from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import WeekCreate, WeekOut, KPIUpdate, KPIOut

router = APIRouter(prefix="/api/admin", tags=["admin"])

KPI_TITLES = [
    "1. Budget Execution",
    "2. Organizational (General)",
    "3. Organization (Digital Transformation)",
    "4. Organization (賦能平台 3.0)",
    "5. People",
]


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


@router.put("/kpis/{kpi_id}", response_model=KPIOut)
def update_kpi(kpi_id: int, body: KPIUpdate, db: Session = Depends(get_db)):
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")

    if body.title is not None:
        kpi.title = body.title

    if body.status is not None:
        valid = {"not_started", "in_progress", "completed"}
        if body.status not in valid:
            raise HTTPException(status_code=400, detail=f"status must be one of {valid}")
        kpi.status = body.status

    if body.highlights is not None:
        for h in kpi.highlights:
            db.delete(h)
        kpi.highlights = [
            models.Highlight(content=c, order_index=i)
            for i, c in enumerate(body.highlights)
        ]

    if body.lowlights is not None:
        for l in kpi.lowlights:
            db.delete(l)
        kpi.lowlights = [
            models.Lowlight(content=c, order_index=i)
            for i, c in enumerate(body.lowlights)
        ]

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
