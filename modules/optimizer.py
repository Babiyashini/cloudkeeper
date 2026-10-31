"""Generates cost-saving recommendations from resource + spend data."""
from modules.tag_checker import load_resources, REQUIRED_TAGS

def generate_recommendations():
    resources = load_resources()
    recs = []

    for r in resources:
        tags = r.get("tags", {})

        # 1. Untagged high-cost resources — can't attribute cost, risk of waste
        if r["monthly_cost"] >= 100 and not tags:
            recs.append({
                "severity": "HIGH",
                "resource": r["name"],
                "provider": r["provider"],
                "type": r["type"],
                "monthly_cost": r["monthly_cost"],
                "savings_potential": round(r["monthly_cost"] * 0.5, 2),
                "recommendation": "Fully untagged and expensive — investigate owner and either tag, right-size, or terminate.",
            })
            continue

        # 2. Dev/test resources running at production-scale cost
        env = tags.get("Environment", "").lower()
        if env in ("dev", "test") and r["monthly_cost"] >= 100:
            recs.append({
                "severity": "MEDIUM",
                "resource": r["name"],
                "provider": r["provider"],
                "type": r["type"],
                "monthly_cost": r["monthly_cost"],
                "savings_potential": round(r["monthly_cost"] * 0.4, 2),
                "recommendation": "Non-prod resource with high cost — schedule auto-shutdown outside business hours to save ~40%.",
            })

        # 3. Missing Owner tag — governance risk
        elif "Owner" not in tags and r["monthly_cost"] >= 50:
            recs.append({
                "severity": "LOW",
                "resource": r["name"],
                "provider": r["provider"],
                "type": r["type"],
                "monthly_cost": r["monthly_cost"],
                "savings_potential": 0,
                "recommendation": "Missing Owner tag — cannot route cost alerts. Add Owner tag for accountability.",
            })

    recs.sort(key=lambda x: -x["savings_potential"])
    total_savings = round(sum(r["savings_potential"] for r in recs), 2)
    return {
        "count": len(recs),
        "total_savings_potential": total_savings,
        "recommendations": recs,
    }