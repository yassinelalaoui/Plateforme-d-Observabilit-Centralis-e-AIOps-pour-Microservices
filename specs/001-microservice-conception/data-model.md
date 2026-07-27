# Data Model: Microservice Conception

## Service Ownership

| Service | Owned data | Storage boundary |
|---|---|---|
| User Service | Static sample users | Process-local seed data; no database access |
| Order Service | Orders and anomaly configuration | PostgreSQL; only Order Service connects |

## User

| Field | Type | Rules |
|---|---|---|
| `id` | string | Stable sample identifier; unique in User Service response |
| `name` | string | Non-empty display name |

Users are static sample records for this sub-phase. They have a one-to-many relationship with
orders through `userId`; User Service receives order summaries only through the Order Service API.

## Order

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key; generated or seeded uniquely |
| `userId` | string | Required; identifies the associated sample user |
| `description` | string | Required, non-empty demonstration label |
| `amount` | decimal | Required; non-negative; stored at two decimal places |
| `status` | string | One of `PENDING`, `CONFIRMED`, `CANCELLED` |
| `createdAt` | timestamp with time zone | Required creation timestamp |

Orders are read-only in this feature. An empty order result is valid and returns an empty list.

## Anomaly Mode

| Value | Behavior | Validation |
|---|---|---|
| `normal` | No injected behavior | Default |
| `error` | Select 20% of `GET /orders` requests for HTTP 500 | Mutually exclusive |
| `latency` | Delay each `GET /orders` response by 3,000–5,000 ms | Mutually exclusive |

The configuration is process-level, does not persist in PostgreSQL, and must be validated before
the Order Service accepts traffic.

## Derived User Response

The User Service response contains its sample User records plus the order summaries obtained by
calling Order Service. It does not copy or persist Order Service data. If the dependency call
fails or times out, the response is HTTP 503 with an error code safe for clients and operators.
