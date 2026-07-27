# Feature Specification: ML Anomaly Detector

**Feature Branch**: `008-ml-anomaly-detector`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 4.1: Build data_loader.py (queries Elasticsearch and Prometheus) and model.py using Scikit-Learn IsolationForest to detect anomalies."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Telemetry Data Loading (Priority: P1)

An operator or scheduler can run the `data_loader.py` script to fetch metrics from Prometheus and log entries from Elasticsearch, merging them into a unified dataset structured by timestamp.

**Why this priority**: Fetching and consolidating telemetry data is the prerequisite first step before any anomaly detection model training or inference can take place.

**Independent Test**: Running `python data_loader.py` retrieves recent metric counters and log documents, outputting a consolidated CSV or dataframe with columns representing features like CPU, memory, request rate, and log count.

**Acceptance Scenarios**:

1. **Given** Prometheus and Elasticsearch contain telemetry data, **When** `data_loader.py` is executed, **Then** it queries both backends and prints the summary (row count, feature names) of the successfully merged dataset.
2. **Given** one of the telemetry backends is offline, **When** `data_loader.py` is run, **Then** it logs the connection failure and exits with a non-zero code to fail-fast.

---

### User Story 2 - ML Anomaly Detection (Priority: P2)

An operator can run `model.py` to train or execute a Scikit-Learn `IsolationForest` model on the loaded telemetry dataset to flag anomalous intervals (outliers).

**Why this priority**: Automating anomaly detection allows finding unexpected service failures or degradations based on multi-dimensional telemetry data without relying on hard-coded threshold rules.

**Independent Test**: Running `python model.py` trains the `IsolationForest` estimator and outputs predictions where anomalies are tagged as `-1` and normal intervals as `1`.

**Acceptance Scenarios**:

1. **Given** a consolidated dataset from the data loader, **When** `model.py` is executed, **Then** it fits the `IsolationForest` model, runs inference, and writes the prediction results (anomaly flags and decision scores) to an output file.
2. **Given** a dataset containing missing or NULL values, **When** `model.py` runs, **Then** it checks for and handles missing values (e.g. imputes or drops them) before executing the pipeline.

---

### Edge Cases

- What happens if the queried time range has zero logs or metrics? The data loader MUST return an empty dataset rather than crashing, and the model script MUST refuse to train on empty data.
- How are timestamps aligned when Prometheus scrapes every 10s but logs are sporadic? The data loader MUST aggregate log event counts into matching bucket intervals (e.g., 10-second or 1-minute windows) to align with metric timestamps.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST implement `data_loader.py` to query metrics from Prometheus API and log counts from Elasticsearch API.
- **FR-002**: `data_loader.py` MUST aggregate and align log counts and metric values by bucketed timestamps.
- **FR-003**: The system MUST implement `model.py` using Scikit-Learn's `IsolationForest` model.
- **FR-004**: The model pipeline MUST split training data and scale numerical features (standardization/min-max scaling) before fitting the model.
- **FR-005**: The model pipeline MUST identify anomalies and output predictions (e.g., `1` for normal, `-1` for anomaly) along with decision scores.

### Operational Requirements *(required for deployable services)*

- **OR-001**: The Isolation Forest `contamination` parameter MUST be configurable.
- **OR-002**: The model version, feature inputs, anomaly threshold, feature importance details (explainability), and rollback fallbacks MUST be clearly defined:
  - **Inputs**: CPU usage, memory usage, HTTP requests count, HTTP error count, Elasticsearch log error count.
  - **Threshold**: Contamination rate (e.g. 0.05 or 5% of training samples).
  - **Version Provenance**: The serialized model weights file (e.g., `.pkl` or `.joblib`) filename MUST include a version tag.
  - **Explainability**: The model script MUST output feature importance or decision contribution metrics for flagged anomalies.
  - **Rollback Behavior**: If the active model generates false alarm rates above a threshold, the system MUST fallback to a default threshold-based rule engine.

### Key Entities *(include if feature involves data)*

- **Telemetry Feature Set**: The aligned dataset containing metric readings and log count values.
- **Anomaly Output**: The classification decision including anomaly flag and distance score.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `data_loader.py` merges and returns 1 hour of telemetry data in under 5 seconds.
- **SC-002**: The `IsolationForest` model classifies a 10,000-row telemetry dataset in under 1 second.

## Assumptions

- Prometheus and Elasticsearch are running and reachable over the local network ports.
- Telemetry datasets contain standard numerical measurements suitable for distance/isolation-based anomaly algorithms.
