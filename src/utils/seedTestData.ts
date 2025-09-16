/**
 * Test Data Seeder for Staff Dashboard
 * Creates sample requests to test the staff console functionality
 */

import { saveRequest } from '../services/requestService';
import { RequestFormDataWithFiles } from '../components/request/RequestForm/types';

const sampleRequests: Omit<RequestFormDataWithFiles, 'files'>[] = [
  {
    title: 'Police Incident Report - Traffic Accident',
    department: 'police',
    description: 'Requesting police incident report for traffic accident on Main Street on September 10, 2025. Need details for insurance claim.',
    dateRange: {
      startDate: '2025-09-10',
      endDate: '2025-09-10',
      preset: 'Custom'
    },
    contactEmail: 'john.smith@email.com'
  },
  {
    title: 'Fire Department Inspection Records',
    department: 'fire',
    description: 'Requesting fire safety inspection records for commercial building at 123 Business Ave for the past year.',
    dateRange: {
      startDate: '2024-09-01',
      endDate: '2025-09-01',
      preset: 'Last 12 months'
    },
    contactEmail: 'sarah.johnson@company.com'
  },
  {
    title: 'City Council Meeting Minutes',
    department: 'clerk',
    description: 'Requesting meeting minutes and audio recordings from city council meetings in August 2025.',
    dateRange: {
      startDate: '2025-08-01',
      endDate: '2025-08-31',
      preset: 'Custom'
    },
    contactEmail: 'resident@community.org'
  },
  {
    title: 'Department Budget Information',
    department: 'finance',
    description: 'Requesting detailed budget allocations and expenditures for Parks and Recreation department for fiscal year 2025.',
    dateRange: {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      preset: 'Current year'
    },
    contactEmail: 'transparency.advocate@watchdog.org'
  },
  {
    title: 'Building Permit Applications',
    department: 'other',
    description: 'Requesting copies of building permit applications for residential properties on Oak Street submitted in the last 6 months.',
    dateRange: {
      startDate: '2025-03-16',
      endDate: '2025-09-16',
      preset: 'Last 6 months'
    },
    contactEmail: 'property.research@realty.com'
  },
  {
    title: 'Police Body Camera Footage',
    department: 'police',
    description: 'Requesting body camera footage from incident #12345 that occurred on September 5, 2025, involving officer badge #789.',
    dateRange: {
      startDate: '2025-09-05',
      endDate: '2025-09-05',
      preset: 'Custom'
    },
    contactEmail: 'legal.inquiry@lawfirm.com'
  },
  {
    title: 'Environmental Compliance Reports',
    department: 'other',
    description: 'Requesting environmental compliance reports and inspection records for waste management facilities in the city limits.',
    dateRange: {
      startDate: '2025-01-01',
      endDate: '2025-09-16',
      preset: 'Year to date'
    },
    contactEmail: 'environmental.group@greenwatch.org'
  }
];

export const seedTestData = async () => {
  console.log('🌱 Seeding test data...');
  
  try {
    for (let i = 0; i < sampleRequests.length; i++) {
      const request = sampleRequests[i];
      const requestWithFiles: RequestFormDataWithFiles = {
        ...request,
        files: [] // No files for test data
      };
      
      const result = await saveRequest(requestWithFiles);
      console.log(`✅ Created request ${i + 1}/${sampleRequests.length}: ${result.trackingId}`);
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Test data seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  }
};

// Utility to clear all test data (use with caution)
export const clearTestData = async () => {
  console.log('🧹 This would clear test data - implement if needed for development');
  // TODO: Implement if needed for development cleanup
};