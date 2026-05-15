from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import KPIOut, TrendPoint

router = APIRouter(prefix="/api/kpis", tags=["kpis"])


@router.get("/trend/{number}", response_model=list[TrendPoint])
def get_trend(number: int, db: Session = Depends(get_db)):
    kpis = (
        db.query(models.KPI)
        .join(models.Week)
        .filter(models.KPI.number == number)
        .order_by(models.Week.week_date)
        .all()
    )
    return [TrendPoint(week_date=k.week.week_date, status=k.status) for k in kpis]


@router.get("/{kpi_id}", response_model=KPIOut)
def get_kpi(kpi_id: int, db: Session = Depends(get_db)):
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    return kpi
