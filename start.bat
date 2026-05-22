@echo off
start "Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\uvicorn app.main:app --reload --port 8000"
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 5174"
