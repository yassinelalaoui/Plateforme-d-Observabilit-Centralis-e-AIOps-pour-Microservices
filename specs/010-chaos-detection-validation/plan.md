# Implementation Plan: Chaos Testing & End-to-End Validation

**Branch**: `010-chaos-detection-validation` | **Date**: 2026-07-28 | **Spec**: [spec.md](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/specs/010-chaos-detection-validation/spec.md)

## Summary

The goal of this feature is to implement Phase 5.2, providing automated chaos injection and a unified system status visualization.
We will achieve this by:
1. Exposing dynamic `/anomaly` endpoint control in `order-service` to switch modes without restarting.
2. Emulating `ml_anomaly_score` in Prometheus metrics scraped from `order-service` to simulate ML engine outputs.
3. Creating `chaos_script.py` to toggle modes, run HTTP request load, and gracefully clean up.
4. Enhancing the Grafana dashboard with a unified "System Status" stat panel driven by combined PromQL metrics.

## Technical Context

- **Language/Version**: Python 3.x (for chaos script), Node.js v20+ / TypeScript (for order-service)
- **Primary Dependencies**: `prom-client` (order-service metrics), standard library `argparse`, `urllib` (chaos script)
- **Storage**: N/A
- **Testing**: Vitest (integration smoke tests), Python CLI manual verification
- **Target Platform**: Docker Compose / Linux server environment
- **Project Type**: CLI / Web-Service
- **Performance Goals**: Chaos script traffic rate of 1-20 requests/sec; status panel updates within 60s of mode change
- **Constraints**: 3-5 seconds response delay in latency mode; ~20% HTTP 500 failure rate in error mode; mandatory graceful signal handling (`SIGINT`, `SIGTERM`) to restore normal state on script termination

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Service ownership, versioned contracts, and datastore boundaries are defined.
- [x] Docker Compose configuration uses least privilege, named networks, private backing services, intentional image versions, and documented configuration/secrets.
- [x] Health/readiness, graceful shutdown, resource limits, and failure behavior are planned.
- [x] OpenTelemetry traces, structured logs, Prometheus metrics, and required Grafana dashboards/alerts are defined; telemetry avoids secrets and high-cardinality labels.
- [x] Automated checks include tests proportionate to risk, including contract/integration tests for service interactions.
- [x] ML work, if applicable, defines feature inputs, evaluation thresholds, versioned artifacts, auditability, rollback, and reproducible training/evaluation.

## Project Structure

### Documentation (this feature)

```text
specs/010-chaos-detection-validation/
├── plan.md              # This file
├── research.md          # Design choices, decisions, and alternatives
├── data-model.md        # Chaos Scenario and System Health State model
├── quickstart.md        # Quickstart validation guide
└── contracts/           # API Contract definitions
    └── order-service-anomaly.openapi.yaml
```

### Source Code changes

We will modify/add the following files in the workspace:

```text
chaos_script.py [NEW] (in my-project root)
order-service/
├── src/
│   ├── app.ts (register GET/POST /anomaly routes)
│   ├── services/
│   │   └── anomaly-service.ts (make mode mutable, support getMode and setMode)
│   └── observability/
│       └── telemetry.ts (register ml_anomaly_score gauge metric)
config/
└── grafana/
    └── dashboards/
        └── microservices-overview.json (add System Status Panel configuration)
```

**Structure Decision**: Modified the single-project structure of `order-service` to include dynamic anomaly endpoints and added the root-level Python script `chaos_script.py` for execution.

## Complexity Tracking

*No Constitution Check violations or exceptions required.*
