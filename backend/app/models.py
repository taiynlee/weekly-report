from pydantic import BaseModel


class SubKPI(BaseModel):
    id: str
    title: str
    items: list[str]


class KPI(BaseModel):
    id: int
    title: str
    sub_kpis: list[SubKPI]
    highlights: list[str]
    lowlights: list[str]
    status: str  # "not_started" | "in_progress" | "completed"


class KPIListItem(BaseModel):
    id: int
    title: str
    status: str
