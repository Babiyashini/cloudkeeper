# CloudKeeper

Multi-cloud FinOps dashboard - real-time cost visibility, budget alerting, tag compliance, and optimization recommendations across AWS, Azure, and GCP.

[![CI](https://github.com/Babiyashini/cloudkeeper/actions/workflows/ci.yml/badge.svg)](https://github.com/Babiyashini/cloudkeeper/actions/workflows/ci.yml)
[![Daily Cost Check](https://github.com/Babiyashini/cloudkeeper/actions/workflows/cost-check.yml/badge.svg)](https://github.com/Babiyashini/cloudkeeper/actions/workflows/cost-check.yml)

## Stack

- Backend: Python 3.12, Flask 3, Gunicorn
- Frontend: Jinja2, Chart.js 4, custom design system
- Infra: Docker, Docker Compose, GitHub Actions

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

- CI (.github/workflows/ci.yml) - Docker build + smoke tests on every push/PR
- Daily Cost Check (.github/workflows/cost-check.yml) - runs daily 09:00 UTC

## Run locally

docker compose up --build

Open http://localhost:5050

## Roadmap

- [x] Phase 1: Flask + Docker scaffold
- [x] Phase 2: Full FinOps logic + polished UI
- [x] Phase 3A: Git + GitHub Actions CI
- [x] Phase 3C: Daily cron cost-check workflow
- [ ] Phase 3D: Push image to GHCR
- [ ] Phase 3E: Terraform -> Render
- [ ] Phase 3F: Live public URL

## License

MIT
