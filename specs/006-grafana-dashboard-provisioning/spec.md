# Feature Specification: Grafana Dashboard Provisioning

**Feature Branch**: `006-grafana-dashboard-provisioning`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 3.2: Add grafana to docker-compose.yml with datasources.yml (Prometheus + Elasticsearch) and a pre-configured dashboard JSON for RPS, latency, 5xx errors, and error logs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Telemetry Dashboard Provisioning (Priority: P1)

An operator can run Grafana containerized via Docker Compose and instantly access pre-loaded datasources (Prometheus and Elasticsearch) and the microservices monitoring dashboard upon container startup without any manual setup.

**Why this priority**: Pre-provisioning dashboards ensures that operational visibility is immediate and uniform across dev, staging, and production environments without operator error.

**Independent Test**: Starting the Grafana container and logging in to `http://localhost:3000` allows the operator to select the pre-loaded dashboard and view charts.

**Acceptance Scenarios**:

1. **Given** the docker-compose stack starts, **When** the operator opens the Grafana UI, **Then** the Prometheus and Elasticsearch datasources are pre-loaded under the connections panel.
2. **Given** the datasources are active, **When** the operator opens the dashboards, **Then** the pre-configured service overview dashboard is immediately visible.

---

### User Story 2 - Microservice Overview Dashboard (Priority: P2)

An operator can monitor the health and performance of the applications in real time from a single Grafana dashboard containing charts for Requests Per Second (RPS), p95 latency, 5xx error counts, and recent error log messages.

**Why this priority**: Consolidation of key operational metrics (RPS, Latency, Errors) and logs allows rapid detection and debugging of service anomalies or performance degradation.

**Independent Test**: Sending request traffic to the microservices produces corresponding metrics curves and log charts in the Grafana panel.

**Acceptance Scenarios**:

1. **Given** the dashboard is loaded, **When** the operator views the panels, **Then** RPS, p95 latency, and HTTP 5xx counts are displayed as timeseries charts.
2. **Given** the applications are logging errors, **When** the log panel is viewed, **Then** corresponding error log documents from Elasticsearch are presented in the logs view.

---

### Edge Cases

- What happens if the Prometheus or Elasticsearch datasource is unreachable? Grafana MUST boot successfully and load the dashboard, showing a warning indicator on individual panels that fail to load data, rather than crashing the container.
- How are dashboard JSON definition errors handled? Grafana MUST log the dashboard load failure in its logs and continue running, allowing the operator to correct the JSON mount.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define the `grafana` service inside `docker-compose.yml`.
- **FR-002**: Grafana MUST mount `datasources.yaml` to auto-provision Prometheus and Elasticsearch.
- **FR-003**: Grafana MUST mount `dashboards.yaml` and a JSON dashboard configuration to auto-provision the service overview dashboard.
- **FR-004**: The JSON dashboard MUST contain panels for:
  - Requests Per Second (RPS)
  - p95 response latency
  - HTTP 5xx error counts
  - Elasticsearch logs stream (filtered by error severity/level)

### Operational Requirements *(required for deployable services)*

- **OR-001**: Grafana port 3000 MUST be exposed to the host machine for operator UI access.
- **OR-002**: Provisioning directories (`provisioning/datasources/` and `provisioning/dashboards/`) MUST be mounted read-only.
- **OR-003**: Grafana security credentials (such as admin password) MUST be configurable via environment variables (e.g., `GF_SECURITY_ADMIN_PASSWORD`).

### Key Entities *(include if feature involves data)*

- **Datasource Config**: The connections YAML (`datasources.yaml`) defining Prometheus and Elasticsearch HTTP URLs.
- **Dashboard JSON**: The schema defining panel configurations, queries, and layout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Grafana service is fully up and running in under 45 seconds.
- **SC-002**: The pre-configured dashboard displays correct historical metrics and log documents matching active service operations.

## Assumptions

- Pre-configured YAML and JSON templates exist on the host in the `/config/grafana/` directory.
- The browser used to access Grafana has network visibility to the host's port 3000.
