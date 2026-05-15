from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import WeekOut, KPIListItem

router = APIRouter(prefix="/api/weeks", tags=["weeks"])


@router.get("", response_model=list[WeekOut])
def list_weeks(db: Session = Depends(get_db)):
    return db.query(models.Week).order_by(models.Week.week_date.desc()).all()


@router.get("/{week_date}/kpis", response_model=list[KPIListItem])
def list_kpis_by_week(week_date: str, db: Session = Depends(get_db)):
    try:
        parsed = date.fromisoformat(week_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")

    week = db.query(models.Week).filter(models.Week.week_date == parsed).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")

    return sorted(week.kpis, key=lambda k: k.number)
