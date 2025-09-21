# Technical Context - Public Records AI Assistant

## Technology Stack

### Frontend

- **Framework:** Next.js
- **UI Library:** MUI v5+
- **Language:** TypeScript (strict)
- **State Management:** React Query
- **Forms:** React Hook Form + Zod
- **Data Grid:** MUI Data Grid
- **PDF Viewer:** PDF.js
- **Testing:** Jest + RTL, Playwright

### Backend

- **Platform:** Google Cloud Platform (GCP)
- **Compute:** Cloud Run
- **Storage:**
  - Firestore (prototype)
  - Cloud Storage
  - Cloud SQL (production)
- **AI Services:**
  - Vertex AI (Gemini 1.5)
  - Vertex Matching Engine
  - Document AI
  - DLP API
- **Messaging:** Pub/Sub
- **Scheduling:** Cloud Tasks
- **Analytics:** BigQuery

### Infrastructure

- **CDN:** Cloud CDN
- **Security:** Cloud Armor, IAP
- **Auth:** Google Identity Platform
- **Email:** Gmail API
- **Monitoring:** Cloud Logging, Monitoring, Traces

## Development Environment

### Required Tools

- Node.js 18+
- npm/yarn
- Git
- VS Code (recommended)
- GCP CLI tools
- Docker

### Environment Variables

```bash
# Auth
GOOGLE_CLOUD_PROJECT=
GOOGLE_APPLICATION_CREDENTIALS=

# Storage
FIRESTORE_EMULATOR_HOST=
PUBSUB_EMULATOR_HOST=

# Region
GOOGLE_CLOUD_REGION=us-west1

# APIs (Phase 0 - mock)
VERTEX_AI_ENDPOINT=
DOCUMENT_AI_ENDPOINT=
DLP_API_ENDPOINT=
```

### Local Development

1. Install dependencies

```bash
npm install
```

2. Start emulators

```bash
npm run emulators
```

3. Run development server

```bash
npm run dev
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Lint
npm run lint

# Type check
npm run type-check
```

## Dependencies

### Production Dependencies

```json
{
  "@emotion/react": "^11.x",
  "@emotion/styled": "^11.x",
  "@mui/material": "^5.x",
  "@mui/x-data-grid": "^8.x",
  "@mui/x-date-pickers": "^8.x",
  "next": "^15.x",
  "react": "^19.x",
  "react-hook-form": "^7.x",
  "firebase": "^12.x",
  "date-fns": "^4.x",
  "zod": "^3.x"
}
```

### Development Dependencies

```json
{
  "@types/react": "^19.x",
  "@typescript-eslint/eslint-plugin": "^5.x",
  "eslint": "^8.x",
  "eslint-plugin-simple-import-sort": "^10.x",
  "jest": "^29.x",
  "playwright": "^1.x",
  "prettier": "^3.x",
  "typescript": "^5.x"
}
```

### Code Quality Tools

**Prettier Configuration:**
- Single quotes, 80 character width
- Trailing commas for better git diffs
- Automatic formatting via `npm run format`

**ESLint Configuration:**
- Import sorting with logical grouping
- Automatic fixes via `npm run lint:fix`
- Import groups: External → Internal → Relative

**Quality Scripts:**
```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Lint with auto-fix
npm run lint:fix
```

## Build & Deploy

### Build Process

1. Lint and type check
2. Run tests
3. Build Next.js
4. Build Docker image
5. Push to Container Registry

### Deployment Environments

- Local (emulators)
- Development
- Staging
- Production

### Infrastructure as Code

- Terraform for GCP resources
- GitHub Actions for CI/CD
- Cloud Build for container builds

## Security Requirements

### Authentication

- Google Identity Platform SSO
- MFA requirement
- Session management

### Authorization

- Role-based access control
- Agency-level isolation
- Resource-level permissions

### Data Protection

- us-west region only
- End-to-end encryption
- PII handling procedures
- Audit logging

## Performance Requirements

### Frontend

- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Core Web Vitals pass

### API

- P95 latency < 500ms
- Search latency < 2s
- PDF load < 3s

### Scalability

- Handle 10k+ concurrent requests
- Support multiple agencies
- Elastic resource scaling

## Monitoring & Observability

### Metrics

- Request latency
- Error rates
- Resource usage
- User actions

### Logging

- Application logs
- Audit logs
- Error tracking
- Usage analytics

### Alerting

- SLO breaches
- Error spikes
- Resource constraints
- Security events

## Development Workflow

### Git Flow

1. Feature branches
2. Pull requests
3. Code review
4. Automated tests
5. Merge to main

### Release Process

1. Version bump
2. Changelog update
3. Tag release
4. Deploy to staging
5. Verify & promote

### Documentation

- API documentation
- Component documentation
- Architecture diagrams
- Runbooks
