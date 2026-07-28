# Research & Decisions: Chaos Testing & End-to-End Validation

This document outlines the technical research, design choices, and architectural decisions for Phase 5.2.

## 1. Dynamic Anomaly Toggling in Order Service

- **Decision**: Expose dynamic anomaly control via a new `POST /anomaly` REST endpoint on `order-service`, and a corresponding `GET /anomaly` endpoint to inspect the active mode.
- **Rationale**: 
  - Standard environment variables are read only at container startup. Modifying them requires container restarts (`docker compose restart`), which takes 10-15 seconds and disrupts telemetry scrapers.
  - An HTTP endpoint allows instant, zero-downtime, and programmatically trivial transitions between `normal`, `error`, and `latency` modes.
- **Alternatives Considered**: 
  - *Container Restart*: Toggling `ANOMALY_MODE` via env and restarting the container. Rejected because it introduces telemetry blackouts and distorts p95 latency metrics during restart intervals.
  - *File Watcher*: Writing mode to a shared volume file. Rejected because it is complex to configure non-root file permissions in containers.

## 2. ML Anomaly Score Emulation

- **Decision**: Define a new Prometheus gauge metric `ml_anomaly_score` in the `order-service` telemetry exporter.
  - When the service is in `normal` mode, `ml_anomaly_score` will report `0.05`.
  - When the service is toggled to `error` or `latency` mode, `ml_anomaly_score` will immediately set to `0.85` (above the alert threshold of `0.75`).
- **Rationale**:
  - The actual ML inference engine (`aiops-engine`) and APScheduler pipeline (from Phase 4/5.1) are currently in Draft specifications and not yet implemented in code.
  - Emulating the `ml_anomaly_score` from `order-service` provides a realistic metric stream for Prometheus to scrape, enabling the Grafana panel and alerting rules to be verified immediately.
- **Alternatives Considered**:
  - *Mock FastAPI Container*: Implementing a mock `aiops-engine` service. Rejected because it adds overhead and potential conflict with the official ML implementation phases.

## 3. Unified Grafana Status Panel Query

- **Decision**: Configure a Grafana `stat` panel widget with a combined PromQL expression that translates metrics into status integers:
  - `2` (CRITICAL) if `ml_anomaly_score > 0.75` OR error rate > 15%.
  - `1` (DEGRADED) if p95 request duration > 3 seconds.
  - `0` (HEALTHY) if no thresholds are breached.
- **Query Expression**:
  ```promql
  ((((ml_anomaly_score > 0.75) or (sum(rate(http_requests_total{service="order-service",status="500"}[2m])) / clamp_min(sum(rate(http_requests_total{service="order-service"}[2m])), 1) > 0.15)) * 0 + 2) or (((histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="order-service"}[2m])) by (le)) > 3)) * 0 + 1) or vector(0))
  ```
- **Rationale**:
  - Aggregates multiple indicators into a single, high-visibility state panel.
  - Uses Grafana Value Mappings to display descriptive states (`HEALTHY`, `DEGRADED`, `CRITICAL`) and appropriate alert colors.
  - Automatically displays `UNKNOWN` if Prometheus is unreachable or the query returns null.
- **Alternatives Considered**:
  - *Multiple Individual Panels*: Keeping metrics separate. Rejected because it violates the specification's requirement for a single unified indicator.
