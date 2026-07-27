# Feature Specification: Microservice Conception

**Feature Branch**: `001-microservice-conception`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Create two lightweight sample microservices: a User Service that
retrieves users and calls an Order Service, and an Order Service that retrieves orders from a
PostgreSQL datastore. Support controlled error and latency anomalies in the Order Service, and
provide local run and test documentation."

## Clarifications

### Session 2026-07-27

- Q: Which HTTP status should the User Service return when it cannot obtain order data? → A: HTTP 503 Service Unavailable.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retrieve Users with Their Order Context (Priority: P1)

An operator can request `GET /users` from the User Service and receive a successful response
after the service has called the Order Service to obtain order information.

**Why this priority**: This verifies the central microservice-to-microservice interaction that
Sub-Phase 1.1 is intended to demonstrate.

**Independent Test**: Start both services in their normal mode, request `GET /users`, and confirm
that the response succeeds and includes the User Service result plus the available order context.

**Acceptance Scenarios**:

1. **Given** both services are available and the Order Service has sample orders, **When** a user
   requests `GET /users`, **Then** the User Service returns a successful response containing user
   information and the order information obtained from the Order Service.
2. **Given** the Order Service cannot complete its request, **When** a user requests `GET /users`,
   **Then** the User Service returns HTTP 503 Service Unavailable without presenting incomplete
   order information as a successful result.

---

### User Story 2 - Retrieve Persisted Orders (Priority: P2)

An operator can request `GET /orders` from the Order Service and receive the sample order data
that the service reads from its PostgreSQL datastore.

**Why this priority**: This proves that a service can safely own and use its backing data while
remaining independently testable.

**Independent Test**: Start the Order Service with its datastore and request `GET /orders` to
confirm the configured sample orders are returned.

**Acceptance Scenarios**:

1. **Given** the datastore is available and initialized, **When** an operator requests
   `GET /orders`, **Then** the Order Service returns a successful response with the configured
   sample orders.
2. **Given** the datastore is unavailable, **When** an operator requests `GET /orders`, **Then**
   the service returns a clear failure response and records the failure for operators.

---

### User Story 3 - Exercise Controlled Order-Service Anomalies (Priority: P3)

An operator can enable one controlled anomaly mode through Order Service configuration to observe
how the two services behave under failures and slow dependencies.

**Why this priority**: Repeatable fault conditions are needed for the observability and AIOps
work that follows this sub-phase.

**Independent Test**: Run the Order Service in each supported anomaly mode and repeatedly call
`GET /orders`, then verify the configured failure rate or latency range from the responses and
their operational signals.

**Acceptance Scenarios**:

1. **Given** the error-injection mode is enabled, **When** `GET /orders` is requested repeatedly,
   **Then** approximately 20% of requests return HTTP 500 and the remaining requests use normal
   behavior.
2. **Given** the latency-injection mode is enabled, **When** `GET /orders` is requested, **Then**
   each response is delayed by a randomly selected duration from 3 through 5 seconds before normal
   success or normal failure handling.
3. **Given** anomaly injection is disabled, **When** `GET /orders` is requested, **Then** neither
   injected HTTP 500 errors nor injected latency are applied.

### Edge Cases

- What happens when the User Service cannot reach the Order Service within its configured request
  deadline? The response must clearly indicate a dependency failure and record it.
- What happens when anomaly configuration contains an unsupported value? The Order Service must
  fail startup with a clear configuration error rather than silently choosing a mode.
- What happens if both anomaly modes are requested? The service must reject the configuration;
  only one anomaly mode may be active at a time.
- What happens if the PostgreSQL datastore has no orders? `GET /orders` returns a successful empty
  collection, and `GET /users` represents that empty order context accurately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a User Service endpoint at `GET /users`.
- **FR-002**: A successful `GET /users` request MUST cause the User Service to request order
  information from the Order Service before completing its response.
- **FR-003**: The system MUST provide an Order Service endpoint at `GET /orders`.
- **FR-004**: The Order Service MUST retrieve its sample order data from a PostgreSQL datastore
  that is owned by the Order Service.
- **FR-005**: The Order Service MUST support a configuration-controlled error anomaly mode in
  which `GET /orders` produces HTTP 500 for approximately 20% of requests.
- **FR-006**: The Order Service MUST support a configuration-controlled latency anomaly mode in
  which `GET /orders` delays each request by a random duration between 3 and 5 seconds.
- **FR-007**: The anomaly configuration MUST default to normal operation, permit only one anomaly
  mode at a time, and reject invalid or conflicting settings at startup.
- **FR-008**: Each service MUST return clear failure responses when its required dependency is
  unavailable and MUST not report a partial dependency result as a complete success.
- **FR-010**: When the User Service cannot obtain order information because the Order Service is
  unavailable or its request times out, `GET /users` MUST return HTTP 503 Service Unavailable.
- **FR-009**: The project MUST include a basic `README.md` that documents local startup,
  configuration of normal and anomaly modes, and reproducible requests that verify `/users` and
  `/orders`.

### Operational Requirements *(required for deployable services)*

- **OR-001**: Both services MUST emit structured logs, distributed traces, and request/error/
  latency metrics. Telemetry MUST propagate from `GET /users` to the dependent order request and
  MUST exclude secrets and high-cardinality request data.
- **OR-002**: Both services MUST expose health and readiness behavior, validate configuration at
  startup, and stop gracefully. The Order Service readiness behavior MUST account for its
  PostgreSQL dependency.
- **OR-003**: Local deployment MUST keep the PostgreSQL datastore private to the Order Service.
  Services MUST run with least privilege and only expose the ports required for local access and
  observability.
- **OR-004**: The feature MUST provide a dashboard or documented queries that show request rate,
  error rate, and latency for both endpoints, including the effect of an enabled anomaly mode.

### Key Entities *(include if feature involves data)*

- **User**: A lightweight sample user record returned by the User Service.
- **Order**: A lightweight sample order record held by the Order Service and associated with a
  user identifier for the demonstration.
- **Anomaly Mode**: The validated Order Service configuration state: normal, error injection, or
  latency injection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With all dependencies available and anomaly injection disabled, 20 consecutive
  `GET /users` requests complete successfully and include the corresponding order context.
- **SC-002**: With a ready datastore and anomaly injection disabled, 20 consecutive
  `GET /orders` requests return the configured sample order collection successfully.
- **SC-003**: In error-injection mode, 100 consecutive `GET /orders` requests produce an HTTP 500
  rate between 15% and 25%.
- **SC-004**: In latency-injection mode, 20 consecutive `GET /orders` requests each take at least
  3 seconds and no more than 5.5 seconds before the normal response is returned.
- **SC-005**: A new developer can follow the README from a clean local environment to start the
  feature and verify normal, error, and latency modes in 15 minutes or less.
- **SC-006**: Operators can identify the request path and the active anomaly effect through the
  recorded traces, logs, and request/error/latency metrics for every test scenario.

## Assumptions

- The services use lightweight, seeded sample users and orders; user creation, authentication,
  authorization, and order mutation are outside this sub-phase.
- `GET /users` returns the User Service's sample users with the order context obtained from the
  Order Service; pagination and filtering are out of scope.
- The 20% error rate is evaluated across a sufficiently large sample of requests, not guaranteed
  for every small batch.
- The latency mode delays the Order Service response before its normal result; it does not combine
  with error injection.
- Docker Compose is the local orchestration baseline, and its concrete implementation will be
  designed during planning.
