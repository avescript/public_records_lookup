# Active Context

## Current Focus
**Epic 2 — Agency Console & Staff Workflows** 🚧
Goal: Build staff interfaces for request queue management, status updates, and workflow optimization.

## Active User Story
US-020: Staff request queue with filtering and SLA tracking (IN PROGRESS)

### Acceptance Criteria
- ✅ Given staff access, they can view all submitted requests in a sortable data grid
- ✅ Given request data, staff can see tracking ID, title, department, status, submitted date, and SLA due dates
- ✅ Given SLA requirements, staff can identify overdue requests (red), due soon (orange), and on-time (green)
- ✅ Given test scenarios, staff can use seeded sample data to verify functionality
- [ ] Given filtering needs, staff can filter by department, status, and date ranges
- [ ] Given search requirements, staff can search requests and persist filters in URL
- [ ] Given request details, staff can view complete request information and update status
- [ ] Given workflow needs, staff can add internal notes and track request progress

### Completed Tasks (Epic 2)
- [x] Create StaffDashboard component with MUI Data Grid
- [x] Implement SLA tracking with business day calculations
- [x] Add due date indicators with color coding (overdue, due soon, on time)
- [x] Set up staff page routing and navigation
- [x] Create admin tools for test data management
- [x] Build test data seeder with realistic sample requests
- [x] Integrate staff console into main navigation

### Current Focus (Epic 2 Continuation)
**Next Tasks:**
1. Add filtering and search capabilities with URL persistence
2. Implement request details view/drawer for status management
3. Build staff authentication and role-based access
4. Enhance SLA tracking with business day accuracy
5. Add internal notes and workflow management

## Technical Stack (Current)
- Next.js 15+ with TypeScript (strict mode)
- MUI v5+ component library with @mui/x-data-grid for advanced tables
- React Hook Form with Zod validation
- Firebase/Firestore for data persistence
- date-fns for date formatting and business day calculations
- Responsive design implementation
- ESLint + Prettier configuration

## System Architecture
### Data Layer
- Firebase/Firestore for request storage
- Request service with CRUD operations
- Tracking ID generation system (PR-{timestamp}-{random})
- Support for multiple request statuses

### UI Components
- RequestForm: Complete form with validation and file upload
- DateRangePicker: Custom component with preset and custom date ranges
- FileUpload: Drag-and-drop with preview functionality
- RequestConfirmation: Full confirmation page with request details
- Status tracking: Lookup page for request status by tracking ID
- StaffDashboard: Advanced data grid with SLA tracking and priority indicators
- AdminTools: Test data seeding and development utilities

### Pages
- `/` - Submit new request
- `/confirmation` - Request confirmation (with Suspense boundary)
- `/status` - Track request by tracking ID
- `/staff` - Staff console with request queue management
- `/admin` - Admin tools for development and testing

## Recent Decisions
1. Firebase/Firestore for backend persistence (prototype-ready)
2. Tracking ID pattern: PR-{6-digit timestamp}-{4-char random}
3. Status workflow: submitted → processing → under_review → completed/rejected
4. Client-side navigation with window.location for cross-page transitions
5. Suspense boundaries for components using useSearchParams
6. Environment-based Firebase configuration with emulator support

## Current Capabilities
✅ **Complete Request Submission Flow**
- Form validation with real-time feedback
- File upload with preview and removal
- Date range selection with presets
- Successful submission with tracking ID

✅ **Data Persistence**
- Firestore integration with proper typing
- Request service with error handling
- Automatic tracking ID generation
- Status management system

✅ **User Experience**
- Confirmation page with complete request details
- Status lookup by tracking ID
- Navigation between all features
- Responsive design across all components

✅ **Staff Console Foundation** 🆕
- Advanced data grid with sortable columns
- SLA tracking with business day calculations
- Due date indicators (overdue/due soon/on time)
- Request queue management interface
- Test data seeding for development
- Admin tools for data management

✅ **Technical Foundation**
- TypeScript strict mode compliance
- Comprehensive error handling
- Clean component architecture
- Build optimization and deployment ready

## Next Priorities (Epic 2 Continuation)
1. Filtering and search with URL persistence
2. Request details view with status updates
3. Staff authentication and role-based access
4. Enhanced SLA tracking accuracy
5. Internal notes and workflow management

## Dependencies
- Next.js 15+
- React 18+
- TypeScript 5+
- Material-UI v5 + @mui/x-data-grid
- React Hook Form + Zod
- Firebase SDK v10+
- date-fns v3+

## Notes
- Epic 1: Complete end-to-end user flow implemented ✅
- Epic 2: Staff dashboard foundation complete 🚧
- Firebase integration ready for production configuration
- All core UI components complete with proper testing
- Advanced data grid provides foundation for complex staff workflows
- Test data seeding enables rapid development and testing
