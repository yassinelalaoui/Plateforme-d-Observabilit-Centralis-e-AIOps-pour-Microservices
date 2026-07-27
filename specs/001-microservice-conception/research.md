# Research: Microservice Conception

## Decision: Spring Boot User Service and Node.js Order Service

**Rationale**: The project explicitly supports Spring Boot and Node.js microservices. Assigning
one service to each demonstrates polyglot observability and W3C trace propagation while keeping
each service small and independently deployable.

**Alternatives considered**:

- Use Spring Boot for both services: simpler but does not exercise the stated platform mix.
- Use Node.js for both services: equally valid technically but does not demonstrate Java telemetry.

## Decision: PostgreSQL 16 is private to Order Service

**Rationale**: Order Service is the sole owner of order persistence. Keeping PostgreSQL on a
named `data` network with no host port and only an Order Service network attachment enforces the
constitution's datastore boundary and container isolation.

**Alternatives considered**:

- Share the database with User Service: rejected because it breaks service ownership.
- Publish PostgreSQL to the host: rejected because application access does not require it.

## Decision: One validated `ANOMALY_MODE` configuration value

**Rationale**: `normal`, `error`, and `latency` are mutually exclusive modes. A single enum-like
value makes invalid and conflicting configuration impossible, defaults safely to `normal`, and is
easy to document and test. Error mode applies a Bernoulli 0.20 selection per request; latency
mode selects a duration uniformly from 3,000 to 5,000 milliseconds per request.

**Alternatives considered**:

- Independent error and latency flags: rejected because the specification forbids combined modes.
- Fixed delay: rejected because the requested scenario requires a 3–5 second range.

## Decision: OpenTelemetry plus Prometheus-compatible metrics

**Rationale**: OpenTelemetry SDKs provide trace context propagation and structured correlation;
Micrometer and prom-client expose stable low-cardinality request/error/duration metrics for
Prometheus. Logs use JSON and include trace identifiers, not secrets or full request payloads.

**Alternatives considered**:

- Logs only: rejected because it cannot provide trace linkage or alertable metrics.
- High-cardinality labels such as user or order IDs: rejected by the constitution.

## Decision: Failure mapping and timeouts

**Rationale**: The User Service uses a finite outbound timeout and maps Order Service network,
timeout, and HTTP 5xx failures to HTTP 503, as clarified in the feature specification. It does
not return partial data as a successful response.

**Alternatives considered**:

- Return partial users without orders: rejected by FR-008.
- Return HTTP 500: rejected by the clarification that specifies HTTP 503.

## Decision: Versioned SQL initialization and seeded data

**Rationale**: Ordered, idempotent schema and seed scripts make a clean local environment
reproducible and provide predictable data for contracts and smoke tests.

**Alternatives considered**:

- Runtime schema creation in service code: rejected because it obscures database ownership and
  makes initialization harder to audit.
