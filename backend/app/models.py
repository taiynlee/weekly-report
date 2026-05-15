from datetime import date, datetime
from sqlalchemy import Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Week(Base):
    __tablename__ = "weeks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    week_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    kpis: Mapped[list["KPI"]] = relationship(
        back_populates="week", cascade="all, delete-orphan"
    )


class KPI(Base):
    __tablename__ = "kpis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    week_id: Mapped[int] = mapped_column(ForeignKey("weeks.id"), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="not_started")

    week: Mapped["Week"] = relationship(back_populates="kpis")
    sub_kpis: Mapped[list["SubKPI"]] = relationship(
        back_populates="kpi", cascade="all, delete-orphan", order_by="SubKPI.id"
    )
    highlights: Mapped[list["Highlight"]] = relationship(
        back_populates="kpi", cascade="all, delete-orphan", order_by="Highlight.order_index"
    )


class SubKPI(Base):
    __tablename__ = "sub_kpis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kpi_id: Mapped[int] = mapped_column(ForeignKey("kpis.id"), nullable=False)
    sub_id: Mapped[str] = mapped_column(String(10), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)

    kpi: Mapped["KPI"] = relationship(back_populates="sub_kpis")
    items: Mapped[list["SubKPIItem"]] = relationship(
        back_populates="sub_kpi", cascade="all, delete-orphan", order_by="SubKPIItem.order_index"
    )


class SubKPIItem(Base):
    __tablename__ = "sub_kpi_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sub_kpi_id: Mapped[int] = mapped_column(ForeignKey("sub_kpis.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    sub_kpi: Mapped["SubKPI"] = relationship(back_populates="items")


class Highlight(Base):
    __tablename__ = "highlights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kpi_id: Mapped[int] = mapped_column(ForeignKey("kpis.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    llm_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    percentage: Mapped[int | None] = mapped_column(Integer, nullable=True)

    kpi: Mapped["KPI"] = relationship(back_populates="highlights")
    media: Mapped[list["HighlightMedia"]] = relationship(
        back_populates="highlight", cascade="all, delete-orphan", order_by="HighlightMedia.order_index"
    )


class HighlightMedia(Base):
    __tablename__ = "highlight_media"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    highlight_id: Mapped[int] = mapped_column(ForeignKey("highlights.id"), nullable=False)
    media_type: Mapped[str] = mapped_column(String(10), nullable=False)  # 'image' or 'video'
    url: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    highlight: Mapped["Highlight"] = relationship(back_populates="media")
