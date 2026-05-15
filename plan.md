# Weekly Report — Implementation Plan

每完成 3 個步驟 commit + push 一次。

---

## Task 1：後端安裝新套件
- [x] Step 1：安裝 SQLAlchemy 與 Alembic（`uv add sqlalchemy alembic`）
- [x] Step 2：確認安裝成功
- [x] Step 3：Commit `pyproject.toml` + `uv.lock`

## Task 2：建立 SQLAlchemy ORM Models
- [x] Step 4：建立 `backend/app/database.py`（engine + session + get_db）
- [x] Step 5：改寫 `backend/app/models.py` 為 ORM models（Week / KPI / SubKPI / SubKPIItem / Highlight / Lowlight）
- [x] Step 6：確認 models import 正常

## Task 3：Alembic 初始化與第一次 Migration
- [x] Step 7：初始化 Alembic（`uv run alembic init alembic`）
- [x] Step 8：修改 `alembic/env.py`，指向 ORM models 與 SQLite
- [x] Step 9：產生並執行第一次 migration，確認 tables 建立 → **Commit**

## Task 4：建立 Pydantic Schemas
- [x] Step 10：建立 `backend/app/schemas.py`（Out / Create / Update / TrendPoint）
- [x] Step 11：確認 schemas import 正常
- [x] Step 12：Commit `schemas.py`

## Task 5：Weeks 與 KPIs 讀取路由
- [x] Step 13：建立 `backend/app/routes/weeks.py`
- [x] Step 14：更新 `backend/app/routes/kpis.py` 改為查 DB
- [x] Step 15：更新 `backend/app/main.py` 掛上新 router → **Commit**

## Task 6：Admin 寫入路由
- [x] Step 16：建立 `backend/app/routes/admin.py`（POST /weeks、PUT /kpis/{id}）
- [x] Step 17：掛上 admin router
- [x] Step 18：手動測試 Admin API → **Commit**

## Task 7：資料庫 Seed
- [x] Step 19：建立 `backend/seed.py`，把 PPT 資料寫入 DB
- [x] Step 20：執行 seed
- [x] Step 21：確認資料正確 → **Commit**

## Task 8：前端 — 週份切換
- [x] Step 22：新增 `fetchWeeks` / `fetchKPIsByWeek` API client 方法
- [x] Step 23：建立 `frontend/src/components/WeekSelector.tsx`
- [x] Step 24：更新 `index.tsx` 加入 WeekSelector → **Commit**

## Task 9：前端 — 跨週趨勢
- [x] Step 25：新增 `fetchTrend` API client 方法
- [x] Step 26：建立 `frontend/src/components/TrendChart.tsx`
- [x] Step 27：在 KpiDetail 底部加入 TrendChart → **Commit**

## Task 10：前端 — Admin Panel（基礎版）
- [x] Step 28：新增 Admin API methods（createWeek / updateKPI）
- [x] Step 29：建立 `frontend/src/routes/admin/index.tsx`
- [x] Step 30：在 `__root.tsx` Header 加入 Admin 連結 → **Commit**

## Task 11：清理與最終 Commit
- [x] Step 31：確認 `weekly.db` 已在 `.gitignore`
- [x] Step 32：移除舊的 `backend/app/data.py`
- [x] Step 33：最終 commit → **Commit**

---

## Task 12：Admin 進階功能 — 項目層級編輯
- [x] Step 34：Highlight / Lowlight 加欄位（status / llm_prompt / link / image_path / video_path）
- [x] Step 35：Alembic migration（server_default 解決 SQLite NOT NULL 限制）
- [x] Step 36：安裝 `anthropic` + `python-multipart`，更新 schemas.py → **Commit**

## Task 13：Admin 後端新 API
- [x] Step 37：admin.py 加 highlight/lowlight CRUD（POST/PUT/DELETE）
- [x] Step 38：admin.py 加檔案上傳 endpoint（`/upload?field=image_path|video_path`）
- [x] Step 39：admin.py 加 LLM 生成 endpoint（`/generate` → 呼叫 Claude Haiku）→ **Commit**

## Task 14：Admin 前端改版
- [x] Step 40：KPI 標題改為可編輯 input
- [x] Step 41：KPI 層級移除狀態選擇器；狀態改為每個 highlight/lowlight 項目各自設定
- [x] Step 42：每個項目加入 LLM Prompt、連結、圖片上傳、影片上傳欄位 → **Commit**

## Task 15：文件同步
- [x] Step 43：更新 README（新 Schema、新 API、新功能說明）
- [x] Step 44：更新 plan.md 補齊 Task 12-15
- [ ] Step 45：Commit + push → **Commit**
