import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import (
    WeekCreate, WeekOut, KPIUpdate, KPIOut,
    HighlightOut, LowlightOut, ItemUpdate, GenerateRequest,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

KPI_TITLES = [
    "1. Budget Execution",
    "2. Organizational (General)",
    "3. Organization (Digital Transformation)",
    "4. Organization (賦能平台 3.0)",
    "5. People",
]


# ── Weeks ────────────────────────────────────────────────────────────────────

@router.post("/weeks", response_model=WeekOut, status_code=201)
def create_week(body: WeekCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Week).filter(models.Week.week_date == body.week_date).first()
    if existing:
        raise HTTPException(status_code=400, detail="Week already exists")

    week = models.Week(week_date=body.week_date)
    db.add(week)
    db.flush()

    for i, title in enumerate(KPI_TITLES, 1):
        db.add(models.KPI(week_id=week.id, number=i, title=title, status="not_started"))

    db.commit()
    db.refresh(week)
    return week


# ── KPI ──────────────────────────────────────────────────────────────────────

@router.put("/kpis/{kpi_id}", response_model=KPIOut)
def update_kpi(kpi_id: int, body: KPIUpdate, db: Session = Depends(get_db)):
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")

    if body.title is not None:
        kpi.title = body.title

    if body.sub_kpis is not None:
        for s in kpi.sub_kpis:
            db.delete(s)
        kpi.sub_kpis = [
            models.SubKPI(
                sub_id=s.sub_id,
                title=s.title,
                items=[
                    models.SubKPIItem(content=item, order_index=j)
                    for j, item in enumerate(s.items)
                ],
            )
            for s in body.sub_kpis
        ]

    db.commit()
    db.refresh(kpi)
    return kpi


# ── Highlights ────────────────────────────────────────────────────────────────

@router.post("/kpis/{kpi_id}/highlights", response_model=HighlightOut, status_code=201)
def add_highlight(kpi_id: int, db: Session = Depends(get_db)):
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    idx = len(kpi.highlights)
    h = models.Highlight(kpi_id=kpi_id, content="", order_index=idx, status="not_started")
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.put("/highlights/{item_id}", response_model=HighlightOut)
def update_highlight(item_id: int, body: ItemUpdate, db: Session = Depends(get_db)):
    h = db.query(models.Highlight).filter(models.Highlight.id == item_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    if body.content is not None:
        h.content = body.content
    if body.status is not None:
        h.status = body.status
    if body.llm_prompt is not None:
        h.llm_prompt = body.llm_prompt
    if body.link is not None:
        h.link = body.link
    db.commit()
    db.refresh(h)
    return h


@router.delete("/highlights/{item_id}", status_code=204)
def delete_highlight(item_id: int, db: Session = Depends(get_db)):
    h = db.query(models.Highlight).filter(models.Highlight.id == item_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(h)
    db.commit()


# ── Lowlights ─────────────────────────────────────────────────────────────────

@router.post("/kpis/{kpi_id}/lowlights", response_model=LowlightOut, status_code=201)
def add_lowlight(kpi_id: int, db: Session = Depends(get_db)):
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    idx = len(kpi.lowlights)
    l = models.Lowlight(kpi_id=kpi_id, content="", order_index=idx, status="not_started")
    db.add(l)
    db.commit()
    db.refresh(l)
    return l


@router.put("/lowlights/{item_id}", response_model=LowlightOut)
def update_lowlight(item_id: int, body: ItemUpdate, db: Session = Depends(get_db)):
    l = db.query(models.Lowlight).filter(models.Lowlight.id == item_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    if body.content is not None:
        l.content = body.content
    if body.status is not None:
        l.status = body.status
    if body.llm_prompt is not None:
        l.llm_prompt = body.llm_prompt
    if body.link is not None:
        l.link = body.link
    db.commit()
    db.refresh(l)
    return l


@router.delete("/lowlights/{item_id}", status_code=204)
def delete_lowlight(item_id: int, db: Session = Depends(get_db)):
    l = db.query(models.Lowlight).filter(models.Lowlight.id == item_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(l)
    db.commit()


# ── File Upload ───────────────────────────────────────────────────────────────

@router.post("/highlights/{item_id}/upload")
async def upload_highlight_file(
    item_id: int,
    field: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await _upload_file(item_id, field, file, db, models.Highlight, "highlights")


@router.post("/lowlights/{item_id}/upload")
async def upload_lowlight_file(
    item_id: int,
    field: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await _upload_file(item_id, field, file, db, models.Lowlight, "lowlights")


async def _upload_file(item_id, field, file, db, Model, folder):
    if field not in ("image_path", "video_path"):
        raise HTTPException(status_code=400, detail="field must be image_path or video_path")

    item = db.query(Model).filter(Model.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    dest_dir = UPLOAD_DIR / folder / str(item_id)
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Remove old file if exists
    old = getattr(item, field)
    if old:
        old_path = Path("..") / old.lstrip("/")
        if old_path.exists():
            old_path.unlink(missing_ok=True)

    ext = Path(file.filename).suffix if file.filename else ""
    dest = dest_dir / f"{field}{ext}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    url = f"/uploads/{folder}/{item_id}/{field}{ext}"
    setattr(item, field, url)
    db.commit()
    db.refresh(item)
    return {"url": url}


# ── LLM Generate ─────────────────────────────────────────────────────────────

@router.post("/highlights/{item_id}/generate", response_model=HighlightOut)
async def generate_highlight(item_id: int, body: GenerateRequest, db: Session = Depends(get_db)):
    h = db.query(models.Highlight).filter(models.Highlight.id == item_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    h.content = await _call_llm(body.prompt, body.context, h.content)
    h.llm_prompt = body.prompt
    db.commit()
    db.refresh(h)
    return h


@router.post("/lowlights/{item_id}/generate", response_model=LowlightOut)
async def generate_lowlight(item_id: int, body: GenerateRequest, db: Session = Depends(get_db)):
    l = db.query(models.Lowlight).filter(models.Lowlight.id == item_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    l.content = await _call_llm(body.prompt, body.context, l.content)
    l.llm_prompt = body.prompt
    db.commit()
    db.refresh(l)
    return l


async def _call_llm(prompt: str, context: str | None, current_content: str) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    import anthropic
    client = anthropic.Anthropic(api_key=api_key)

    system = "You are an assistant helping update KPI report items. Return only the updated content text, no explanation."
    user_msg = f"Current content: {current_content}\n\nInstruction: {prompt}"
    if context:
        user_msg = f"Context: {context}\n\n{user_msg}"

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user_msg}],
    )
    return message.content[0].text.strip()
