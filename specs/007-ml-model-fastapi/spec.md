# Feature Specification: ML Model FastAPI Wrapper

**Feature Branch**: `007-ml-model-fastapi`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 4.2: Wrap the ML model into a FastAPI app exposing /health and /predict endpoints. Containerize as aiops-engine in docker-compose.yml."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Machine Learning Predictions (Priority: P1)

A client application or service operator can request anomaly predictions by sending input features to the `POST /predict` endpoint and receiving the ML model's inference results.

**Why this priority**: Exposing the inference capabilities via a standard HTTP API is the core functionality that allows external services to query predictions in real time.

**Independent Test**: Sending a POST request with sample operational metrics (e.g., CPU, memory usage) to `http://localhost:8000/predict` returns a JSON object containing the anomaly probability and class prediction.

**Acceptance Scenarios**:

1. **Given** the FastAPI application is running and the model is loaded, **When** a client sends a valid JSON payload containing the required model features, **Then** the application returns HTTP 200 with the prediction outputs.
2. **Given** a client sends a request with missing or invalid feature parameters, **When** the payload is processed, **Then** the application returns HTTP 422 Unprocessable Entity with a validation error description.

---

### User Story 2 - Containerized Inference Engine (Priority: P2)

An operator can run the machine learning model wrapper containerized as `aiops-engine` inside Docker Compose, connected to the same internal network as the other services.

**Why this priority**: Containerization of the ML environment guarantees that all python dependencies, C-libraries, and the model weights remain consistent across different platforms.

**Independent Test**: Running `docker compose up --build -d` starts the `aiops-engine` service alongside the other services. Running `docker compose ps` shows `aiops-engine` as healthy.

**Acceptance Scenarios**:

1. **Given** the compose environment is starting up, **When** the container environment initializes, **Then** the `aiops-engine` container starts up using a dedicated Docker image.
2. **Given** the service is running, **When** the `GET /health` endpoint is requested, **Then** it returns HTTP 200 and a status message confirming that both the service and the underlying model are healthy and loaded.

---

### Edge Cases

- What happens if the model weights file is corrupted or missing from the container image? The FastAPI app MUST fail-fast during startup, logging a clear initialization error and preventing the container from becoming healthy.
- What happens if a prediction request contains features out of the normal scale/bound? The API validation schema MUST reject extreme or invalid values (e.g. negative cpu percentages) before passing the values to the model.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST wrap the machine learning model into a FastAPI web application.
- **FR-002**: The FastAPI app MUST expose a `GET /health` endpoint to verify service and model load state.
- **FR-003**: The FastAPI app MUST expose a `POST /predict` endpoint that takes metric inputs and returns the model inference response.
- **FR-004**: The system MUST define an `aiops-engine` service inside `docker-compose.yml` that builds and runs the FastAPI app container.
- **FR-005**: All input feature payloads MUST be validated at the API boundary using Pydantic schemas.

### Operational Requirements *(required for deployable services)*

- **OR-001**: The `aiops-engine` container MUST run under a non-root user.
- **OR-002**: The container build MUST use a multi-stage Python build to keep the runtime image lean.
- **OR-003**: CPU and memory limits MUST be specified for the `aiops-engine` service in `docker-compose.yml`.
- **OR-004**: Model features MUST define:
  - **Inputs**: Features like CPU utilization, memory pressure, and request rate.
  - **Evaluation Threshold**: Threshold above which an anomaly is triggered (e.g., 0.85).
  - **Version Provenance**: Metadata indicating the model training run or registry ID.
  - **Explainability**: Log outputs indicating which input feature had the highest contribution to the prediction.
  - **Rollback Behavior**: Fallback logic to revert to a previous version if inference failures exceed a defined error rate.

### Key Entities *(include if feature involves data)*

- **Prediction Request**: The input payload schema containing feature metrics.
- **Prediction Result**: The inference output schema containing class label, anomaly probability, and explanation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Anomaly predictions on `POST /predict` complete in under 100ms.
- **SC-002**: The FastAPI container starts up and reports healthy in under 30 seconds.

## Assumptions

- The ML model weights file is packaged inside the container or mounted from a local volume.
- The client applications communicate with the ML engine over the internal network using standard HTTP/REST.
