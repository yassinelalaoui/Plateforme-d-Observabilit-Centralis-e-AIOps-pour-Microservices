# Feature Specification: Containerize Services

**Feature Branch**: `002-containerize-services`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 1.2: Containerize user-service, order-service, and PostgreSQL into docker-compose.yml with an internal network app-network."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Service Container Orchestration (Priority: P1)

An operator can run a single command (`docker compose up`) to stand up the entire microservices topology, including the User Service, Order Service, and PostgreSQL database, with all services running as containers.

**Why this priority**: This is the fundamental goal of containerization. It ensures that the deployment environment is reproducible and easily manageable.

**Independent Test**: Running `docker compose up --build -d` starts all services. Running `docker compose ps` shows all containers running successfully.

**Acceptance Scenarios**:

1. **Given** a clean development environment with Docker, **When** the operator runs `docker compose up --build -d`, **Then** the User Service, Order Service, and PostgreSQL containers start up.
2. **Given** all services are running, **When** the operator requests the health endpoint of User Service (`GET /actuator/health`) or Order Service (`GET /health`), **Then** they both return successful (healthy) responses.

---

### User Story 2 - Isolated Internal Network Communication (Priority: P2)

The User Service and Order Service communicate with each other over an isolated internal network (`app-network`), while the PostgreSQL database is kept private to the Order Service and not exposed to the host machine.

**Why this priority**: Security and network isolation are critical to ensure that microservice boundaries are enforced and databases are protected from external access.

**Independent Test**: The PostgreSQL database port is not exposed on `localhost` of the host machine, but the Order Service can successfully query database tables.

**Acceptance Scenarios**:

1. **Given** the Docker Compose stack is running, **When** an operator tries to connect to PostgreSQL from the host machine using `psql` or `pg_isready` on the standard port `5432` without going through the containers, **Then** the connection is refused.
2. **Given** the Docker Compose stack is running, **When** a request is made to `GET /users` on the User Service, **Then** it successfully retrieves order context from the Order Service over the internal network.

---

### Edge Cases

- What happens if the PostgreSQL database takes longer to start up than the Order Service? The Order Service container must wait or retry the connection until PostgreSQL is healthy before it becomes fully healthy itself, or compose must use health-check-based `depends_on`.
- What happens if container resources (memory/CPU limits) are exceeded? The container engine must constrain resource usage per service to prevent a single service from starving the rest of the host.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define User Service, Order Service, and PostgreSQL services inside `docker-compose.yml`.
- **FR-002**: The system MUST define an internal network named `app-network` (or `application`) that connects User Service and Order Service.
- **FR-003**: The PostgreSQL service MUST be attached to a private network (e.g., `data`) that is only accessible to the Order Service.
- **FR-004**: The system MUST NOT publish the PostgreSQL port to the host machine.
- **FR-005**: Both User Service and Order Service MUST run under non-root users inside their respective Docker containers.

### Operational Requirements *(required for deployable services)*

- **OR-001**: Dockerfiles for User Service and Order Service MUST use multi-stage builds to optimize image sizes and exclude build tools from the final images.
- **OR-002**: Container definitions inside `docker-compose.yml` MUST enforce CPU and memory limits.
- **OR-003**: The PostgreSQL service MUST define a health check to ensure database readiness, and dependent services MUST wait for it to be healthy.
- **OR-004**: Persistent database volumes MUST be used for PostgreSQL data directory.

### Key Entities *(include if feature involves data)*

- **Docker Compose Topology**: The configuration defining services, networks, volumes, resource constraints, and health checks.
- **Service Container**: The isolated runtime environment for a single service (User Service, Order Service, or database).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The entire stack builds and boots to a fully healthy state (`healthy`) in under 2 minutes.
- **SC-002**: The host machine cannot establish direct TCP connections to PostgreSQL on port 5432.
- **SC-003**: Memory footprint of the running services remains within the defined limits (e.g., 256MB per application container).

## Assumptions

- Docker Engine/Desktop with Docker Compose v2 is installed on the host.
- Environment variables required by the services (such as ports or database credentials) are defined via a `.env` file at the root.
