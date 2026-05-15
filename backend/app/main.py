from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.weeks import router as weeks_router
from app.routes.kpis import router as kpis_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weeks_router)
app.include_router(kpis_router)


@app.get("/health")
def health():
    return {"status": "ok"}
