# Weekly Report — KPI Dashboard

2026 年度 KPI 週報網站，支援多週歷史切換與跨週狀態趨勢比較。

## 架構總覽

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│                                                         │
│  ┌──────────────┐          ┌──────────────────────┐     │
│  │  Dashboard   │          │    Admin Panel        │     │
│  │  (週報檢視)  │          │  (手動更新 KPI 資料)  │     │
│  └──────┬───────┘          └──────────┬────────────┘     │
│         │  GET /api/weeks/*           │ PUT /api/admin/* │
└─────────┼─────────────────────────────┼──────────────────┘
          │                             │
┌─────────▼─────────────────────────────▼──────────────────┐
│                    FastAPI Backend                        │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ weeks router│  │  kpis router │  │  admin router  │   │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘   │
│         │                │                  │             │
│  ┌──────▼────────────────▼──────────────────▼──────────┐  │
│  │              SQLAlchemy ORM + Alembic                │  │
│  └──────────────────────────┬───────────────────────────┘  │
│                             │                             │
│                    ┌────────▼────────┐                    │
│                    │   weekly.db     │                    │
│                    │   (SQLite)      │                    │
│                    └─────────────────┘                    │
└───────────────────────────────────────────────────────────┘
```

## 資料庫 Schema

```
weeks ──────────────┐
  id                │ 1:N
  week_date (UNIQUE)│
  created_at        │
                    ▼
              kpis ──────────────────────────┐
                id                           │ 1:N
                week_id (FK)                 │
                number (1-5)                 │
                title                        │
                status                       │
                  │                          │
            ┌─────┼──────────────┐           │
            │1:N  │1:N           │1:N        │
            ▼     ▼              ▼           ▼
       sub_kpis  highlights  lowlights  (趨勢查詢用 status)
          │
          │ 1:N
          ▼
    sub_kpi_items
```

## 資料流

```
Admin 填寫表單
    │
    ▼ PUT /api/admin/kpis/{id}
FastAPI 驗證 (Pydantic)
    │
    ▼
SQLAlchemy 寫入 SQLite
    │
    ▼ cachetools TTL 快取失效
GET /api/weeks/{date}/kpis
    │
    ▼
React Dashboard 渲染
```

## Tech Stack

| 層級 | 技術 |
|------|------|
| 前端框架 | React + TypeScript |
| 路由 | TanStack Router (file-based) |
| 樣式 | Tailwind CSS |
| HTTP | Axios |
| 圖示 | lucide-react |
| 後端框架 | FastAPI |
| ORM | SQLAlchemy |
| Migration | Alembic |
| 資料庫 | SQLite |
| 套件管理 | uv |
| 設定管理 | pydantic-settings |
| 快取 | cachetools (TTL) |

## API 端點

| Method | Path | 說明 |
|--------|------|------|
| `GET` | `/api/weeks` | 所有週清單 |
| `GET` | `/api/weeks/{date}/kpis` | 該週 5 個 KPI |
| `GET` | `/api/kpis/{id}` | 單一 KPI 詳細 |
| `GET` | `/api/kpis/trend/{number}` | 指定 KPI 跨週狀態趨勢 |
| `POST` | `/api/admin/weeks` | 建立新週 |
| `PUT` | `/api/admin/kpis/{id}` | 更新 KPI 資料與狀態 |

## 專案結構

```
weekly-report/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 入口
│   │   ├── config.py        # pydantic-settings
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── routes/
│   │       ├── weeks.py     # GET /api/weeks/*
│   │       ├── kpis.py      # GET /api/kpis/*
│   │       └── admin.py     # PUT/POST /api/admin/*
│   ├── alembic/             # DB migrations
│   ├── pyproject.toml
│   └── weekly.db            # SQLite (gitignored)
├── frontend/
│   └── src/
│       ├── routes/
│       │   ├── __root.tsx
│       │   ├── index.tsx        # Dashboard
│       │   └── admin/
│       │       └── index.tsx    # Admin Panel
│       ├── components/
│       │   ├── KpiDetail.tsx
│       │   ├── WeekSelector.tsx
│       │   └── TrendChart.tsx
│       └── api/
│           └── client.ts
├── docs/
│   └── plans/
│       └── 2026-05-15-weekly-report-full.md
└── README.md
```

## 啟動方式

```bash
# 後端
cd backend
uv run alembic upgrade head   # 初始化 DB
uv run uvicorn app.main:app --port 8000 --reload

# 前端
cd frontend
npm run dev
```
