# Test Scenarios & Demo Guide

This document provides comprehensive test scenarios for the Public Records Lookup application, covering both development testing and client demonstrations.

## Quick Start

1. Start your development server: `npm run dev`
2. Go to `localhost:3000/admin/tools` (admin access required)
3. Click **"Complete Setup"** to create all test data
4. Follow the demo script below

## Test Scenarios Overview

### 1. **Existing Unfulfilled Requests** (10 requests)
Realistic requests that admins need to process, representing typical public records inquiries:

- **Police Use of Force Incidents** - Journalist requesting Q3 2025 reports
- **Criminal Case Discovery** - Defense attorney needing case documents  
- **City Budget Analysis** - Citizen seeking Public Works expenditures
- **Building Code Violations** - Business researching downtown properties
- **Fire Emergency Response** - Academic researcher studying response times
- **City Council Minutes** - Journalist investigating executive sessions
- **Environmental Assessments** - Citizen tracking development projects
- **Police Training Records** - Attorney researching officer qualifications
- **Water Quality Reports** - Researcher examining municipal compliance
- **Building Permit Data** - Contractor analyzing fees and processing

### 2. **Sample Request** (For Requester Testing)
Pre-configured request perfect for testing the citizen experience:
- **Title:** Traffic Citation Data - Speed Enforcement
- **Department:** Police  
- **Description:** Highway 99 speed citations for August 2025
- **Email:** community.watch@residents.org

## Complete Demo Script

### Step 1: Requester Submits Request
**Role:** Public Citizen  
**URL:** `localhost:3000`

**Actions:**
1. Fill out request form using sample data:
   - Title: "Traffic Citation Data - Speed Enforcement"
   - Department: Police Department
   - Date Range: August 1-31, 2025
   - Description: Request speed violation data for community safety analysis
   - Email: community.watch@residents.org

2. Submit request and save the tracking ID

**Expected Outcome:** 
- Confirmation page with tracking ID
- Request successfully stored in system

### Step 2: Requester Checks Status  
**Role:** Public Citizen  
**URL:** `localhost:3000/status`

**Actions:**
1. Enter tracking ID from Step 1
2. Click "Search Request"

**Expected Outcome:**
- View request details and current status
- See submission date and description

### Step 3: Admin Reviews Queue
**Role:** Staff/Admin  
**URL:** `localhost:3000/admin/staff`

**Actions:**
1. View staff dashboard with all pending requests
2. Use filters to find specific requests
3. Notice SLA tracking and priority indicators
4. Click on the sample request from Step 1

**Expected Outcome:**
- See comprehensive request queue
- Filter and sort functionality working
- Request details drawer opens

### Step 4: Admin Processes Request (Epic 4 Features)
**Role:** Staff/Admin  
**URL:** `localhost:3000/admin/staff`

**Actions:**
1. Open request details drawer
2. Update status to "Processing"
3. Add internal note: "Searching for citation records"
4. Click "Find Records" to demonstrate Epic 4
5. Use PII Detection feature on sample documents
6. Create redactions using drawing tools
7. Submit for approval workflow

**Expected Outcome:**
- Status updates working
- Epic 4 PII detection active
- Redaction canvas functional
- Approval workflow initiated

### Step 5: Complete Request Workflow
**Role:** Staff/Admin  
**URL:** `localhost:3000/admin/staff`

**Actions:**
1. Process through approval workflow
2. Update status to "Completed"
3. Add final note: "Records prepared and ready for release"
4. View complete audit trail

**Expected Outcome:**
- Full workflow demonstrated
- Status tracking complete
- Audit trail visible

## Requester Personas

The test data includes realistic personas for different user types:

### 🗞️ **Sarah Mitchell** - Journalist
- Email: sarah.mitchell@localnews.com
- Focus: Investigative reporting on municipal government
- Typical Requests: Police reports, city council minutes, budget data

### ⚖️ **Marcus Rodriguez** - Defense Attorney  
- Email: mrodriguez@defenderslaw.com
- Focus: Criminal defense case discovery
- Typical Requests: Police reports, evidence logs, officer records

### 🏠 **Jennifer Chen** - Citizen Advocate
- Email: jennifer.chen.inquirer@gmail.com  
- Focus: Community transparency and oversight
- Typical Requests: Budget data, environmental reports, city policies

### 🏗️ **David Thompson** - Business Owner
- Email: dthompson@constructionplus.com
- Focus: Construction and development projects
- Typical Requests: Building permits, inspections, code violations

### 🎓 **Dr. Angela Foster** - Academic Researcher
- Email: afoster@university.edu
- Focus: Urban policy and emergency services research  
- Typical Requests: Statistical data, response times, policy documents

## Testing Workflows

### For Development Testing:
1. Use **"Create Existing Requests"** to populate admin queue
2. Test filtering, sorting, and search in staff dashboard
3. Practice Epic 4 features on various request types
4. Validate status updates and audit trails

### For Client Demos:
1. Use **"Complete Setup"** for full demonstration
2. Follow demo script for smooth presentation
3. Highlight Epic 4 features (PII detection, redaction, approval)
4. Show both requester and admin perspectives

### For User Training:
1. Create **"Sample Request"** for hands-on training
2. Let users practice the complete workflow
3. Use existing requests for queue management training
4. Practice various scenarios and edge cases

## Reset and Maintenance

- **Reset Data:** Use admin tools to clear test data when needed
- **Fresh Start:** Complete setup creates new data set
- **Partial Testing:** Use individual tools for specific scenarios

## Tracking IDs

After creating test data, tracking IDs are displayed in the admin tools. Sample format:
- `PR-123456-ABCD` - Format for all tracking IDs
- Use these IDs for status lookup testing
- Each request gets a unique, timestamped ID

## Epic 4 Testing Focus

The test scenarios are specifically designed to showcase Epic 4 features:

1. **PII Detection:** Documents contain various PII types for testing
2. **Redaction Drawing:** Canvas tools for manual redaction creation  
3. **Approval Workflow:** Multi-step approval process with comments
4. **Staff Interface:** Professional dashboard for processing requests

## Troubleshooting

- **No Requests Showing:** Check admin tools console for seeding errors
- **Authentication Issues:** Ensure admin authentication is working
- **Epic 4 Features:** Verify all Epic 4 services are properly integrated
- **Status Updates:** Check Firestore connection and service functionality

---

*This guide ensures comprehensive testing coverage and smooth demonstrations of all application features.*