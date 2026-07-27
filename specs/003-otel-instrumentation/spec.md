# Feature Specification: OpenTelemetry Instrumentation

**Feature Branch**: `003-otel-instrumentation`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 2.1: Instrument user-service and order-service with OpenTelemetry SDK to export OTLP gRPC/HTTP traces, metrics, and logs with W3C traceparent context propagation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distributed Trace Context Propagation (Priority: P1)

An operator can track the exact execution flow of a request as it propagates from the User Service to the Order Service. The trace context is propagated using the W3C traceparent standard, ensuring a unified trace identifier links all related spans.

**Why this priority**: Correct trace propagation is essential for troubleshooting distributed system failures, tracking cross-service latency, and observing transaction paths.

**Independent Test**: Calling the User Service endpoint `GET /users` produces a trace that contains spans from both the User Service and the Order Service, sharing the same `traceId`.

**Acceptance Scenarios**:

1. **Given** a user initiates a request to User Service, **When** the User Service calls Order Service, **Then** it injects the W3C `traceparent` HTTP header.
2. **Given** the Order Service receives a request from User Service, **When** it parses the headers, **Then** it extracts the parent trace context and creates child spans under the same `traceId`.

---

### User Story 2 - Centralized Telemetry Export (Priority: P2)

The User Service and Order Service automatically export their collected traces, metrics, and logs to a centralized OpenTelemetry Collector using the OTLP protocol.

**Why this priority**: Centralized export separates application runtime logs/metrics from storage and analysis, allowing operators to monitor the system's performance and health in real time.

**Independent Test**: The OpenTelemetry Collector receives OTLP trace and metric payloads from both services, which are then viewable in Jaeger/Prometheus/Elasticsearch.

**Acceptance Scenarios**:

1. **Given** the applications are running and handling traffic, **When** the OTLP exporters are active, **Then** traces and metrics are periodically sent to the configured OTLP endpoint.
2. **Given** a log message is generated, **When** the log is formatted, **Then** it includes the active `traceId` and `spanId` (if inside a trace context) to enable log-trace correlation.

---

### Edge Cases

- What happens if the OpenTelemetry Collector endpoint is unreachable? The telemetry SDK MUST drop or buffer telemetry safely, ensuring the application remains healthy, responsive, and does not crash or leak memory.
- How are sensitive parameters (like passwords, keys, or user-identifiable data) handled in telemetry? Telemetry spans, metrics, and logs MUST redact or omit passwords, authentication headers, cookies, and high-cardinality variables.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: User Service MUST automatically inject the W3C traceparent context into outbound HTTP requests to the Order Service.
- **FR-002**: Order Service MUST extract the W3C traceparent context from incoming HTTP requests to trace execution flows.
- **FR-003**: Both services MUST configure OTLP trace, metric, and log exporters to push data to a centralized collector.
- **FR-004**: App logs MUST be output in a structured JSON format and include `trace_id` and `span_id` when a trace is active.

### Operational Requirements *(required for deployable services)*

- **OR-001**: The OTLP exporter endpoint MUST be configurable through the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable.
- **OR-002**: The default trace sampling probability MUST be configurable (defaulting to 100% or `1.0` for local debugging).
- **OR-003**: The collection and exporting of telemetry data MUST NOT introduce blocking operations or noticeable latency to client requests.

### Key Entities *(include if feature involves data)*

- **Trace Context**: The W3C traceparent header containing `version-traceid-parentid-traceflags`.
- **Telemetry Payload**: The structured OTLP data packets containing spans, metrics, or log records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Under normal loads, end-to-end request tracing correctly links all cross-service spans with a 100% correlation rate.
- **SC-002**: Telemetry processing overhead adds less than 5ms of latency to request execution.
- **SC-003**: Exported JSON logs from both services successfully correlate with active traces using the W3C trace ID in Kibana.

## Assumptions

- An OpenTelemetry Collector is available and listening on the configured OTLP receiver ports.
- The W3C traceparent header is supported and used as the default propagation format across all services.
