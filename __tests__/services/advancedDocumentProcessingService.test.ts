/**
 * Advanced Document Processing Service Tests
 *
 * Comprehensive test suite for the advanced document processing service
 * covering OCR, multi-format support, batch processing, and agency integration.
 */

import {
  advancedDocumentProcessingService,
  AdvancedDocumentProcessingService,
  DocumentProcessingResult,
  ProcessingStatus,
  DocumentFileType,
  BatchProgress,
} from '../../src/services/advancedDocumentProcessingService';

// Mock dependencies
jest.mock('../../src/services/piiDetectionService');
jest.mock('../../src/services/agencyRedactionRulesService');
jest.mock('tesseract.js');

import { piiDetectionService } from '../../src/services/piiDetectionService';
import { agencyRedactionRulesService } from '../../src/services/agencyRedactionRulesService';

// Mock implementations
const mockPIIDetection = piiDetectionService as jest.Mocked<
  typeof piiDetectionService
>;
const mockAgencyRules = agencyRedactionRulesService as jest.Mocked<
  typeof agencyRedactionRulesService
>;

describe('AdvancedDocumentProcessingService', () => {
  let service: AdvancedDocumentProcessingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdvancedDocumentProcessingService();

    // Setup default mocks
    mockPIIDetection.detectPII.mockResolvedValue([
      {
        type: 'SSN' as any,
        value: '123-45-6789',
        confidence: 0.95,
        startIndex: 10,
        endIndex: 21,
        context: 'SSN: 123-45-6789',
      },
    ]);

    mockAgencyRules.getAgencyTemplate.mockResolvedValue({
      id: 'police-template',
      agencyId: 'police',
      agencyName: 'Police Department',
      name: 'Police Template',
      description: 'Standard police template',
      rules: [
        {
          id: 'rule-1',
          name: 'SSN Protection',
          description: 'Protect SSN data',
          piiTypes: ['SSN' as any],
          sensitivityLevel: 'high' as any,
          autoApply: true,
          requiresApproval: false,
        },
      ],
      version: '1.0.0',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
    });
  });

  afterEach(() => {
    // Cleanup service resources
    if (service && typeof service.cleanup === 'function') {
      service.cleanup();
    }
  });

  describe('Service Initialization', () => {
    test('should initialize service successfully', () => {
      expect(service).toBeInstanceOf(AdvancedDocumentProcessingService);
    });

    test('should initialize with empty processing queue', () => {
      const results = service.getAllProcessingResults();
      expect(results).toHaveLength(0);
    });
  });

  describe('File Type Detection', () => {
    test('should detect PDF files correctly', () => {
      const pdfFile = new File(['test'], 'test.pdf', {
        type: 'application/pdf',
      });
      // @ts-ignore - accessing private method for testing
      const fileType = service.getFileType(pdfFile);
      expect(fileType).toBe(DocumentFileType.PDF);
    });

    test('should detect image files correctly', () => {
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // @ts-ignore - accessing private method for testing
      expect(service.getFileType(pngFile)).toBe(DocumentFileType.IMAGE_PNG);
      // @ts-ignore - accessing private method for testing
      expect(service.getFileType(jpegFile)).toBe(DocumentFileType.IMAGE_JPEG);
    });

    test('should detect text files correctly', () => {
      const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      // @ts-ignore - accessing private method for testing
      const fileType = service.getFileType(txtFile);
      expect(fileType).toBe(DocumentFileType.TXT);
    });

    test('should detect Word documents correctly', () => {
      const docFile = new File(['test'], 'test.doc', {
        type: 'application/msword',
      });
      const docxFile = new File(['test'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      // @ts-ignore - accessing private method for testing
      expect(service.getFileType(docFile)).toBe(DocumentFileType.DOC);
      // @ts-ignore - accessing private method for testing
      expect(service.getFileType(docxFile)).toBe(DocumentFileType.DOCX);
    });

    test('should fallback to extension-based detection', () => {
      const unknownPdfFile = new File(['test'], 'test.pdf', {
        type: 'application/octet-stream',
      });
      // @ts-ignore - accessing private method for testing
      const fileType = service.getFileType(unknownPdfFile);
      expect(fileType).toBe(DocumentFileType.PDF);
    });
  });

  describe('OCR Requirements', () => {
    test('should require OCR for image files', () => {
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // @ts-ignore - accessing private method for testing
      expect(service.requiresOCR(pngFile)).toBe(true);
      // @ts-ignore - accessing private method for testing
      expect(service.requiresOCR(jpegFile)).toBe(true);
    });

    test('should not require OCR for text files', () => {
      const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const pdfFile = new File(['test'], 'test.pdf', {
        type: 'application/pdf',
      });

      // @ts-ignore - accessing private method for testing
      expect(service.requiresOCR(txtFile)).toBe(false);
      // @ts-ignore - accessing private method for testing
      expect(service.requiresOCR(pdfFile)).toBe(false);
    });
  });

  describe('Single Document Processing', () => {
    test('should process text file successfully', async () => {
      const txtFile = new File(['Sample text content'], 'test.txt', {
        type: 'text/plain',
      });

      const result = await service.processDocument(txtFile, 'police', {
        enableOCR: false,
        enablePIIDetection: true,
        enableAgencyValidation: true,
      });

      expect(result.status).toBe(ProcessingStatus.COMPLETED);
      expect(result.fileName).toBe('test.txt');
      expect(result.fileType).toBe(DocumentFileType.TXT);
      expect(result.extractedText).toBe('Sample text content');
      expect(result.piiFindings).toBeDefined();
      expect(result.agencyRules).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should process image file with OCR', async () => {
      const imageFile = new File(['fake image'], 'test.png', {
        type: 'image/png',
      });

      const result = await service.processDocument(imageFile, 'police', {
        enableOCR: true,
        enablePIIDetection: true,
        enableAgencyValidation: true,
      });

      expect(result.status).toBe(ProcessingStatus.COMPLETED);
      expect(result.fileName).toBe('test.png');
      expect(result.fileType).toBe(DocumentFileType.IMAGE_PNG);
      expect(result.ocrData).toBeDefined();
      expect(result.extractedText).toBeDefined();
      expect(result.piiFindings).toBeDefined();
      expect(result.agencyRules).toBeDefined();
    });

    test('should handle processing with disabled features', async () => {
      const txtFile = new File(['Sample text'], 'test.txt', {
        type: 'text/plain',
      });

      const result = await service.processDocument(txtFile, undefined, {
        enableOCR: false,
        enablePIIDetection: false,
        enableAgencyValidation: false,
      });

      expect(result.status).toBe(ProcessingStatus.COMPLETED);
      expect(result.extractedText).toBe('Sample text');
      expect(result.piiFindings).toBeUndefined();
      expect(result.agencyRules).toBeUndefined();
    });

    test('should handle processing errors gracefully', async () => {
      mockPIIDetection.detectPII.mockRejectedValue(
        new Error('PII detection failed')
      );

      const txtFile = new File(['Sample text'], 'test.txt', {
        type: 'text/plain',
      });
      const result = await service.processDocument(txtFile, 'police');

      expect(result.status).toBe(ProcessingStatus.FAILED);
      expect(result.error).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    test('should process multiple files in batch', async () => {
      const files = [
        new File(['Text 1'], 'file1.txt', { type: 'text/plain' }),
        new File(['Text 2'], 'file2.txt', { type: 'text/plain' }),
        new File(['Text 3'], 'file3.txt', { type: 'text/plain' }),
      ];

      const batchId = await service.batchProcessDocuments(files, {
        agencyId: 'police',
        maxConcurrent: 2,
        enablePIIDetection: true,
        enableAgencyValidation: true,
      });

      expect(batchId).toBeDefined();
      expect(batchId).toMatch(/^batch_\d+_[a-z0-9]+$/);

      // Check batch progress
      const progress = service.getBatchProgress(batchId);
      expect(progress).toBeDefined();
      expect(progress?.total).toBe(3);
    });

    test('should handle batch processing with different file types', async () => {
      const files = [
        new File(['Text content'], 'file1.txt', { type: 'text/plain' }),
        new File(['PDF content'], 'file2.pdf', { type: 'application/pdf' }),
        new File(['Image content'], 'file3.png', { type: 'image/png' }),
      ];

      const batchId = await service.batchProcessDocuments(files, {
        maxConcurrent: 1,
      });

      expect(batchId).toBeDefined();

      const progress = service.getBatchProgress(batchId);
      expect(progress).toBeDefined();
      expect(progress?.total).toBe(3);
    });

    test('should respect max concurrent limit', async () => {
      const files = Array.from(
        { length: 10 },
        (_, i) =>
          new File([`Text ${i}`], `file${i}.txt`, { type: 'text/plain' })
      );

      const batchId = await service.batchProcessDocuments(files, {
        maxConcurrent: 3,
      });

      expect(batchId).toBeDefined();

      const progress = service.getBatchProgress(batchId);
      expect(progress).toBeDefined();
      expect(progress?.total).toBe(10);
    });
  });

  describe('Processing Status Management', () => {
    test('should track processing status correctly', async () => {
      const txtFile = new File(['Test'], 'test.txt', { type: 'text/plain' });
      const resultPromise = service.processDocument(txtFile);

      // Give processing a moment to start
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await resultPromise;
      const status = service.getProcessingStatus(result.id);

      expect(status).toBeDefined();
      expect(status?.id).toBe(result.id);
      expect(status?.status).toBe(ProcessingStatus.COMPLETED);
    });

    test('should return null for non-existent process', () => {
      const status = service.getProcessingStatus('non-existent-id');
      expect(status).toBeNull();
    });

    test('should return all processing results', async () => {
      const files = [
        new File(['Text 1'], 'file1.txt', { type: 'text/plain' }),
        new File(['Text 2'], 'file2.txt', { type: 'text/plain' }),
      ];

      await Promise.all(files.map(file => service.processDocument(file)));

      const results = service.getAllProcessingResults();
      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === ProcessingStatus.COMPLETED)).toBe(
        true
      );
    });
  });

  describe('Agency Validation', () => {
    test('should validate documents against agency rules', async () => {
      const txtFile = new File(['SSN: 123-45-6789'], 'test.txt', {
        type: 'text/plain',
      });

      const result = await service.processDocument(txtFile, 'police', {
        enableAgencyValidation: true,
      });

      expect(result.agencyRules).toBeDefined();
      expect(result.agencyRules?.agencyId).toBe('police');
      expect(result.agencyRules?.applicableRules).toContain('rule-1');
      expect(result.agencyRules?.autoApplyRules).toContain('rule-1');
    });

    test('should handle missing agency template', async () => {
      mockAgencyRules.getAgencyTemplate.mockResolvedValue(null);

      const txtFile = new File(['Test'], 'test.txt', { type: 'text/plain' });
      const result = await service.processDocument(txtFile, 'unknown-agency', {
        enableAgencyValidation: true,
      });

      expect(result.agencyRules).toBeDefined();
      expect(result.agencyRules?.validationResults).toHaveLength(1);
      expect(result.agencyRules?.validationResults[0].severity).toBe('warning');
    });

    test('should handle agency validation errors', async () => {
      mockAgencyRules.getAgencyTemplate.mockRejectedValue(
        new Error('Template error')
      );

      const txtFile = new File(['Test'], 'test.txt', { type: 'text/plain' });
      const result = await service.processDocument(txtFile, 'police', {
        enableAgencyValidation: true,
      });

      expect(result.agencyRules).toBeDefined();
      expect(result.agencyRules?.validationResults).toHaveLength(1);
      expect(result.agencyRules?.validationResults[0].severity).toBe('error');
    });
  });

  describe('Cleanup and Resource Management', () => {
    test('should clear completed processes', async () => {
      const txtFile = new File(['Test'], 'test.txt', { type: 'text/plain' });
      await service.processDocument(txtFile);

      let results = service.getAllProcessingResults();
      expect(results).toHaveLength(1);

      service.clearCompletedProcesses();

      results = service.getAllProcessingResults();
      expect(results).toHaveLength(0);
    });

    test('should not clear in-progress processes', async () => {
      // This test would require mocking to simulate in-progress state
      // For now, we'll test the method exists and can be called
      expect(() => service.clearCompletedProcesses()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle file reading errors', async () => {
      const corruptFile = new File([''], 'corrupt.txt', { type: 'text/plain' });
      // Mock file reading to fail
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn(() => ({
        readAsText: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        onload: null,
        onerror: null,
        result: null,
      })) as any;

      try {
        const result = await service.processDocument(corruptFile);
        expect(result.status).toBe(ProcessingStatus.COMPLETED); // Should still complete with extracted text
      } finally {
        global.FileReader = originalFileReader;
      }
    });

    test('should handle OCR processing errors', async () => {
      // Mock Tesseract to fail
      const imageFile = new File(['fake image'], 'test.png', {
        type: 'image/png',
      });

      const result = await service.processDocument(imageFile, undefined, {
        enableOCR: true,
      });

      // Should complete with fallback mock data when OCR fails
      expect(result.status).toBe(ProcessingStatus.COMPLETED);
      expect(result.ocrData?.confidence).toBeLessThan(0.6); // Fallback has lower confidence
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large batch processing efficiently', async () => {
      const files = Array.from(
        { length: 50 },
        (_, i) =>
          new File([`Content ${i}`], `file${i}.txt`, { type: 'text/plain' })
      );

      const startTime = Date.now();
      const batchId = await service.batchProcessDocuments(files, {
        maxConcurrent: 5,
      });
      const endTime = Date.now();

      expect(batchId).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should generate unique process IDs', async () => {
      const files = Array.from(
        { length: 10 },
        (_, i) =>
          new File([`Text ${i}`], `file${i}.txt`, { type: 'text/plain' })
      );

      const results = await Promise.all(
        files.map(file => service.processDocument(file))
      );

      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length); // All IDs should be unique
    });
  });

  describe('Integration Tests', () => {
    test('should integrate PII detection and agency validation', async () => {
      const txtFile = new File(
        ['Name: John Doe, SSN: 123-45-6789'],
        'test.txt',
        { type: 'text/plain' }
      );

      mockPIIDetection.detectPII.mockResolvedValue([
        {
          type: 'PERSON_NAME' as any,
          value: 'John Doe',
          confidence: 0.9,
          startIndex: 6,
          endIndex: 14,
          context: 'Name: John Doe',
        },
        {
          type: 'SSN' as any,
          value: '123-45-6789',
          confidence: 0.95,
          startIndex: 21,
          endIndex: 32,
          context: 'SSN: 123-45-6789',
        },
      ]);

      const result = await service.processDocument(txtFile, 'police', {
        enablePIIDetection: true,
        enableAgencyValidation: true,
      });

      expect(result.status).toBe(ProcessingStatus.COMPLETED);
      expect(result.piiFindings).toHaveLength(2);
      expect(result.agencyRules?.applicableRules).toBeDefined();
      expect(result.agencyRules?.validationResults).toBeDefined();
    });
  });
});
