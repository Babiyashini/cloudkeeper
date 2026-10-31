"""Aggregates multi-cloud billing data into totals, trends, and breakdowns."""
import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PROVIDERS = ["aws", "azure", "gcp"]

def _load(provider):
    path = os.path.join(DATA_DIR, f"{provider}_billing.json")
    with open(path) as f:
        return json.load(f)

def load_all():
    return {p: _load(p) for p in PROVIDERS}

def provider_total(data):
    return round(sum(d["total"] for d in data["daily_costs"]), 2)

def summary():
    """Total spend per provider + grand total + currency."""
    all_data = load_all()
    per_provider = {p.upper(): provider_total(d) for p, d in all_data.items()}
    grand_total = round(sum(per_provider.values()), 2)
    return {
        "currency": "USD",
        "billing_period": all_data["aws"]["billing_period"],
        "per_provider": per_provider,
        "grand_total": grand_total,
    }

def daily_trend():
    """Returns {'dates': [...], 'series': {'AWS': [...], 'Azure': [...], 'GCP': [...]}}"""
    all_data = load_all()
    aws = all_data["aws"]["daily_costs"]
    dates = [d["date"] for d in aws]
    series = {}
    for p, d in all_data.items():
        series[p.upper()] = [day["total"] for day in d["daily_costs"]]
    return {"dates": dates, "series": series}

def service_breakdown():
    """Per-provider, per-service total across the month."""
    all_data = load_all()
    result = {}
    for p, d in all_data.items():
        totals = {}
        for day in d["daily_costs"]:
            for svc, cost in day["services"].items():
                totals[svc] = round(totals.get(svc, 0) + cost, 2)
        result[p.upper()] = dict(sorted(totals.items(), key=lambda kv: -kv[1]))
    return result

def top_services(n=5):
    """Flat ranked list of top N services across all clouds."""
    breakdown = service_breakdown()
    flat = []
    for provider, services in breakdown.items():
        for svc, cost in services.items():
            flat.append({"provider": provider, "service": svc, "cost": cost})
    flat.sort(key=lambda x: -x["cost"])
    return flat[:n]