from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from services.gemini_client import call_gemini

router = APIRouter()

class AlertItem(BaseModel):
    obligation: str
    deadline: str
    days_remaining: int
    urgency: str
    party: str
    timeframe: str  # "7-day" | "14-day" | "30-day" | "upcoming"
    source_clause: Optional[str] = None

class AlertsRequest(BaseModel):
    text: Optional[str] = None
    obligations: Optional[List[Dict[str, Any]]] = None

@router.post("/alerts")
@router.get("/alerts")
async def get_alerts(
    today: Optional[str] = Query(None, description="Current date in YYYY-MM-DD format"),
    text: Optional[str] = Query(None)
):
    """
    Compute proactive alerts for obligations/deadlines within 7, 14, or 30 days from reference date.
    """
    try:
        current_date = datetime.strptime(today, "%Y-%m-%d").date() if today else date.today()
    except Exception:
        current_date = date.today()

    today_str = current_date.strftime("%Y-%m-%d")

    # If text is provided, ask Gemini or fallback
    system_prompt = (
        f"You are a contract alerts engine. Given reference date {today_str}, identify all obligations "
        "or deadlines due within 7 days, 14 days, or 30 days. "
        "Return ONLY raw JSON: { alerts: [{obligation, deadline, days_remaining, urgency: 'Critical|High|Medium|Low', party, source_clause}] }."
    )
    
    result = call_gemini(system_prompt, text or "Standard contract terms", ref_date_str=today_str)
    alerts_raw = result.get("alerts", [])

    categorized_alerts = []
    for item in alerts_raw:
        deadline_str = item.get("deadline", "")
        days_rem = item.get("days_remaining")
        
        if days_rem is None and deadline_str:
            try:
                deadline_dt = datetime.strptime(deadline_str, "%Y-%m-%d").date()
                days_rem = (deadline_dt - current_date).days
            except Exception:
                days_rem = 14

        timeframe = "30-day"
        if days_rem is not None:
            if days_rem <= 7:
                timeframe = "7-day"
            elif days_rem <= 14:
                timeframe = "14-day"
            elif days_rem <= 30:
                timeframe = "30-day"
            else:
                timeframe = "upcoming"

        categorized_alerts.append({
            "obligation": item.get("obligation", "Contract obligation"),
            "deadline": deadline_str or (current_date.strftime("%Y-%m-%d")),
            "days_remaining": days_rem if days_rem is not None else 10,
            "urgency": item.get("urgency", "High"),
            "party": item.get("party", "Contracting Party"),
            "timeframe": timeframe,
            "source_clause": item.get("source_clause", "Terms of Service")
        })

    # Sort alerts by days_remaining ascending
    categorized_alerts.sort(key=lambda x: x["days_remaining"])

    return {
        "reference_date": today_str,
        "count": len(categorized_alerts),
        "due_within_7_days": len([a for a in categorized_alerts if a["days_remaining"] <= 7]),
        "due_within_14_days": len([a for a in categorized_alerts if a["days_remaining"] <= 14]),
        "due_within_30_days": len([a for a in categorized_alerts if a["days_remaining"] <= 30]),
        "alerts": categorized_alerts
    }
