"""Structured Pydantic schemas for every analysis response produced by the AI layer.

Every route that calls the Gemini client routes its result through
`validate_response`, which:

* detects the analysis type from the system prompt,
* coerces/normalizes the raw JSON into a typed structure (strings stay
  strings, lists stay lists, unexpected extra keys are dropped), and
* never silently drops a response; if coercion itself fails, the raw dict is
  returned with a `validation_warning` marker and the failure is logged so the
  UI/operator can surface it honestly instead of trusting unvalidated output.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, ValidationError

logger = logging.getLogger("contractlens.analysis")


# ---------------------------------------------------------------------------
# Type keys (shared by prompt detection, fallback data and validation)
# ---------------------------------------------------------------------------

EXTRACT = "extract"
OBLIGATIONS = "obligations"
TIMELINE = "timeline"
FLAGS = "flags"
SUMMARY = "summary"
ALERTS = "alerts"
COMPARE = "compare"
QA = "qa"

PROMPT_TYPES = (EXTRACT, OBLIGATIONS, TIMELINE, FLAGS, SUMMARY, ALERTS, COMPARE, QA)


def detect_prompt_type(system_prompt: str) -> str:
    """Map a system prompt to its analysis type.

    Order matters: several prompts share words (e.g. the alerts engine prompt
    mentions "obligations", the summary prompt mentions "risk_highlights").
    More specific/signature phrases are matched first so each prompt is
    classified correctly.
    """
    p = (system_prompt or "").lower()
    if "senior contract analyst" in p or "contract intelligence engine" in p or ("parties" in p and "source_sections" in p):
        return EXTRACT
    if "q&a" in p or "qa" in p or ("question" in p and "answer" in p):
        return QA
    if ("contract" in p and "compar" in p) or "contract_a" in p:
        return COMPARE
    if "alerts engine" in p or ("alerts" in p and "deadline" in p):
        return ALERTS
    if "business contract summarizer" in p or "executive" in p or "summar" in p or "headline" in p:
        return SUMMARY
    if "timeline specialist" in p or "timeline" in p or "chronological" in p:
        return TIMELINE
    if "senior contract risk attorney" in p or "risk audit" in p or "risk analyst" in p or ("risk" in p and "clause" in p):
        return FLAGS
    if "legal obligations analyst" in p or "obligation" in p:
        return OBLIGATIONS
    if "risk" in p or "flag" in p:
        return FLAGS
    return OBLIGATIONS


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class LenientModel(BaseModel):
    model_config = ConfigDict(extra="ignore")


class ContractParty(LenientModel):
    name: str = Field(default="")
    role: str = Field(default="")
    shorthand: Optional[str] = Field(default="")


class ContractExtraction(LenientModel):
    document_type: str = Field(default="", description="e.g. MSA, NDA, Lease, Employment Agreement")
    title: str = Field(default="")
    governing_law: str = Field(default="")
    financial_value: str = Field(default="")
    parties: List[ContractParty] = Field(default_factory=list)
    effective_date: Optional[str] = Field(default="")
    expiration_date: Optional[str] = Field(default="")
    renewal_terms: Optional[str] = Field(default="")
    payment_terms: Optional[str] = Field(default="")
    termination_conditions: Optional[str] = Field(default="")
    service_obligations: Optional[str] = Field(default="")
    liability_cap: Optional[str] = Field(default="")
    confidence: Optional[Any] = Field(default="High")
    important_dates: List[Dict[str, Any]] = Field(default_factory=list)
    source_sections: Dict[str, Any] = Field(default_factory=dict)
    missing_fields: List[str] = Field(default_factory=list)


class ContractObligation(LenientModel):
    party: str = Field(default="")
    description: str = Field(default="")
    deadline: Optional[str] = Field(default="")
    deadline_type: Optional[str] = Field(default="")
    recurrence: Optional[str] = Field(default="")
    urgency: str = Field(default="Medium")
    consequence: Optional[str] = Field(default="")
    source_clause: str = Field(default="")
    frequency: Optional[str] = Field(default="")
    obligation_type: Optional[str] = Field(default="")
    due_date_condition: Optional[str] = Field(default="")
    penalty: Optional[str] = Field(default="")


class ObligationsResult(LenientModel):
    obligations: List[ContractObligation] = Field(default_factory=list)


class ContractFlag(LenientModel):
    title: Optional[str] = Field(default="")
    clause_text: str = Field(default="")
    section_reference: str = Field(default="")
    flag_type: Optional[str] = Field(default="")
    reason: str = Field(default="")
    severity: str = Field(default="Medium")
    affected_party: Optional[str] = Field(default="")
    suggested_revision: Optional[str] = Field(default="")
    page_reference: Optional[str] = Field(default="")
    business_impact: Optional[str] = Field(default="")
    review_consideration: Optional[str] = Field(default="")


class FlagsResult(LenientModel):
    flags: List[ContractFlag] = Field(default_factory=list)


class TimelineEvent(LenientModel):
    date: str = Field(default="")
    label: str = Field(default="")
    type: str = Field(default="deadline")
    party: str = Field(default="")
    description: str = Field(default="")
    days_from_today: Optional[int] = Field(default=0)
    urgency: Optional[str] = Field(default="Medium")
    source_clause: str = Field(default="")
    page_reference: Optional[str] = Field(default="")


class TimelineResult(LenientModel):
    timeline: List[TimelineEvent] = Field(default_factory=list)


class SummaryResult(LenientModel):
    headline: str = Field(default="")
    overview: Optional[str] = Field(default="")
    parties_summary: str = Field(default="")
    what_we_get: Optional[str] = Field(default="")
    what_we_owe: Optional[str] = Field(default="")
    key_commitments: List[str] = Field(default_factory=list)
    critical_dates: List[str] = Field(default_factory=list)
    financial_summary: Optional[str] = Field(default="")
    financial_terms: Optional[str] = Field(default="")
    top_risks: List[str] = Field(default_factory=list)
    risk_highlights: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    health_score: Optional[int] = Field(default=0)


class AlertItem(LenientModel):
    obligation: str = Field(default="")
    deadline: str = Field(default="")
    days_remaining: int = Field(default=0)
    urgency: str = Field(default="Medium")
    party: str = Field(default="")
    source_clause: str = Field(default="")


class AlertsResult(LenientModel):
    alerts: List[AlertItem] = Field(default_factory=list)


class CompareChange(LenientModel):
    type: str = Field(default="modified")
    section: str = Field(default="")
    contract_a_text: str = Field(default="")
    contract_b_text: str = Field(default="")
    significance: str = Field(default="Medium")
    explanation: str = Field(default="")


class CompareResult(LenientModel):
    changes: List[CompareChange] = Field(default_factory=list)


class QAResult(LenientModel):
    answer: str = Field(default="")
    confidence: str = Field(default="High")
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    caveat: Optional[str] = Field(default=None)
    source_section: Optional[str] = Field(default="")
    source_text: Optional[str] = Field(default="")


SCHEMAS: Dict[str, type[BaseModel]] = {
    EXTRACT: ContractExtraction,
    OBLIGATIONS: ObligationsResult,
    TIMELINE: TimelineResult,
    FLAGS: FlagsResult,
    SUMMARY: SummaryResult,
    ALERTS: AlertsResult,
    COMPARE: CompareResult,
    QA: QAResult,
}


__all__ = [
    "EXTRACT", "OBLIGATIONS", "TIMELINE", "FLAGS", "SUMMARY",
    "ALERTS", "COMPARE", "QA", "PROMPT_TYPES", "SCHEMAS",
    "detect_prompt_type", "validate_response",
]


def validate_response(system_prompt: str, data: Any) -> Dict[str, Any]:
    """Coerce a raw Gemini/fallback dict into its typed shape.

    Returns a normalized dict. On hard coercion failure the input dict is
    returned unchanged plus a `validation_warning` marker (the failure is
    logged); it is never replaced with fabricated data.
    """
    if not isinstance(data, dict):
        logger.warning("analysis_schemas: expected a dict, got %s", type(data).__name__)
        return {"validation_warning": "analysis did not return an object"}

    prompt_type = detect_prompt_type(system_prompt)
    schema = SCHEMAS.get(prompt_type)
    if schema is None:
        logger.warning("analysis_schemas: no schema for prompt type %r", prompt_type)
        return data

    try:
        return schema.model_validate(data).model_dump()
    except ValidationError as exc:
        logger.warning(
            "analysis_schemas: validation failed for %s: %s", prompt_type, exc
        )
        return {**data, "validation_warning": f"{prompt_type} could not be validated"}