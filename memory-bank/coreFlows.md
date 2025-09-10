# Core User Flows

## Overview
Essential happy path flows for the Public Records AI Assistant, focusing on key interactions while maintaining extensibility for future enhancements.

## 1. Public Requester Flow
**Core Goal:** Submit request and receive records

### Basic Flow
1. Submit Request
   - Fill basic form (name, email, description)
   - Get tracking ID
   - Receive confirmation email

2. Track Request
   - View status
   - Download records when ready

### Extension Points
- Additional form fields
- Document attachments
- Multi-language support
- Status notifications
- Feedback collection

## 2. Records Officer Flow
**Core Goal:** Process requests efficiently

### Basic Flow
1. Review Requests
   - View queue
   - Sort by due date
   - Open request details

2. Find Records
   - Run AI match
   - Review top matches
   - Accept/reject matches

3. Handle Redactions
   - Review AI suggestions
   - Modify if needed
   - Send for approval

### Extension Points
- Advanced filtering
- Batch processing
- Custom workflows
- Integration with external systems
- Analytics dashboard

## 3. Legal Reviewer Flow
**Core Goal:** Ensure compliant release

### Basic Flow
1. Review Package
   - Check redactions
   - Verify compliance
   - Approve or request changes

2. Final Approval
   - Approve for release
   - Add any notes

### Extension Points
- Detailed annotations
- Compliance checklists
- Team collaboration
- Audit reporting
- Template management

## Required Components

### Phase 1 (Essential)
- Public request form
- Request queue
- Basic search
- Document viewer
- Redaction tools
- Approval workflow

### Phase 2 (When Needed)
- Advanced filters
- Batch operations
- Analytics
- Custom workflows
- Integration points

## Success Indicators
- Request submission < 3 minutes
- Match review < 5 minutes per request
- Legal review < 10 minutes per package
- Clear status at every step

## Notes
- Start with minimal viable flows
- Add complexity only when needed
- Maintain consistent patterns
- Focus on user efficiency
- Keep UI/UX simple and clear
