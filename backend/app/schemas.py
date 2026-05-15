from datetime import date
from pydantic import BaseModel


class SubKPIItemOut(BaseModel):
    id: int
    content: str
    order_index: int
    model_config = {"from_attributes": True}


class SubKPIOut(BaseModel):
    id: int
    sub_id: str
    title: str
    items: list[SubKPIItemOut]
    model_config = {"from_attributes": True}


class HighlightOut(BaseModel):
    id: int
    content: str
    order_index: int
    model_config = {"from_attributes": True}


class LowlightOut(BaseModel):
    id: int
    content: str
    order_index: int
    model_config = {"from_attributes": True}


class KPIOut(BaseModel):
    id: int
    number: int
    title: str
    status: str
    sub_kpis: list[SubKPIOut]
    highlights: list[HighlightOut]
    lowlights: list[LowlightOut]
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
    highlights: list[str] | None = None
    lowlights: list[str] | None = None
    sub_kpis: list[SubKPIIn] | None = None


class TrendPoint(BaseModel):
    week_date: date
    status: str
