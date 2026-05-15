# Weekly Report — KPI Dashboard

2026 年度 KPI 週報網站，支援多週歷史切換、跨週狀態趨勢比較，及 Admin 逐項編輯（含 LLM 生成、檔案上傳）。

## 架構總覽

```
┌─────────────────────────────────────────────────────────────┐
│                          Browser                            │
│                                                             │
│  ┌──────────────┐           ┌──────────────────────────┐    │
│  │  Dashboard   │           │       Admin Panel         │    │
│  │  (週報檢視)  │           │  (KPI / 項目逐筆編輯)    │    │
│  └──────┬───────┘           └──────────┬────────────────┘    │
│         │  GET /api/weeks/*            │ PUT/POST /api/admin/*│
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
┌─────────▼──────────────────────────────▼─────────────────────┐
│                       FastAPI Backend                         │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ weeks router│  │  kpis router │  │    admin router      │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘  │
│         │                │                     │              │
│  ┌──────▼────────────────▼─────────────────────▼───────────┐  │
│  │               SQLAlchemy ORM + Alembic                   │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                │
│               ┌─────────────▼─────────────┐                 │
│               │         weekly.db          │                 │
│               │         (SQLite)           │                 │
│               └───────────────────────────┘                 │
│                                                               │
│               ┌───────────────────────────┐                 │
│               │   /uploads  (靜態檔案)     │                 │
│               │   images / videos          │                 │
│               └───────────────────────────┘                 │
└───────────────────────────────────────────────────────────────┘
```

## 資料庫 Schema

```
weeks ──────────────┐
  id                │ 1:N
  week_date (UNIQUE)│
  created_at        │
                    ▼
              kpis ─────────────────────────────┐
                id                              │ 1:N
                week_id (FK)                    │
                number (1-5)                    │
                title                           │
                status                          │
                  │                             │
            ┌─────┼──────────────┐              │
            │1:N  │1:N           │1:N           │
            ▼     ▼              ▼              ▼
       sub_kpis  highlights  lowlights   (趨勢查詢用)
          │          │            │
          │ 1:N      │            │
          ▼          ▼            ▼
    sub_kpi_items  (status, llm_prompt, link,
                    image_path, video_path)
```

### highlights / lowlights 新增欄位

| 欄位 | 說明 |
|------|------|
| `status` | 項目狀態（not_started / in_progress / completed） |
| `llm_prompt` | 上次傳給 Claude 的 prompt |
| `link` | 相關連結 URL |
| `image_path` | 上傳圖片路徑（served via `/uploads/`） |
| `video_path` | 上傳影片路徑（served via `/uploads/`） |

## Tech Stack

| 層級 | 技術 |
|------|------|
| 前端框架 | React + TypeScript |
| 路由 | TanStack Router (file-based) |
| 樣式 | Tailwind CSS v4 |
| HTTP | Axios |
| 圖示 | lucide-react |
| 後端框架 | FastAPI |
| ORM | SQLAlchemy |
| Migration | Alembic |
| 資料庫 | SQLite |
| 套件管理 | uv |
| 設定管理 | pydantic-settings |
| LLM | Anthropic SDK (claude-haiku) |
| 檔案上傳 | python-multipart + FastAPI StaticFiles |

## API 端點

### 讀取（Dashboard）

| Method | Path | 說明 |
|--------|------|------|
| `GET` | `/api/weeks` | 所有週清單 |
| `GET` | `/api/weeks/{date}/kpis` | 該週 5 個 KPI |
| `GET` | `/api/kpis/{id}` | 單一 KPI 詳細（含 highlights/lowlights 新欄位） |
| `GET` | `/api/kpis/trend/{number}` | 指定 KPI 跨週狀態趨勢 |

### Admin

| Method | Path | 說明 |
|--------|------|------|
| `POST` | `/api/admin/weeks` | 建立新週（自動產生 5 個 KPI） |
| `PUT` | `/api/admin/kpis/{id}` | 更新 KPI 標題 / sub_kpis |
| `POST` | `/api/admin/kpis/{id}/highlights` | 新增 highlight 項目 |
| `PUT` | `/api/admin/highlights/{id}` | 更新 highlight（content/status/llm_prompt/link） |
| `DELETE` | `/api/admin/highlights/{id}` | 刪除 highlight |
| `POST` | `/api/admin/highlights/{id}/upload?field=image_path` | 上傳圖片 |
| `POST` | `/api/admin/highlights/{id}/upload?field=video_path` | 上傳影片 |
| `POST` | `/api/admin/highlights/{id}/generate` | 呼叫 Claude API 更新內容 |
| `POST` | `/api/admin/kpis/{id}/lowlights` | 新增 lowlight 項目 |
| `PUT` | `/api/admin/lowlights/{id}` | 更新 lowlight |
| `DELETE` | `/api/admin/lowlights/{id}` | 刪除 lowlight |
| `POST` | `/api/admin/lowlights/{id}/upload?field=image_path` | 上傳圖片 |
| `POST` | `/api/admin/lowlights/{id}/upload?field=video_path` | 上傳影片 |
| `POST` | `/api/admin/lowlights/{id}/generate` | 呼叫 Claude API 更新內容 |

## 專案結構

```
weekly-report/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 入口 + StaticFiles /uploads
│   │   ├── config.py        # pydantic-settings
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── routes/
│   │       ├── weeks.py     # GET /api/weeks/*
│   │       ├── kpis.py      # GET /api/kpis/*
│   │       └── admin.py     # Admin CRUD + 檔案上傳 + LLM 生成
│   ├── alembic/             # DB migrations
│   ├── uploads/             # 上傳的圖片／影片（gitignored）
│   ├── pyproject.toml
│   └── weekly.db            # SQLite（gitignored）
├── frontend/
│   └── src/
│       ├── routes/
│       │   ├── __root.tsx       # 全域 Layout + Nav（Dashboard / Admin）
│       │   ├── index.tsx        # Dashboard（週份切換 + KPI tab + TrendChart）
│       │   └── admin/
│       │       └── index.tsx    # Admin Panel
│       ├── components/
│       │   ├── KpiDetail.tsx    # KPI 詳細（status badge + sub_kpis + H/L）
│       │   ├── WeekSelector.tsx # 週份下拉選單
│       │   └── TrendChart.tsx   # 跨週狀態趨勢橫向時間軸
│       ├── hooks/
│       │   └── useTheme.ts      # Dark/Light mode toggle
│       └── api/
│           └── client.ts        # 所有 API 呼叫（含 Admin CRUD）
└── README.md
```

## 環境設定

LLM 生成功能需要設定 Anthropic API Key：

```bash
# backend/.env（或直接設環境變數）
ANTHROPIC_API_KEY=sk-ant-...
```

## 啟動方式

```bash
# 後端
cd backend
uv run alembic upgrade head        # 初始化 / 執行 migration
uv run uvicorn app.main:app --port 8000 --reload

# 前端
cd frontend
npm run dev                         # http://localhost:5174
```

## Admin Panel 功能

- 建立新週份 → 自動產生 5 個 KPI
- KPI 標題直接編輯
- 每個 Highlight / Lowlight 項目：
  - 狀態切換（未開始 / 進行中 / 已完成）
  - 內容文字編輯
  - **LLM Prompt**：輸入指令後按「生成」，Claude 自動更新內容
  - **連結**：URL 欄位
  - **圖片**：本機上傳，預覽顯示
  - **影片**：本機上傳，嵌入播放器
