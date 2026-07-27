# Feature Specification: ELK Logging Pipeline

**Feature Branch**: `005-elk-logging-pipeline`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 3.1: Add elasticsearch, logstash, and kibana to docker-compose.yml. Create logstash.conf to parse JSON logs and index them into app-logs-%{+YYYY.MM.dd}."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Centralized Log Ingestion (Priority: P1)

An operator can run the Elasticsearch, Logstash, and Kibana (ELK) stack to aggregate, parse, and index structured JSON logs produced by all microservices.

**Why this priority**: Centralized logging allows debugging microservice interactions in a polyglot system by collecting disparate stdout streams into a searchable index.

**Independent Test**: Starting the stack launches Elasticsearch, Logstash, and Kibana. Sending a mock JSON log packet to Logstash on its input port indexation results in a searchable document in Elasticsearch.

**Acceptance Scenarios**:

1. **Given** the ELK stack is active, **When** a service sends a JSON log to Logstash, **Then** Logstash successfully parses the payload and sends it to Elasticsearch.
2. **Given** logs are sent to Elasticsearch, **When** they are stored, **Then** they are stored under the daily index pattern `app-logs-YYYY.MM.dd`.

---

### User Story 2 - Interactive Log Search & Dashboards (Priority: P2)

An operator can query, filter, and view structured log events using the Kibana browser interface to analyze errors, trace interactions, and search by transaction identifiers.

**Why this priority**: A user-friendly search interface is required for support teams and operators to quickly pinpoint issues without inspecting individual raw container files.

**Independent Test**: Accessing the Kibana portal at `http://localhost:5601` allows creating an index pattern and querying logs with KQL (Kibana Query Language).

**Acceptance Scenarios**:

1. **Given** Kibana is configured, **When** the operator opens `http://localhost:5601` in a browser, **Then** the Kibana home dashboard is displayed.
2. **Given** the operator queries a specific `traceId`, **When** the logs are searched, **Then** Kibana returns all correlated log entries from both the User Service and the Order Service.

---

### Edge Cases

- What happens if the Elasticsearch container starts slower than Logstash? Logstash MUST retry connection attempts to Elasticsearch and temporarily buffer incoming logs to prevent message loss.
- What happens if a log payload contains malformed or unparseable JSON? Logstash MUST handle the parsing failure gracefully (e.g., fallback to a raw string or append a `_jsonparsefailure` tag) without dropping the message or crashing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define `elasticsearch`, `logstash`, and `kibana` services inside `docker-compose.yml`.
- **FR-002**: The `logstash` service MUST mount `logstash.conf` to configure the logging pipeline.
- **FR-003**: Logstash MUST expose a TCP/UDP input port (e.g., port 5000) configured with a JSON codec to receive application log streams.
- **FR-004**: Logstash MUST output parsed log events to Elasticsearch, indexing them into `app-logs-%{+YYYY.MM.dd}` daily indexes.
- **FR-005**: Kibana MUST be pre-configured to communicate with the Elasticsearch cluster.

### Operational Requirements *(required for deployable services)*

- **OR-001**: Kibana MUST expose port 5601 to the host machine for operator UI access.
- **OR-002**: A persistent volume named `elasticsearch-data` MUST be configured for the Elasticsearch container.
- **OR-003**: Logstash and Elasticsearch services MUST NOT expose port bindings to the host machine unless explicitly required for external ingestion.
- **OR-004**: Containers MUST enforce reasonable memory limits (e.g., limiting Elasticsearch heap memory).

### Key Entities *(include if feature involves data)*

- **Log Event**: The structured log JSON object including timestamp, log level, message, service name, and trace identifier.
- **Daily Index**: The daily-partitioned indices inside Elasticsearch matching the `app-logs-YYYY.MM.dd` pattern.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Kibana UI is fully loaded and responsive within 2 minutes of starting the stack.
- **SC-002**: Logstash successfully ingests and parses JSON logs at a rate of at least 500 events per second.
- **SC-003**: An operator can successfully search and view log documents in Kibana under 2 seconds.

## Assumptions

- Standard official Elastic stack images are used (e.g., version 8.x).
- The host system has enough memory resources (at least 2GB of free RAM) to boot the ELK containers.
