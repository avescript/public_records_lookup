/**
 * Comprehensive Test Scenarios for Public Records Application
 * Provides realistic test data and workflows for demo and development
 */

import { RequestFormDataWithFiles } from '../components/request/RequestForm/types';
import { saveRequest, StoredRequest } from '../services/requestService';

// Sample requester personas with realistic profiles
export const REQUESTER_PERSONAS = {
  journalist: {
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@localnews.com',
    organization: 'Central Valley Tribune',
    background: 'Investigative journalist covering municipal government',
  },
  attorney: {
    name: 'Marcus Rodriguez',
    email: 'mrodriguez@defenderslaw.com', 
    organization: 'Public Defenders Office',
    background: 'Defense attorney representing clients in criminal cases',
  },
  citizen: {
    name: 'Jennifer Chen',
    email: 'jennifer.chen.inquirer@gmail.com',
    organization: 'Private Citizen',
    background: 'Community advocate interested in city transparency',
  },
  business: {
    name: 'David Thompson',
    email: 'dthompson@constructionplus.com',
    organization: 'Thompson Construction LLC',
    background: 'Contractor needing permits and inspection records',
  },
  researcher: {
    name: 'Dr. Angela Foster',
    email: 'afoster@university.edu',
    organization: 'State University Research Institute',
    background: 'Academic researcher studying urban policy',
  },
};

// Pre-existing unfulfilled requests that admins need to process
export const EXISTING_REQUESTS: Omit<RequestFormDataWithFiles, 'files'>[] = [
  {
    title: 'Police Use of Force Incidents - Q3 2025',
    department: 'police',
    description: 'Requesting all use of force reports, body camera footage logs, and incident summaries for July, August, and September 2025. This is for a investigative series on police accountability in our community.',
    dateRange: {
      startDate: '2025-07-01',
      endDate: '2025-09-30',
      preset: 'Custom range',
    },
    contactEmail: REQUESTER_PERSONAS.journalist.email,
  },
  {
    title: 'Criminal Case File #2025-4387 - Discovery Request',
    department: 'police',
    description: 'Defense attorney requesting all documentation related to criminal case #2025-4387, including: police reports, witness statements, evidence logs, and officer notes. Client: Marcus Johnson, charged with burglary.',
    dateRange: {
      startDate: '2025-08-15',
      endDate: '2025-09-20',
      preset: 'Custom',
    },
    contactEmail: REQUESTER_PERSONAS.attorney.email,
  },
  {
    title: 'City Budget - Department of Public Works Expenditures',
    department: 'finance',
    description: 'Requesting detailed expenditure reports for the Department of Public Works, including contractor payments, equipment purchases, and overtime records for fiscal year 2025. Specifically interested in road maintenance and infrastructure spending.',
    dateRange: {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      preset: 'Current fiscal year',
    },
    contactEmail: REQUESTER_PERSONAS.citizen.email,
  },
  {
    title: 'Building Code Violations - Downtown District',
    department: 'other',
    description: 'Requesting all building code violation notices, citations, and inspection reports for properties in the downtown district (zip code 12345) for the past 18 months. Need for compliance research on potential property acquisition.',
    dateRange: {
      startDate: '2024-03-01',
      endDate: '2025-09-24',
      preset: 'Custom range',
    },
    contactEmail: REQUESTER_PERSONAS.business.email,
  },
  {
    title: 'Fire Department Emergency Response Times',
    department: 'fire',
    description: 'Academic research request for anonymized emergency response data including: call volumes, response times, incident types, and resource allocation patterns. This data will be used for a study on urban emergency services efficiency.',
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2025-08-31',
      preset: 'Custom range',
    },
    contactEmail: REQUESTER_PERSONAS.researcher.email,
  },
  {
    title: 'City Council Executive Session Minutes',
    department: 'clerk',
    description: 'Requesting all city council executive session minutes that are now public record, along with any related correspondence and legal opinions. Particularly interested in discussions about development projects and personnel matters.',
    dateRange: {
      startDate: '2024-06-01',
      endDate: '2025-06-01',
      preset: 'Past 12 months',
    },
    contactEmail: REQUESTER_PERSONAS.journalist.email,
  },
  {
    title: 'Environmental Impact Assessments',
    department: 'other',
    description: 'Requesting all environmental impact assessments, permits, and compliance reports for the proposed Riverside Development Project. Include all consultant reports, public comments, and agency correspondence.',
    dateRange: {
      startDate: '2023-01-01',
      endDate: '2025-09-24',
      preset: 'Custom range',
    },
    contactEmail: REQUESTER_PERSONAS.citizen.email,
  },
  {
    title: 'Personnel Records - Officer Training Completions',
    department: 'police',
    description: 'Requesting anonymized records of police officer training completions including: de-escalation training, firearms qualifications, mental health crisis training, and continuing education hours for 2024-2025.',
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2025-09-01',
      preset: 'Custom range',
    },
    contactEmail: REQUESTER_PERSONAS.attorney.email,
  },
  {
    title: 'Water Quality Test Results',
    department: 'other',
    description: 'Requesting all water quality test results, lab reports, and compliance documentation for the municipal water supply system. Include any violation notices, corrective actions, and EPA correspondence.',
    dateRange: {
      startDate: '2024-07-01',
      endDate: '2025-09-24',
      preset: 'Past 15 months',
    },
    contactEmail: REQUESTER_PERSONAS.researcher.email,
  },
  {
    title: 'Building Permit Fees and Processing Times',
    department: 'other',
    description: 'Requesting data on building permit fees collected, processing times, and approval rates for residential construction permits. Need breakdown by permit type and construction value for business planning purposes.',
    dateRange: {
      startDate: '2023-09-01',
      endDate: '2025-09-24',
      preset: 'Past 24 months',
    },
    contactEmail: REQUESTER_PERSONAS.business.email,
  },
];

// Sample request for testing requester experience
export const SAMPLE_REQUEST: Omit<RequestFormDataWithFiles, 'files'> = {
  title: 'Traffic Citation Data - Speed Enforcement',
  department: 'police',
  description: 'I am requesting records of traffic citations issued for speeding violations on Highway 99 between Main Street and Oak Avenue for the month of August 2025. Please include: citation numbers, dates/times, violation codes, and fine amounts (personal information can be redacted). This request is for a community safety analysis.',
  dateRange: {
    startDate: '2025-08-01',
    endDate: '2025-08-31',
    preset: 'Custom',
  },
  contactEmail: 'community.watch@residents.org',
};

// Quick tracking IDs for easy testing
export interface TestTrackingIds {
  [key: string]: string;
}

// Status update scenarios for admin workflow testing
export const STATUS_SCENARIOS = {
  submitted: 'Request received and queued for processing',
  processing: 'Staff assigned and beginning record search',
  under_review: 'Records found, conducting legal review for PII and exemptions',
  completed: 'Records prepared and ready for release',
  rejected: 'Request cannot be fulfilled due to exemption or other legal restriction',
};

/**
 * Seeds the database with existing unfulfilled requests
 */
export const seedExistingRequests = async (): Promise<TestTrackingIds> => {
  console.log('🏢 Creating existing unfulfilled requests...');
  const trackingIds: TestTrackingIds = {};

  try {
    for (let i = 0; i < EXISTING_REQUESTS.length; i++) {
      const request = EXISTING_REQUESTS[i];
      const requestWithFiles: RequestFormDataWithFiles = {
        ...request,
        files: [],
      };

      const result = await saveRequest(requestWithFiles);
      trackingIds[`existing_${i + 1}`] = result.trackingId;
      
      console.log(`✅ Created existing request ${i + 1}/${EXISTING_REQUESTS.length}: ${result.trackingId}`);
      
      // Add small delay for different timestamps
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('🎉 Existing requests seeded successfully!');
    console.log('📋 Tracking IDs:', trackingIds);
    
    return trackingIds;
  } catch (error) {
    console.error('❌ Error seeding existing requests:', error);
    throw error;
  }
};

/**
 * Creates a sample request for testing requester experience
 */
export const createSampleRequest = async (): Promise<string> => {
  console.log('📝 Creating sample request for requester testing...');
  
  try {
    const requestWithFiles: RequestFormDataWithFiles = {
      ...SAMPLE_REQUEST,
      files: [],
    };

    const result = await saveRequest(requestWithFiles);
    console.log(`✅ Sample request created: ${result.trackingId}`);
    
    return result.trackingId;
  } catch (error) {
    console.error('❌ Error creating sample request:', error);
    throw error;
  }
};

/**
 * Complete test scenario setup - creates all test data
 */
export const setupCompleteTestScenario = async () => {
  console.log('🎬 Setting up complete test scenario...');
  
  try {
    // 1. Create existing unfulfilled requests
    const existingTrackingIds = await seedExistingRequests();
    
    // 2. Create sample request for requester testing
    const sampleTrackingId = await createSampleRequest();
    
    const testData = {
      existingRequests: existingTrackingIds,
      sampleRequest: sampleTrackingId,
      personas: REQUESTER_PERSONAS,
      statusScenarios: STATUS_SCENARIOS,
    };
    
    console.log('🎉 Complete test scenario setup finished!');
    console.log('📊 Test Data Summary:', testData);
    
    return testData;
  } catch (error) {
    console.error('❌ Error setting up test scenario:', error);
    throw error;
  }
};

/**
 * Reset function to clear test data (implement carefully)
 */
export const resetTestScenario = async () => {
  console.log('🔄 This would reset all test data - implement with caution for production');
  // TODO: Implement if needed for complete reset capability
  // This should only be available in development/demo environments
};

/**
 * Quick demo script data
 */
export const DEMO_SCRIPT = {
  title: "Public Records System Demo",
  steps: [
    {
      step: 1,
      role: "Requester",
      action: "Submit new request",
      url: "localhost:3000",
      data: SAMPLE_REQUEST,
      expectedOutcome: "Get tracking ID and confirmation"
    },
    {
      step: 2,
      role: "Requester", 
      action: "Check request status",
      url: "localhost:3000/status",
      data: "Use tracking ID from step 1",
      expectedOutcome: "See current status and details"
    },
    {
      step: 3,
      role: "Admin/Staff",
      action: "Review staff dashboard",
      url: "localhost:3000/admin/staff",
      data: "View all pending requests",
      expectedOutcome: "See request queue with filters and details"
    },
    {
      step: 4,
      role: "Admin/Staff",
      action: "Process sample request",
      url: "localhost:3000/admin/staff",
      data: "Select sample request, update status, add notes",
      expectedOutcome: "Demonstrate Epic 4 features: PII detection, redaction, approval workflow"
    },
    {
      step: 5,
      role: "Admin/Staff",
      action: "Complete request workflow",
      url: "localhost:3000/admin/staff", 
      data: "Update status to completed",
      expectedOutcome: "Show complete audit trail and process"
    }
  ]
};

export default {
  REQUESTER_PERSONAS,
  EXISTING_REQUESTS,
  SAMPLE_REQUEST,
  STATUS_SCENARIOS,
  DEMO_SCRIPT,
  seedExistingRequests,
  createSampleRequest,
  setupCompleteTestScenario,
  resetTestScenario,
};