# Walkthrough: Chaos Testing & End-to-End Validation

This document summarizes the completed implementation and validation results for Phase 5.2.

## Changes Made

### 1. Telemetry and Metrics
- Modified [telemetry.ts](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/order-service/src/observability/telemetry.ts) to register the `ml_anomaly_score` Prometheus gauge.
- Replaced the deprecated OpenTelemetry `resourceFromAttributes` helper with the standard `Resource` constructor to fix TypeScript compile issues.

### 2. Service Layer
- Modified `AnomalyService` in [anomaly-service.ts](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/order-service/src/services/anomaly-service.ts) to make the anomaly mode mutable.
- Added `getMode()` and `setMode(...)` methods to dynamically switch modes.
- Integrated `ml_anomaly_score` updating inside the service so that entering `error` or `latency` mode automatically sets the metric to `0.85`, and returning to `normal` sets it to `0.05`.

### 3. API Routing
- Modified `createApp(...)` in [app.ts](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/order-service/src/app.ts) to share a single instance of `AnomalyService`.
- Added `GET /anomaly` to check the current mode.
- Added `POST /anomaly` to dynamically switch the mode (`normal`, `error`, `latency`).

### 4. Chaos Injector Script
- Created [chaos_script.py](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/chaos_script.py) in the project root.
- Implemented argument parsing, HTTP request loop to simulate load on `http://localhost:8080/users`, graceful signal handling (`SIGINT`, `SIGTERM`) to restore normal mode on interruption, and console execution summary statistics on completion.

### 5. Grafana Dashboard
- Updated [microservices-overview.json](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/config/grafana/dashboards/microservices-overview.json) to add a prominent **System Status** stat panel at the top.
- Configured a PromQL query combining `ml_anomaly_score` and error/latency thresholds, mapping results to color-coded labels (`HEALTHY`, `DEGRADED`, `CRITICAL`), falling back to `UNKNOWN` on failure.

## Verification Results

### Automated Tests
Ran `npm run test` inside `order-service` to execute the integration test suite. Added 3 new tests in [orders.test.ts](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/order-service/test/orders.test.ts):
- Assert default anomaly mode is `normal` and `ml_anomaly_score` is `0.05`.
- Assert dynamic updates via `POST /anomaly` work and metric updates to `0.85`.
- Assert HTTP 400 is returned for invalid modes.

All 30 unit and integration tests passed successfully.
