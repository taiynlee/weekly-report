from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import AnnualPlanKpiOut, AnnualPlanTaskOut, AnnualPlanItemOut, SegmentOut, KpiCreate

router = APIRouter(prefix="/api", tags=["annual_plan"])


def _latest_week(year: int, db: Session) -> models.Week | None:
    return (
        db.query(models.Week)
        .filter(
            models.Week.week_date >= date(year, 1, 1),
            models.Week.week_date <= date(year, 12, 31),
        )
        .order_by(models.Week.week_date.desc())
        .first()
    )


def _kpi_to_out(kpi: models.KPI, week_id: int) -> AnnualPlanKpiOut:
    return AnnualPlanKpiOut(
        kpi_number=kpi.number,
        kpi_title=kpi.title,
        kpi_id=kpi.id,
        week_id=week_id,
        percentage=kpi.percentage,
        tasks=[
            AnnualPlanTaskOut(
                id=s.id,
                sub_id=s.sub_id,
                title=s.title,
                items=[
                    AnnualPlanItemOut(
                        id=item.id,
                        content=item.content,
                        start_date=item.start_date,
                        end_date=item.end_date,
                        order_index=item.order_index,
                        segments=[
                            SegmentOut(
                                id=seg.id,
                                start_date=seg.start_date,
                                end_date=seg.end_date,
                                order_index=seg.order_index,
                            )
                            for seg in item.segments
                        ],
                    )
                    for item in s.items
                ],
            )
            for s in kpi.sub_kpis
        ],
    )


@router.get("/annual-plan/{year}", response_model=list[AnnualPlanKpiOut])
def get_annual_plan(year: int, db: Session = Depends(get_db)):
    week = _latest_week(year, db)
    if not week:
        return []
    kpis = (
        db.query(models.KPI)
        .filter(models.KPI.week_id == week.id)
        .order_by(models.KPI.number)
        .all()
    )
    return [_kpi_to_out(kpi, week.id) for kpi in kpis]


@router.post("/admin/annual-plan/{year}/kpis", response_model=AnnualPlanKpiOut, status_code=201)
def add_annual_plan_kpi(year: int, body: KpiCreate, db: Session = Depends(get_db)):
    week = _latest_week(year, db)
    if not week:
        raise HTTPException(status_code=404, detail="No week found for this year")
    existing_numbers = {k.number for k in week.kpis}
    number = max(existing_numbers, default=0) + 1
    kpi = models.KPI(week_id=week.id, number=number, title=body.title, status="not_started")
    db.add(kpi)
    db.commit()
    db.refresh(kpi)
    return _kpi_to_out(kpi, week.id)
