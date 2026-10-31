import os
from flask import Flask, render_template, jsonify
from modules import cost_analyzer, budget_alert, tag_checker, optimizer

app = Flask(__name__)

# ---------- Page routes ----------
@app.route("/")
def dashboard():
    return render_template("dashboard.html", title="Dashboard")

@app.route("/resources")
def resources_page():
    return render_template("resources.html", title="Resources")

@app.route("/recommendations")
def recommendations_page():
    return render_template("recommendations.html", title="Recommendations")

@app.route("/reports")
def reports_page():
    return render_template("reports.html", title="Reports")

@app.route("/health")
def health():
    return {"status": "ok", "service": "cloudkeeper", "version": "0.2.0"}

# ---------- API routes ----------
@app.route("/api/costs/summary")
def api_summary():
    return jsonify(cost_analyzer.summary())

@app.route("/api/costs/trend")
def api_trend():
    return jsonify(cost_analyzer.daily_trend())

@app.route("/api/costs/services")
def api_services():
    return jsonify(cost_analyzer.service_breakdown())

@app.route("/api/costs/top-services")
def api_top_services():
    return jsonify(cost_analyzer.top_services(5))

@app.route("/api/alerts")
def api_alerts():
    return jsonify(budget_alert.check_alerts())

@app.route("/api/tags")
def api_tags():
    return jsonify(tag_checker.check_tags())

@app.route("/api/recommendations")
def api_recommendations():
    return jsonify(optimizer.generate_recommendations())

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)