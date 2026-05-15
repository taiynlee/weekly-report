"""Seed DB with 2026-05-11 KPI data extracted from weekly_20260511.pptx."""
from datetime import date

from app.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(engine)

SEED_DATE = date(2026, 5, 11)

KPI_SEED = [
    {
        "number": 1,
        "title": "1. Budget Execution",
        "status": "in_progress",
        "sub_kpis": [
            {
                "sub_id": "1.1",
                "title": "1.1 Budget execution >= 90%, <=100%",
                "items": [
                    "雲端費用追蹤 (Azure, AWS)",
                    "辦理 conference 活動",
                    "Lab 環境軟硬體採購",
                ],
            }
        ],
        "highlights": [
            "Azure: cost until today $953（比上週新增 $684）",
            "AZRWHQDXLabPOCQ: $43（比上週新增 $31）",
            "AZRWHQDXLabPOCD: $101（比上週新增 $70）",
            "AWSWHQPROVISIONSITD: $420（比上週新增 $315）",
            "DevOps Taipei (6/25~6/26) – Joy 共計 15 人",
            "KubeSummit (Oct.) – Ruby",
        ],
        "lowlights": ["None"],
    },
    {
        "number": 2,
        "title": "2. Organizational (General)",
        "status": "in_progress",
        "sub_kpis": [
            {
                "sub_id": "2.1",
                "title": "2.1 Project on time",
                "items": [
                    "衛星雲的擴展（共 10 projects）協助前期培訓、平台管理與專案落地",
                    "支援 WUS/WMX 的 COG/SRE，確保平台運行穩定與運維能力提升",
                ],
            },
            {
                "sub_id": "2.2",
                "title": "2.2 IT Service SLA",
                "items": [
                    "完善 CCoE 平台上各元件版本控制、問題追蹤、升級、備份、災難復原等機制",
                    "協助 CCoE 雲端平台元件 SLA >= 99% 以上",
                ],
            },
        ],
        "highlights": [
            "WW SAT WUS：目前預計建置二個機房，COG 準備再出差去美國安裝上架，4/27 出發",
            "WW SAT WLC：預計先使用 WMX SAT",
            "Nginx Ingress controller 置換，驗證 gateway-api + Traefik 中，測試結果與實施步驟放至 cloud guidebook，六月底前完成研究，預計年底上線",
            "Completed CCoE mid-quarter report",
        ],
        "lowlights": ["None"],
    },
    {
        "number": 3,
        "title": "3. Organization (Digital Transformation)",
        "status": "in_progress",
        "sub_kpis": [
            {
                "sub_id": "3.1",
                "title": "3.1 Cloud Architect",
                "items": [
                    "Facilitate Application (52+) reach Cloud Maturity score >= 3.0",
                ],
            },
            {
                "sub_id": "3.2",
                "title": "3.2 Cloud Tenants",
                "items": [
                    "CA Academy 推展 Cloud (Azure/AWS) 使用課程 >= 2 waves（30 人）",
                    "協助 SRE Academy 訓練計劃 >= 2 waves（15 人）",
                ],
            },
        ],
        "highlights": [
            "SRE Academy Wave1 kick-off 2/26（10 人受訓 / 7 courses）→ final presentation 4/7",
        ],
        "lowlights": ["None"],
    },
    {
        "number": 4,
        "title": "4. Organization (賦能平台 3.0)",
        "status": "in_progress",
        "sub_kpis": [
            {
                "sub_id": "4.1",
                "title": "4.1 AI Enterprise Foundation",
                "items": [
                    "AI Foundation (Phase2) 專案 on time",
                    "完善 AI 平台雲/地 Agent 平台建置",
                    "協助 AMD GPU 硬體整合地端 HPC GPU 資源池：MI350 × 2",
                    "規劃地端 LLM 推論元件整合與應用在緯創大腦",
                ],
            },
            {
                "sub_id": "4.2",
                "title": "4.2 AI Application & Governance",
                "items": [
                    "協助擴大 Columbus 平台應用：Agent 用例 >= 20",
                    "協助建置虛實整合賦能平台：完成 3 個場域虛實整合用例並上架",
                    "協助垂直領域 AI 應用：開發並落地 3 個在場域的 SLM 模型",
                ],
            },
            {
                "sub_id": "4.3",
                "title": "4.3 AI Tenants",
                "items": [
                    "AI Engineer 學院的推廣與賦能 >= 1 wave（45 人）",
                ],
            },
        ],
        "highlights": [
            "Lmcache + LLM-D setting up & SOP",
            "Slurm monitoring setting & SOP，架設新 UI（AIF 申請中），並與 Tony、Roger、TM、User 說明，計畫增加 slurmdbd 歷史資料",
            "AMD MI350 environment setting with Yuna",
            "LLMOPS — 1. MinIO: API to create bucket（竹北）4/16；2. BCM: slurm 帳號、NetApp 掛載、GPU metrics 4/22；3. Harbor: API account of harbor dev 已完成，new harbor for AAW3.0 planned until end of June；4. K8S: service account YAML 延用原本地端 GitLab",
        ],
        "lowlights": ["None"],
    },
    {
        "number": 5,
        "title": "5. People",
        "status": "in_progress",
        "sub_kpis": [
            {"sub_id": "5.1", "title": "5.1 New Technology & PoC", "items": ["Wistron DX Lab introduce new technology & PoC every half year"]},
            {"sub_id": "5.2", "title": "5.2 TCM 推動", "items": ["協助規劃與推動 TCM：Cloud Architect 溝通、驗證與評估"]},
            {"sub_id": "5.3", "title": "5.3 HPC 建置與管理", "items": ["推動資料中心 HPC (Slurm) 的建置、應用與管理實務"]},
            {"sub_id": "5.4", "title": "5.4 實習生訓練", "items": ["實習生訓練協助"]},
        ],
        "highlights": [
            "LLM/SLM Inference 概念與架構",
            "Agent & Skill (nanobot)",
            "DeepAgents（k8s 管理、報表、trouble shooting、告警、email 定期通知）",
            "台科大評選討論",
        ],
        "lowlights": ["None"],
    },
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(models.Week).filter(models.Week.week_date == SEED_DATE).first()
        if existing:
            print(f"Week {SEED_DATE} already exists, skipping seed.")
            return

        week = models.Week(week_date=SEED_DATE)
        db.add(week)
        db.flush()

        for kpi_data in KPI_SEED:
            kpi = models.KPI(
                week_id=week.id,
                number=kpi_data["number"],
                title=kpi_data["title"],
                status=kpi_data["status"],
            )
            db.add(kpi)
            db.flush()

            for i, h in enumerate(kpi_data["highlights"]):
                db.add(models.Highlight(kpi_id=kpi.id, content=h, order_index=i))
            for i, l in enumerate(kpi_data["lowlights"]):
                db.add(models.Lowlight(kpi_id=kpi.id, content=l, order_index=i))
            for sub_data in kpi_data["sub_kpis"]:
                sub = models.SubKPI(kpi_id=kpi.id, sub_id=sub_data["sub_id"], title=sub_data["title"])
                db.add(sub)
                db.flush()
                for j, item in enumerate(sub_data["items"]):
                    db.add(models.SubKPIItem(sub_kpi_id=sub.id, content=item, order_index=j))

        db.commit()
        print(f"Seed complete: week {SEED_DATE} with {len(KPI_SEED)} KPIs.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
