from cachetools import TTLCache, cached
from fastapi import APIRouter, HTTPException

from app.data import KPI_DATA
from app.models import KPI, KPIListItem

router = APIRouter(prefix="/api/kpis", tags=["kpi"])

_cache: TTLCache = TTLCache(maxsize=32, ttl=300)


@cached(_cache)
def _get_all() -> list[KPI]:
    return KPI_DATA


@router.get("", response_model=list[KPIListItem])
def list_kpis():
    return [KPIListItem(id=k.id, title=k.title, status=k.status) for k in _get_all()]


@router.get("/{kpi_id}", response_model=KPI)
def get_kpi(kpi_id: int):
    for kpi in _get_all():
        if kpi.id == kpi_id:
            return kpi
    raise HTTPException(status_code=404, detail="KPI not found")
