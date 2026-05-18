from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import ScheduleTaskOut, ScheduleTaskCreate, ScheduleTaskUpdate, ScheduleByKpi

router = APIRouter(prefix="/api", tags=["schedule"])

KPI_TITLES = [
    "1. Budget Execution",
    "2. Organizational (General)",
    "3. Organization (Digital Transformation)",
    "4. Organization (賦能平台 3.0)",
    "5. People",
]


@router.get("/schedule/{year}", response_model=list[ScheduleByKpi])
def get_schedule(year: int, db: Session = Depends(get_db)):
    tasks = (
        db.query(models.ScheduleTask)
        .filter(models.ScheduleTask.year == year)
        .order_by(models.ScheduleTask.kpi_number, models.ScheduleTask.order_index)
        .all()
    )
    groups: dict[int, list] = {i: [] for i in range(1, 6)}
    for task in tasks:
        if task.kpi_number in groups:
            groups[task.kpi_number].append(task)
    return [
        ScheduleByKpi(
            kpi_number=kpi_num,
            kpi_title=KPI_TITLES[kpi_num - 1],
            tasks=task_list,
        )
        for kpi_num, task_list in sorted(groups.items())
    ]


@router.post("/admin/schedule", response_model=ScheduleTaskOut, status_code=201)
def create_task(body: ScheduleTaskCreate, db: Session = Depends(get_db)):
    if body.kpi_number not in range(1, 6):
        raise HTTPException(status_code=400, detail="kpi_number must be 1-5")
    if body.end_date < body.start_date:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")
    task = models.ScheduleTask(**body.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/admin/schedule/{task_id}", response_model=ScheduleTaskOut)
def update_task(task_id: int, body: ScheduleTaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.ScheduleTask).filter(models.ScheduleTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    if task.end_date < task.start_date:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")
    db.commit()
    db.refresh(task)
    return task


@router.delete("/admin/schedule/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.ScheduleTask).filter(models.ScheduleTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
