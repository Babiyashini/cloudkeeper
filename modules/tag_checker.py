"""Scans resources.json for missing required tags."""
import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
REQUIRED_TAGS = ["Environment", "Owner", "Project"]

def load_resources():
    with open(os.path.join(DATA_DIR, "resources.json")) as f:
        return json.load(f)["resources"]

def check_tags():
    resources = load_resources()
    violations = []
    compliant = 0
    for r in resources:
        tags = r.get("tags", {})
        missing = [t for t in REQUIRED_TAGS if t not in tags or not tags[t]]
        if missing:
            violations.append({
                "id": r["id"],
                "name": r["name"],
                "provider": r["provider"],
                "type": r["type"],
                "monthly_cost": r["monthly_cost"],
                "missing_tags": missing,
            })
        else:
            compliant += 1
    total = len(resources)
    return {
        "total_resources": total,
        "compliant": compliant,
        "violations_count": len(violations),
        "compliance_pct": round((compliant / total) * 100, 1) if total else 0,
        "violations": violations,
    }