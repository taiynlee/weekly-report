# Weekly Report Full Implementation Plan

> **For Claude:** 每完成 3 個步驟執行一次 `git add -A && git commit && git push`。

**Goal:** 在現有原型基礎上，加入 SQLite 資料庫、多週歷史切換、KPI 跨週趨勢、Admin 後台。

**Architecture:** FastAPI + SQLAlchemy + Alembic (SQLite)；React + TanStack Router，新增 `/admin` 路由。

**Tech Stack:** Python/FastAPI/SQLAlchemy/Alembic/uv — TypeScript/React/TanStack Router/Tailwind/Axios

---

## Task 1：後端安裝新套件

**Files:**
- Modify: `backend/pyproject.toml`

**Step 1: 安裝 SQLAlchemy 與 Alembic**
```bash
cd backend
uv add sqlalchemy alembic
```

**Step 2: 確認安裝成功**
```bash
uv run python -c "import sqlalchemy, alembic; print('ok')"
```
Expected: `ok`

**Step 3: Commit**
```bash
git add backend/pyproject.toml backend/uv.lock
git commit -m "chore: add sqlalchemy and alembic dependencies"
git push
```

---

## Task 2：建立 SQLAlchemy ORM Models

**Files:**
- Create: `backend/app/database.py`
- Modify: `backend/app/models.py`

**Step 4: 建立 database.py（engine + session）**
```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./weekly.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Step 5: 改寫 models.py 為 ORM models**
```python
# backend/app/models.py
from datetime import date, datetime
from sqlalchemy import Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Week(Base):
    __tablename__ = "weeks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    week_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    kpis: Mapped[list["KPI"]] = relationship(back_populates="week", cascade="all, delete-orphan")

class KPI(Base):
    __tablename__ = "kpis"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    week_id: Mapped[int] = mapped_column(ForeignKey("weeks.id"), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    week: Mapped["Week"] = relationship(back_populates="kpis")
    sub_kpis: Mapped[list["SubKPI"]] = relationship(back_populates="kpi", cascade="all, delete-orphan")
    highlights: Mapped[list["Highlight"]] = relationship(back_populates="kpi", cascade="all, delete-orphan")
    lowlights: Mapped[list["Lowlight"]] = relationship(back_populates="kpi", cascade="all, delete-orphan")

class SubKPI(Base):
    __tablename__ = "sub_kpis"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kpi_id: Mapped[int] = mapped_column(ForeignKey("kpis.id"), nullable=False)
    sub_id: Mapped[str] = mapped_column(String(10), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    kpi: Mapped["KPI"] = relationship(back_populates="sub_kpis")
    items: Mapped[list["SubKPIItem"]] = relationship(back_populates="sub_kpi", cascade="all, delete-orphan")

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
    kpi: Mapped["KPI"] = relationship(back_populates="highlights")

class Lowlight(Base):
    __tablename__ = "lowlights"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kpi_id: Mapped[int] = mapped_column(ForeignKey("kpis.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    kpi: Mapped["KPI"] = relationship(back_populates="lowlights")
```

**Step 6: 確認 models import 正常**
```bash
uv run python -c "from app.models import Week, KPI; print('ok')"
```
Expected: `ok`

---

## Task 3：Alembic 初始化與第一次 Migration

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/`

**Step 7: 初始化 Alembic**
```bash
cd backend
uv run alembic init alembic
```

**Step 8: 修改 alembic/env.py，指向 ORM models**

在 `alembic/env.py` 加入：
```python
from app.database import Base
from app import models  # noqa: F401 — 確保所有 model 被載入
target_metadata = Base.metadata
```
並將 `sqlalchemy.url` 改為：`sqlite:///./weekly.db`

**Step 9: 產生並執行第一次 migration**
```bash
uv run alembic revision --autogenerate -m "create initial tables"
uv run alembic upgrade head
uv run python -c "from app.database import engine; print(engine.table_names())"
```
Expected: 列出所有 table 名稱

> **Commit checkpoint（Step 7-9 完成）**
```bash
git add backend/alembic/ backend/alembic.ini backend/app/database.py backend/app/models.py
git commit -m "feat: add SQLAlchemy ORM models and Alembic migration"
git push
```

---

## Task 4：建立 Pydantic Schemas

**Files:**
- Create: `backend/app/schemas.py`

**Step 10: 建立 schemas.py**
```python
# backend/app/schemas.py
from datetime import date
from pydantic import BaseModel

class SubKPIItemOut(BaseModel):
    id: int
    content: str
    order_index: int
    model_config = {"from_attributes": True}

class SubKPIOut(BaseModel):
    id: str
    title: str
    items: list[SubKPIItemOut]
    model_config = {"from_attributes": True}

class HighlightOut(BaseModel):
    id: int
    content: str
    model_config = {"from_attributes": True}

class LowlightOut(BaseModel):
    id: int
    content: str
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

class KPIUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    highlights: list[str] | None = None
    lowlights: list[str] | None = None
    sub_kpis: list[dict] | None = None

class TrendPoint(BaseModel):
    week_date: date
    status: str
```

**Step 11: 確認 schemas import 正常**
```bash
uv run python -c "from app.schemas import KPIOut, WeekOut; print('ok')"
```
Expected: `ok`

**Step 12: Commit**
```bash
git add backend/app/schemas.py
git commit -m "feat: add Pydantic request/response schemas"
git push
```

---

## Task 5：建立 Weeks 與 KPIs 讀取路由

**Files:**
- Create: `backend/app/routes/weeks.py`
- Modify: `backend/app/routes/kpis.py`
- Modify: `backend/app/main.py`

**Step 13: 建立 weeks.py**
```python
# backend/app/routes/weeks.py
from fastapi import APIRouter, Depends
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
    from datetime import date
    week = db.query(models.Week).filter(models.Week.week_date == date.fromisoformat(week_date)).first()
    if not week:
        from fastapi import HTTPException
        raise HTTPException(404, "Week not found")
    return sorted(week.kpis, key=lambda k: k.number)
```

**Step 14: 更新 kpis.py 改為查 DB**
```python
# backend/app/routes/kpis.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas import KPIOut, TrendPoint

router = APIRouter(prefix="/api/kpis", tags=["kpis"])

@router.get("/{kpi_id}", response_model=KPIOut)
def get_kpi(kpi_id: int, db: Session = Depends(get_db)):
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(404, "KPI not found")
    return kpi

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
```

**Step 15: 更新 main.py 掛上新 router，移除舊 kpi router**
```python
from app.routes.weeks import router as weeks_router
from app.routes.kpis import router as kpis_router
app.include_router(weeks_router)
app.include_router(kpis_router)
```

> **Commit checkpoint（Step 13-15 完成）**
```bash
git add backend/app/routes/ backend/app/main.py
git commit -m "feat: add weeks and kpis read API routes with SQLAlchemy"
git push
```

---

## Task 6：建立 Admin 路由（寫入 API）

**Files:**
- Create: `backend/app/routes/admin.py`
- Modify: `backend/app/main.py`

**Step 16: 建立 admin.py**
```python
# backend/app/routes/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas import WeekCreate, WeekOut, KPIUpdate, KPIOut
from datetime import date as date_type

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/weeks", response_model=WeekOut, status_code=201)
def create_week(body: WeekCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Week).filter(models.Week.week_date == body.week_date).first()
    if existing:
        raise HTTPException(400, "Week already exists")
    week = models.Week(week_date=body.week_date)
    db.add(week)
    db.flush()
    kpi_titles = [
        "1. Budget Execution",
        "2. Organizational (General)",
        "3. Organization (Digital Transformation)",
        "4. Organization (賦能平台 3.0)",
        "5. People",
    ]
    for i, title in enumerate(kpi_titles, 1):
        db.add(models.KPI(week_id=week.id, number=i, title=title, status="not_started"))
    db.commit()
    db.refresh(week)
    return week

@router.put("/kpis/{kpi_id}", response_model=KPIOut)
def update_kpi(kpi_id: int, body: KPIUpdate, db: Session = Depends(get_db)):
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(404, "KPI not found")
    if body.title is not None:
        kpi.title = body.title
    if body.status is not None:
        kpi.status = body.status
    if body.highlights is not None:
        for h in kpi.highlights:
            db.delete(h)
        kpi.highlights = [models.Highlight(content=c, order_index=i) for i, c in enumerate(body.highlights)]
    if body.lowlights is not None:
        for l in kpi.lowlights:
            db.delete(l)
        kpi.lowlights = [models.Lowlight(content=c, order_index=i) for i, c in enumerate(body.lowlights)]
    db.commit()
    db.refresh(kpi)
    return kpi
```

**Step 17: 掛上 admin router**
```python
from app.routes.admin import router as admin_router
app.include_router(admin_router)
```

**Step 18: 手動測試 Admin API**
```bash
# 建立第一週
curl -X POST http://localhost:8000/api/admin/weeks \
  -H "Content-Type: application/json" \
  -d '{"week_date": "2026-05-11"}'

# 確認 KPI 自動建立
curl http://localhost:8000/api/weeks/2026-05-11/kpis
```
Expected: 回傳 5 個 KPI，status 皆為 `not_started`

> **Commit checkpoint（Step 16-18 完成）**
```bash
git add backend/app/routes/admin.py backend/app/main.py
git commit -m "feat: add admin API routes for creating weeks and updating KPIs"
git push
```

---

## Task 7：資料庫 Seed（匯入現有 PPT 資料）

**Files:**
- Create: `backend/seed.py`

**Step 19: 建立 seed.py，把目前 data.py 的資料寫入 DB**
```python
# backend/seed.py
from app.database import SessionLocal, engine, Base
from app import models
from datetime import date

Base.metadata.create_all(engine)
db = SessionLocal()

week = models.Week(week_date=date(2026, 5, 11))
db.add(week)
db.flush()

kpi_data = [...]  # 從 app/data.py 搬移

db.commit()
print("Seed complete")
```

**Step 20: 執行 seed**
```bash
uv run python seed.py
```
Expected: `Seed complete`

**Step 21: 確認資料正確**
```bash
curl http://localhost:8000/api/weeks/2026-05-11/kpis
```
Expected: 5 個 KPI，status `in_progress`，有 highlights

> **Commit checkpoint（Step 19-21 完成）**
```bash
git add backend/seed.py
git commit -m "feat: add seed script with 2026-05-11 KPI data from PPT"
git push
```

---

## Task 8：前端 — 週份切換（WeekSelector）

**Files:**
- Create: `frontend/src/components/WeekSelector.tsx`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/routes/index.tsx`

**Step 22: 新增 API client 方法**
```typescript
export const fetchWeeks = () =>
  http.get<{ id: number; week_date: string }[]>('/weeks').then(r => r.data)

export const fetchKPIsByWeek = (date: string) =>
  http.get<KPIListItem[]>(`/weeks/${date}/kpis`).then(r => r.data)
```

**Step 23: 建立 WeekSelector 元件**
```tsx
// frontend/src/components/WeekSelector.tsx
import { ChevronDown } from 'lucide-react'
interface Props { weeks: { id: number; week_date: string }[]; value: string; onChange: (d: string) => void }
export function WeekSelector({ weeks, value, onChange }: Props) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-gray-700 cursor-pointer"
      >
        {weeks.map(w => (
          <option key={w.id} value={w.week_date}>
            Week of {w.week_date}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}
```

**Step 24: 更新 index.tsx 加入 WeekSelector**
- 從 `fetchWeeks()` 取得週清單
- 新增 `selectedWeek` state
- 切換週時重新呼叫 `fetchKPIsByWeek(selectedWeek)`
- Header 右側顯示 `WeekSelector`

> **Commit checkpoint（Step 22-24 完成）**
```bash
git add frontend/src/
git commit -m "feat: add week selector with multi-week support"
git push
```

---

## Task 9：前端 — 跨週趨勢（TrendChart）

**Files:**
- Create: `frontend/src/components/TrendChart.tsx`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/components/KpiDetail.tsx`

**Step 25: 新增 trend API client 方法**
```typescript
export interface TrendPoint { week_date: string; status: string }
export const fetchTrend = (number: number) =>
  http.get<TrendPoint[]>(`/kpis/trend/${number}`).then(r => r.data)
```

**Step 26: 建立 TrendChart 元件**
```tsx
// frontend/src/components/TrendChart.tsx
// 用 Tailwind 畫出橫向時間軸，每個週一個圓點，顏色對應 status：
// not_started = gray, in_progress = blue, completed = green
const STATUS_COLOR = {
  not_started: 'bg-gray-300',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
}
```

**Step 27: 在 KpiDetail 底部加入 TrendChart**
- 呼叫 `fetchTrend(kpi.number)`
- 若只有一週資料則不顯示（需 >= 2 週才有意義）

> **Commit checkpoint（Step 25-27 完成）**
```bash
git add frontend/src/
git commit -m "feat: add cross-week KPI status trend chart"
git push
```

---

## Task 10：前端 — Admin Panel

**Files:**
- Create: `frontend/src/routes/admin/index.tsx`
- Modify: `frontend/src/routes/__root.tsx`
- Modify: `frontend/src/api/client.ts`

**Step 28: 新增 Admin API methods**
```typescript
export const createWeek = (week_date: string) =>
  http.post('/admin/weeks', { week_date }).then(r => r.data)

export const updateKPI = (id: number, data: Partial<KPI>) =>
  http.put(`/admin/kpis/${id}`, data).then(r => r.data)
```

**Step 29: 建立 admin/index.tsx**
- 頂部：建立新週的日期選擇器 + 建立按鈕
- 主體：選週後顯示 5 個 KPI 的編輯卡片
- 每張卡片：
  - Status 下拉選單（未開始 / 進行中 / 完成）
  - Highlights 文字區塊（每行一條，可新增/刪除）
  - Lowlights 文字區塊（每行一條，可新增/刪除）
  - 儲存按鈕

**Step 30: 在 __root.tsx Header 加入 Admin 連結**
```tsx
<Link to="/admin" className="text-sm text-gray-500 hover:text-blue-600">Admin</Link>
```

> **Commit checkpoint（Step 28-30 完成）**
```bash
git add frontend/src/
git commit -m "feat: add admin panel for manual KPI data entry"
git push
```

---

## Task 11：.gitignore 補強與最終清理

**Files:**
- Modify: `.gitignore`
- Delete: `backend/app/data.py`（已被 DB 取代）

**Step 31: 確認 weekly.db 已在 .gitignore**
```
backend/weekly.db
```

**Step 32: 移除舊的 data.py，更新 pyproject.toml 若有 hello.py**

**Step 33: 最終 commit**
```bash
git add -A
git commit -m "chore: cleanup legacy data.py, ensure db is gitignored"
git push
```

---

## 完成後驗收清單

- [ ] `GET /api/weeks` 回傳週清單
- [ ] `GET /api/weeks/2026-05-11/kpis` 回傳 5 個 KPI
- [ ] `GET /api/kpis/trend/1` 回傳跨週趨勢
- [ ] `POST /api/admin/weeks` 可建立新週
- [ ] `PUT /api/admin/kpis/{id}` 可更新 KPI
- [ ] 前端週份下拉切換正常
- [ ] 前端趨勢圓點顯示正確
- [ ] Admin 頁面可儲存資料並即時反映
- [ ] `weekly.db` 不在 git history 中
