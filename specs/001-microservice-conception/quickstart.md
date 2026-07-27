# Quickstart: Microservice Conception

## Prerequisites

- Docker Desktop or Docker Engine with Docker Compose v2
- `curl` or an equivalent HTTP client

## Start normal mode

1. From the repository root, copy `.env.example` to `.env` and retain the default `ANOMALY_MODE=normal`.
2. Run `docker compose up --build -d`.
3. Wait for the User Service, Order Service, and PostgreSQL health checks to report healthy.
4. Request User Service: `curl -i http://localhost:8080/users`.
5. Request Order Service: `curl -i http://localhost:8081/orders`.

Expect HTTP 200 responses that follow the contracts in
[user-service.openapi.yaml](contracts/user-service.openapi.yaml) and
[order-service.openapi.yaml](contracts/order-service.openapi.yaml).

## Verify error injection

1. Set `ANOMALY_MODE=error` in `.env` and recreate Order Service with
   `docker compose up -d --force-recreate order-service`.
2. Send 100 requests to `http://localhost:8081/orders`.
3. Confirm 15–25 responses are HTTP 500 and that User Service maps dependency failures to HTTP 503.

## Verify latency injection

1. Set `ANOMALY_MODE=latency` in `.env` and recreate Order Service.
2. Send 20 requests to `http://localhost:8081/orders` while measuring elapsed time.
3. Confirm every response takes at least 3 seconds and no more than 5.5 seconds.

## Verify observability

1. Request `GET /users` once in normal mode and once in each anomaly mode.
2. In the telemetry backend, locate one trace that contains User Service and Order Service spans
   sharing the same trace ID.
3. In Prometheus/Grafana, verify request count, error count, and request-duration metrics for both
   endpoints. Confirm labels do not contain user IDs, order IDs, credentials, or request bodies.

## Stop and clean up

Run `docker compose down`. Add `--volumes` only when intentionally discarding local PostgreSQL
data; it removes the named development volume.
