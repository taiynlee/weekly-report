# Weekly Report — KPI Dashboard

2026 年度 KPI 週報網站，支援週報檢視、年度計劃甘特圖、跨週趨勢比較，及 Admin 完整 CRUD 管理（含 LLM 生成、檔案上傳、PPT 匯出）。

## 功能概覽

### Frontend（週報瀏覽）
- **週份選擇器**：切換歷史週份記錄
- **年度計劃頁**（甘特圖）：顯示 5 個 KPI 群組的全年時程，含今日紅線與工量%
- **KPI 詳細頁**：各 KPI 狀態、指標項目、Highlight 清單（含媒體附件）
- **跨週趨勢**：TrendChart 顯示各 KPI 跨週狀態變化
- **Dark / Light mode** 切換
- **匯出 PPT**：從年度計劃甘特圖一鍵下載 6 張投影片 PPTX（Light mode 固定輸出）

### Backend（Admin 管理）
- **KPI 管理**：週份建立（自動帶入前一週資料）、KPI 狀態 / 內容 / 工量% 編輯
- **年度計劃管理**：年份選擇（未建立年份可一鍵複製前年資料）、Sub-KPI / 項目 / 時程 CRUD、刪除後自動重排序
- **Highlight 管理**：新增 / 編輯 / 刪除（刪除自動重排序）、LLM 生成、圖片 / 影片上傳
- **排程管理（ScheduleEditor）**：年度計劃的甘特任務 CRUD

---

## 架構總覽

```
Browser
├── Frontend (React + TanStack Router)
│   ├── / (Dashboard)
│   │   ├── 年度計劃 tab  →  GanttChart + 匯出 PPT
│   │   └── KPI tabs      →  KpiDetail + TrendChart
│   └── /admin (Admin Panel)
│       ├── KPI 管理 tab  →  週份 Grid + KPI 編輯
│       └── 年度計劃 tab  →  年份 Grid + AnnualPlanEditor + ScheduleEditor
│
└── Backend (FastAPI)
    ├── /api/weeks/*          讀取週清單
    ├── /api/kpis/*           讀取 KPI 詳細 / 趨勢
    ├── /api/annual-plan/*    年度計劃讀取
    ├── /api/schedule/*       排程任務讀取
    ├── /api/admin/*          CRUD（週 / KPI / Highlight / 項目 / 時程）
    ├── /api/export/*         PPT 匯出
    └── /uploads/*            靜態媒體檔案
```

---

## 資料庫 Schema

```
weeks (1:N) ──► kpis
                 ├── (1:N) sub_kpis
                 │           └── (1:N) sub_kpi_items
                 │                       └── (1:N) sub_kpi_item_segments
                 └── (1:N) highlights
                             └── (1:N) highlight_media

schedule_tasks  (year, kpi_number, title, start_date, end_date, order_index)
```

---

## Tech Stack

| 層級 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 路由 | TanStack Router (file-based) |
| 樣式 | Tailwind CSS v4 |
| HTTP | Axios |
| 圖示 | lucide-react |
| 後端框架 | FastAPI |
| ORM | SQLAlchemy 2 |
| Migration | Alembic |
| 資料庫 | SQLite |
| 套件管理 | uv |
| 設定管理 | pydantic-settings |
| LLM | Anthropic SDK (claude-haiku) |
| 檔案上傳 | python-multipart + FastAPI StaticFiles |
| PPT 匯出 | python-pptx |

---

## API 端點

### 讀取

| Method | Path | 說明 |
|--------|------|------|
| `GET` | `/api/weeks` | 所有週清單 |
| `GET` | `/api/weeks/{date}/kpis` | 該週 KPI 清單 |
| `GET` | `/api/kpis/{id}` | 單一 KPI 詳細 |
| `GET` | `/api/kpis/trend/{number}` | 跨週狀態趨勢 |
| `GET` | `/api/annual-plan/{year}` | 年度計劃資料 |
| `GET` | `/api/schedule/{year}` | 排程任務（依 KPI 群組） |
| `GET` | `/api/schedule/years` | 有排程資料的年份清單 |

### Admin

| Method | Path | 說明 |
|--------|------|------|
| `POST` | `/api/admin/weeks` | 建立新週（自動帶入前週資料） |
| `PUT` | `/api/admin/kpis/{id}` | 更新 KPI（標題 / 狀態 / 工量%） |
| `POST/PUT/DELETE` | `/api/admin/kpis/{id}/sub-kpis` | Sub-KPI CRUD |
| `POST/PUT/DELETE` | `/api/admin/sub-kpi-items/*` | 項目 CRUD（刪除自動重排序） |
| `POST/PUT/DELETE` | `/api/admin/sub-kpi-item-segments/*` | 時程區間 CRUD（刪除自動重排序） |
| `POST/PUT/DELETE` | `/api/admin/highlights/*` | Highlight CRUD（刪除自動重排序） |
| `POST` | `/api/admin/highlights/{id}/upload` | 上傳圖片 / 影片 |
| `POST` | `/api/admin/highlights/{id}/generate` | Claude LLM 生成內容 |
| `POST/PUT/DELETE` | `/api/admin/schedule` | 排程任務 CRUD |
| `POST` | `/api/admin/schedule/copy-year` | 複製年度排程 |

### 匯出

| Method | Path | 說明 |
|--------|------|------|
| `GET` | `/api/export/annual-plan/{year}/pptx` | 匯出年度計劃 PPTX（6 張，Light mode） |

---

## 環境設定

**Credentials 不可 commit**，請用 `.env` 檔（已 gitignored）：

```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 啟動方式

```bash
# 後端
cd backend
uv run alembic upgrade head
uv run uvicorn app.main:app --port 8000 --reload

# 前端
cd frontend
npm install
npm run dev        # http://localhost:5174
```

---

## 專案結構

```
weekly-report/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── routes/
│   │       ├── weeks.py
│   │       ├── kpis.py
│   │       ├── admin.py        # KPI / Highlight / Sub-KPI CRUD
│   │       ├── annual_plan.py  # 年度計劃讀取
│   │       ├── schedule.py     # 排程任務 CRUD
│   │       └── export.py       # PPT 匯出
│   ├── alembic/
│   ├── uploads/        # gitignored — 使用者上傳的媒體檔
│   ├── weekly.db       # gitignored
│   └── .env            # gitignored — 放 API keys
├── frontend/
│   └── src/
│       ├── routes/
│       │   ├── __root.tsx
│       │   ├── index.tsx           # Dashboard（Gantt + KPI detail）
│       │   └── admin/index.tsx     # Admin Panel
│       ├── components/
│       │   ├── GanttChart.tsx      # 年度計劃甘特圖 + 匯出按鈕
│       │   ├── KpiDetail.tsx       # KPI 詳細內容
│       │   ├── AnnualPlanEditor.tsx
│       │   ├── ScheduleEditor.tsx
│       │   ├── WeekSelector.tsx
│       │   └── TrendChart.tsx
│       └── api/client.ts
└── README.md
```

---

## 安全性

| 項目 | 狀態 |
|------|------|
| `backend/.env` (API keys) | gitignored ✅ |
| `backend/weekly.db` | gitignored ✅ |
| `backend/uploads/` | gitignored ✅ |
| `.claude/` (本地 AI 記憶) | gitignored ✅ |
| `frontend/.tanstack/` | gitignored ✅ |
