# Quickstart: Chaos Testing & End-to-End Validation

This guide provides step-by-step instructions to run, verify, and clean up the chaos testing setup.

## Prerequisites

- Python 3.x installed locally.
- Docker and Docker Compose installed.

## Setup and Startup

1. **Build and start the microservices stack**:
   ```bash
   docker compose up --build -d
   ```
2. **Verify services are healthy**:
   - Order Service: `http://localhost:8081/health` (Should return `{"status":"UP"}`)
   - User Service: `http://localhost:8080/actuator/health` (Should return `{"status":"UP"}`)
   - Grafana: `http://localhost:3000` (User: `admin` / Pass: `admin`)
   - Prometheus: `http://localhost:9090`

## Run Chaos Injection

We will use the `chaos_script.py` script located in the repository root to inject and test anomalies.

### Scenario A: Inject Error Anomaly (CRITICAL State)

1. **Execute the script**:
   ```bash
   python chaos_script.py --mode error --duration 30 --rate 5
   ```
2. **What this does**:
   - Sends a `POST` request to `http://localhost:8081/anomaly` to switch `order-service` to `error` mode.
   - Generates 5 requests per second to the end-to-end flow (`http://localhost:8080/users`).
   - Observes ~20% of `order-service` requests failing with HTTP 500.
3. **Verify in Grafana**:
   - Access the "Microservices Overview" dashboard.
   - The **System Status** panel will change from **HEALTHY** (Green) to **CRITICAL** (Red).
   - In Prometheus, `ml_anomaly_score` will jump to `0.85`.
4. **Cleanup**:
   - Once the 30-second duration completes (or if interrupted with `Ctrl+C`), the script will restore `normal` mode.
   - The status panel will return to **HEALTHY** (Green) within 60 seconds.

### Scenario B: Inject Latency Anomaly (DEGRADED State)

1. **Execute the script**:
   ```bash
   python chaos_script.py --mode latency --duration 30 --rate 2
   ```
2. **What this does**:
   - Switches `order-service` to `latency` mode, introducing a 3-5s delay per request.
   - Sends 2 requests per second to the end-to-end flow.
3. **Verify in Grafana**:
   - The **System Status** panel will transition to **DEGRADED** (Orange/Yellow).
4. **Cleanup**:
   - The script will restore `normal` mode. The panel will return to **HEALTHY** within 60 seconds.

## Manual Verification (Edge Cases)

- **Signal Interruption**: Start the script and immediately hit `Ctrl+C`. Verify in `docker compose logs order-service` or by fetching `http://localhost:8081/anomaly` that the mode was successfully reset to `normal`.
- **Query Failure / Unknown State**: Stop the Prometheus container (`docker compose stop prometheus`). Verify that the Grafana status panel transitions to **UNKNOWN** (Gray).
