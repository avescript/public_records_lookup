/**
 * Enhanced Synthetic Data Generator v2
 * Epic 8: Synthetic Data & Public Domain Corpus
 * US-080: Load synthetic dataset v2 for multi-agency testing
 * 
 * Generates comprehensive synthetic data for 5+ agencies with:
 * - 100+ realistic requests across departments
 * - 500+ documents with varied types and complexity
 * - Realistic metadata and relationships
 * - Edge cases and performance testing data
 */

export interface SyntheticAgency {
  id: string;
  name: string;
  departments: string[];
  commonRequestTypes: string[];
  documentTypes: string[];
  averageResponseTime: number; // business days
  complexityWeight: number; // 0.1-1.0, affects redaction complexity
}

export interface SyntheticRequestTemplate {
  title: string;
  agency: string;
  department: string;
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  expectedRecordCount: number;
  commonKeywords: string[];
  piiLikelihood: number; // 0.0-1.0
  redactionComplexity: number; // 0.0-1.0
}

export interface SyntheticDocumentTemplate {
  id: string;
  title: string;
  agency: string;
  department: string;
  recordType: string;
  source: string;
  description: string;
  documentType: 'pdf' | 'email' | 'spreadsheet' | 'image' | 'form';
  classification: 'public' | 'standard' | 'restricted' | 'confidential';
  keyPhrases: string[];
  piiTypes: string[];
  pageRange: [number, number]; // [min, max] pages
  fileSizeRange: [string, string]; // [min, max] file sizes
  commonDatePatterns: string[];
  relatedDocuments?: string[]; // IDs of related documents
}

export interface SyntheticPersona {
  name: string;
  email: string;
  type: 'citizen' | 'journalist' | 'lawyer' | 'researcher' | 'activist';
  requestPatterns: {
    preferredAgencies: string[];
    typicalComplexity: 'simple' | 'medium' | 'complex';
    requestFrequency: number; // requests per month
    followUpLikelihood: number; // 0.0-1.0
  };
}

// Enhanced agencies for multi-agency testing
export const SYNTHETIC_AGENCIES: SyntheticAgency[] = [
  {
    id: 'police',
    name: 'Police Department',
    departments: ['patrol', 'investigations', 'traffic', 'community_relations', 'internal_affairs'],
    commonRequestTypes: [
      'incident_reports', 'arrest_records', 'traffic_citations', 'use_of_force', 
      'officer_training', 'complaint_investigations', 'body_camera_footage',
    ],
    documentTypes: ['incident_report', 'arrest_report', 'citation', 'training_record', 'complaint_file'],
    averageResponseTime: 15,
    complexityWeight: 0.8,
  },
  {
    id: 'fire',
    name: 'Fire Department',
    departments: ['emergency_response', 'fire_prevention', 'hazmat', 'training', 'administration'],
    commonRequestTypes: [
      'emergency_response', 'fire_inspections', 'hazmat_incidents', 'training_records',
      'equipment_maintenance', 'personnel_records', 'budget_reports',
    ],
    documentTypes: ['incident_report', 'inspection_report', 'training_certificate', 'maintenance_log'],
    averageResponseTime: 10,
    complexityWeight: 0.6,
  },
  {
    id: 'finance',
    name: 'Finance Department',
    departments: ['accounting', 'budget', 'payroll', 'procurement', 'audit'],
    commonRequestTypes: [
      'budget_reports', 'expenditure_records', 'contract_documents', 'payroll_data',
      'audit_reports', 'vendor_payments', 'capital_projects',
    ],
    documentTypes: ['financial_report', 'contract', 'invoice', 'audit_report', 'budget_document'],
    averageResponseTime: 12,
    complexityWeight: 0.7,
  },
  {
    id: 'public_works',
    name: 'Public Works Department',
    departments: ['streets', 'water', 'sewer', 'parks', 'facilities', 'engineering'],
    commonRequestTypes: [
      'infrastructure_reports', 'maintenance_records', 'construction_permits', 'environmental_studies',
      'project_plans', 'inspection_reports', 'contractor_records',
    ],
    documentTypes: ['engineering_report', 'permit', 'inspection_report', 'maintenance_record', 'project_plan'],
    averageResponseTime: 14,
    complexityWeight: 0.5,
  },
  {
    id: 'legal',
    name: 'Legal Department',
    departments: ['litigation', 'contracts', 'compliance', 'claims', 'advisory'],
    commonRequestTypes: [
      'legal_opinions', 'litigation_documents', 'contract_records', 'settlement_agreements',
      'compliance_reports', 'insurance_claims', 'advisory_memos',
    ],
    documentTypes: ['legal_opinion', 'contract', 'litigation_file', 'settlement_agreement', 'memo'],
    averageResponseTime: 20,
    complexityWeight: 0.9,
  },
  {
    id: 'parks',
    name: 'Parks and Recreation',
    departments: ['parks_maintenance', 'recreation_programs', 'facilities', 'events', 'aquatics'],
    commonRequestTypes: [
      'facility_usage', 'program_records', 'maintenance_reports', 'event_permits',
      'safety_incidents', 'budget_reports', 'staff_records',
    ],
    documentTypes: ['usage_report', 'permit', 'incident_report', 'program_record', 'maintenance_log'],
    averageResponseTime: 8,
    complexityWeight: 0.3,
  },
];

// Synthetic request templates for realistic scenario generation
export const REQUEST_TEMPLATES: SyntheticRequestTemplate[] = [
  // Police Department Templates
  {
    title: 'Police Use of Force Incidents - {timeRange}',
    agency: 'police',
    department: 'internal_affairs',
    description: 'Request for all use of force incident reports for the period {timeRange}. Include officer reports, witness statements, administrative review documentation, and body camera footage logs.',
    complexity: 'complex',
    expectedRecordCount: 8,
    commonKeywords: ['use of force', 'incident report', 'body camera', 'administrative review'],
    piiLikelihood: 0.9,
    redactionComplexity: 0.8,
  },
  {
    title: 'Traffic Citation Data - {location}',
    agency: 'police',
    department: 'traffic',
    description: 'Traffic citation records for {location} including citation numbers, violation codes, dates, and fine amounts for the period {timeRange}.',
    complexity: 'simple',
    expectedRecordCount: 25,
    commonKeywords: ['traffic citation', 'violation codes', 'fine amounts'],
    piiLikelihood: 0.6,
    redactionComplexity: 0.4,
  },
  {
    title: 'Officer Training Records - {trainingType}',
    agency: 'police',
    department: 'training',
    description: 'Police officer training completion records for {trainingType} including certification dates, instructor information, and training evaluation scores.',
    complexity: 'medium',
    expectedRecordCount: 15,
    commonKeywords: ['officer training', 'certification', 'training evaluation'],
    piiLikelihood: 0.7,
    redactionComplexity: 0.5,
  },
  
  // Fire Department Templates
  {
    title: 'Emergency Response Times - {district}',
    agency: 'fire',
    department: 'emergency_response',
    description: 'Fire department emergency response data for {district} including call volumes, response times, incident types, and resource allocation for {timeRange}.',
    complexity: 'medium',
    expectedRecordCount: 12,
    commonKeywords: ['emergency response', 'response times', 'call volumes', 'incident types'],
    piiLikelihood: 0.4,
    redactionComplexity: 0.3,
  },
  {
    title: 'Fire Inspection Reports - {businessType}',
    agency: 'fire',
    department: 'fire_prevention',
    description: 'Fire safety inspection reports for {businessType} establishments including violation notices, compliance documentation, and follow-up inspection records.',
    complexity: 'simple',
    expectedRecordCount: 20,
    commonKeywords: ['fire inspection', 'safety violations', 'compliance'],
    piiLikelihood: 0.5,
    redactionComplexity: 0.2,
  },
  
  // Finance Department Templates
  {
    title: 'Department Expenditure Report - {department}',
    agency: 'finance',
    department: 'budget',
    description: 'Detailed expenditure report for {department} including contractor payments, equipment purchases, overtime records, and budget variance analysis for fiscal year {fiscalYear}.',
    complexity: 'complex',
    expectedRecordCount: 18,
    commonKeywords: ['expenditure', 'contractor payments', 'budget variance'],
    piiLikelihood: 0.6,
    redactionComplexity: 0.6,
  },
  {
    title: 'Vendor Contract Records - {contractType}',
    agency: 'finance',
    department: 'procurement',
    description: 'Vendor contract documentation for {contractType} including bid documents, contract terms, payment schedules, and performance evaluations.',
    complexity: 'medium',
    expectedRecordCount: 10,
    commonKeywords: ['vendor contract', 'bid documents', 'payment schedules'],
    piiLikelihood: 0.3,
    redactionComplexity: 0.4,
  },
  
  // Public Works Templates
  {
    title: 'Infrastructure Maintenance Records - {infrastructure}',
    agency: 'public_works',
    department: 'streets',
    description: 'Maintenance and repair records for {infrastructure} including work orders, contractor invoices, inspection reports, and project completion documentation.',
    complexity: 'medium',
    expectedRecordCount: 22,
    commonKeywords: ['maintenance records', 'work orders', 'inspection reports'],
    piiLikelihood: 0.2,
    redactionComplexity: 0.2,
  },
  {
    title: 'Environmental Impact Studies - {project}',
    agency: 'public_works',
    department: 'engineering',
    description: 'Environmental impact assessment documentation for {project} including consultant reports, public comments, agency correspondence, and permit applications.',
    complexity: 'complex',
    expectedRecordCount: 35,
    commonKeywords: ['environmental impact', 'consultant reports', 'public comments'],
    piiLikelihood: 0.4,
    redactionComplexity: 0.5,
  },
  
  // Legal Department Templates
  {
    title: 'Litigation Case Files - {caseType}',
    agency: 'legal',
    department: 'litigation',
    description: 'Legal case file documentation for {caseType} cases including pleadings, discovery materials, settlement negotiations, and court orders.',
    complexity: 'complex',
    expectedRecordCount: 45,
    commonKeywords: ['litigation', 'pleadings', 'discovery', 'settlement'],
    piiLikelihood: 0.9,
    redactionComplexity: 0.9,
  },
  {
    title: 'Legal Opinion Memoranda - {topic}',
    agency: 'legal',
    department: 'advisory',
    description: 'Legal opinion memoranda regarding {topic} including research analysis, statutory interpretation, and recommended courses of action.',
    complexity: 'medium',
    expectedRecordCount: 8,
    commonKeywords: ['legal opinion', 'statutory interpretation', 'legal analysis'],
    piiLikelihood: 0.3,
    redactionComplexity: 0.6,
  },
  
  // Parks and Recreation Templates
  {
    title: 'Facility Usage Reports - {facility}',
    agency: 'parks',
    department: 'facilities',
    description: 'Usage reports and booking records for {facility} including reservation schedules, maintenance logs, and incident reports for {timeRange}.',
    complexity: 'simple',
    expectedRecordCount: 12,
    commonKeywords: ['facility usage', 'reservation schedules', 'maintenance logs'],
    piiLikelihood: 0.3,
    redactionComplexity: 0.1,
  },
  {
    title: 'Recreation Program Participation Data',
    agency: 'parks',
    department: 'recreation_programs',
    description: 'Participation statistics and enrollment data for recreation programs including demographic breakdowns, program evaluations, and budget impact analysis.',
    complexity: 'medium',
    expectedRecordCount: 16,
    commonKeywords: ['program participation', 'enrollment data', 'demographic breakdowns'],
    piiLikelihood: 0.7,
    redactionComplexity: 0.4,
  },
];

// Synthetic document templates for the enhanced record corpus
export const DOCUMENT_TEMPLATES: SyntheticDocumentTemplate[] = [
  // Police Documents
  {
    id: 'doc-police-001',
    title: 'Incident Report #{reportNumber} - {incidentType}',
    agency: 'police',
    department: 'patrol',
    recordType: 'Incident Report',
    source: 'Police Records',
    description: 'Police incident report documenting {incidentType} at {location} on {date}. Includes officer observations, witness statements, evidence collection, and follow-up actions.',
    documentType: 'pdf',
    classification: 'restricted',
    keyPhrases: ['incident report', 'officer statement', 'witness statement', 'evidence collection'],
    piiTypes: ['PERSON_NAME', 'ADDRESS', 'PHONE', 'EMAIL'],
    pageRange: [3, 15],
    fileSizeRange: ['1.2 MB', '4.5 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'YYYY-MM-DD'],
    relatedDocuments: ['doc-police-002', 'doc-police-003'],
  },
  {
    id: 'doc-police-002',
    title: 'Body Camera Footage Log - Incident #{reportNumber}',
    agency: 'police',
    department: 'patrol',
    recordType: 'Media Log',
    source: 'Digital Evidence',
    description: 'Body camera footage inventory and metadata for incident #{reportNumber}. Includes timestamp logs, officer assignments, video quality notes, and evidentiary chain of custody.',
    documentType: 'pdf',
    classification: 'restricted',
    keyPhrases: ['body camera', 'footage log', 'chain of custody', 'digital evidence'],
    piiTypes: ['PERSON_NAME', 'BADGE_NUMBER'],
    pageRange: [2, 6],
    fileSizeRange: ['800 KB', '1.8 MB'],
    commonDatePatterns: ['MM/DD/YYYY HH:MM:SS', 'ISO 8601'],
  },
  {
    id: 'doc-police-003',
    title: 'Use of Force Report - Officer {officerName}',
    agency: 'police',
    department: 'internal_affairs',
    recordType: 'Use of Force Report',
    source: 'Internal Affairs',
    description: 'Comprehensive use of force incident documentation including officer justification, supervisor review, witness accounts, medical evaluation, and administrative determination.',
    documentType: 'pdf',
    classification: 'confidential',
    keyPhrases: ['use of force', 'supervisor review', 'administrative determination', 'medical evaluation'],
    piiTypes: ['PERSON_NAME', 'BADGE_NUMBER', 'MEDICAL_ID', 'SSN'],
    pageRange: [8, 25],
    fileSizeRange: ['2.5 MB', '8.2 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'MM-DD-YYYY'],
  },

  // Fire Department Documents
  {
    id: 'doc-fire-001',
    title: 'Emergency Response Report - Call #{callNumber}',
    agency: 'fire',
    department: 'emergency_response',
    recordType: 'Emergency Response Report',
    source: 'Fire Department Records',
    description: 'Emergency response documentation for call #{callNumber} including dispatch information, response times, personnel assignments, actions taken, and outcome summary.',
    documentType: 'pdf',
    classification: 'standard',
    keyPhrases: ['emergency response', 'dispatch information', 'response times', 'personnel assignments'],
    piiTypes: ['PERSON_NAME', 'ADDRESS', 'PHONE'],
    pageRange: [4, 12],
    fileSizeRange: ['1.5 MB', '3.8 MB'],
    commonDatePatterns: ['MM/DD/YYYY HH:MM', 'YYYY-MM-DD HH:MM:SS'],
  },
  {
    id: 'doc-fire-002',
    title: 'Fire Inspection Report - {businessName}',
    agency: 'fire',
    department: 'fire_prevention',
    recordType: 'Fire Inspection Report',
    source: 'Fire Prevention Division',
    description: 'Fire safety inspection report for {businessName} including code compliance assessment, violation notices, recommended corrective actions, and re-inspection scheduling.',
    documentType: 'pdf',
    classification: 'standard',
    keyPhrases: ['fire inspection', 'code compliance', 'violation notices', 'corrective actions'],
    piiTypes: ['BUSINESS_NAME', 'ADDRESS', 'CONTACT_PERSON', 'PHONE'],
    pageRange: [6, 18],
    fileSizeRange: ['2.1 MB', '5.4 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'DD-MM-YYYY'],
  },

  // Finance Department Documents
  {
    id: 'doc-finance-001',
    title: 'Expenditure Report - {department} - FY{year}',
    agency: 'finance',
    department: 'budget',
    recordType: 'Financial Report',
    source: 'Finance Department',
    description: 'Comprehensive expenditure analysis for {department} fiscal year {year} including line-item breakdowns, budget variances, contractor payments, and year-over-year comparisons.',
    documentType: 'spreadsheet',
    classification: 'standard',
    keyPhrases: ['expenditure report', 'budget variance', 'contractor payments', 'fiscal year'],
    piiTypes: ['SSN', 'ACCOUNT_NUMBER', 'VENDOR_ID'],
    pageRange: [25, 85],
    fileSizeRange: ['4.2 MB', '15.7 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'FY YYYY'],
  },
  {
    id: 'doc-finance-002',
    title: 'Contract Agreement - {vendorName} - {contractType}',
    agency: 'finance',
    department: 'procurement',
    recordType: 'Contract Document',
    source: 'Procurement Division',
    description: 'Contract agreement with {vendorName} for {contractType} services including terms and conditions, payment schedules, performance metrics, and compliance requirements.',
    documentType: 'pdf',
    classification: 'standard',
    keyPhrases: ['contract agreement', 'terms and conditions', 'payment schedules', 'performance metrics'],
    piiTypes: ['BUSINESS_NAME', 'ADDRESS', 'PHONE', 'EMAIL', 'TAX_ID'],
    pageRange: [15, 45],
    fileSizeRange: ['3.8 MB', '12.3 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'Month DD, YYYY'],
  },

  // Public Works Documents
  {
    id: 'doc-publicworks-001',
    title: 'Infrastructure Assessment - {roadName}',
    agency: 'public_works',
    department: 'streets',
    recordType: 'Infrastructure Report',
    source: 'Public Works Department',
    description: 'Infrastructure condition assessment for {roadName} including pavement analysis, drainage evaluation, traffic impact study, and maintenance recommendations.',
    documentType: 'pdf',
    classification: 'public',
    keyPhrases: ['infrastructure assessment', 'pavement analysis', 'drainage evaluation', 'maintenance recommendations'],
    piiTypes: [],
    pageRange: [12, 35],
    fileSizeRange: ['5.2 MB', '18.6 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'Quarter Q YYYY'],
  },
  {
    id: 'doc-publicworks-002',
    title: 'Environmental Impact Study - {projectName}',
    agency: 'public_works',
    department: 'engineering',
    recordType: 'Environmental Study',
    source: 'Engineering Division',
    description: 'Environmental impact assessment for {projectName} including ecological surveys, water quality analysis, air quality monitoring, and mitigation measures.',
    documentType: 'pdf',
    classification: 'standard',
    keyPhrases: ['environmental impact', 'ecological surveys', 'water quality', 'mitigation measures'],
    piiTypes: ['CONSULTANT_NAME', 'BUSINESS_ADDRESS'],
    pageRange: [28, 120],
    fileSizeRange: ['12.5 MB', '45.8 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'YYYY-MM-DD', 'Month YYYY'],
  },

  // Legal Department Documents
  {
    id: 'doc-legal-001',
    title: 'Legal Opinion - {topicArea}',
    agency: 'legal',
    department: 'advisory',
    recordType: 'Legal Opinion',
    source: 'Legal Department',
    description: 'Legal opinion memorandum regarding {topicArea} including statutory analysis, case law research, regulatory compliance assessment, and recommended actions.',
    documentType: 'pdf',
    classification: 'restricted',
    keyPhrases: ['legal opinion', 'statutory analysis', 'case law research', 'regulatory compliance'],
    piiTypes: ['ATTORNEY_NAME', 'BAR_NUMBER'],
    pageRange: [8, 25],
    fileSizeRange: ['2.4 MB', '7.8 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'Month DD, YYYY'],
  },
  {
    id: 'doc-legal-002',
    title: 'Litigation File - {caseName} v. City',
    agency: 'legal',
    department: 'litigation',
    recordType: 'Litigation File',
    source: 'Legal Department',
    description: 'Complete litigation file for {caseName} v. City including pleadings, discovery responses, expert witness reports, settlement negotiations, and court orders.',
    documentType: 'pdf',
    classification: 'confidential',
    keyPhrases: ['litigation file', 'pleadings', 'discovery responses', 'settlement negotiations'],
    piiTypes: ['PERSON_NAME', 'SSN', 'ADDRESS', 'PHONE', 'EMAIL', 'ATTORNEY_NAME'],
    pageRange: [45, 200],
    fileSizeRange: ['18.5 MB', '85.3 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'Month DD, YYYY', 'YYYY-MM-DD'],
  },

  // Parks and Recreation Documents
  {
    id: 'doc-parks-001',
    title: 'Facility Usage Report - {facilityName} - {month}',
    agency: 'parks',
    department: 'facilities',
    recordType: 'Usage Report',
    source: 'Parks and Recreation',
    description: 'Monthly usage report for {facilityName} including reservation statistics, maintenance activities, incident reports, and revenue analysis.',
    documentType: 'spreadsheet',
    classification: 'standard',
    keyPhrases: ['facility usage', 'reservation statistics', 'maintenance activities', 'revenue analysis'],
    piiTypes: ['PERSON_NAME', 'PHONE', 'EMAIL'],
    pageRange: [6, 20],
    fileSizeRange: ['1.8 MB', '5.2 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'MM/YYYY'],
  },
  {
    id: 'doc-parks-002',
    title: 'Recreation Program Enrollment - {programName}',
    agency: 'parks',
    department: 'recreation_programs',
    recordType: 'Program Record',
    source: 'Recreation Division',
    description: 'Program enrollment and participation data for {programName} including participant demographics, attendance records, feedback evaluations, and budget impact.',
    documentType: 'pdf',
    classification: 'restricted',
    keyPhrases: ['program enrollment', 'participant demographics', 'attendance records', 'feedback evaluations'],
    piiTypes: ['PERSON_NAME', 'ADDRESS', 'PHONE', 'EMAIL', 'DOB', 'EMERGENCY_CONTACT'],
    pageRange: [15, 40],
    fileSizeRange: ['4.5 MB', '12.8 MB'],
    commonDatePatterns: ['MM/DD/YYYY', 'Season YYYY'],
  },
];

// Synthetic personas for realistic request patterns
export const SYNTHETIC_PERSONAS: SyntheticPersona[] = [
  {
    name: 'Sarah Martinez',
    email: 'sarah.martinez@email.com',
    type: 'journalist',
    requestPatterns: {
      preferredAgencies: ['police', 'finance', 'legal'],
      typicalComplexity: 'complex',
      requestFrequency: 8,
      followUpLikelihood: 0.9,
    },
  },
  {
    name: 'David Chen',
    email: 'd.chen@lawfirm.com',
    type: 'lawyer',
    requestPatterns: {
      preferredAgencies: ['legal', 'police', 'finance'],
      typicalComplexity: 'complex',
      requestFrequency: 12,
      followUpLikelihood: 0.8,
    },
  },
  {
    name: 'Maria Rodriguez',
    email: 'maria.r.researcher@university.edu',
    type: 'researcher',
    requestPatterns: {
      preferredAgencies: ['fire', 'public_works', 'parks'],
      typicalComplexity: 'medium',
      requestFrequency: 4,
      followUpLikelihood: 0.6,
    },
  },
  {
    name: 'John Thompson',
    email: 'jthompson.citizen@gmail.com',
    type: 'citizen',
    requestPatterns: {
      preferredAgencies: ['public_works', 'parks', 'fire'],
      typicalComplexity: 'simple',
      requestFrequency: 2,
      followUpLikelihood: 0.3,
    },
  },
  {
    name: 'Patricia Williams',
    email: 'p.williams@transparency.org',
    type: 'activist',
    requestPatterns: {
      preferredAgencies: ['police', 'finance', 'legal'],
      typicalComplexity: 'complex',
      requestFrequency: 15,
      followUpLikelihood: 0.95,
    },
  },
];

// Template variable substitution patterns
export const TEMPLATE_VARIABLES = {
  timeRange: [
    'January 2025 - March 2025',
    'April 2025 - June 2025',
    'July 2025 - September 2025',
    'October 2024 - December 2024',
    '2024',
    '2025',
    'Q1 2025',
    'Q2 2025',
    'fiscal year 2024-2025',
  ],
  location: [
    'Highway 99 between Main Street and Oak Avenue',
    'Downtown Commercial District',
    'Riverside Park area',
    'Industrial Zone East',
    'Residential Zone 5',
    'School District boundaries',
    'City Center Plaza',
  ],
  trainingType: [
    'De-escalation Techniques',
    'Mental Health Crisis Intervention',
    'Use of Force Protocols',
    'Community Policing Methods',
    'Emergency Response Procedures',
  ],
  district: [
    'North District',
    'South District',
    'East District',
    'West District',
    'Central District',
  ],
  businessType: [
    'restaurant and bar',
    'retail shopping center',
    'manufacturing facility',
    'healthcare facility',
    'educational institution',
  ],
  department: [
    'Police Department',
    'Fire Department',
    'Public Works Department',
    'Parks and Recreation',
    'Legal Department',
  ],
  fiscalYear: [
    '2024-2025',
    '2023-2024',
    '2025-2026',
  ],
  contractType: [
    'IT services',
    'construction services',
    'professional consulting',
    'equipment maintenance',
    'security services',
  ],
  infrastructure: [
    'bridge infrastructure',
    'water distribution systems',
    'sewer treatment facilities',
    'road maintenance',
    'traffic control systems',
  ],
  project: [
    'Riverside Development Project',
    'Downtown Revitalization Initiative',
    'Industrial Zone Expansion',
    'Green Infrastructure Program',
    'Transit-Oriented Development',
  ],
  caseType: [
    'employment discrimination',
    'personal injury',
    'contract dispute',
    'civil rights',
    'environmental compliance',
  ],
  topic: [
    'public meeting compliance',
    'personnel policy interpretation',
    'procurement regulations',
    'environmental law compliance',
    'public records disclosure',
  ],
  facility: [
    'Community Center',
    'Sports Complex',
    'Senior Center',
    'Aquatic Facility',
    'Park Pavilion',
  ],
};

export default {
  SYNTHETIC_AGENCIES,
  REQUEST_TEMPLATES,
  DOCUMENT_TEMPLATES,
  SYNTHETIC_PERSONAS,
  TEMPLATE_VARIABLES,
};