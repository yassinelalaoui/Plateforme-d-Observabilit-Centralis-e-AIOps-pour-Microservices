# Tasks: Chaos Testing & End-to-End Validation

**Input**: Design documents from `/specs/010-chaos-detection-validation/`

**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Integration tests are required to verify the new dynamic anomaly HTTP API endpoints. Manual tests are required to verify end-to-end chaos execution, Grafana dashboard updates, and graceful restoration.

**Organization**: Tasks are grouped by phase and user story to support independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths are included in descriptions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and validation

- [ ] T001 Verify project status and Docker Compose environment in repository root
- [ ] T002 Update `.specify/feature.json` to reference `specs/010-chaos-detection-validation`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core instrumentation and service API updates to enable dynamic toggling

- [ ] T003 Register `ml_anomaly_score` gauge metric in [order-service/src/observability/telemetry.ts](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/order-service/src/observability/telemetry.ts)
- [ ] T004 Modify `AnomalyService` in [order-service/src/services/anomaly-service.ts](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/order-service/src/services/anomaly-service.ts) to support dynamic mode toggling (`setMode` and `getMode`)
- [ ] T005 Implement GET/POST `/anomaly` endpoint handlers in [order-service/src/app.ts](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/order-service/src/app.ts)

**Checkpoint**: Base API foundation complete. Run integration tests to verify compile checks pass.

---

## Phase 3: User Story 1 - Automated Chaos Injection (Priority: P1) 🎯 MVP

**Goal**: Operators can run `chaos_script.py` to trigger errors or latency in the system, and terminating it resets the service to normal.

**Independent Test**: Execute `python chaos_script.py --mode error` and confirm HTTP 500 errors are returned; press Ctrl+C and confirm `order-service` returns to normal.

### Tests for User Story 1

- [ ] T006 [P] [US1] Create integration test suite in [tests/integration/anomaly-api.test.ts](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/tests/integration/anomaly-api.test.ts) to assert GET/POST `/anomaly` behavior

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create skeleton [chaos_script.py](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/chaos_script.py) in project root with argument parsing (`--mode`, `--duration`, `--rate`, `--target`, `--order-service-url`)
- [ ] T008 [US1] Implement request load generation loop in [chaos_script.py](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/chaos_script.py) targeting user-service
- [ ] T009 [US1] Implement signal handler configuration (`SIGINT`, `SIGTERM`) in [chaos_script.py](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/chaos_script.py) to automatically restore `normal` mode on exit
- [ ] T010 [US1] Implement execution summary console logging in [chaos_script.py](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/chaos_script.py)

**Checkpoint**: User Story 1 is fully functional. Run vitest integration tests to verify the API, and test `chaos_script.py` manually.

---

## Phase 4: User Story 2 - Unified Grafana System Status Panel (Priority: P2)

**Goal**: Operators can view a single high-level system status panel in Grafana that aggregates system metrics, error counts, and ML anomaly metrics.

**Independent Test**: Viewing Grafana dashboard during normal operation displays `HEALTHY`. Running `chaos_script.py` transitions status to `DEGRADED` or `CRITICAL`.

### Implementation for User Story 2

- [ ] T011 [US2] Update [config/grafana/dashboards/microservices-overview.json](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/config/grafana/dashboards/microservices-overview.json) to add the System Status panel using the combined PromQL query
- [ ] T012 [US2] Verify the System Status panel renders correctly in Grafana UI under normal, degraded, and critical conditions

**Checkpoint**: At this point, both User Stories 1 and 2 are integrated.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification and documentation updates

- [ ] T013 Verify health, readiness, and container lifecycle of the updated `order-service`
- [ ] T014 [P] Update [walkthrough.md](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/specs/010-chaos-detection-validation/walkthrough.md) with test execution details, console logs, and screenshots
- [ ] T015 Run validation scenarios in [specs/010-chaos-detection-validation/quickstart.md](file:///c:/Users/ASUS/IdeaProjects/projet_stage/my-project/specs/010-chaos-detection-validation/quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion (can run in parallel with Story 1 implementation)
- **Polish (Phase 5)**: Depends on both user stories being complete

### Parallel Opportunities

- Setup tasks can be done together.
- Registering metrics (T003), updating service (T004), and creating tests (T006) can start in parallel.
- Once the API endpoints are in place, the python `chaos_script.py` implementation (Story 1) and Grafana dashboard update (Story 2) can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run integration tests and execute `chaos_script.py` manually to verify mode toggling and load injection.

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Deploy/Demo (MVP)
3. Add User Story 2 -> Test independently -> Deploy/Demo (Full status visualization)
