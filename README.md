# Microservice Conception (Sub-Phase 1.1)

A polyglot demonstration project implementing the **User Service** (Spring Boot + Java 21) and **Order Service** (Node.js 22 + TypeScript) backed by a private PostgreSQL datastore.

## Architecture

- **User Service (`user-service/`)**: Port `8080`. Serves `GET /users` with static sample users aggregated with their order data from the Order Service.
- **Order Service (`order-service/`)**: Port `8081`. Serves `GET /orders` with order records loaded from its private PostgreSQL instance.
- **PostgreSQL (`database/`)**: Accessible only by the Order Service on a private data network.
- **Observability Stack**:
  - OpenTelemetry Collector: Port `4318` (OTLP HTTP receiver)
  - Prometheus: Port `9090` (scraping metrics)
  - Grafana: Port `3000` (visualizing performance and anomaly metrics)
  - Elasticsearch + Logstash + Kibana: Port `5601` (ELK logging pipeline)

---

## Prerequisites

- **Docker Desktop** or Docker Engine with Docker Compose v2.
- **Node.js 22 LTS** & **Java 21 JRE/JDK** (if running/testing locally outside Docker).
- **uv** (Python toolchain for running specify-cli tools).

---

## Quickstart

### 1. Configure the Environment
Copy the example environment file to `.env`:
```bash
cp .env.example .env
```
Keep `ANOMALY_MODE=normal` to start in normal mode.

### 2. Start the Topology
Run the services using Docker Compose:
```bash
docker compose up --build -d
```
Verify health using:
```bash
docker compose ps
```
Wait for all services to report `healthy`.

### 3. Verify Endpoints
- **User Service**: `curl -i http://localhost:8080/users`
- **Order Service**: `curl -i http://localhost:8081/orders`
- **Metrics**: `curl -i http://localhost:8081/metrics` or `curl -i http://localhost:8080/actuator/prometheus`

---

## Anomaly Modes

The Order Service supports three mutually exclusive anomaly modes controlled via the `ANOMALY_MODE` variable in `.env`.

### 1. Normal Mode (`ANOMALY_MODE=normal`)
Standard operation. No simulated errors or delays are injected.

### 2. Error Mode (`ANOMALY_MODE=error`)
Injects `HTTP 500 Internal Server Error` on approximately 20% of `GET /orders` requests.
- **Verify**: Recreate the container after updating `.env`:
  ```bash
  docker compose up -d --force-recreate order-service
  ```
  Send 100 requests to `http://localhost:8081/orders` and confirm a ~20% error rate.
  Verify that the User Service maps these failures to `HTTP 503 Service Unavailable`.

### 3. Latency Mode (`ANOMALY_MODE=latency`)
Delays all `GET /orders` requests by a random duration between 3 and 5 seconds.
- **Verify**: Update `.env` and recreate the container:
  ```bash
  docker compose up -d --force-recreate order-service
  ```
  Call `http://localhost:8081/orders` and confirm each response takes between 3.0 and 5.5 seconds.

---

## Observability Portals

- **Grafana**: [http://localhost:3000](http://localhost:3000) (Credentials: `admin` / `admin`). Pre-configured with the **Microservices Overview** dashboard.
- **Kibana**: [http://localhost:5601](http://localhost:5601). Explore log index `microservices-logs-*` for JSON logs correlated with W3C `traceId`.
- **Prometheus**: [http://localhost:9090](http://localhost:9090). Inspect scraped metrics like `http_requests_total`.

---

## Running Tests

### Order Service (Node.js / Vitest)
From the `order-service/` directory:
```bash
npm install
npm run test
npm run lint
```

### User Service (Java / Maven / JUnit)
From the `user-service/` directory:
```bash
mvn test
```

### Contract & Integration Smoke Tests
From the root workspace (run after `npm install` inside `order-service/` to resolve Vitest dependencies):
```bash
npx vitest run tests/contract/
```
To run the integration smoke test against the active Compose topology:
```bash
npx vitest run tests/integration/compose-smoke.test.ts
```

---

## Cleanup

To stop and remove containers:
```bash
docker compose down
```
To discard persistent database data as well:
```bash
docker compose down --volumes
```
