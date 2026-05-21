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

# ─── Constants ──────────────────────────────────────────────────────────────

KPI_COLORS: dict[int, RGBColor] = {
    1: RGBColor(0x22, 0xD3, 0xEE),
    2: RGBColor(0x38, 0xBD, 0xF8),
    3: RGBColor(0x60, 0xA5, 0xFA),
    4: RGBColor(0x81, 0x8C, 0xF8),
    5: RGBColor(0xA7, 0x8B, 0xFA),
}
MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

# Slide layout (widescreen 16:9)
SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

ML        = Inches(0.28)   # left margin
TITLE_Y   = Inches(0.12)
TITLE_H   = Inches(0.48)
HDR_Y     = Inches(0.68)
HDR_H     = Inches(0.27)
CONTENT_Y = Inches(1.02)
CONTENT_B = Inches(7.28)
CONTENT_H = CONTENT_B - CONTENT_Y

# ─── Geometry helpers ────────────────────────────────────────────────────────

def _is_leap(y: int) -> bool:
    return (y % 4 == 0 and y % 100 != 0) or y % 400 == 0

def _days(y: int) -> int:
    return 366 if _is_leap(y) else 365

def _date_frac(d: datetime.date, year: int) -> float:
    start = datetime.date(year, 1, 1)
    return max(0.0, min(1.0, (d - start).days / _days(year)))

def _month_frac(m: int, year: int) -> float:
    return _date_frac(datetime.date(year, m, 1), year)

def _month_w_frac(m: int, year: int) -> float:
    return calendar.monthrange(year, m)[1] / _days(year)

def _seg_bar(s: datetime.date | None, e: datetime.date | None,
             year: int, tl_x: int, tl_w_in: float):
    """Return (bar_x_emu, bar_w_emu) or (None, None) if no overlap with year."""
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

# ─── Drawing primitives ──────────────────────────────────────────────────────

def _rect(slide, x, y, w, h, fill: RGBColor, *, border_color: RGBColor | None = None):
    shape = slide.shapes.add_shape(1, int(x), int(y),
                                   max(int(w), 18_000), max(int(h), 18_000))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(0.25)
    else:
        shape.line.fill.background()
    return shape

def _text(slide, text: str, x, y, w, h, *,
          size: float = 9, bold: bool = False,
          color: RGBColor = RGBColor(0x1E, 0x29, 0x3B),
          align=PP_ALIGN.LEFT):
    txb = slide.shapes.add_textbox(int(x), int(y), max(int(w), 18_000), max(int(h), 18_000))
    tf = txb.text_frame
    tf.word_wrap = True
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

def _month_headers(slide, year: int, tl_x, tl_w_in: float, y, h):
    for m in range(1, 13):
        mx = int(tl_x + Inches(tl_w_in * _month_frac(m, year)))
        mw = int(Inches(tl_w_in * _month_w_frac(m, year)))
        bg = RGBColor(0xF1, 0xF5, 0xF9) if m % 2 else RGBColor(0xE2, 0xE8, 0xF0)
        _rect(slide, mx, y, mw, h, bg)
        _text(slide, MONTH_NAMES[m - 1], mx, y, mw, h,
              size=6.5, color=RGBColor(0x64, 0x74, 0x8B), align=PP_ALIGN.CENTER)

def _month_grid(slide, year: int, tl_x, tl_w_in: float, y_top, height):
    for m in range(2, 13):
        gx = int(tl_x + Inches(tl_w_in * _month_frac(m, year)))
        _rect(slide, gx, y_top, 9_000, int(height), RGBColor(0xE2, 0xE8, 0xF0))

def _today_line(slide, year: int, tl_x, tl_w_in: float, y_top, height):
    today = datetime.date.today()
    if today.year != year:
        return
    tx = int(tl_x + Inches(tl_w_in * _date_frac(today, year)))
    _rect(slide, tx, y_top, 27_000, int(height), RGBColor(0xEF, 0x44, 0x44))

def _blank_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank layout
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    return slide

# ─── Slide 1: Overview ──────────────────────────────────────────────────────

def _build_overview(prs, year: int, groups):
    slide = _blank_slide(prs)

    KPI_W_IN = 2.8
    PCT_W_IN = 0.52
    TL_W_IN  = 13.33 - 0.28 - KPI_W_IN - PCT_W_IN - 0.28  # ≈ 9.45
    KPI_W = Inches(KPI_W_IN)
    TL_X  = int(ML + KPI_W + Inches(PCT_W_IN))

    # Title
    _rect(slide, ML, TITLE_Y, Inches(0.07), TITLE_H, RGBColor(0x3B, 0x82, 0xF6))
    _text(slide, f"{year}  年度計劃", int(ML + Inches(0.16)), TITLE_Y,
          Inches(8), TITLE_H, size=16, bold=True, color=RGBColor(0x0F, 0x17, 0x2A))

    # Column headers
    _text(slide, "工量%", int(ML + KPI_W), HDR_Y, Inches(PCT_W_IN), HDR_H,
          size=7, color=RGBColor(0x64, 0x74, 0x8B), align=PP_ALIGN.CENTER)
    _month_headers(slide, year, TL_X, TL_W_IN, HDR_Y, HDR_H)

    row_h = int(CONTENT_H / 5)

    for idx, (group, color) in enumerate(groups):
        y = int(CONTENT_Y) + row_h * idx

        row_bg = RGBColor(0xF8, 0xFA, 0xFC) if idx % 2 == 0 else RGBColor(0xFF, 0xFF, 0xFF)
        total_w = int(KPI_W + Inches(PCT_W_IN) + Inches(TL_W_IN))
        _rect(slide, ML, y, total_w, row_h, row_bg)
        _month_grid(slide, year, TL_X, TL_W_IN, y, row_h)

        # Color accent strip
        _rect(slide, ML, y, Inches(0.06), row_h, color)
        # KPI label
        _text(slide, group.kpi_title, int(ML + Inches(0.12)), y,
              int(KPI_W - Inches(0.14)), row_h,
              size=9, bold=True, color=RGBColor(0x1E, 0x29, 0x3B))
        # Work %
        pct_text = f"{group.percentage}%" if group.percentage is not None else "—"
        _text(slide, pct_text, int(ML + KPI_W), y, Inches(PCT_W_IN), row_h,
              size=9, bold=True, color=color, align=PP_ALIGN.CENTER)

        # Draw all segment bars for this KPI
        bar_y = y + int(row_h * 0.22)
        bar_h = int(row_h * 0.56)
        for task in group.tasks:
            for item in task.items:
                for seg in item.segments:
                    bx, bw = _seg_bar(seg.start_date, seg.end_date, year, TL_X, TL_W_IN)
                    if bx is not None:
                        _rect(slide, bx, bar_y, bw, bar_h, color)

        _today_line(slide, year, TL_X, TL_W_IN, y, row_h)

# ─── Slides 2-6: Per-KPI detail ─────────────────────────────────────────────

def _build_kpi_slide(prs, year: int, group, color: RGBColor):
    slide = _blank_slide(prs)

    STRIP_W   = Inches(0.08)
    TASK_W_IN = 3.35
    PCT_W_IN  = 0.52
    TL_W_IN   = 13.33 - 0.28 - 0.08 - TASK_W_IN - PCT_W_IN - 0.28  # ≈ 8.80
    TASK_X = int(ML + STRIP_W)
    PCT_X  = int(TASK_X + Inches(TASK_W_IN))
    TL_X   = int(PCT_X + Inches(PCT_W_IN))

    # Title with color accent
    _rect(slide, ML, TITLE_Y, STRIP_W, TITLE_H, color)
    _text(slide, group.kpi_title, int(ML + STRIP_W + Inches(0.1)), TITLE_Y,
          Inches(9.5), TITLE_H, size=15, bold=True, color=RGBColor(0x0F, 0x17, 0x2A))
    if group.percentage is not None:
        _text(slide, f"工量：{group.percentage}%", Inches(11), TITLE_Y,
              Inches(2.0), TITLE_H, size=12, bold=True, color=color,
              align=PP_ALIGN.RIGHT)

    # Column headers
    _text(slide, "工量%", PCT_X, HDR_Y, Inches(PCT_W_IN), HDR_H,
          size=7, color=RGBColor(0x64, 0x74, 0x8B), align=PP_ALIGN.CENTER)
    _month_headers(slide, year, TL_X, TL_W_IN, HDR_Y, HDR_H)

    # Build row list: ('task', task) | ('item', task, item)
    rows = []
    for task in group.tasks:
        dated = [i for i in task.items if i.segments]
        if not dated:
            continue
        rows.append(('task', task, None))
        for item in dated:
            rows.append(('item', task, item))

    if not rows:
        _text(slide, "（尚無甘特資料）", TASK_X, CONTENT_Y, Inches(8), Inches(1),
              size=12, color=RGBColor(0x94, 0xA3, 0xB8))
        return

    row_h = max(int(CONTENT_H / len(rows)), int(Inches(0.22)))

    for ri, row in enumerate(rows):
        y = int(CONTENT_Y) + row_h * ri
        row_bg = RGBColor(0xF8, 0xFA, 0xFC) if ri % 2 == 0 else RGBColor(0xFF, 0xFF, 0xFF)
        total_w = int(STRIP_W + Inches(TASK_W_IN) + Inches(PCT_W_IN) + Inches(TL_W_IN))
        _rect(slide, ML, y, total_w, row_h, row_bg)
        _rect(slide, ML, y, STRIP_W, row_h, color)
        _month_grid(slide, year, TL_X, TL_W_IN, y, row_h)

        kind, task, item = row
        if kind == 'task':
            _text(slide, task.title, int(TASK_X + Inches(0.05)), y,
                  Inches(TASK_W_IN), row_h,
                  size=8.5, bold=True, color=RGBColor(0x1E, 0x29, 0x3B))
        else:
            bar_y = y + int(row_h * 0.15)
            bar_h = int(row_h * 0.70)
            # Item label (indented)
            _text(slide, item.content, int(TASK_X + Inches(0.18)), y,
                  Inches(TASK_W_IN - 0.20), row_h,
                  size=7.5, color=RGBColor(0x47, 0x56, 0x69))
            # Segment bars
            for seg in item.segments:
                bx, bw = _seg_bar(seg.start_date, seg.end_date, year, TL_X, TL_W_IN)
                if bx is None:
                    continue
                _rect(slide, bx, bar_y, bw, bar_h, color)
                if bw > Inches(0.9):
                    _text(slide, item.content, int(bx + Inches(0.06)), bar_y,
                          int(bw - Inches(0.1)), bar_h,
                          size=6.5, color=RGBColor(0xFF, 0xFF, 0xFF))

        _today_line(slide, year, TL_X, TL_W_IN, y, row_h)

# ─── Endpoint ────────────────────────────────────────────────────────────────

@router.get("/annual-plan/{year}/pptx")
def export_annual_plan_pptx(year: int, db: Session = Depends(get_db)):
    week = _latest_week(year, db)
    actual_year = year
    if not week:
        # Fall back to previous year (same logic as dashboard)
        week = _latest_week(year - 1, db)
        actual_year = year - 1
    if not week:
        raise HTTPException(status_code=404, detail="No annual plan data found")

    kpis = (
        db.query(models.KPI)
        .filter(models.KPI.week_id == week.id)
        .order_by(models.KPI.number)
        .all()
    )
    groups = [_kpi_to_out(k, week.id) for k in kpis]

    prs = Presentation()
    prs.slide_width  = SLIDE_W
    prs.slide_height = SLIDE_H

    pairs = [(g, KPI_COLORS.get(g.kpi_number, RGBColor(0x60, 0xA5, 0xFA))) for g in groups]

    _build_overview(prs, actual_year, pairs)
    for g, color in pairs:
        _build_kpi_slide(prs, actual_year, g, color)

    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)

    filename = f"annual-plan-{actual_year}.pptx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
