# CloudKeeper

Multi-cloud FinOps dashboard - real-time cost visibility, budget alerting, tag compliance, and optimization recommendations across AWS, Azure, and GCP.

**🔗 Live demo:** https://cloudkeeper-1ef3a.containers.snapdeploy.app

[![CI](https://github.com/Babiyashini/cloudkeeper/actions/workflows/ci.yml/badge.svg)](https://github.com/Babiyashini/cloudkeeper/actions/workflows/ci.yml)
[![Daily Cost Check](https://github.com/Babiyashini/cloudkeeper/actions/workflows/cost-check.yml/badge.svg)](https://github.com/Babiyashini/cloudkeeper/actions/workflows/cost-check.yml)

## Stack

- Backend: Python 3.12, Flask 3, Gunicorn
- Frontend: Jinja2, Chart.js 4, custom design system
- Infra: Docker, Docker Compose, GitHub Actions, GHCR, SnapDeploy
- IaC: Terraform (Render provider config)

## Features

| Page | What it does |
|---|---|
| Dashboard | KPI cards, 30-day trend chart, donut breakdown, top-5 services, budget alerts |
| Resources | Compliance ring, tag policy violations, filterable + searchable table |
| Recommendations | Monthly savings potential, HIGH/MEDIUM/LOW severities |
| Reports | Per-provider service breakdown, CSV export, print-to-PDF |

## API

- GET /api/costs/summary - grand_total + per_provider breakdown
- GET /api/costs/trend - 30-day trend per provider
- GET /api/costs/services - per-provider service breakdown
- GET /api/costs/top-services - top N services by cost
- GET /api/alerts - budget alerts with severity
- GET /api/tags - tag compliance + violations
- GET /api/recommendations - savings opportunities
- GET /health - status ok

## Automation

- CI (.github/workflows/ci.yml) - Docker build + smoke tests on every push/PR, publishes image to GHCR
- Daily Cost Check (.github/workflows/cost-check.yml) - runs daily at 09:00 UTC

## Container image

Published to GitHub Container Registry on every push to main:
