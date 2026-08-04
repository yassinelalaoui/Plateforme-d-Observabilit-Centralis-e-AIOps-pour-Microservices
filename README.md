# Platform for Centralized Observability & AIOps — Microservices

This repository is a demo polyglot microservices platform composed of:

- User Service (Spring Boot / Java)
- Order Service (Node.js + TypeScript)
- PostgreSQL, OpenTelemetry Collector, Prometheus, Grafana, and ELK stack for observability

The project includes unit tests, contract tests, and an integration smoke test that validates service-to-service communication.

Table of Contents
- Overview
- Prerequisites
- Quickstart (start services)
- Verifying endpoints & observability
- Anomaly modes
- Running tests (unit, contract, integration)
  - Host-run (requires published ports)
  - Recommended: In-network test runner (Docker)
- Troubleshooting
- Contributing
- License

---

## Overview

The Order Service exposes order data on port `8081`. The User Service (port `8080`) aggregates user data and calls the Order Service. The observability components (OTel, Prometheus, Grafana, ELK) are included to demonstrate telemetry, metrics, and logs.

Key paths:
- order-service/ — Node.js service (Vitest tests)
- user-service/ — Java service (Maven, JUnit)
- tests/contract/ — Contract tests for cross-service expectations
- tests/integration/ — Integration smoke tests for Compose-based topology

---

## Prerequisites

- Docker Desktop or Docker Engine + Docker Compose v2
- Node.js 22.x (for local development of order-service)
- Java 21 JDK (for local development of user-service)

> Note: For running integration smoke tests reliably, the recommended approach is to run the tests inside the Docker Compose network (see "In-network test runner" below). This avoids host port mapping inconsistencies.

---

## Quickstart — Start the services

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Build and start the topology with Compose:

```bash
docker compose up --build -d
```

3. Verify containers and health:

```bash
docker compose ps
```

Wait until services report a healthy state.

---

## Verify endpoints & observability

From the host (if ports are published):

- User Service: http://localhost:8080/users
- Order Service: http://localhost:8081/orders
- Grafana: http://localhost:3000 (admin/admin)
- Kibana: http://localhost:5601
- Prometheus: http://localhost:9090

---

## Anomaly Modes (Order Service)

Control failure/latency behaviors via `.env` → `ANOMALY_MODE`:

- `normal` — normal operation (default)
- `error` — injects ~20% 500 errors on `/orders`
- `latency` — injects random 3–5s delays on `/orders`

After changing `.env`, recreate the order-service container:

```bash
docker compose up -d --force-recreate order-service
```

---

## Running Tests

There are three main kinds of tests:

- Unit tests (service-local)
- Contract tests (verify API contracts across services)
- Integration smoke tests (validate the running Compose topology)

### Order service unit tests (Vitest)

```bash
cd order-service
npm install
npm run test
```

Ensure dependencies are installed so that test imports (telemetry, logging, DB clients) succeed.

### User service unit tests (Maven)

```bash
cd user-service
mvn test
```

### Contract tests (quick verification)

From the repository root (make sure `order-service` deps installed):

```bash
# install once in order-service
cd order-service && npm install && cd ..
# run contract tests using the order-service vitest config
npx vitest run --config order-service/vitest.config.ts tests/contract
```

### Integration smoke tests — two options

Option A — Host-run (only if Compose publishes ports to localhost)

```bash
# ensure compose published ports and services are ready
docker compose ps
# run the integration test using the order-service vitest config
npx vitest run --config order-service/vitest.config.ts tests/integration/compose-smoke.test.ts
```

If you encounter ECONNREFUSED errors to `127.0.0.1:8081`, the Order Service host port is not published or the app binds to localhost inside the container; use Option B.

Option B — Recommended: In-network test runner (runs tests inside a container on the Compose network)

1. Build the test-runner image (bundles Node, dependencies, and runs Vitest):

```bash
docker build -f test-runner.Dockerfile -t po-test-runner:latest .
```

2. Identify your Compose network name. Common pattern: `<folder>_application`. You can list networks with:

```bash
docker network ls | grep <partial-name>
```

3. Run the test runner attached to the Compose network (replace the network name if different):

```bash
docker run --rm --network plateforme-d-observabilit-centralis-e-aiops-pour-microservices_application \
  -e ORDER_SERVICE_URL="http://order-service:8081" \
  -e USER_SERVICE_URL="http://user-service:8080" \
  po-test-runner:latest
```

This method resolves services by their Compose names and is robust for CI.

---

## Troubleshooting

- Vitest failing to load config:
  - Ensure the `--config` path points to `order-service/vitest.config.ts` (scripts in package.json are configured to do this).
  - Run `npm install` in `order-service` to provide required devDependencies (vitest, supertest, etc.).

- Order Service unreachable on host (ECONNREFUSED 127.0.0.1:8081):
  1. Confirm the container has a host port binding with:
     ```bash
     docker compose ps
     docker inspect <order_container_id> --format '{{json .HostConfig.PortBindings}}'
     ```
  2. Recreate the service to apply ports:
     ```bash
     docker compose up -d --force-recreate --build order-service
     ```
  3. Check service logs for binding or startup errors:
     ```bash
     docker compose logs --tail 200 order-service
     ```
  4. Exec into the container to check which address the app is listening on (`0.0.0.0` required for host binding):
     ```bash
     docker exec -it <order_container_id> sh -c "ss -ltnp || netstat -ltnp"
     ```

- Tests time out or DNS/network errors in containers:
  - Vitest worker threads can affect DNS/HTTP behavior in containers. If you observe flaky network behavior, disable worker threads in the Vitest config or run tests inside the in-network runner.

- Tests import failures (missing packages like `supertest`):
  - Run `npm install` in `order-service/` or add the missing packages as devDependencies in `package.json`.

---

## Contributing

- Add contract tests under `tests/contract/` to validate APIs.
- Keep `order-service/vitest.config.ts` in sync if new test folders are added.
- For changes to Compose ports or service names, update the README and the `test-runner` instructions.

PRs are welcome. Please include tests and update documentation for any behavior or configuration changes.

---

## License

MIT
