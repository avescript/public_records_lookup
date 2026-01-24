/**
 * Enhanced Synthetic Data Generator Tests
 * Epic 8: Synthetic Data & Public Domain Corpus
 * Comprehensive test suite for synthetic data generation and validation
 */

import SyntheticDataGenerator, { GeneratedRequest, GeneratedDocument, SyntheticDataSet } from '../syntheticDataGenerator';
import { SYNTHETIC_AGENCIES, REQUEST_TEMPLATES, DOCUMENT_TEMPLATES, SYNTHETIC_PERSONAS } from '../../data/syntheticDataTemplates';

describe('SyntheticDataGenerator', () => {
  let generator: SyntheticDataGenerator;

  beforeEach(() => {
    generator = new SyntheticDataGenerator();
  });

  describe('Dataset Generation', () => {
    it('should generate a complete dataset with correct structure', async () => {
      const options = {
        requestCount: 20,
        documentsPerAgency: 10,
        includeEdgeCases: true,
        includePerformanceData: false,
      };

      const dataset = generator.generateDataset(options);

      expect(dataset).toHaveProperty('metadata');
      expect(dataset).toHaveProperty('requests');
      expect(dataset).toHaveProperty('documents');
      expect(dataset).toHaveProperty('analytics');

      expect(Array.isArray(dataset.requests)).toBe(true);
      expect(Array.isArray(dataset.documents)).toBe(true);

      // Check metadata
      expect(dataset.metadata.totalRequests).toBe(dataset.requests.length);
      expect(dataset.metadata.totalDocuments).toBe(dataset.documents.length);
      expect(dataset.metadata.version).toBe('2.0');
      expect(dataset.metadata.agencies).toHaveLength(SYNTHETIC_AGENCIES.length);
    });

    it('should generate the requested number of requests', () => {
      const options = {
        requestCount: 50,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      };

      const dataset = generator.generateDataset(options);
      
      expect(dataset.requests).toHaveLength(50);
    });

    it('should generate appropriate number of documents per agency', () => {
      const options = {
        requestCount: 10,
        documentsPerAgency: 8,
        includeEdgeCases: false,
        includePerformanceData: false,
      };

      const dataset = generator.generateDataset(options);
      
      // Should have approximately documentsPerAgency * number of agencies
      const expectedDocuments = 8 * SYNTHETIC_AGENCIES.length;
      expect(dataset.documents).toHaveLength(expectedDocuments);
    });

    it('should include edge cases when requested', () => {
      const options = {
        requestCount: 10,
        documentsPerAgency: 5,
        includeEdgeCases: true,
        includePerformanceData: false,
      };

      const dataset = generator.generateDataset(options);
      
      // Should have more than the base number of requests due to edge cases
      expect(dataset.requests.length).toBeGreaterThan(10);
      
      // Check for edge case test scenarios
      const edgeCaseRequests = dataset.requests.filter(r => 
        r.testScenario?.includes('test') || 
        r.testScenario?.includes('edge') ||
        r.testScenario?.includes('broad') ||
        r.testScenario?.includes('no_matches') ||
        r.testScenario?.includes('high_sensitivity')
      );
      
      expect(edgeCaseRequests.length).toBeGreaterThan(0);
    });

    it('should include performance test data when requested', () => {
      const options = {
        requestCount: 5,
        documentsPerAgency: 3,
        includeEdgeCases: false,
        includePerformanceData: true,
      };

      const dataset = generator.generateDataset(options);
      
      // Should have more requests due to performance test data
      expect(dataset.requests.length).toBeGreaterThan(5);
      
      // Check for performance test scenarios
      const perfTestRequests = dataset.requests.filter(r => 
        r.testScenario?.includes('performance')
      );
      
      expect(perfTestRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Request Generation', () => {
    it('should generate requests with proper structure', () => {
      const dataset = generator.generateDataset({
        requestCount: 10,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      dataset.requests.forEach((request: GeneratedRequest) => {
        // Required fields
        expect(request.title).toBeDefined();
        expect(typeof request.title).toBe('string');
        expect(request.title.length).toBeGreaterThan(0);
        
        expect(request.department).toBeDefined();
        expect(typeof request.department).toBe('string');
        
        expect(request.description).toBeDefined();
        expect(typeof request.description).toBe('string');
        expect(request.description.length).toBeGreaterThan(10);
        
        expect(request.contactEmail).toBeDefined();
        expect(request.contactEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        
        expect(request.dateRange).toBeDefined();
        expect(request.dateRange.startDate).toBeDefined();
        expect(request.dateRange.endDate).toBeDefined();
        
        // Synthetic data specific fields
        expect(['simple', 'medium', 'complex']).toContain(request.complexity);
        expect(request.persona).toBeDefined();
        expect(request.agency).toBeDefined();
        expect(request.generatedAt).toBeDefined();
        expect(Array.isArray(request.expectedMatches)).toBe(true);
      });
    });

    it('should distribute requests across all agencies', () => {
      const dataset = generator.generateDataset({
        requestCount: 30,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      const agencyIds = SYNTHETIC_AGENCIES.map(a => a.id);
      const requestAgencies = dataset.requests.map(r => r.agency.id);
      
      // Each agency should have at least one request
      agencyIds.forEach(agencyId => {
        expect(requestAgencies).toContain(agencyId);
      });
      
      // Check analytics
      agencyIds.forEach(agencyId => {
        expect(dataset.analytics.requestsByAgency[agencyId]).toBeGreaterThan(0);
      });
    });

    it('should assign realistic personas to requests', () => {
      const dataset = generator.generateDataset({
        requestCount: 15,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      const personaTypes = SYNTHETIC_PERSONAS.map(p => p.type);
      
      dataset.requests.forEach(request => {
        expect(personaTypes).toContain(request.persona.type);
        expect(request.contactEmail).toBe(request.persona.email);
      });
    });
  });

  describe('Document Generation', () => {
    it('should generate documents with proper structure', () => {
      const dataset = generator.generateDataset({
        requestCount: 5,
        documentsPerAgency: 10,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      dataset.documents.forEach((document: GeneratedDocument) => {
        // Required MatchCandidate fields
        expect(document.id).toBeDefined();
        expect(typeof document.id).toBe('string');
        expect(document.id.startsWith('doc-synth-')).toBe(true);
        
        expect(document.title).toBeDefined();
        expect(typeof document.title).toBe('string');
        expect(document.title.length).toBeGreaterThan(0);
        
        expect(document.description).toBeDefined();
        expect(typeof document.description).toBe('string');
        expect(document.description.length).toBeGreaterThan(10);
        
        expect(document.source).toBeDefined();
        expect(document.recordType).toBeDefined();
        expect(document.agency).toBeDefined();
        expect(document.dateCreated).toBeDefined();
        
        expect(typeof document.relevanceScore).toBe('number');
        expect(document.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(document.relevanceScore).toBeLessThanOrEqual(1);
        
        expect(['high', 'medium', 'low']).toContain(document.confidence);
        expect(Array.isArray(document.keyPhrases)).toBe(true);
        
        // Synthetic metadata
        expect(document.syntheticMetadata).toBeDefined();
        expect(['pdf', 'email', 'spreadsheet', 'image', 'form']).toContain(document.syntheticMetadata.documentType);
        expect(['public', 'standard', 'restricted', 'confidential']).toContain(document.syntheticMetadata.classification);
        expect(Array.isArray(document.syntheticMetadata.piiTypes)).toBe(true);
        expect(typeof document.syntheticMetadata.realismScore).toBe('number');
      });
    });

    it('should generate diverse document types', () => {
      const dataset = generator.generateDataset({
        requestCount: 5,
        documentsPerAgency: 15,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      const documentTypes = new Set(dataset.documents.map(d => d.syntheticMetadata.documentType));
      const classifications = new Set(dataset.documents.map(d => d.syntheticMetadata.classification));
      
      // Should have multiple document types and classifications
      expect(documentTypes.size).toBeGreaterThan(1);
      expect(classifications.size).toBeGreaterThan(1);
    });

    it('should assign realistic metadata to documents', () => {
      const dataset = generator.generateDataset({
        requestCount: 5,
        documentsPerAgency: 10,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      dataset.documents.forEach(document => {
        expect(document.metadata.fileSize).toBeDefined();
        expect(document.metadata.fileSize).toMatch(/^\d+(\.\d+)?\s*(KB|MB|GB)$/);
        
        expect(typeof document.metadata.pageCount).toBe('number');
        expect(document.metadata.pageCount).toBeGreaterThan(0);
        
        expect(document.metadata.lastModified).toBeDefined();
        expect(document.metadata.classification).toBeDefined();
      });
    });
  });

  describe('Data Quality and Relationships', () => {
    it('should create realistic request-document matches', () => {
      const dataset = generator.generateDataset({
        requestCount: 10,
        documentsPerAgency: 20,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      dataset.requests.forEach(request => {
        if (request.expectedMatches && request.expectedMatches.length > 0) {
          request.expectedMatches.forEach(docId => {
            const document = dataset.documents.find(d => d.id === docId);
            expect(document).toBeDefined();
            
            if (document) {
              // Documents should be from the same or related agency
              const requestAgency = request.agency.id;
              const documentAgency = document.template.agency;
              
              // Allow some cross-agency matches for realistic scenarios
              const isRealistic = documentAgency === requestAgency || 
                                Math.random() > 0.8; // Allow some cross-agency matches
              expect(isRealistic).toBe(true);
            }
          });
        }
      });
    });

    it('should generate unique IDs for all documents', () => {
      const dataset = generator.generateDataset({
        requestCount: 5,
        documentsPerAgency: 20,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      const documentIds = dataset.documents.map(d => d.id);
      const uniqueIds = new Set(documentIds);
      
      expect(uniqueIds.size).toBe(documentIds.length);
    });

    it('should assign appropriate complexity levels', () => {
      const dataset = generator.generateDataset({
        requestCount: 30,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      const complexityCounts = dataset.requests.reduce((acc, req) => {
        acc[req.complexity] = (acc[req.complexity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Should have a mix of complexity levels
      expect(Object.keys(complexityCounts).length).toBeGreaterThan(1);
      
      // Analytics should match actual counts
      expect(dataset.analytics.complexityDistribution).toEqual(complexityCounts);
      expect(dataset.metadata.complexity).toEqual(complexityCounts);
    });

    it('should calculate analytics correctly', () => {
      const dataset = generator.generateDataset({
        requestCount: 20,
        documentsPerAgency: 8,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      // Verify analytics match actual data
      const actualRequestsByAgency = dataset.requests.reduce((acc, req) => {
        acc[req.agency.id] = (acc[req.agency.id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(dataset.analytics.requestsByAgency).toEqual(actualRequestsByAgency);

      const actualDocumentsByAgency = dataset.documents.reduce((acc, doc) => {
        acc[doc.template.agency] = (acc[doc.template.agency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(dataset.analytics.documentsByAgency).toEqual(actualDocumentsByAgency);

      // Average expected matches should be calculated correctly
      const totalMatches = dataset.requests.reduce((sum, req) => 
        sum + (req.expectedMatches?.length || 0), 0
      );
      const expectedAvg = totalMatches / dataset.requests.length;
      
      expect(dataset.analytics.averageExpectedMatches).toBeCloseTo(expectedAvg, 2);
    });
  });

  describe('Template Variable Substitution', () => {
    it('should substitute variables in request titles and descriptions', () => {
      const dataset = generator.generateDataset({
        requestCount: 10,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      dataset.requests.forEach(request => {
        // Should not contain unsubstituted template variables
        expect(request.title).not.toMatch(/\\{\\w+\\}/);
        expect(request.description).not.toMatch(/\\{\\w+\\}/);
      });
    });

    it('should substitute variables in document titles and descriptions', () => {
      const dataset = generator.generateDataset({
        requestCount: 5,
        documentsPerAgency: 10,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      dataset.documents.forEach(document => {
        // Should not contain unsubstituted template variables
        expect(document.title).not.toMatch(/\\{\\w+\\}/);
        expect(document.description).not.toMatch(/\\{\\w+\\}/);
      });
    });
  });

  describe('Performance and Scale', () => {
    it('should generate large datasets efficiently', () => {
      const startTime = Date.now();
      
      const dataset = generator.generateDataset({
        requestCount: 100,
        documentsPerAgency: 50,
        includeEdgeCases: true,
        includePerformanceData: true,
      });
      
      const endTime = Date.now();
      const generationTime = endTime - startTime;
      
      // Should generate within reasonable time (less than 5 seconds)
      expect(generationTime).toBeLessThan(5000);
      
      // Should have generated the expected volume
      expect(dataset.requests.length).toBeGreaterThan(100);
      expect(dataset.documents.length).toBe(50 * SYNTHETIC_AGENCIES.length);
      
      console.log(`Generated ${dataset.requests.length} requests and ${dataset.documents.length} documents in ${generationTime}ms`);
    });

    it('should handle edge cases gracefully', () => {
      // Test with minimal data
      const minimalDataset = generator.generateDataset({
        requestCount: 1,
        documentsPerAgency: 1,
        includeEdgeCases: false,
        includePerformanceData: false,
      });
      
      expect(minimalDataset.requests.length).toBeGreaterThanOrEqual(1);
      expect(minimalDataset.documents.length).toBe(SYNTHETIC_AGENCIES.length);
      
      // Test with zero requests (should still generate documents)
      const docsOnlyDataset = generator.generateDataset({
        requestCount: 0,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      });
      
      expect(docsOnlyDataset.documents.length).toBe(5 * SYNTHETIC_AGENCIES.length);
    });
  });

  describe('Data Validation', () => {
    it('should generate valid date ranges', () => {
      const dataset = generator.generateDataset({
        requestCount: 20,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      dataset.requests.forEach(request => {
        const startDate = new Date(request.dateRange.startDate);
        const endDate = new Date(request.dateRange.endDate);
        
        expect(startDate).toBeInstanceOf(Date);
        expect(endDate).toBeInstanceOf(Date);
        expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
        
        // Dates should be within reasonable range (not too far in past/future)
        const now = new Date();
        const twoYearsAgo = new Date(now.getFullYear() - 2, 0, 1);
        const oneYearFromNow = new Date(now.getFullYear() + 1, 11, 31);
        
        expect(startDate.getTime()).toBeGreaterThanOrEqual(twoYearsAgo.getTime());
        expect(endDate.getTime()).toBeLessThanOrEqual(oneYearFromNow.getTime());
      });
    });

    it('should generate valid email addresses', () => {
      const dataset = generator.generateDataset({
        requestCount: 15,
        documentsPerAgency: 5,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      dataset.requests.forEach(request => {
        expect(request.contactEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('should generate realistic file sizes and page counts', () => {
      const dataset = generator.generateDataset({
        requestCount: 5,
        documentsPerAgency: 15,
        includeEdgeCases: false,
        includePerformanceData: false,
      });

      dataset.documents.forEach(document => {
        // Page count should be reasonable
        expect(document.metadata.pageCount).toBeGreaterThan(0);
        expect(document.metadata.pageCount).toBeLessThan(500);
        
        // File size should match expected format
        expect(document.metadata.fileSize).toMatch(/^\d+(\.\d+)?\s*(KB|MB|GB)$/);
        
        // Parse file size and ensure it's reasonable
        const match = document.metadata.fileSize.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/);
        expect(match).not.toBeNull();
        
        if (match) {
          const value = parseFloat(match[1]);
          const unit = match[2];
          
          expect(value).toBeGreaterThan(0);
          
          if (unit === 'KB') {
            expect(value).toBeLessThan(10000); // Less than 10MB
          } else if (unit === 'MB') {
            expect(value).toBeLessThan(100); // Less than 100MB
          } else if (unit === 'GB') {
            expect(value).toBeLessThan(5); // Less than 5GB
          }
        }
      });
    });
  });
});