# Feature Specification: Telemetry Infrastructure

**Feature Branch**: `004-telemetry-infrastructure`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 2.2: Add otel-collector and prometheus to docker-compose.yml with otel-collector-config.yaml and prometheus.yml configurations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Centralized Telemetry Collection (Priority: P1)

An operator can run the OpenTelemetry Collector and Prometheus services inside Docker Compose to receive, process, and scrape telemetry data (traces and metrics) from all running microservices.

**Why this priority**: Centralized infrastructure is required before any application telemetry can be parsed, aggregated, or displayed in dashboards.

**Independent Test**: Running the Docker Compose stack starts the collector and Prometheus. Opening the Prometheus targets page shows all configured scrape jobs.

**Acceptance Scenarios**:

1. **Given** the docker-compose topology is started, **When** the operator checks the health of `otel-collector` and `prometheus`, **Then** both containers are reported as healthy and running.
2. **Given** the collector is running, **When** it receives traces via OTLP/HTTP or OTLP/gRPC, **Then** it processes them according to its pipeline configuration.

---

### User Story 2 - Configurable Telemetry Routing (Priority: P2)

An operator can modify the scrape targets or export routing rules by editing external configuration files (`otel-collector-config.yaml` and `prometheus.yml`) without rewriting service code or rebuilding container images.

**Why this priority**: Flexibility in routing and scraping targets allows operators to scale the system, add new services, or route metrics to different backends dynamically.

**Independent Test**: Modifying `prometheus.yml` to change a scrape interval immediately changes the scrape frequency in Prometheus without container rebuilds.

**Acceptance Scenarios**:

1. **Given** external config files exist, **When** the container starts, **Then** `docker-compose.yml` mounts these config files read-only into the correct locations inside the containers.
2. **Given** the Prometheus config defines target jobs for `user-service` and `order-service`, **When** the Prometheus UI target page is inspected, **Then** both target systems are listed with their configured path.

---

### Edge Cases

- What happens if a scrape target is offline or unreachable? Prometheus MUST mark the target status as `down` in its state database but continue attempting to scrape on the configured interval without crashing.
- What happens if a configuration file contains invalid YAML syntax? The services MUST log a parsing error and fail to start up (fail-fast), rather than running with corrupted or silent defaults.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define `otel-collector` and `prometheus` container services inside `docker-compose.yml`.
- **FR-002**: The `otel-collector` service MUST mount `otel-collector-config.yaml` from the host.
- **FR-003**: The `prometheus` service MUST mount `prometheus.yml` from the host.
- **FR-004**: Prometheus MUST be configured to scrape metric endpoints from both User Service (`/actuator/prometheus`) and Order Service (`/metrics`).
- **FR-005**: Both telemetry services MUST be attached to a private telemetry network.

### Operational Requirements *(required for deployable services)*

- **OR-001**: Mounted configuration files inside telemetry containers MUST be read-only (`:ro`).
- **OR-002**: Both services MUST run under non-root users where possible to adhere to least privilege.
- **OR-003**: Resources (CPU and Memory) allocated to the telemetry services MUST be constrained.

### Key Entities *(include if feature involves data)*

- **Collector Configuration**: The pipeline rules (receivers, processors, exporters) defined in `otel-collector-config.yaml`.
- **Scrape Config**: The scraping target rules defined in `prometheus.yml`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Prometheus successfully scrapes endpoints and reports all targets as `up` within 30 seconds of service startup.
- **SC-002**: OpenTelemetry Collector successfully receives OTLP trace exports from application services without dropping payloads.

## Assumptions

- Pre-configured YAML templates exist on the host in the `/config` directory.
- Host firewall rules do not prevent containers on the internal networks from communicating with each other.
