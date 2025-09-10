# Development Progress

## Overall Status
Phase 1 - Core Implementation

## Current Sprint
Sprint 1: Foundation & Request Intake (Epics 0-1)

## Epic Progress

### Epic 0 — Foundation & Environments
Status: In Progress
- [x] US-000: Bootstrap project (Completed)
  - [x] Create repo and Next.js + TypeScript + MUI baseline
  - [x] Add ESLint + Prettier + TS strict config
  - [x] Set up proper project structure
  - [x] Configure TypeScript with strict mode
  - [ ] Set up GitHub Actions/Cloud Build pipelines
  - [ ] Add `.env.example` for Google Identity/keys
  - [ ] Add top-level README and contributing guide
- [ ] US-001: us-west residency guardrails
  - [ ] Infra defaults with us-west regions
  - [ ] Region guardrails documentation
  - [ ] Static analysis/pre-commit check for IaC

### Epic 1 — Core UI Components
Status: In Progress
- [x] Create reusable FileUpload component
  - [x] Implement drag-and-drop functionality
  - [x] Add file validation
  - [ ] Add file preview
- [x] Create RequestForm component
  - [x] Implement form validation with Zod
  - [x] Add form state management
  - [ ] Integrate with FileUpload component

### Epic 1 — Request Intake (Public Portal)
Status: Not Started
- [ ] US-010: Submit a public records request
- [ ] US-011: Intake queue for staff

### Epic 2 — Agency Console & SLA
Status: Not Started
- [ ] US-020: Filter by agency/status/due date
- [ ] US-021: SLA clocks & due-soon indicators

### Epic 3 — Search & AI Match
Status: Not Started
- [ ] US-030: Run AI match and view Top-N
- [ ] US-031: Accept/Reject candidate matches

### Epic 4 — Redaction
Status: Not Started
- [ ] US-040: View suggested PII findings
- [ ] US-041: Draw redactions and export rendition
- [ ] US-042: Human approval gate

### Epic 5 — Approvals & Legal Review
Status: Not Started
- [ ] US-050: Request changes
- [ ] US-051: Approve package for release

### Epic 6 — Package & Delivery
Status: Not Started
- [ ] US-060: Build combined package
- [ ] US-061: Schedule mock delivery

### Epic 7 — Audit & Observability
Status: Not Started
- [ ] US-070: Immutable application audit log
- [ ] US-071: BigQuery export for dashboards

### Epic 8 — Synthetic Data & Public Domain Corpus
Status: Not Started
- [ ] US-080: Load synthetic dataset v2
- [ ] US-081: Import public-domain PDFs

### Epic 9 — RBAC & Multi-Agency
Status: Not Started
- [ ] US-090: Agency switcher & row filtering
- [ ] US-091: Role-based UI

### Epic 10 — Non-functional & Readiness
Status: Not Started
- [ ] US-100: Accessibility & responsiveness
- [ ] US-101: Performance SLOs

### Epic 11 — "Go Demo"
Status: Not Started
- [ ] US-110: Scripted end-to-end demo

### Cross-Epic — AI Email Drafting
Status: Not Started
- [ ] US-120: Generate response draft

## Known Issues
None at this stage

## Next Milestones
1. Complete project bootstrap
2. Establish us-west guardrails
3. Begin request intake development
4. Set up synthetic data structure
