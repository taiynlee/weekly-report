import os
import shutil
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

from app.schemas import (
    WeekCreate, WeekOut, KPIUpdate, KPIOut,
    HighlightOut, HighlightMediaOut, ItemUpdate, LinkCreate, GenerateRequest,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def _delete_upload(url_path: str) -> None:
    if url_path.startswith(('http://', 'https://')):
        return
    try:
        rel = url_path.lstrip('/')
        full = Path(__file__).parent.parent.parent / rel
        if full.exists():
            full.unlink()
    except Exception:
        pass

KPI_TITLES = [
    "1. Budget Execution",
    "2. Organizational (General)",
    "3. Organization (Digital Transformation)",
    "4. Organization (賦能平台 3.0)",
    "5. People",
]


# ── Weeks ─────────────────────────────────────────────────────────────────────

@router.post("/weeks", response_model=WeekOut, status_code=201)
def create_week(body: WeekCreate, db: Session = Depends(get_db)):
    if db.query(models.Week).filter(models.Week.week_date == body.week_date).first():
        raise HTTPException(status_code=400, detail="Week already exists")

    week = models.Week(week_date=body.week_date)
    db.add(week)
    db.flush()

    prev_week = (
        db.query(models.Week)
        .filter(models.Week.week_date < body.week_date)
        .order_by(models.Week.week_date.desc())
        .first()
    )

    if prev_week:
        for prev_kpi in sorted(prev_week.kpis, key=lambda k: k.number):
            new_kpi = models.KPI(
                week_id=week.id,
                number=prev_kpi.number,
                title=prev_kpi.title,
                status=prev_kpi.status,
            )
            new_kpi.highlights = [
                models.Highlight(
                    content=h.content, order_index=h.order_index,
                    status=h.status, llm_prompt=h.llm_prompt,
                    percentage=h.percentage,
                    media=[
                        models.HighlightMedia(
                            media_type=m.media_type, url=m.url, order_index=m.order_index
                        )
                        for m in h.media
                    ],
                )
                for h in prev_kpi.highlights
            ]
            new_kpi.sub_kpis = [
                models.SubKPI(
                    sub_id=s.sub_id, title=s.title,
                    items=[
                        models.SubKPIItem(content=i.content, order_index=i.order_index)
                        for i in s.items
                    ],
                )
                for s in prev_kpi.sub_kpis
            ]
            db.add(new_kpi)
    else:
        for i, title in enumerate(KPI_TITLES, 1):
            db.add(models.KPI(week_id=week.id, number=i, title=title, status="not_started"))

    db.commit()
    db.refresh(week)
    return week


# ── KPI ───────────────────────────────────────────────────────────────────────

@router.put("/kpis/{kpi_id}", response_model=KPIOut)
def update_kpi(kpi_id: int, body: KPIUpdate, db: Session = Depends(get_db)):
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")

    if body.title is not None:
        kpi.title = body.title

    if body.status is not None:
        kpi.status = body.status

    if body.sub_kpis is not None:
        for s in kpi.sub_kpis:
            db.delete(s)
        kpi.sub_kpis = [
            models.SubKPI(
                sub_id=s.sub_id, title=s.title,
                items=[
                    models.SubKPIItem(content=item, order_index=j)
                    for j, item in enumerate(s.items)
                ],
            )
            for s in body.sub_kpis
        ]

    db.commit()
    db.refresh(kpi)
    return kpi


# ── Highlights ────────────────────────────────────────────────────────────────

@router.post("/kpis/{kpi_id}/highlights", response_model=HighlightOut, status_code=201)
def add_highlight(kpi_id: int, db: Session = Depends(get_db)):
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    idx = len(kpi.highlights)
    h = models.Highlight(kpi_id=kpi_id, content="", order_index=idx, status="not_started")
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.put("/highlights/{item_id}", response_model=HighlightOut)
def update_highlight(item_id: int, body: ItemUpdate, db: Session = Depends(get_db)):
    h = db.query(models.Highlight).filter(models.Highlight.id == item_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    if body.content is not None:
        h.content = body.content
    if body.status is not None:
        h.status = body.status
    if body.llm_prompt is not None:
        h.llm_prompt = body.llm_prompt
    if body.percentage is not None:
        h.percentage = body.percentage
    db.commit()
    db.refresh(h)
    return h


@router.delete("/highlights/{item_id}", status_code=204)
def delete_highlight(item_id: int, db: Session = Depends(get_db)):
    h = db.query(models.Highlight).filter(models.Highlight.id == item_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(h)
    db.commit()


# ── File Upload ───────────────────────────────────────────────────────────────

@router.post("/highlights/{item_id}/upload", response_model=HighlightOut)
async def upload_highlight_file(
    item_id: int, field: str, file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if field not in ("image", "video"):
        raise HTTPException(status_code=400, detail="field must be image or video")
    h = db.query(models.Highlight).filter(models.Highlight.id == item_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")

    dest_dir = UPLOAD_DIR / "highlights" / str(item_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix if file.filename else ""
    ts = int(time.time() * 1000)
    dest = dest_dir / f"{field}_{ts}{ext}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    url = f"/uploads/highlights/{item_id}/{field}_{ts}{ext}"
    idx = len([m for m in h.media if m.media_type == field])
    media = models.HighlightMedia(highlight_id=item_id, media_type=field, url=url, order_index=idx)
    db.add(media)
    db.commit()
    db.refresh(h)
    return h


@router.post("/highlights/{item_id}/links", response_model=HighlightOut)
def add_highlight_link(item_id: int, body: LinkCreate, db: Session = Depends(get_db)):
    h = db.query(models.Highlight).filter(models.Highlight.id == item_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    idx = len([m for m in h.media if m.media_type == 'link'])
    media = models.HighlightMedia(highlight_id=item_id, media_type='link', url=body.url, order_index=idx)
    db.add(media)
    db.commit()
    db.refresh(h)
    return h


@router.delete("/highlight-media/{media_id}", status_code=204)
def delete_highlight_media(media_id: int, db: Session = Depends(get_db)):
    m = db.query(models.HighlightMedia).filter(models.HighlightMedia.id == media_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    _delete_upload(m.url)
    db.delete(m)
    db.commit()


# ── Azure Cost Skill ──────────────────────────────────────────────────────────

ENV_FILE = Path(__file__).parent.parent.parent.parent / ".env"

SUBSCRIPTIONS = {
    "AZRCASITD":           "AZRCASITD",
    "AZRWHQDXLabPOCD":     "AZRWHQDXLABPOCD",
    "AZRWHQDXLabPOCQ":     "AZRWHQDXLABPOCQ",
}

AWS_ACCOUNTS = {
    "AWSWHQPROVISIONSITD": "AWSWHQPROVISIONSITD",
}


def _load_env_file() -> dict:
    result: dict = {}
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    result[k] = v
    return result


def _query_azure_cost(sub_name: str) -> str:
    import urllib.request as _req
    import urllib.parse as _parse
    import json as _json
    from datetime import date, timedelta

    prefix = SUBSCRIPTIONS.get(sub_name)
    if not prefix:
        raise HTTPException(status_code=400, detail=f"Unknown subscription: {sub_name}")

    env    = _load_env_file()
    tenant = env[f"{prefix}_TENANT_ID"]
    client_id = env[f"{prefix}_CLIENT_ID"]
    secret = env[f"{prefix}_CLIENT_SECRET"]
    sub    = env[f"{prefix}_SUBSCRIPTION_ID"]

    token_body = _parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id, "client_secret": secret,
        "scope": "https://management.azure.com/.default",
    }).encode()
    token = _json.loads(_req.urlopen(_req.Request(
        f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
        data=token_body, method="POST")).read())["access_token"]

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    url = (f"https://management.azure.com/subscriptions/{sub}"
           f"/providers/Microsoft.CostManagement/query?api-version=2023-11-01")

    def _query(from_d, to_d):
        body = _json.dumps({
            "type": "ActualCost",
            "timeframe": "Custom",
            "timePeriod": {"from": f"{from_d}T00:00:00Z", "to": f"{to_d}T00:00:00Z"},
            "dataset": {"granularity": "None",
                        "aggregation": {"totalCost": {"name": "Cost", "function": "Sum"}}},
        }).encode()
        data = _json.loads(_req.urlopen(
            _req.Request(url, data=body, headers=headers, method="POST")).read())
        rows = data["properties"]["rows"]
        cols = [c["name"] for c in data["properties"]["columns"]]
        if rows:
            d = dict(zip(cols, rows[0]))
            return float(d["Cost"]), d["Currency"]
        return 0.0, "TWD"

    today          = date.today()
    days_since_sun = (today.weekday() + 1) % 7
    recent_sun     = today - timedelta(days=days_since_sun)
    prev_sun       = recent_sun - timedelta(days=7)
    month_start    = date(today.year, today.month, 1)
    f = lambda d: f"{d.month}/{d.day}"

    if recent_sun < month_start:
        # 本月尚無整週，直接回傳月初到今天
        cost, cur = _query(month_start, today)
        return f"{sub_name}｜{f(month_start)}–{f(today)} {cost:,.2f} {cur}"
    elif prev_sun < month_start:
        # 本月只有一個星期天
        cost_a, cur = _query(month_start, recent_sun)
        return f"{sub_name}｜到{f(recent_sun)}(日) {cost_a:,.2f} {cur}"
    else:
        # 本月有兩個（以上）星期天
        cost_a, cur = _query(month_start, recent_sun)
        cost_b, _   = _query(month_start, prev_sun)
        diff = cost_a - cost_b
        return f"{sub_name}｜到{f(recent_sun)}(日) {cost_a:,.2f} / 到{f(prev_sun)}(日) {cost_b:,.2f} / 週增 {diff:+,.2f} {cur}"


# ── AWS Cost Skill ────────────────────────────────────────────────────────────

def _get_usd_to_twd() -> float:
    import urllib.request as _req
    import json as _json
    resp = _req.urlopen("https://open.er-api.com/v6/latest/USD", timeout=5)
    return float(_json.loads(resp.read())["rates"]["TWD"])


def _query_aws_cost(account_name: str) -> str:
    import boto3 as _boto3
    from datetime import date, timedelta

    prefix = AWS_ACCOUNTS.get(account_name)
    if not prefix:
        raise HTTPException(status_code=400, detail=f"Unknown AWS account: {account_name}")

    env = _load_env_file()
    client = _boto3.client(
        "ce",
        region_name="us-east-1",
        aws_access_key_id=env[f"{prefix}_ACCESS_KEY_ID"],
        aws_secret_access_key=env[f"{prefix}_SECRET_ACCESS_KEY"],
    )

    rate = _get_usd_to_twd()

    today          = date.today()
    days_since_sun = (today.weekday() + 1) % 7
    recent_sun     = today - timedelta(days=days_since_sun)
    prev_sun       = recent_sun - timedelta(days=7)
    month_start    = date(today.year, today.month, 1)
    f = lambda d: f"{d.month}/{d.day}"
    twd = lambda usd: usd * rate

    def _query(from_d, to_d):
        resp = client.get_cost_and_usage(
            TimePeriod={"Start": str(from_d), "End": str(to_d)},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
        )
        total = sum(
            float(r["Total"]["UnblendedCost"]["Amount"])
            for r in resp["ResultsByTime"]
        )
        return total

    if recent_sun < month_start:
        usd = _query(month_start, today)
        return f"{account_name}｜{f(month_start)}–{f(today)} {usd:,.2f} USD ({twd(usd):,.0f} TWD)"
    elif prev_sun < month_start:
        usd_a = _query(month_start, recent_sun)
        return f"{account_name}｜到{f(recent_sun)}(日) {usd_a:,.2f} USD ({twd(usd_a):,.0f} TWD)"
    else:
        usd_a = _query(month_start, recent_sun)
        usd_b = _query(month_start, prev_sun)
        diff  = usd_a - usd_b
        return (f"{account_name}｜"
                f"到{f(recent_sun)}(日) {usd_a:,.2f} USD ({twd(usd_a):,.0f} TWD) / "
                f"到{f(prev_sun)}(日) {usd_b:,.2f} USD ({twd(usd_b):,.0f} TWD) / "
                f"週增 {diff:+,.2f} USD ({twd(diff):+,.0f} TWD)")


# ── LLM Generate ──────────────────────────────────────────────────────────────

@router.post("/highlights/{item_id}/generate", response_model=HighlightOut)
async def generate_highlight(item_id: int, body: GenerateRequest, db: Session = Depends(get_db)):
    h = db.query(models.Highlight).filter(models.Highlight.id == item_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")

    import asyncio
    prompt_lower = body.prompt.lower()
    azure_match = next((n for n in SUBSCRIPTIONS if n.lower() in prompt_lower), None)
    aws_match   = next((n for n in AWS_ACCOUNTS  if n.lower() in prompt_lower), None)

    if azure_match:
        h.content = await asyncio.to_thread(_query_azure_cost, azure_match)
    elif aws_match:
        h.content = await asyncio.to_thread(_query_aws_cost, aws_match)
    else:
        h.content = await _call_llm(body.prompt, body.context, h.content)

    h.llm_prompt = body.prompt
    db.commit()
    db.refresh(h)
    return h


async def _call_llm(prompt: str, context: str | None, current_content: str) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    system = "You are an assistant helping update KPI report items. Return only the updated content text, no explanation."
    user_msg = f"Current content: {current_content}\n\nInstruction: {prompt}"
    if context:
        user_msg = f"Context: {context}\n\n{user_msg}"

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user_msg}],
    )
    return message.content[0].text.strip()
