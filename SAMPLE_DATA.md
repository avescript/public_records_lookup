# Sample Request Data for Manual Testing

Use this data to manually test the requester experience by copying and pasting into the request form at `localhost:3000`.

## 📋 Sample Request Template

### Basic Information
- **Title:** Traffic Citation Data - Speed Enforcement
- **Department:** Police Department
- **Email:** community.watch@residents.org

### Date Range
- **Start Date:** 2025-08-01
- **End Date:** 2025-08-31
- **Preset:** Custom

### Description (Copy/Paste Ready)
```
I am requesting records of traffic citations issued for speeding violations on Highway 99 between Main Street and Oak Avenue for the month of August 2025. Please include: citation numbers, dates/times, violation codes, and fine amounts (personal information can be redacted). This request is for a community safety analysis.
```

## 🎭 Alternative Sample Requests

### 1. Fire Department Records
- **Title:** Fire Safety Inspection Records
- **Department:** Fire Department  
- **Email:** business.owner@company.com
- **Date Range:** 2024-09-01 to 2025-09-01
- **Description:**
```
Requesting fire safety inspection records for commercial building at 123 Business Avenue for the past year. Need documentation for insurance renewal purposes. Please include inspection reports, violation notices, and compliance certificates.
```

### 2. City Council Minutes
- **Title:** City Council Meeting Minutes - August 2025
- **Department:** City Clerk
- **Email:** citizen.advocate@community.org  
- **Date Range:** 2025-08-01 to 2025-08-31
- **Description:**
```
Requesting meeting minutes and audio recordings from city council meetings in August 2025. Specifically interested in discussions about budget allocations and development projects. Please include any executive session summaries that are public record.
```

### 3. Budget Information
- **Title:** Parks Department Budget Analysis
- **Department:** Finance Department
- **Email:** transparency.watchdog@email.com
- **Date Range:** 2025-01-01 to 2025-12-31  
- **Description:**
```
Requesting detailed budget allocations and expenditures for Parks and Recreation department for fiscal year 2025. Please include line-item expenses, contractor payments, and any budget amendments or transfers.
```

### 4. Police Report Request
- **Title:** Police Incident Report - Case #2025-4567
- **Department:** Police Department
- **Email:** legal.inquiry@lawfirm.com
- **Date Range:** 2025-09-15 to 2025-09-15
- **Description:**
```
Requesting police incident report for case #2025-4567 that occurred on September 15, 2025, at the intersection of Main Street and First Avenue. Need complete report including officer notes, witness statements, and any related documentation for legal proceedings.
```

### 5. Environmental Records
- **Title:** Water Quality Test Results - 2025
- **Department:** Other  
- **Email:** environmental.research@university.edu
- **Date Range:** 2025-01-01 to 2025-09-24
- **Description:**
```
Requesting all water quality test results, lab reports, and compliance documentation for the municipal water supply system for 2025. Include any violation notices, corrective actions, and correspondence with environmental agencies. This is for academic research on municipal water systems.
```

## 🧪 Testing Instructions

### For Requester Experience Testing:
1. Go to `localhost:3000`
2. Copy and paste one of the sample requests above
3. Submit the form
4. Save the tracking ID
5. Test status lookup at `localhost:3000/status`

### For Admin Processing Testing:
1. Submit a sample request
2. Go to `localhost:3000/admin/staff`
3. Find your request in the queue
4. Open details and practice:
   - Status updates
   - Adding internal notes  
   - Using Epic 4 features
   - Processing workflow

### For Status Checking:
Use these sample tracking IDs (if you've run the complete setup):
- Check admin tools page for current tracking IDs
- Or create fresh requests and use those IDs

## 📝 Copy-Paste Checklist

When testing manually, copy these exactly:

**Email addresses:**
- `community.watch@residents.org`
- `business.owner@company.com`
- `citizen.advocate@community.org`
- `transparency.watchdog@email.com`
- `legal.inquiry@lawfirm.com`
- `environmental.research@university.edu`

**Common Date Ranges:**
- Current month: 2025-09-01 to 2025-09-30
- Past month: 2025-08-01 to 2025-08-31  
- Current year: 2025-01-01 to 2025-12-31
- Past 6 months: 2025-03-01 to 2025-09-24

**Department Options:**
- Police Department
- Fire Department
- City Clerk
- Finance Department
- Other

---

*Use this data to thoroughly test both the requester and admin experiences. Each sample represents a realistic public records request scenario.*