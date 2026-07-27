# Implementation Plan: Microservice Conception

**Branch**: `001-microservice-conception` | **Date**: 2026-07-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-microservice-conception/spec.md`

## Summary

Implement a lightweight two-service demonstration: a Spring Boot User Service exposes `GET /users`
and calls a Node.js Order Service, which exposes `GET /orders` backed by a private PostgreSQL
database. Docker Compose orchestrates the services with isolated application and data networks.
Order Service configuration selects normal operation, a 20% HTTP 500 injection mode, or a random
3–5 second latency injection mode. Both services export OpenTelemetry traces, Prometheus metrics,
and structured logs through a private ELK pipeline; the User Service maps Order Service
unavailability or timeouts to HTTP 503.

## Technical Context

**Language/Version**: Java 21 (User Service); Node.js 22 LTS with TypeScript (Order Service)

**Primary Dependencies**: Spring Boot 3.x, Spring Web, Actuator, Micrometer Prometheus,
OpenTelemetry Java agent; Express 5, pg, prom-client, Pino, OpenTelemetry Node SDK

**Storage**: PostgreSQL 16, owned exclusively by Order Service; schema and seed data run from
versioned initialization SQL

**Testing**: JUnit 5 + Spring Boot test (User Service); Vitest + Supertest (Order Service);
Docker Compose integration checks and contract validation

**Target Platform**: Linux containers orchestrated locally with Docker Compose v2

**Project Type**: Containerized microservices with a private relational datastore

**Performance Goals**: In normal mode, 20 consecutive end-to-end user requests complete
successfully; latency mode adds 3–5 seconds; error mode yields 15–25 HTTP 500 responses per 100
order requests

**Constraints**: Non-root containers; pinned image versions; no privileged containers or host
networking; PostgreSQL has no host port; anomaly modes are mutually exclusive and validated at
startup; no secrets committed to source control

**Scale/Scope**: Two sample services, one PostgreSQL datastore, seeded demonstration data, and
local observability signals; authentication, writes, paging, and ML workloads are out of scope

## Constitution Check

*GATE: Passed before research and re-checked after Phase 1 design.*

- [x] Service ownership, versioned contracts, and datastore boundaries are defined: User Service
  owns user samples; Order Service owns orders and the PostgreSQL connection; OpenAPI contracts
  are versioned with the feature.
- [x] Docker Compose uses least privilege, named networks, private backing services, intentional
  image versions, and documented configuration/secrets: `edge`, `application`, and `data` named
  networks separate access; only User Service and Order Service publish local ports; PostgreSQL
  is accessible solely on `data` by Order Service.
- [x] Health/readiness, graceful shutdown, resource limits, and failure behavior are planned:
  services expose health/readiness; Order readiness checks PostgreSQL; User Service returns HTTP
  503 for Order Service timeout/unavailability; Compose defines stop grace periods and limits.
- [x] OpenTelemetry traces, structured logs, Prometheus metrics, and Grafana dashboards/alerts
  are defined: W3C trace context flows from User to Order; metrics cover request count, errors,
  and duration; dashboard/queries distinguish normal and anomaly modes; logs flow through private
  Elasticsearch, Logstash, and Kibana services, omit secrets, and retain trace identifiers.
- [x] Automated checks include tests proportionate to risk: unit, contract, and Compose-backed
  integration tests cover endpoint behavior, service failure mapping, seeded data, and anomalies.
- [x] ML work is not applicable to this sub-phase.

## Project Structure

### Documentation (this feature)

```text
specs/001-microservice-conception/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── contracts/
    ├── user-service.openapi.yaml
    └── order-service.openapi.yaml
```

### Source Code (repository root)

```text
.
├── docker-compose.yml
├── .env.example
├── README.md
├── config/
│   ├── otel-collector-config.yaml
│   ├── prometheus.yml
│   ├── alerts/
│   │   └── microservices-alerts.yaml
│   ├── logstash/
│   │   └── logstash.conf
│   └── grafana/
│       ├── dashboards/
│       │   └── microservices-overview.json
│       └── provisioning/
│           ├── dashboards.yaml
│           └── datasources.yaml
├── database/
│   └── order-service/
│       └── init/
│           ├── 001-create-orders.sql
│           └── 002-seed-orders.sql
├── user-service/
│   ├── Dockerfile
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/aiops/userservice/
│   │   │   │   ├── UserServiceApplication.java
│   │   │   │   ├── api/UserController.java
│   │   │   │   ├── client/OrderServiceClient.java
│   │   │   │   ├── config/OrderServiceProperties.java
│   │   │   │   ├── model/User.java
│   │   │   │   ├── model/OrderSummary.java
│   │   │   │   └── service/UserQueryService.java
│   │   │   └── resources/application.yml
│   │   └── test/java/com/aiops/userservice/
│   │       ├── api/UserControllerTest.java
│   │       └── client/OrderServiceClientTest.java
│   └── .dockerignore
├── order-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/env.ts
│   │   ├── routes/orders.ts
│   │   ├── services/order-service.ts
│   │   ├── services/anomaly-service.ts
│   │   ├── repositories/order-repository.ts
│   │   ├── models/order.ts
│   │   └── observability/telemetry.ts
│   ├── test/
│   │   ├── orders.test.ts
│   │   └── anomaly-service.test.ts
│   └── .dockerignore
└── tests/
    ├── contract/
    │   ├── user-service-contract.test.ts
    │   └── order-service-contract.test.ts
    └── integration/
        └── compose-smoke.test.ts
```

**Structure Decision**: Keep each deployable service self-contained, place cross-service runtime
configuration at the root, and isolate database initialization scripts under the Order Service
ownership path. The root `tests/` directory contains only cross-service validation; service tests
remain with their service. Elasticsearch, Logstash, Kibana, OpenTelemetry Collector, Prometheus,
and Grafana are private telemetry-plane services except for explicitly required local operator UIs.

## Complexity Tracking

No constitution violations require an exception.
