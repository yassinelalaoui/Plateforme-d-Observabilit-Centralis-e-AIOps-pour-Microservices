---

description: "Actionable implementation tasks for Microservice Conception"

---

# Tasks: Microservice Conception

**Input**: Design documents from `specs/001-microservice-conception/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, and
`quickstart.md`

**Tests**: Unit, contract, and Compose-backed integration tests are required by the constitution
for these changed service interactions.

**Organization**: Tasks are grouped by user story. User Story 2 is implemented before User Story
1 because a live, PostgreSQL-backed Order Service is a hard dependency of the User Service's
end-to-end scenario.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after its listed prerequisites are complete.
- **[US#]**: User story the task supports.
- Every task names the exact target file or directory.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the repository structure and reproducible service toolchains.

- [ ] T001 Create the root directories in `user-service/`, `order-service/`, `database/order-service/init/`, `config/grafana/dashboards/`, `config/grafana/provisioning/`, and `tests/`.
- [ ] T002 Initialize the Java 21 Spring Boot build and dependencies in `user-service/pom.xml`.
- [ ] T003 [P] Initialize the Node.js 22 TypeScript build, runtime dependencies, and test scripts in `order-service/package.json` and `order-service/tsconfig.json`.
- [ ] T004 [P] Add Java formatting/lint configuration in `user-service/pom.xml` and Node formatting/lint configuration in `order-service/package.json`.
- [ ] T005 [P] Create container build exclusions in `user-service/.dockerignore` and `order-service/.dockerignore`.
- [ ] T006 [P] Define non-secret local configuration defaults in `.env.example`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the isolated runtime, schema, shared observability path, and operational
configuration required before feature slices run together.

- [ ] T007 Create the `orders` schema, constraints, and indexes in `database/order-service/init/001-create-orders.sql`.
- [ ] T008 Create deterministic sample order records matching `data-model.md` in `database/order-service/init/002-seed-orders.sql`.
- [ ] T009 Create the Compose topology for User Service, Order Service, PostgreSQL, OpenTelemetry Collector, Prometheus, Grafana, Elasticsearch, Logstash, and Kibana with pinned images, non-root services, resource limits, health checks, named volumes, and isolated `edge`, `application`, `data`, and `telemetry` networks in `docker-compose.yml`.
- [ ] T010 Configure PostgreSQL credentials, volume ownership, and private data-network attachment in `docker-compose.yml` and `.env.example` without publishing a database host port.
- [ ] T011 [P] Configure OpenTelemetry collection, trace-context forwarding, and the private Logstash JSON log pipeline in `config/otel-collector-config.yaml` and `config/logstash/logstash.conf`.
- [ ] T012 [P] Configure Prometheus scraping, alert-rule loading, and telemetry-pipeline health checks in `config/prometheus.yml`.
- [ ] T013 [P] Provision Prometheus as the Grafana datasource in `config/grafana/provisioning/datasources.yaml`.
- [ ] T014 [P] Provision the dashboard folder in `config/grafana/provisioning/dashboards.yaml`.
- [ ] T015 Add the User Service application bootstrap, actuator health/readiness endpoints, trace-correlated JSON logging for the ELK pipeline, and graceful shutdown settings in `user-service/src/main/java/com/aiops/userservice/UserServiceApplication.java` and `user-service/src/main/resources/application.yml`.
- [ ] T016 Add Order Service bootstrap, process shutdown handling, trace-correlated JSON logging for the ELK pipeline, and health/readiness routes in `order-service/src/app.ts`, `order-service/src/server.ts`, and `order-service/src/observability/telemetry.ts`.
- [ ] T017 Implement validated `ANOMALY_MODE` loading with `normal`, `error`, and `latency` as the only accepted values in `order-service/src/config/env.ts`.
- [ ] T018 Create least-privilege multi-stage container builds in `user-service/Dockerfile` and `order-service/Dockerfile`.

**Checkpoint**: Compose can start private PostgreSQL plus both healthy service shells; invalid
anomaly configuration fails Order Service startup; no user-story endpoint is implemented yet.

---

## Phase 3: User Story 2 - Retrieve Persisted Orders (Priority: P2)

**Goal**: Serve seeded PostgreSQL orders through `GET /orders` with a stable contract and clear
datastore failure behavior. This must complete before User Story 1 can perform its live call.

**Independent Test**: With PostgreSQL ready, `GET /orders` returns the seeded collection; with the
database unavailable, it returns HTTP 503 and emits correlated operational signals.

### Tests for User Story 2

- [ ] T019 [P] [US2] Create repository tests for seeded orders, empty results, and datastore errors in `order-service/test/order-repository.test.ts`.
- [ ] T020 [P] [US2] Create `GET /orders` contract tests for HTTP 200 and HTTP 503 responses in `tests/contract/order-service-contract.test.ts`.
- [ ] T021 [P] [US2] Create HTTP route tests for normal and unavailable-database behavior in `order-service/test/orders.test.ts`.

### Implementation for User Story 2

- [ ] T022 [P] [US2] Define the Order types and response DTO matching `contracts/order-service.openapi.yaml` in `order-service/src/models/order.ts`.
- [ ] T023 [US2] Implement the PostgreSQL connection pool and read-only order queries in `order-service/src/repositories/order-repository.ts`.
- [ ] T024 [US2] Implement order retrieval and datastore-error mapping to HTTP 503 in `order-service/src/services/order-service.ts`.
- [ ] T025 [US2] Implement `GET /orders`, response validation, and structured error responses in `order-service/src/routes/orders.ts`.
- [ ] T026 [US2] Register the order route, readiness dependency check, low-cardinality request/error/duration metrics, and trace correlation in `order-service/src/app.ts` and `order-service/src/observability/telemetry.ts`.
- [ ] T027 [US2] Configure Order Service PostgreSQL environment wiring and private network dependencies in `docker-compose.yml`.
- [ ] T028 [US2] Run and make the Order Service unit, contract, and Compose database tests pass in `order-service/test/` and `tests/contract/order-service-contract.test.ts`.

**Checkpoint**: `GET /orders` works from seeded PostgreSQL, handles an empty collection, returns
HTTP 503 for datastore loss, and does not expose database credentials or data-plane ports.

---

## Phase 4: User Story 1 - Retrieve Users with Their Order Context (Priority: P1) MVP

**Goal**: Serve sample users from `GET /users` only after successfully retrieving their order
context from Order Service; map dependency faults to HTTP 503.

**Independent Test**: With the P2 Order Service running normally, `GET /users` returns users with
order summaries. Stopping Order Service or forcing its failure makes `GET /users` return HTTP 503.

### Tests for User Story 1

- [ ] T029 [P] [US1] Create `GET /users` contract tests for successful aggregation and HTTP 503 in `tests/contract/user-service-contract.test.ts`.
- [ ] T030 [P] [US1] Create Order Service client tests for success, timeout, and HTTP 5xx mapping in `user-service/src/test/java/com/aiops/userservice/client/OrderServiceClientTest.java`.
- [ ] T031 [P] [US1] Create controller tests for user aggregation and no-partial-success behavior in `user-service/src/test/java/com/aiops/userservice/api/UserControllerTest.java`.

### Implementation for User Story 1

- [ ] T032 [P] [US1] Define static sample User and received OrderSummary models in `user-service/src/main/java/com/aiops/userservice/model/User.java` and `user-service/src/main/java/com/aiops/userservice/model/OrderSummary.java`.
- [ ] T033 [P] [US1] Define validated Order Service base URL and outbound timeout properties in `user-service/src/main/java/com/aiops/userservice/config/OrderServiceProperties.java` and `user-service/src/main/resources/application.yml`.
- [ ] T034 [US1] Implement the traced HTTP client, contract deserialization, timeout behavior, and upstream error mapping in `user-service/src/main/java/com/aiops/userservice/client/OrderServiceClient.java`.
- [ ] T035 [US1] Implement user-to-order aggregation without persisting Order Service data in `user-service/src/main/java/com/aiops/userservice/service/UserQueryService.java`.
- [ ] T036 [US1] Implement `GET /users` and the stable HTTP 503 error response in `user-service/src/main/java/com/aiops/userservice/api/UserController.java`.
- [ ] T037 [US1] Configure User Service's application-network dependency, health/readiness behavior, metrics, and OpenTelemetry propagation in `user-service/src/main/resources/application.yml` and `docker-compose.yml`.
- [ ] T038 [US1] Run and make User Service unit, contract, and live dependency-failure tests pass in `user-service/src/test/` and `tests/contract/user-service-contract.test.ts`.

**Checkpoint**: `GET /users` returns aggregated data only after the Order Service call and returns
HTTP 503, never a partial successful payload, for Order Service timeout or unavailability.

---

## Phase 5: User Story 3 - Exercise Controlled Order-Service Anomalies (Priority: P3)

**Goal**: Provide safe, mutually exclusive configuration-controlled error and latency injection
for `GET /orders` so the two-service path can be observed under fault conditions.

**Independent Test**: In error mode, 100 requests produce 15–25 HTTP 500 responses; in latency
mode, 20 requests each take 3–5.5 seconds; normal mode injects neither effect.

### Tests for User Story 3

- [ ] T039 [P] [US3] Create deterministic unit tests for mode validation, 20% selection, and 3–5 second delay selection in `order-service/test/anomaly-service.test.ts`.
- [ ] T040 [P] [US3] Create Compose-backed anomaly scenario tests for normal, error, and latency modes in `tests/integration/compose-smoke.test.ts`.

### Implementation for User Story 3

- [ ] T041 [US3] Implement anomaly selection, injected HTTP 500 responses, and randomized latency in `order-service/src/services/anomaly-service.ts`.
- [ ] T042 [US3] Apply the anomaly service before Order Service's normal retrieval path and record mode-safe metrics and logs in `order-service/src/routes/orders.ts` and `order-service/src/observability/telemetry.ts`.
- [ ] T043 [US3] Wire `ANOMALY_MODE` into Compose and document valid modes in `.env.example` and `docker-compose.yml`.
- [ ] T044 [US3] Run and make anomaly unit and integration tests pass in `order-service/test/anomaly-service.test.ts` and `tests/integration/compose-smoke.test.ts`.

**Checkpoint**: Error and latency injection meet their quantitative acceptance ranges, are mutually
exclusive, are disabled by default, and remain visible through safe telemetry.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete the operational artifacts, documentation, and end-to-end quality gates.

- [ ] T045 [P] Create request-rate, error-rate, latency, and ELK log-correlation visualizations for both endpoints in `config/grafana/dashboards/microservices-overview.json`.
- [ ] T046 [P] Create actionable rules for dependency failure, Order Service errors, latency degradation, and telemetry-pipeline unavailability in `config/alerts/microservices-alerts.yaml`, then load and document them in `config/prometheus.yml` and `README.md`.
- [ ] T047 Update local startup, normal/error/latency validation, test commands, telemetry access, and cleanup instructions in `README.md`.
- [ ] T048 Verify Docker isolation, non-root users, image pins, resource limits, exposed ports, named-volume scope, and secret handling in `docker-compose.yml`, `user-service/Dockerfile`, and `order-service/Dockerfile`.
- [ ] T049 Verify W3C trace propagation, JSON log correlation and trace-ID search in Kibana, metric label cardinality, and the dashboard/alert evidence for all normal and anomaly scenarios in `tests/integration/compose-smoke.test.ts`, `config/grafana/dashboards/microservices-overview.json`, and `config/logstash/logstash.conf`.
- [ ] T050 Run the full local validation sequence from `specs/001-microservice-conception/quickstart.md` and record any required corrections in `README.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** has no dependencies.
- **Phase 2** depends on Phase 1 and blocks all feature slices.
- **US2** depends on Phase 2 and provides the Order Service runtime required by US1.
- **US1** depends on US2 because its acceptance test requires a live Order Service.
- **US3** depends on US2 and can proceed in parallel with the late US1 implementation/testing work
  once the Order Service route is stable.
- **Phase 6** depends on all requested user stories.

### User Story Dependencies

```text
Setup → Foundational → US2 (persisted orders) → US1 (users with orders)
                                    └──────────→ US3 (controlled anomalies)
US1 + US3 → Polish and full validation
```

### Parallel Opportunities

- T003–T006 can proceed in parallel after T001–T002 establish the root shape.
- T011–T014 run in parallel after the Compose topology exists.
- In US2, T019–T022 run in parallel; T023–T028 then follow in order.
- In US1, T029–T033 run in parallel; T034–T038 then follow in order.
- In US3, T039 and T040 run in parallel; T041–T044 then follow in order.
- T045 and T046 can run in parallel after metric names and observability endpoints stabilize.

## Parallel Example: User Story 2

```text
Task: "Create repository tests in order-service/test/order-repository.test.ts"
Task: "Create GET /orders contract tests in tests/contract/order-service-contract.test.ts"
Task: "Create HTTP route tests in order-service/test/orders.test.ts"
Task: "Define Order types in order-service/src/models/order.ts"
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US2 so the private, PostgreSQL-backed Order Service is live.
3. Complete US1 and validate `GET /users` aggregation plus HTTP 503 behavior.
4. Stop and demonstrate the normal two-service request path.

### Incremental Delivery

1. Deliver persisted order retrieval (US2).
2. Add the User Service aggregation slice (US1).
3. Add controlled anomaly injection (US3).
4. Add operational dashboard, alerts, README, and full quickstart verification.

## Notes

- All tasks use the strict checkbox, ID, optional parallel marker, story label, and file-path format.
- The PostgreSQL datastore is never accessed directly by User Service.
- The implementation must preserve the constitution's container-isolation and observability rules.
