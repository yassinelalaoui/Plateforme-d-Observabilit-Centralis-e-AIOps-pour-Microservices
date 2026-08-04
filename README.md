# Centralized Observability & AIOps Microservices Platform

This repository contains a polyglot microservices topology designed to demonstrate centralized logging, distributed tracing, and metrics collection with an AIOps/anomaly detection focus.

## 🏗️ Architecture & Component Stack

- **User Service (Java / Spring Boot):** Aggregates user details and orchestrates calls to the Order Service.
- **Order Service (Node.js / TypeScript):** Manages order operations and features dynamic anomaly injection (latency/errors).
- **PostgreSQL:** Backs the Order Service data store.
- **Telemetry & Centralized Observability Stack:**
  - **OpenTelemetry Collector:** Ingests distributed traces and routes them to Prometheus and Logstash.
  - **Prometheus:** Scrapes metrics from services and the OTel Collector.
  - **Grafana:** Pre-configured dashboards for real-time visualization of system metrics.
  - **Elasticsearch, Logstash & Kibana (ELK Stack):** Centralized log aggregation, ingestion, and search dashboard.

---

## 🚀 Quickstart

1. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```

2. **Start the Platform:**
   ```bash
   docker compose up --build -d
   ```

3. **Verify Health:**
   ```bash
   docker compose ps
   ```
   Wait for all services to report a healthy status.

---

## 🔗 Port Mappings & Services

Once the stack is running, you can access the following endpoints locally:

| Service | Address | Credentials / Info |
| :--- | :--- | :--- |
| **User Service** | [http://localhost:8080/users](http://localhost:8080/users) | Aggregated user endpoint |
| **Order Service** | [http://localhost:8081/orders](http://localhost:8081/orders) | Raw order endpoint |
| **Grafana** | [http://localhost:3000](http://localhost:3000) | `admin` / `admin` (dashboards) |
| **Kibana** | [http://localhost:5601](http://localhost:5601) | ELK log query interface |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) | Scraping metrics dashboard |

---

## ⚠️ Anomaly Injection Modes

The **Order Service** supports simulated failures to validate observability alerts and patterns. Configure `ANOMALY_MODE` in your `.env` file:

- `normal`: Default operating behavior.
- `error`: Injects `500 Internal Server Error` responses on ~20% of requests to `/orders`.
- `latency`: Injects random `3s to 5s` delays on `/orders` requests.

Apply changes by recreating the service:
```bash
docker compose up -d --force-recreate order-service
```

---

## 🧪 Testing Suite

### 1. Unit Tests
*   **Order Service (Node.js):**
    ```bash
    cd order-service
    npm install
    npm run test
    ```
*   **User Service (Java):**
    ```bash
    cd user-service
    mvn test
    ```

### 2. Contract Verification Tests
Run the contract tests from the repository root:
```bash
# Ensure order-service dependencies are installed first
cd order-service && npm install && cd ..
npx vitest run --config order-service/vitest.config.ts tests/contract
```

### 3. Integration Smoke Tests
*   **Option A: Running on Host** (requires ports to be correctly published):
    ```bash
    npx vitest run --config order-service/vitest.config.ts tests/integration/compose-smoke.test.ts
    ```
*   **Option B: In-Network Runner** (Recommended for CI / isolated environments):
    1. Build the test-runner container:
       ```bash
       docker build -f test-runner.Dockerfile -t po-test-runner:latest .
       ```
    2. Execute tests inside the Docker network:
       ```bash
       docker run --rm --network plateforme-d-observabilit-centralis-e-aiops-pour-microservices_application \
         -e ORDER_SERVICE_URL="http://order-service:8081" \
         -e USER_SERVICE_URL="http://user-service:8080" \
         po-test-runner:latest
       ```

---

## 🛠️ Troubleshooting

- **Prometheus Storage Permission Failures:**
  Prometheus may fail to start if it runs as a non-root user (`nobody`) and is unable to write metadata to a root-owned `tmpfs` volume. This is resolved by explicitly routing data to the world-writable directory: `--storage.tsdb.path=/tmp/prometheus`.

- **Order Service Port Binding Issues:**
  If the host cannot connect to `localhost:8081`, ensure the container is connected to the non-internal `edge` network in `docker-compose.yml`. Ports cannot be published to the host for containers that are attached exclusively to internal networks.
