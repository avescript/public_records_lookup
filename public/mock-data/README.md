# Mock PDF Files for PII Detection Testing

This directory contains sample PDF files used for Phase 0 development of the PII detection system.

## Files:
- `police_report_001.pdf` - Sample police report with SSN, phone, address
- `incident_report_002.pdf` - Incident report with SSN, DOB, driver's license
- `witness_statement_003.pdf` - Witness statement with names, phone, address  
- `financial_records_004.pdf` - Financial document with account numbers, SSN
- `medical_records_005.pdf` - Medical records with SSN, medical ID, names, DOB

## PII Types Detected:
- SSN (Social Security Numbers)
- PHONE (Phone Numbers) 
- ADDRESS (Street Addresses)
- PERSON_NAME (Personal Names)
- EMAIL (Email Addresses)
- DOB (Dates of Birth)
- DRIVERS_LICENSE (Driver's License Numbers)
- ACCOUNT_NUMBER (Financial Account Numbers)
- ROUTING_NUMBER (Bank Routing Numbers)
- MEDICAL_ID (Medical Identifier Numbers)

## Coordinate System:
- x, y: Top-left corner of PII bounding box
- width, height: Dimensions of PII area
- Coordinates are in PDF points (72 points per inch)

For Phase 0, these will be simulated with placeholder rectangles in the PDF preview.