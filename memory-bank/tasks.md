# Project Task List

## Epic 0: Foundation & Environments

### US-000: Bootstrap Project ✅
- [x] Initial Setup
  - [x] Create new Next.js project with TypeScript
  - [x] Add MUI v5+ dependencies
  - [x] Configure TypeScript strict mode
  - [x] Set up project structure (components, pages, etc.)
  - [x] Add base theme configuration

- [x] Code Quality
  - [x] Install and configure ESLint
  - [x] Set up Prettier
  - [x] Add TypeScript strict rules
  - [x] Configure EditorConfig
  - [x] Add lint-staged and husky for pre-commit hooks

- [ ] CI/CD Pipeline
  - [ ] Create GitHub Actions workflow
  - [ ] Set up Cloud Build configuration
  - [ ] Add lint/type checking steps
  - [ ] Configure build process
  - [ ] Add test running step

- [ ] Documentation
  - [ ] Create README.md with setup instructions
  - [ ] Add contributing guidelines
  - [ ] Document development workflow
  - [ ] Create .env.example template
  - [ ] Add architecture documentation

### US-001: us-west Residency Guardrails
- [ ] Infrastructure Setup
  - [ ] Create Terraform configurations
  - [ ] Define us-west region variables
  - [ ] Set up resource naming conventions
  - [ ] Configure networking components
  - [ ] Set up service accounts

- [ ] Guardrails
  - [ ] Create region validation checks
  - [ ] Add pre-commit hooks for IaC
  - [ ] Set up static analysis tools
  - [ ] Document region requirements
  - [ ] Create region compliance tests

## Epic 1: Request Intake

### US-010: Public Records Request Form ✅
- [x] Form Development
  - [x] Create form component structure
  - [x] Add form fields (title, department, description, email)
  - [ ] Implement date range selector
  - [ ] Add file attachment handling
  - [x] Implement form validation with Zod
  - [x] Add loading states and error handling
  - [x] Implement success notifications

- [x] Testing & Quality
  - [x] Fix RequestForm test suite errors
  - [x] Add comprehensive test coverage for form validation
  - [x] Document Material-UI Select testing patterns
  - [x] Resolve test syntax and logic errors
  - [x] Add portal-aware testing documentation

- [ ] Accessibility
  - [x] Add ARIA labels
  - [x] Implement keyboard navigation
  - [x] Add error announcements
  - [ ] Test with screen readers
  - [ ] Validate WCAG 2.1 AA compliance

- [ ] Data Handling
  - [ ] Set up Firestore connection
  - [ ] Create request document structure
  - [ ] Implement file upload to Cloud Storage
  - [ ] Generate tracking IDs
  - [ ] Create confirmation page

### US-011: Staff Intake Queue
- [ ] Queue Interface
  - [ ] Implement MUI Data Grid
  - [ ] Add sorting functionality
  - [ ] Create filter components
  - [ ] Add status indicators
  - [ ] Create detail view

- [ ] Data Management
  - [ ] Set up real-time updates
  - [ ] Implement pagination
  - [ ] Add request status handling
  - [ ] Create data fetching hooks
  - [ ] Add error handling

## Epic 2: Agency Console & SLA

### US-020: Filtering System
- [ ] Filter Components
  - [ ] Create agency filter
  - [ ] Add status filter
  - [ ] Implement date range filter
  - [ ] Add URL parameter sync
  - [ ] Create filter reset functionality

### US-021: SLA Tracking
- [ ] SLA Features
  - [ ] Create business day calculator
  - [ ] Implement due date tracking
  - [ ] Add visual indicators
  - [ ] Create notification system
  - [ ] Add SLA breach tracking

## Epic 3: Search & AI Match

### US-030: AI Matching System
- [ ] Match Implementation
  - [ ] Create mock match service
  - [ ] Design match result interface
  - [ ] Implement confidence scoring
  - [ ] Add match explanations
  - [ ] Create empty state handling

### US-031: Match Review
- [ ] Review Interface
  - [ ] Create accept/reject controls
  - [ ] Implement state management
  - [ ] Add audit logging
  - [ ] Create review history
  - [ ] Implement batch actions

## Next Steps
1. Complete Epic 0 tasks
2. Set up development environment
3. Begin form development
4. Implement basic queue functionality

## Dependencies
- Next.js and MUI setup must be complete before form development
- Firestore emulator needed for local development
- Region checks required before any cloud resource creation
- Authentication system needed before staff features

## Notes
- All features should follow accessibility guidelines
- Maintain us-west region compliance
- Include error handling and logging
- Follow TypeScript strict mode
- Add tests for all components
