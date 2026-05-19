from datetime import date
from pydantic import BaseModel


class SubKPIItemOut(BaseModel):
    id: int
    content: str
    order_index: int
    start_date: date | None = None
    end_date: date | None = None
    model_config = {"from_attributes": True}


class SubKPIOut(BaseModel):
    id: int
    sub_id: str
    title: str
    items: list[SubKPIItemOut]
    model_config = {"from_attributes": True}


class HighlightMediaOut(BaseModel):
    id: int
    media_type: str
    url: str
    order_index: int
    model_config = {"from_attributes": True}


class HighlightOut(BaseModel):
    id: int
    content: str
    order_index: int
    status: str
    llm_prompt: str | None
    percentage: int | None
    media: list[HighlightMediaOut]
    model_config = {"from_attributes": True}


class KPIOut(BaseModel):
    id: int
    number: int
    title: str
    status: str
    sub_kpis: list[SubKPIOut]
    highlights: list[HighlightOut]
    model_config = {"from_attributes": True}


class KPIListItem(BaseModel):
    id: int
    number: int
    title: str
    status: str
    model_config = {"from_attributes": True}


class WeekOut(BaseModel):
    id: int
    week_date: date
    model_config = {"from_attributes": True}


class WeekCreate(BaseModel):
    week_date: date


class SubKPIIn(BaseModel):
    sub_id: str
    title: str
    items: list[str]


class KPIUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    percentage: int | None = None
    sub_kpis: list[SubKPIIn] | None = None


class ItemUpdate(BaseModel):
    content: str | None = None
    status: str | None = None
    llm_prompt: str | None = None
    percentage: int | None = None


class LinkCreate(BaseModel):
    url: str


class GenerateRequest(BaseModel):
    prompt: str
    context: str | None = None


class TrendPoint(BaseModel):
    week_date: date
    status: str


class ScheduleTaskOut(BaseModel):
    id: int
    year: int
    kpi_number: int
    title: str
    start_date: date
    end_date: date
    color: str | None
    order_index: int
    model_config = {"from_attributes": True}


class ScheduleTaskCreate(BaseModel):
    year: int
    kpi_number: int
    title: str
    start_date: date
    end_date: date
    color: str | None = None
    order_index: int = 0


class ScheduleTaskUpdate(BaseModel):
    title: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    color: str | None = None
    order_index: int | None = None


class ScheduleByKpi(BaseModel):
    kpi_number: int
    kpi_title: str
    tasks: list[ScheduleTaskOut]


class CopyYearRequest(BaseModel):
    from_year: int
    to_year: int


# ── Annual Plan (sub_kpi-based Gantt source) ──────────────────────────────────

class SegmentOut(BaseModel):
    id: int
    start_date: date | None
    end_date: date | None
    order_index: int
    model_config = {"from_attributes": True}


class SegmentCreate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None


class SegmentUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None


class AnnualPlanItemOut(BaseModel):
    id: int
    content: str
    start_date: date | None
    end_date: date | None
    order_index: int
    segments: list[SegmentOut] = []
    model_config = {"from_attributes": True}


class AnnualPlanTaskOut(BaseModel):
    id: int
    sub_id: str
    title: str
    items: list[AnnualPlanItemOut]
    model_config = {"from_attributes": True}


class AnnualPlanKpiOut(BaseModel):
    kpi_number: int
    kpi_title: str
    kpi_id: int | None
    week_id: int | None
    percentage: int | None
    tasks: list[AnnualPlanTaskOut]


class KpiCreate(BaseModel):
    title: str


class SubKpiCreate(BaseModel):
    title: str
    sub_id: str = ""


class SubKpiUpdate(BaseModel):
    title: str | None = None
    sub_id: str | None = None


class SubKpiItemCreate(BaseModel):
    content: str
    start_date: date | None = None
    end_date: date | None = None


class SubKpiItemUpdate(BaseModel):
    content: str | None = None
    start_date: date | None = None
    end_date: date | None = None
