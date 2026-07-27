<!--
Sync Impact Report
- Version change: template/unversioned -> 1.0.0
- Modified principles: placeholders -> I. Modular Service Boundaries; II. Production-Ready by Default;
  III. Observability Is a Product Contract; IV. Secure Container Isolation; V. Clean, Testable,
  Explainable AIOps
- Added sections: Platform and Security Constraints; Delivery and Quality Workflow
- Templates requiring updates: .specify/templates/plan-template.md (updated);
  .specify/templates/spec-template.md (updated); .specify/templates/tasks-template.md (updated)
- Follow-up TODOs: none
-->

# Centralized Observability & AIOps Platform Constitution

## Core Principles

### I. Modular Service Boundaries
Every Spring Boot, Node.js, FastAPI, and supporting service MUST own one clearly defined
business capability, expose versioned contracts, and avoid direct access to another service's
datastore. Shared code MUST be limited to deliberately versioned libraries for cross-cutting
concerns; service-specific logic MUST remain local. This preserves independent deployment,
scaling, and failure containment.

### II. Production-Ready by Default
Every deployable service MUST provide reproducible, environment-driven configuration; health
and readiness checks; graceful shutdown; resource limits appropriate to its workload; and
documented failure behavior. Docker Compose definitions MUST be deployable without manual
container changes, and secrets MUST be injected through environment or secret mechanisms,
never committed to source control. Production reliability cannot depend on tribal knowledge.

### III. Observability Is a Product Contract
All service-to-service and externally visible operations MUST emit structured logs, metrics,
and distributed traces through OpenTelemetry. Trace context MUST propagate across supported
protocol boundaries. Prometheus metrics MUST use stable, low-cardinality labels; logs MUST be
ingestible by ELK; and Grafana dashboards and actionable alerts MUST accompany new critical
workflows. Telemetry MUST not expose secrets or unnecessary personal data. The platform exists
to make system behavior explainable, so observability is a delivery requirement, not an
afterthought.

### IV. Secure Container Isolation
Each container MUST run with the least privileges needed: non-root where supported, no
privileged mode, no host networking, no writable host mounts unless explicitly justified, and
only required ports and networks exposed. Docker Compose MUST segment public ingress,
application traffic, and telemetry/data-plane traffic with named networks; backing services
MUST remain private by default. Images MUST be pinned to intentional versions and built with
minimal runtime dependencies. Isolation limits blast radius and protects observability data.

### V. Clean, Testable, Explainable AIOps
Code MUST be cohesive, idiomatic for its language, formatted and statically checked, with
clear ownership and no dead or duplicated logic. Changes MUST include tests proportionate to
risk, including contract or integration tests for service interactions. FastAPI and
Scikit-Learn models MUST have versioned artifacts, documented feature inputs, reproducible
training/evaluation paths, and measurable acceptance thresholds before deployment. Automated
recommendations MUST retain enough telemetry and rationale for operators to audit outcomes.

## Platform and Security Constraints

Docker Compose is the local and integration orchestration baseline. The approved platform
components are Spring Boot and Node.js microservices, OpenTelemetry, Prometheus, ELK Stack,
Grafana, and FastAPI with Scikit-Learn for ML workloads. Introducing an alternative runtime,
telemetry path, datastore, or externally reachable service requires an architecture decision
record that explains compatibility, operational cost, security impact, and a rollback path.

Configuration MUST be separated from code and validated at startup. Persistent volumes MUST
be named, scoped to the owning component, and have documented retention and backup needs.
Default credentials, broad CORS rules, mutable image tags, and plaintext secrets are forbidden.

## Delivery and Quality Workflow

Each feature plan MUST pass the Constitution Check before research and again before
implementation. It MUST identify service ownership, contracts, Compose network exposure,
configuration/secrets, telemetry signals, dashboards or alerts, test strategy, and—where ML
is involved—model data, evaluation, versioning, and rollback.

Pull requests MUST be small enough to review, include evidence for applicable automated checks,
and call out any exception to this constitution. Exceptions require a time-bounded written
justification, a compensating control, and an owner; they do not silently redefine a principle.

## Governance

This constitution supersedes conflicting project practices. Amendments require a documented
rationale, an impact review of templates and active plans, and approval by project maintainers.
Versioning follows semantic intent: MAJOR for incompatible principle removal or redefinition,
MINOR for a new principle or material governance expansion, and PATCH for clarification only.
Every feature review MUST verify applicable principles; unresolved violations block release
unless an approved, time-bounded exception is recorded. Runtime guidance and SpecKit templates
MUST be kept aligned whenever this constitution changes.

**Version**: 1.0.0 | **Ratified**: 2026-07-27 | **Last Amended**: 2026-07-27
