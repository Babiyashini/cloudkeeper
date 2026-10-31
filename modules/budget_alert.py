"""
budget_alert.py — Budget monitoring for CloudKeeper

Reads budgets.json + the summary from cost_analyzer and returns
per-provider status (OK / WARNING / CRITICAL) plus usage percentages.
"""

import json
import os

from modules import cost_analyzer

# Resolve to project root / data, regardless of CWD
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DATA_DIR = os.path.join(_BASE_DIR, "data")
_BUDGET_FILE = os.path.join(_DATA_DIR, "budgets.json")


def load_budgets():
    """Load budgets.json. Returns dict keyed by provider (AWS / AZURE / GCP)."""
    with open(_BUDGET_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _normalize_provider(name):
    """Normalize provider name from any casing to AWS / AZURE / GCP."""
    s = str(name or "").upper()
    if s.startswith("AWS"):
        return "AWS"
    if s.startswith("AZURE"):
        return "AZURE"
    if s.startswith("GCP") or s.startswith("GOOGLE"):
        return "GCP"
    return s


def _status_for(usage_pct):
    """Classify usage percentage into a status string."""
    if usage_pct >= 100:
        return "CRITICAL"
    if usage_pct >= 90:
        return "WARNING"
    return "OK"


def check_alerts():
    """
    Return:
      {
        "alerts": [
          {
            "provider":  "AWS",
            "budget":    4500.0,
            "spend":     4574.82,
            "usage_pct": 101.66,
            "status":    "CRITICAL",
            "message":   "AWS over budget by $74.82"
          },
          ...
        ]
      }

    Alerts are sorted worst-first (CRITICAL, WARNING, OK).
    """
    budgets = load_budgets()

    # Pull current spend from cost_analyzer.summary()
    # Expected shape: {"grand_total": ..., "per_provider": {"AWS": 4574.82, ...}}
    summary = cost_analyzer.summary()
    raw_per_provider = summary.get("per_provider") or {}

    # Normalize provider keys so AWS/aws/Aws all map to "AWS"
    per_provider = {}
    for k, v in raw_per_provider.items():
        try:
            per_provider[_normalize_provider(k)] = float(v)
        except (TypeError, ValueError):
            per_provider[_normalize_provider(k)] = 0.0

    alerts = []
    for raw_provider, bdata in budgets.items():
        provider = _normalize_provider(raw_provider)

        # Support both {"budget": 4500} and a bare number
        if isinstance(bdata, (int, float)):
            budget = float(bdata)
        else:
            budget = float(bdata.get("budget", 0) or 0)

        if budget <= 0:
            continue

        spend = per_provider.get(provider, 0.0)
        usage_pct = round((spend / budget) * 100, 2)
        status = _status_for(usage_pct)

        delta = round(spend - budget, 2)
        if delta > 0:
            message = f"{provider.title()} over budget by ${delta:,.2f}"
        elif delta < 0:
            message = f"{provider.title()} ${abs(delta):,.2f} under budget"
        else:
            message = f"{provider.title()} exactly at budget"

        alerts.append(
            {
                "provider": provider,
                "budget": round(budget, 2),
                "spend": round(spend, 2),
                "usage_pct": usage_pct,
                "status": status,
                "message": message,
            }
        )

    # Sort worst-first
    _order = {"CRITICAL": 0, "WARNING": 1, "OK": 2}
    alerts.sort(key=lambda a: _order.get(a["status"], 3))

    return {"alerts": alerts}