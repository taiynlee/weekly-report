import io
import calendar
import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

from app import models
from app.database import get_db
from app.routes.annual_plan import _latest_week, _kpi_to_out

router = APIRouter(prefix="/api/export", tags=["export"])

# ─── Color palette ───────────────────────────────────────────────────────────

KPI_COLORS: dict[int, RGBColor] = {
    1: RGBColor(0x22, 0xD3, 0xEE),
    2: RGBColor(0x38, 0xBD, 0xF8),
    3: RGBColor(0x60, 0xA5, 0xFA),
    4: RGBColor(0x81, 0x8C, 0xF8),
    5: RGBColor(0xA7, 0x8B, 0xFA),
}

BG         = RGBColor(0x0F, 0x17, 0x2A)
PANEL_BG   = RGBColor(0x1A, 0x25, 0x3A)
PANEL_HDR  = RGBColor(0x12, 0x1C, 0x2E)
ROW_A      = RGBColor(0x14, 0x1F, 0x33)
ROW_B      = RGBColor(0x0F, 0x17, 0x2A)
MONTH_A    = RGBColor(0x14, 0x1F, 0x33)
MONTH_B    = RGBColor(0x1A, 0x25, 0x3A)
GRID_CLR   = RGBColor(0x2D, 0x3F, 0x5A)
TEXT_PRI   = RGBColor(0xF1, 0xF5, 0xF9)
TEXT_SEC   = RGBColor(0x94, 0xA3, 0xB8)
TEXT_MUT   = RGBColor(0x64, 0x74, 0x8B)
TODAY_CLR  = RGBColor(0xEF, 0x44, 0x44)
AMBER      = RGBColor(0xF5, 0x9E, 0x0B)
YELLOW     = RGBColor(0xEA, 0xB3, 0x08)
EMERALD    = RGBColor(0x10, 0xB9, 0x81)
STAR_CLR   = RGBColor(0xF5, 0x9E, 0x0B)

STATUS_CLR   = {'in_progress': RGBColor(0x3B, 0x82, 0xF6),
                'completed':   EMERALD,
                'not_started': TEXT_MUT}
STATUS_LABEL = {'in_progress': '進行中', 'completed': '已完成', 'not_started': '未開始'}

MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

# ─── Geometry helpers ────────────────────────────────────────────────────────

def _is_leap(y): return (y % 4 == 0 and y % 100 != 0) or y % 400 == 0
def _days(y):    return 366 if _is_leap(y) else 365

def _date_frac(d: datetime.date, year: int) -> float:
    return max(0.0, min(1.0, (d - datetime.date(year, 1, 1)).days / _days(year)))

def _month_frac(m: int, year: int) -> float:
    return _date_frac(datetime.date(year, m, 1), year)

def _month_w_frac(m: int, year: int) -> float:
    return calendar.monthrange(year, m)[1] / _days(year)

def _seg_bar(s, e, year: int, tl_x, tl_w_in: float):
    if s is None or e is None:
        return None, None
    yr0, yr1 = datetime.date(year, 1, 1), datetime.date(year, 12, 31)
    cs, ce = max(s, yr0), min(e, yr1)
    if cs > ce:
        return None, None
    sf = _date_frac(cs, year)
    ef = _date_frac(ce + datetime.timedelta(days=1), year)
    bx = int(tl_x + Inches(tl_w_in * sf))
    bw = max(int(Inches(tl_w_in * (ef - sf))), 50_000)
    return bx, bw

def _pct_color(pct: int | None) -> RGBColor:
    if not pct:
        return TEXT_MUT
    if pct >= 80:
        return EMERALD
    if pct >= 50:
        return YELLOW
    return AMBER

# ─── Drawing primitives ──────────────────────────────────────────────────────

def _rect(slide, x, y, w, h, fill: RGBColor, *, line_color: RGBColor | None = None):
    s = slide.shapes.add_shape(1, int(x), int(y), max(int(w), 9000), max(int(h), 9000))
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line_color:
        s.line.color.rgb = line_color
        s.line.width = Pt(0.5)
    else:
        s.line.fill.background()
    return s

def _oval(slide, x, y, w, h, fill: RGBColor, *, line_color: RGBColor | None = None, line_width: float = 1.5):
    s = slide.shapes.add_shape(9, int(x), int(y), max(int(w), 9000), max(int(h), 9000))
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line_color:
        s.line.color.rgb = line_color
        s.line.width = Pt(line_width)
    else:
        s.line.fill.background()
    return s

def _text(slide, text: str, x, y, w, h, *,
          size: float = 9, bold: bool = False,
          color: RGBColor = TEXT_PRI,
          align=PP_ALIGN.LEFT, wrap: bool = True):
    txb = slide.shapes.add_textbox(int(x), int(y), max(int(w), 9000), max(int(h), 9000))
    tf = txb.text_frame
    tf.word_wrap = wrap
    tf.margin_left  = Pt(3)
    tf.margin_right = Pt(2)
    tf.margin_top   = Pt(1)
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = str(text)
    r.font.size  = Pt(size)
    r.font.bold  = bold
    r.font.color.rgb = color

def _badge(slide, x, y, w, h, fill: RGBColor, text: str, *,
           text_color: RGBColor = TEXT_PRI, size: float = 8, bold: bool = False,
           shape_type: int = 5):
    """Rounded rectangle badge with centered text."""
    s = slide.shapes.add_shape(shape_type, int(x), int(y), max(int(w), 9000), max(int(h), 9000))
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    tf = s.text_frame
    tf.word_wrap = False
    tf.margin_left = Pt(4)
    tf.margin_right = Pt(4)
    tf.margin_top = Pt(1)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.size  = Pt(size)
    r.font.bold  = bold
    r.font.color.rgb = text_color

def _pct_badge(slide, cx, cy, diameter, pct: int | None):
    """Draw a circle with colored border and % text."""
    if pct is None:
        return
    color = _pct_color(pct)
    d = int(diameter)
    _oval(slide, cx, cy, d, d, BG, line_color=color, line_width=2.5)
    _text(slide, f"{pct}%", cx, cy, d, d,
          size=6.5, bold=True, color=color, align=PP_ALIGN.CENTER)

def _dark_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = BG
    return slide

# ─── Gantt helpers ───────────────────────────────────────────────────────────

def _gantt_month_headers(slide, year, tl_x, tl_w_in, y, h):
    for m in range(1, 13):
        mx = int(tl_x + Inches(tl_w_in * _month_frac(m, year)))
        mw = int(Inches(tl_w_in * _month_w_frac(m, year)))
        _rect(slide, mx, y, mw, h, MONTH_A if m % 2 else MONTH_B)
        _text(slide, MONTH_NAMES[m - 1], mx, y, mw, h,
              size=6.5, color=TEXT_MUT, align=PP_ALIGN.CENTER)

def _gantt_grid(slide, year, tl_x, tl_w_in, y_top, height):
    for m in range(2, 13):
        gx = int(tl_x + Inches(tl_w_in * _month_frac(m, year)))
        _rect(slide, gx, y_top, 9000, int(height), GRID_CLR)

def _today_line(slide, year, tl_x, tl_w_in, y_top, height):
    today = datetime.date.today()
    if today.year != year:
        return
    tx = int(tl_x + Inches(tl_w_in * _date_frac(today, year)))
    _rect(slide, tx, y_top, 27000, int(height), TODAY_CLR)

# ─── Slide 1: Dark Gantt overview ────────────────────────────────────────────

def _build_gantt(prs, year: int, groups):
    slide = _dark_slide(prs)

    KPI_W_IN  = 1.40
    TASK_W_IN = 2.25
    PCT_W_IN  = 0.48
    ML        = Inches(0.28)
    TL_W_IN   = 13.33 - 0.28 - KPI_W_IN - TASK_W_IN - PCT_W_IN - 0.28  # ≈ 8.64
    KPI_X     = ML
    TASK_X    = ML + Inches(KPI_W_IN)
    PCT_X     = TASK_X + Inches(TASK_W_IN)
    TL_X      = int(PCT_X + Inches(PCT_W_IN))
    KPI_W     = Inches(KPI_W_IN)
    TASK_W    = Inches(TASK_W_IN)
    PCT_W     = Inches(PCT_W_IN)

    HDR_Y = Inches(0.08)
    HDR_H = Inches(0.30)

    # Column header row background
    full_w = Inches(KPI_W_IN + TASK_W_IN + PCT_W_IN + TL_W_IN)
    _rect(slide, ML, HDR_Y, full_w, HDR_H, PANEL_HDR)
    _text(slide, "KPI",  KPI_X,  HDR_Y, KPI_W,  HDR_H, size=6.5, bold=True, color=TEXT_MUT, align=PP_ALIGN.CENTER)
    _text(slide, "TASK", TASK_X, HDR_Y, TASK_W, HDR_H, size=6.5, bold=True, color=TEXT_MUT, align=PP_ALIGN.CENTER)
    _text(slide, "工量%", PCT_X,  HDR_Y, PCT_W,  HDR_H, size=6.5, bold=True, color=TEXT_MUT, align=PP_ALIGN.CENTER)
    _gantt_month_headers(slide, year, TL_X, TL_W_IN, HDR_Y, HDR_H)

    # Build row list: collect all rows to distribute height evenly
    Row = list  # (kind, group, task, item, color)
    all_rows: list[tuple] = []
    for group, color in groups:
        all_rows.append(('kpi', group, None, None, color))
        for task in group.tasks:
            dated = [i for i in task.items if i.segments]
            if not dated:
                continue
            all_rows.append(('task', group, task, None, color))
            for item in dated:
                all_rows.append(('item', group, task, item, color))

    if not all_rows:
        return

    CONTENT_Y = float(HDR_Y + HDR_H)
    CONTENT_B = Inches(7.42)
    total_h   = CONTENT_B - CONTENT_Y
    row_h     = max(int(total_h / len(all_rows)), int(Inches(0.20)))

    for ri, (kind, group, task, item, color) in enumerate(all_rows):
        y = int(CONTENT_Y) + row_h * ri
        rh = row_h

        row_bg = ROW_A if ri % 2 == 0 else ROW_B
        _rect(slide, ML, y, full_w, rh, row_bg)
        _gantt_grid(slide, year, TL_X, TL_W_IN, y, rh)

        if kind == 'kpi':
            _rect(slide, KPI_X, y, Inches(0.06), rh, color)
            _text(slide, group.kpi_title.split('. ', 1)[-1],
                  int(KPI_X + Inches(0.10)), y, int(KPI_W - Inches(0.12)), rh,
                  size=8, bold=True, color=TEXT_PRI)
            pct_txt = f"{group.percentage}%" if group.percentage is not None else ""
            _text(slide, pct_txt, PCT_X, y, PCT_W, rh,
                  size=8, bold=True, color=color, align=PP_ALIGN.CENTER)

        elif kind == 'task':
            _rect(slide, KPI_X, y, Inches(0.04), rh, color)
            _text(slide, task.title, int(TASK_X + Inches(0.06)), y,
                  int(TASK_W - Inches(0.08)), rh, size=7.5, color=TEXT_SEC)

        else:  # item row — draw segment bars
            bar_y = y + int(rh * 0.12)
            bar_h = int(rh * 0.76)
            for seg in item.segments:
                bx, bw = _seg_bar(seg.start_date, seg.end_date, year, TL_X, TL_W_IN)
                if bx is None:
                    continue
                _rect(slide, bx, bar_y, bw, bar_h, color)
                if bw > Inches(0.7):
                    _text(slide, item.content, int(bx + Inches(0.06)), bar_y,
                          int(bw - Inches(0.08)), bar_h,
                          size=6.5, color=RGBColor(0xFF, 0xFF, 0xFF), wrap=False)

        _today_line(slide, year, TL_X, TL_W_IN, y, rh)

    # Year label
    _text(slide, f"{year}  年度計劃", int(TL_X + Inches(TL_W_IN / 2 - 0.8)),
          int(HDR_Y + Inches(0.04)), Inches(1.6), Inches(0.22),
          size=7, color=TEXT_MUT, align=PP_ALIGN.CENTER)

# ─── Slides 2-6: KPI Detail ──────────────────────────────────────────────────

PANEL_TOP = Inches(0.82)
PANEL_H   = SLIDE_H - PANEL_TOP - Inches(0.12)
PHDR_H    = Inches(0.42)
LEFT_X    = Inches(0.28)
LEFT_W    = Inches(6.28)
GAP       = Inches(0.24)
RIGHT_X   = LEFT_X + LEFT_W + GAP
RIGHT_W   = SLIDE_W - RIGHT_X - Inches(0.28)


def _build_kpi_detail(prs, kpi: models.KPI, kpi_num: int):
    slide = _dark_slide(prs)
    color = KPI_COLORS.get(kpi_num, RGBColor(0x60, 0xA5, 0xFA))
    status = kpi.status or 'not_started'

    # ─ Title bar ─────────────────────────────────────────────────────────────
    T_Y = Inches(0.10)
    T_H = Inches(0.55)

    # KPI number circle
    circ = Inches(0.46)
    _oval(slide, LEFT_X, T_Y + int((T_H - circ) / 2), circ, circ, color)
    _text(slide, str(kpi_num), LEFT_X, T_Y, circ, T_H,
          size=13, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF), align=PP_ALIGN.CENTER)

    # KPI title
    _text(slide, kpi.title, int(LEFT_X + circ + Inches(0.12)), T_Y,
          Inches(9.8), T_H, size=13, bold=True, color=TEXT_PRI)

    # Status badge
    s_color = STATUS_CLR.get(status, TEXT_MUT)
    s_label = STATUS_LABEL.get(status, '未開始')
    b_w, b_h = Inches(1.40), Inches(0.32)
    _badge(slide, SLIDE_W - Inches(0.28) - b_w, T_Y + int((T_H - b_h) / 2),
           b_w, b_h, s_color, f"● {s_label}", size=8.5, bold=True)

    # ─ Two panels ─────────────────────────────────────────────────────────────
    _rect(slide, LEFT_X,  PANEL_TOP, LEFT_W,  PANEL_H, PANEL_BG)
    _rect(slide, RIGHT_X, PANEL_TOP, RIGHT_W, PANEL_H, PANEL_BG)

    # ─ Left panel: KPI 指標 ───────────────────────────────────────────────────
    _rect(slide, LEFT_X, PANEL_TOP, LEFT_W, PHDR_H, PANEL_HDR)
    _rect(slide, LEFT_X, PANEL_TOP, Inches(0.04), PHDR_H, color)
    _text(slide, "○  KPI 指標", int(LEFT_X + Inches(0.14)), PANEL_TOP,
          Inches(3.5), PHDR_H, size=9, bold=True, color=color)

    if kpi.percentage is not None:
        pct_bg_w = Inches(1.35)
        _badge(slide, int(LEFT_X + LEFT_W - pct_bg_w - Inches(0.12)),
               int(PANEL_TOP + Inches(0.09)), pct_bg_w, Inches(0.24),
               BG, f"平均  {kpi.percentage}%", text_color=color, size=8.5, bold=True)

    row_y   = float(PANEL_TOP + PHDR_H + Inches(0.06))
    max_y   = float(PANEL_TOP + PANEL_H - Inches(0.08))
    SKPI_H  = Inches(0.36)
    ITEM_H  = Inches(0.30)

    for sub_kpi in kpi.sub_kpis:
        if row_y + float(SKPI_H) > max_y:
            break
        # Sub-KPI header
        _rect(slide, LEFT_X, int(row_y), LEFT_W, int(SKPI_H), ROW_A)
        _rect(slide, LEFT_X, int(row_y), Inches(0.05), int(SKPI_H), color)
        _text(slide, f"{sub_kpi.sub_id}  {sub_kpi.title}",
              int(LEFT_X + Inches(0.13)), int(row_y),
              int(LEFT_W - Inches(0.15)), int(SKPI_H),
              size=8.5, bold=True, color=TEXT_PRI)
        row_y += float(SKPI_H)

        for item in sub_kpi.items:
            if row_y + float(ITEM_H) > max_y:
                break
            row_bg = ROW_B if int((row_y - float(PANEL_TOP)) / float(ITEM_H)) % 2 == 0 else PANEL_BG
            _rect(slide, LEFT_X, int(row_y), LEFT_W, int(ITEM_H), PANEL_BG)
            _text(slide, f"  ›  {item.content}",
                  int(LEFT_X + Inches(0.10)), int(row_y),
                  int(LEFT_W - Inches(0.14)), int(ITEM_H),
                  size=8, color=TEXT_SEC)
            row_y += float(ITEM_H)

    # ─ Right panel: HIGHLIGHT ─────────────────────────────────────────────────
    _rect(slide, RIGHT_X, PANEL_TOP, RIGHT_W, PHDR_H, PANEL_HDR)
    _rect(slide, RIGHT_X, PANEL_TOP, Inches(0.04), PHDR_H, STAR_CLR)
    _text(slide, "★  HIGHLIGHT", int(RIGHT_X + Inches(0.14)), PANEL_TOP,
          Inches(4), PHDR_H, size=9, bold=True, color=STAR_CLR)

    HL_H    = Inches(0.52)
    CIRC_D  = Inches(0.40)
    row_y   = float(PANEL_TOP + PHDR_H + Inches(0.06))
    max_y   = float(PANEL_TOP + PANEL_H - Inches(0.08))

    for i, hl in enumerate(kpi.highlights, 1):
        if row_y + float(HL_H) > max_y:
            break
        rh = int(HL_H)
        row_bg = ROW_A if i % 2 == 1 else PANEL_BG
        _rect(slide, RIGHT_X, int(row_y), RIGHT_W, rh, row_bg)

        # Index number
        num_w = Inches(0.34)
        _badge(slide, int(RIGHT_X + Inches(0.10)), int(row_y + int((rh - int(Inches(0.28))) / 2)),
               num_w, int(Inches(0.28)), PANEL_HDR, str(i),
               text_color=TEXT_SEC, size=8, bold=True)

        # Content text
        circ_space = CIRC_D + Inches(0.18)
        text_w = float(RIGHT_W) - float(num_w) - float(circ_space) - Inches(0.28)
        _text(slide, hl.content,
              int(RIGHT_X + Inches(0.10) + float(num_w) + Inches(0.08)), int(row_y),
              int(text_w), rh, size=8, color=TEXT_PRI)

        # Percentage circle badge
        circ_x = int(RIGHT_X + float(RIGHT_W) - float(CIRC_D) - Inches(0.12))
        circ_y = int(row_y) + int((rh - int(CIRC_D)) / 2)
        _pct_badge(slide, circ_x, circ_y, CIRC_D, hl.percentage)

        row_y += float(HL_H) + Inches(0.04)

# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.get("/annual-plan/{year}/pptx")
def export_annual_plan_pptx(year: int, db: Session = Depends(get_db)):
    week = _latest_week(year, db)
    actual_year = year
    if not week:
        week = _latest_week(year - 1, db)
        actual_year = year - 1
    if not week:
        raise HTTPException(status_code=404, detail="No annual plan data found")

    kpis: list[models.KPI] = (
        db.query(models.KPI)
        .filter(models.KPI.week_id == week.id)
        .order_by(models.KPI.number)
        .all()
    )
    annual_groups = [_kpi_to_out(k, week.id) for k in kpis]

    prs = Presentation()
    prs.slide_width  = SLIDE_W
    prs.slide_height = SLIDE_H

    # Slide 1: Dark Gantt overview
    pairs = [(g, KPI_COLORS.get(g.kpi_number, RGBColor(0x60, 0xA5, 0xFA)))
             for g in annual_groups]
    _build_gantt(prs, actual_year, pairs)

    # Slides 2-6: KPI detail
    for kpi, group in zip(kpis, annual_groups):
        _build_kpi_detail(prs, kpi, kpi.number)

    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)

    filename = f"annual-plan-{actual_year}.pptx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
