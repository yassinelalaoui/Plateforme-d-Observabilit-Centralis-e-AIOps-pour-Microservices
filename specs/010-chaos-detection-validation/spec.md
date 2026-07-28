# Feature Specification: Chaos Testing & End-to-End Validation

**Feature Branch**: `010-chaos-detection-validation`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 5.2: Create a unified Grafana status panel and a chaos_script.py to inject latency and 500 errors to validate end-to-end detection."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Chaos Injection (Priority: P1)

An operator or automated test suite can execute `chaos_script.py` to inject controlled failures (such as high request latency or artificial HTTP 500 errors) into the running microservices stack to simulate real-world service degradation.

**Why this priority**: Automated chaos injection allows operators to validate that the entire observability, log aggregation, and ML anomaly detection pipeline responds accurately to real failures.

**Independent Test**: Running `python chaos_script.py --mode error` triggers error responses from Order Service, resulting in error logs in ELK, elevated 5xx metrics in Prometheus, and elevated anomaly scores.

**Acceptance Scenarios**:

1. **Given** the microservices stack is running normally, **When** `chaos_script.py` is invoked with `--mode latency`, **Then** the request processing delay increases by 3-5 seconds and is reflected in Prometheus metrics.
2. **Given** `chaos_script.py` finishes its run or is terminated via `Ctrl+C`, **When** the cleanup hook executes, **Then** the services are restored to normal operating mode automatically.

---

### User Story 2 - Unified Grafana System Status Panel (Priority: P2)

An operator can view a high-level, unified system status panel in Grafana that aggregates system metrics, error counts, and ML anomaly detection scores into a single visual health indicator (e.g., `HEALTHY`, `DEGRADED`, `CRITICAL`).

**Why this priority**: A single unified status panel allows team members to quickly gauge system-wide health without inspecting dozens of separate metric graphs.

**Independent Test**: Viewing the Grafana dashboard during normal operation shows `HEALTHY`; running `chaos_script.py` transitions the status panel to `DEGRADED` or `CRITICAL`.

**Acceptance Scenarios**:

1. **Given** all services are operating without errors, **When** the Grafana dashboard is viewed, **Then** the status panel displays `HEALTHY` in green.
2. **Given** chaos injection causes elevated errors and ML anomaly scores above 0.75, **When** the status panel updates, **Then** it displays `CRITICAL` or `ANOMALY DETECTED` in red.

---

### Edge Cases

- What happens if `chaos_script.py` crashes abruptly? The script MUST register signal handlers (`SIGINT`, `SIGTERM`) to guarantee that anomaly configuration is reset to `normal` before process exit.
- What happens if the Grafana panel query fails? The status panel MUST render an `UNKNOWN` status indicator rather than showing a false `HEALTHY` state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide `chaos_script.py` to programmatically toggle anomaly modes (`normal`, `error`, `latency`) and issue test traffic.
- **FR-002**: `chaos_script.py` MUST feature a graceful exit handler to restore `ANOMALY_MODE=normal` when interrupted.
- **FR-003**: Grafana MUST include a unified status panel widget displaying overall system state based on combined Prometheus metric rules and ML anomaly metrics.
- **FR-004**: The system MUST demonstrate end-to-end convergence: Chaos Injection -> Metrics/Log Spikes -> ML Anomaly Score > 0.75 -> Status Panel Alerting.

### Operational Requirements *(required for deployable services)*

- **OR-001**: Chaos injection MUST be strictly opt-in and disabled by default.
- **OR-002**: `chaos_script.py` MUST print detailed execution summaries (mode injected, duration, request volume, error percentage observed).
- **OR-003**: The status panel threshold boundaries MUST be configurable inside the Grafana dashboard configuration.

### Key Entities *(include if feature involves data)*

- **Chaos Scenario**: The parameterized fault configuration (target service, anomaly mode, duration, request rate).
- **System Health State**: The categorical health status (`HEALTHY`, `DEGRADED`, `CRITICAL`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Executing `chaos_script.py` causes the ML anomaly score to exceed 0.75 and updates the Grafana status panel within 60 seconds.
- **SC-002**: Terminating `chaos_script.py` returns the system to a `HEALTHY` status within 60 seconds.

## Assumptions

- Python 3 with HTTP request capabilities is available on the execution machine.
- Order Service exposes an environment variable or endpoint for anomaly mode switching.
