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
                    "?²ç«¯è²»ç”¨è¿½è¹¤ (Azure, AWS)",
                    "è¾¦ç? conference æ´»å?",
                    "Lab ?°å?è»Ÿç¡¬é«”æ¡è³?,
                ],
            }
        ],
        "highlights": [
            "Azure: cost until today $953ï¼ˆæ?ä¸Šé€±æ–°å¢?$684ï¼?,
            "AZRWHQDXLabPOCQ: $43ï¼ˆæ?ä¸Šé€±æ–°å¢?$31ï¼?,
            "AZRWHQDXLabPOCD: $101ï¼ˆæ?ä¸Šé€±æ–°å¢?$70ï¼?,
            "AWSWHQPROVISIONSITD: $420ï¼ˆæ?ä¸Šé€±æ–°å¢?$315ï¼?,
            "DevOps Taipei (6/25~6/26) ??Joy ?±è? 15 äº?,
            "KubeSummit (Oct.) ??Ruby",
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
                    "è¡›æ??²ç??´å?ï¼ˆå…± 10 projectsï¼‰å??©å??ŸåŸ¹è¨“ã€å¹³?°ç®¡?†è?å°ˆæ??½åœ°",
                    "?¯æ´ WUS/WMX ??COG/SREï¼Œç¢ºä¿å¹³?°é?è¡Œç©©å®šè??‹ç¶­?½å??å?",
                ],
            },
            {
                "sub_id": "2.2",
                "title": "2.2 IT Service SLA",
                "items": [
                    "å®Œå? CCoE å¹³å°ä¸Šå??ƒä»¶?ˆæœ¬?§åˆ¶?å?é¡Œè¿½è¹¤ã€å?ç´šã€å?ä»½ã€ç½??¾©?Ÿç?æ©Ÿåˆ¶",
                    "?”åŠ© CCoE ?²ç«¯å¹³å°?ƒä»¶ SLA >= 99% ä»¥ä?",
                ],
            },
        ],
        "highlights": [
            "WW SAT WUSï¼šç›®?é?è¨ˆå»ºç½®ä??‹æ??¿ï?COG æº–å??å‡ºå·®å»ç¾å?å®‰è?ä¸Šæ¶ï¼?/27 ?ºç™¼",
            "WW SAT WLCï¼šé?è¨ˆå?ä½¿ç”¨ WMX SAT",
            "Nginx Ingress controller ç½®æ?ï¼Œé?è­?gateway-api + Traefik ä¸­ï?æ¸¬è©¦çµæ??‡å¯¦?½æ­¥é©Ÿæ”¾??cloud guidebookï¼Œå…­?ˆå??å??ç?ç©¶ï??è?å¹´å?ä¸Šç?",
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
                    "CA Academy ?¨å? Cloud (Azure/AWS) ä½¿ç”¨èª²ç? >= 2 wavesï¼?0 äººï?",
                    "?”åŠ© SRE Academy è¨“ç·´è¨ˆå? >= 2 wavesï¼?5 äººï?",
                ],
            },
        ],
        "highlights": [
            "SRE Academy Wave1 kick-off 2/26ï¼?0 äººå?è¨?/ 7 coursesï¼‰â? final presentation 4/7",
        ],
        "lowlights": ["None"],
    },
    {
        "number": 4,
        "title": "4. Organization (è³¦èƒ½å¹³å° 3.0)",
        "status": "in_progress",
        "sub_kpis": [
            {
                "sub_id": "4.1",
                "title": "4.1 AI Enterprise Foundation",
                "items": [
                    "AI Foundation (Phase2) å°ˆæ? on time",
                    "å®Œå? AI å¹³å°????Agent å¹³å°å»ºç½®",
                    "?”åŠ© AMD GPU ç¡¬é??´å??°ç«¯ HPC GPU è³‡æ?æ± ï?MI350 ? 2",
                    "è¦å??°ç«¯ LLM ?¨è??ƒä»¶?´å??‡æ??¨åœ¨ç·¯å‰µå¤§è…¦",
                ],
            },
            {
                "sub_id": "4.2",
                "title": "4.2 AI Application & Governance",
                "items": [
                    "?”åŠ©?´å¤§ Columbus å¹³å°?‰ç”¨ï¼šAgent ?¨ä? >= 20",
                    "?”åŠ©å»ºç½®?›å¯¦?´å?è³¦èƒ½å¹³å°ï¼šå???3 ?‹å ´?Ÿè?å¯¦æ•´?ˆç”¨ä¾‹ä¸¦ä¸Šæ¶",
                    "?”åŠ©?‚ç›´?˜å? AI ?‰ç”¨ï¼šé??¼ä¸¦?½åœ° 3 ?‹åœ¨?´å???SLM æ¨¡å?",
                ],
            },
            {
                "sub_id": "4.3",
                "title": "4.3 AI Tenants",
                "items": [
                    "AI Engineer å­¸é™¢?„æ¨å»??è³¦èƒ½ >= 1 waveï¼?5 äººï?",
                ],
            },
        ],
        "highlights": [
            "Lmcache + LLM-D setting up & SOP",
            "Slurm monitoring setting & SOPï¼Œæ¶è¨­æ–° UIï¼ˆAIF ?³è?ä¸­ï?ï¼Œä¸¦??Tony?Roger?TM?User èªªæ?ï¼Œè??«å???slurmdbd æ­·å²è³‡æ?",
            "AMD MI350 environment setting with Yuna",
            "LLMOPS ??1. MinIO: API to create bucketï¼ˆç«¹?—ï?4/16ï¼?. BCM: slurm å¸³è??NetApp ?›è??GPU metrics 4/22ï¼?. Harbor: API account of harbor dev å·²å??ï?new harbor for AAW3.0 planned until end of Juneï¼?. K8S: service account YAML å»¶ç”¨?Ÿæœ¬?°ç«¯ GitLab",
        ],
        "lowlights": ["None"],
    },
    {
        "number": 5,
        "title": "5. People",
        "status": "in_progress",
        "sub_kpis": [
            {"sub_id": "5.1", "title": "5.1 New Technology & PoC", "items": ["Your-Company DX Lab introduce new technology & PoC every half year"]},
            {"sub_id": "5.2", "title": "5.2 TCM ?¨å?", "items": ["?”åŠ©è¦å??‡æ¨??TCMï¼šCloud Architect æºé€šã€é?è­‰è?è©•ä¼°"]},
            {"sub_id": "5.3", "title": "5.3 HPC å»ºç½®?‡ç®¡??, "items": ["?¨å?è³‡æ?ä¸­å? HPC (Slurm) ?„å»ºç½®ã€æ??¨è?ç®¡ç?å¯¦å?"]},
            {"sub_id": "5.4", "title": "5.4 å¯¦ç??Ÿè?ç·?, "items": ["å¯¦ç??Ÿè?ç·´å???]},
        ],
        "highlights": [
            "LLM/SLM Inference æ¦‚å¿µ?‡æ¶æ§?,
            "Agent & Skill (nanobot)",
            "DeepAgentsï¼ˆk8s ç®¡ç??å ±è¡¨ã€trouble shooting?å?è­¦ã€email å®šæ??šçŸ¥ï¼?,
            "?°ç?å¤§è??¸è?è«?,
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
