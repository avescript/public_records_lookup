/**
 * AI Response Service Tests
 * Comprehensive test suite for AI-powered response generation
 */

import {
  AIResponseService,
  aiResponseService,
} from '../../src/services/aiResponseService';
import { PublicRecordRequest } from '../../src/types';
import {
  ResponseGenerationRequest,
  ResponseLength,
  ResponseTemplate,
  ResponseTone,
  SmartEditingContext,
} from '../../src/types/response';

// Mock data
const mockRequest: PublicRecordRequest = {
  id: 'test-request-123',
  title: 'Police Reports for January 2024',
  description: 'Request for all police incident reports from January 2024',
  department: 'Police Department',
  submittedAt: '2024-01-15',
  status: 'in_process',
  contactInfo: {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '555-123-4567',
  },
  priority: 'normal',
  files: [],
};

const mockGenerationRequest: ResponseGenerationRequest = {
  requestId: 'test-request-123',
  tone: 'professional',
  length: 'standard',
  includeSections: [
    'greeting',
    'acknowledgment',
    'records_summary',
    'closing',
    'contact_info',
  ],
  context: {
    requestDetails: mockRequest,
    recordsFound: true,
    recordCount: 5,
    redactionsApplied: true,
    exemptionsUsed: ['FOIA_B6_PERSONAL_PRIVACY'],
    fees: 25.0,
  },
};

describe('AIResponseService', () => {
  describe('Response Generation', () => {
    it('should generate a response with default settings', async () => {
      const result = await aiResponseService.generateResponse(
        mockGenerationRequest
      );

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response?.content).toContain('Thank you');
      expect(result.response?.content).toContain('John Smith');
      expect(result.response?.metadata.tone).toBe('professional');
      expect(result.response?.metadata.length).toBe('standard');
    });

    it('should generate different responses for different tones', async () => {
      const formalRequest = {
        ...mockGenerationRequest,
        tone: 'formal' as ResponseTone,
      };
      const friendlyRequest = {
        ...mockGenerationRequest,
        tone: 'friendly' as ResponseTone,
      };

      const formalResult =
        await aiResponseService.generateResponse(formalRequest);
      const friendlyResult =
        await aiResponseService.generateResponse(friendlyRequest);

      expect(formalResult.success).toBe(true);
      expect(friendlyResult.success).toBe(true);

      // Responses should be different based on tone
      expect(formalResult.response?.content).not.toBe(
        friendlyResult.response?.content
      );
      expect(formalResult.response?.metadata.tone).toBe('formal');
      expect(friendlyResult.response?.metadata.tone).toBe('friendly');
    });

    it('should generate appropriate response when no records found', async () => {
      const noRecordsRequest = {
        ...mockGenerationRequest,
        context: {
          ...mockGenerationRequest.context,
          recordsFound: false,
          recordCount: 0,
        },
      };

      const result = await aiResponseService.generateResponse(noRecordsRequest);

      expect(result.success).toBe(true);
      expect(result.response?.content).toContain('unable to locate');
      expect(result.response?.content).not.toContain(
        'records are being provided'
      );
    });

    it('should handle template-based generation', async () => {
      const templates = aiResponseService.getTemplates();
      const template = templates.find(t => t.id === 'standard-fulfillment');

      const templateRequest = {
        ...mockGenerationRequest,
        templateId: template?.id,
      };

      const result = await aiResponseService.generateResponse(templateRequest);

      expect(result.success).toBe(true);
      expect(result.response?.metadata.templateId).toBe(template?.id);
      expect(result.response?.content).toBeTruthy();
    });

    it('should validate request before generation', async () => {
      const invalidRequest = {
        ...mockGenerationRequest,
        requestId: '', // Invalid - empty request ID
      };

      const result = await aiResponseService.generateResponse(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
    });

    it('should include all requested sections', async () => {
      const sectionsRequest = {
        ...mockGenerationRequest,
        includeSections: [
          'greeting',
          'records_summary',
          'exemptions',
          'closing',
        ],
      };

      const result = await aiResponseService.generateResponse(sectionsRequest);

      expect(result.success).toBe(true);
      expect(result.response?.sections).toHaveLength(4);
      expect(result.response?.sections.map(s => s.type)).toEqual(
        expect.arrayContaining([
          'greeting',
          'records_summary',
          'exemptions',
          'closing',
        ])
      );
    });

    it('should adjust content based on length setting', async () => {
      const conciseRequest = {
        ...mockGenerationRequest,
        length: 'concise' as ResponseLength,
      };
      const detailedRequest = {
        ...mockGenerationRequest,
        length: 'detailed' as ResponseLength,
      };

      const conciseResult =
        await aiResponseService.generateResponse(conciseRequest);
      const detailedResult =
        await aiResponseService.generateResponse(detailedRequest);

      expect(conciseResult.success).toBe(true);
      expect(detailedResult.success).toBe(true);

      // Detailed response should be longer
      const conciseWordCount = conciseResult.response?.metadata.wordsCount || 0;
      const detailedWordCount =
        detailedResult.response?.metadata.wordsCount || 0;

      expect(detailedWordCount).toBeGreaterThan(conciseWordCount);
    });
  });

  describe('Writing Assistance', () => {
    const mockContext: SmartEditingContext = {
      currentContent: 'Thank you for your request',
      cursorPosition: 25,
      tone: 'professional',
      length: 'standard',
      requestContext: mockRequest,
    };

    it('should provide writing suggestions', async () => {
      const suggestions =
        await aiResponseService.getWritingAssistance(mockContext);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      for (const suggestion of suggestions) {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('content');
        expect(suggestion).toHaveProperty('reasoning');
        expect(suggestion).toHaveProperty('confidence');
      }
    });

    it('should provide completion suggestions for short content', async () => {
      const shortContext = {
        ...mockContext,
        currentContent: 'Dear',
      };

      const suggestions =
        await aiResponseService.getWritingAssistance(shortContext);

      expect(suggestions.some(s => s.type === 'completion')).toBe(true);
    });

    it('should provide tone-specific suggestions', async () => {
      const friendlyContext = {
        ...mockContext,
        tone: 'friendly' as ResponseTone,
        currentContent: 'We have reviewed your request',
      };

      const suggestions =
        await aiResponseService.getWritingAssistance(friendlyContext);

      expect(
        suggestions.some(s => s.reasoning.toLowerCase().includes('friendly'))
      ).toBe(true);
    });
  });

  describe('Template Management', () => {
    it('should return default templates', () => {
      const templates = aiResponseService.getTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      // Check for expected default templates
      expect(templates.some(t => t.id === 'standard-fulfillment')).toBe(true);
      expect(templates.some(t => t.id === 'no-records-found')).toBe(true);
      expect(templates.some(t => t.id === 'partial-denial')).toBe(true);
    });

    it('should filter templates by request type', () => {
      const generalTemplates = aiResponseService.getTemplates('general');
      const allTemplates = aiResponseService.getTemplates();

      expect(generalTemplates.length).toBeLessThanOrEqual(allTemplates.length);
      expect(
        generalTemplates.every(t => t.requestType.includes('general'))
      ).toBe(true);
    });

    it('should save and retrieve custom templates', () => {
      const customTemplate: ResponseTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Custom test template',
        requestType: ['test'],
        baseTemplate: 'Dear {{requester_name}}, this is a test.',
        sections: ['greeting', 'closing'],
        placeholders: [
          {
            key: 'requester_name',
            label: 'Requester Name',
            type: 'text',
            required: true,
          },
        ],
        tone: 'professional',
        compliance: { foia: true, cpra: true },
        usage: { frequency: 0, lastUsed: new Date(), rating: 4.0 },
      };

      aiResponseService.saveTemplate(customTemplate);
      const templates = aiResponseService.getTemplates();

      expect(templates.some(t => t.id === 'test-template')).toBe(true);

      // Clean up
      aiResponseService.deleteTemplate('test-template');
    });

    it('should delete templates', () => {
      const customTemplate: ResponseTemplate = {
        id: 'delete-test-template',
        name: 'Delete Test Template',
        description: 'Template to be deleted',
        requestType: ['test'],
        baseTemplate: 'Test content',
        sections: ['greeting'],
        placeholders: [],
        tone: 'professional',
        compliance: { foia: true, cpra: true },
        usage: { frequency: 0, lastUsed: new Date(), rating: 4.0 },
      };

      aiResponseService.saveTemplate(customTemplate);
      expect(
        aiResponseService
          .getTemplates()
          .some(t => t.id === 'delete-test-template')
      ).toBe(true);

      const deleted = aiResponseService.deleteTemplate('delete-test-template');
      expect(deleted).toBe(true);
      expect(
        aiResponseService
          .getTemplates()
          .some(t => t.id === 'delete-test-template')
      ).toBe(false);
    });
  });

  describe('Response Validation', () => {
    it('should validate compliant responses', async () => {
      const result = await aiResponseService.generateResponse(
        mockGenerationRequest
      );
      expect(result.success).toBe(true);

      if (result.response) {
        const validation = await aiResponseService.validateResponse(
          result.response
        );

        expect(validation.isValid).toBe(true);
        expect(validation.score).toBeGreaterThan(0);
        expect(validation.compliance.foia).toBe(true);
        expect(validation.compliance.cpra).toBe(true);
      }
    });

    it('should identify missing required sections', async () => {
      const incompleteRequest = {
        ...mockGenerationRequest,
        includeSections: ['greeting'], // Missing required sections
      };

      const result =
        await aiResponseService.generateResponse(incompleteRequest);
      expect(result.success).toBe(true);

      if (result.response) {
        const validation = await aiResponseService.validateResponse(
          result.response
        );

        expect(
          validation.issues.some(
            issue =>
              issue.type === 'compliance' &&
              issue.message.includes('Missing required section')
          )
        ).toBe(true);
      }
    });

    it('should flag problematic phrases', async () => {
      // Create a response with potentially problematic content
      const problematicResponse = {
        id: 'test-response',
        requestId: 'test-request',
        content: 'We refuse to provide these documents.',
        sections: [],
        metadata: {
          tone: 'formal' as ResponseTone,
          length: 'standard' as ResponseLength,
          wordsCount: 8,
          generatedAt: new Date(),
          confidence: 0.8,
          model: 'test-model',
        },
        suggestions: [],
        placeholders: {},
      };

      const validation =
        await aiResponseService.validateResponse(problematicResponse);

      expect(
        validation.issues.some(
          issue =>
            issue.type === 'compliance' &&
            issue.message.includes('problematic phrase')
        )
      ).toBe(true);
    });

    it('should suggest improvements for short responses', async () => {
      const shortResponse = {
        id: 'test-response',
        requestId: 'test-request',
        content: 'No records found.',
        sections: [],
        metadata: {
          tone: 'formal' as ResponseTone,
          length: 'standard' as ResponseLength,
          wordsCount: 3,
          generatedAt: new Date(),
          confidence: 0.8,
          model: 'test-model',
        },
        suggestions: [],
        placeholders: {},
      };

      const validation =
        await aiResponseService.validateResponse(shortResponse);

      expect(
        validation.issues.some(
          issue =>
            issue.type === 'completeness' && issue.message.includes('too brief')
        )
      ).toBe(true);
    });
  });

  describe('Service Configuration', () => {
    it('should initialize with default configuration', () => {
      const service = new AIResponseService();
      expect(service).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        apiEndpoint: 'https://custom-api.com',
        model: 'custom-model',
        maxTokens: 1000,
        temperature: 0.5,
      };

      const service = new AIResponseService(customConfig);
      expect(service).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid generation requests gracefully', async () => {
      const invalidRequest = {
        requestId: '',
        tone: 'professional' as ResponseTone,
        length: 'standard' as ResponseLength,
        includeSections: [],
        context: {
          requestDetails: mockRequest,
          recordsFound: true,
        },
      };

      const result = await aiResponseService.generateResponse(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INVALID_REQUEST');
    });

    it('should handle empty writing assistance context', async () => {
      const emptyContext: SmartEditingContext = {
        currentContent: '',
        cursorPosition: 0,
        tone: 'professional',
        length: 'standard',
        requestContext: mockRequest,
      };

      const suggestions =
        await aiResponseService.getWritingAssistance(emptyContext);

      expect(Array.isArray(suggestions)).toBe(true);
      // Should still provide some suggestions even with empty content
    });
  });

  describe('Performance', () => {
    it('should generate responses within reasonable time', async () => {
      const startTime = Date.now();

      const result = await aiResponseService.generateResponse(
        mockGenerationRequest
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill(mockGenerationRequest);

      const startTime = Date.now();
      const promises = requests.map(req =>
        aiResponseService.generateResponse(req)
      );
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // All should complete within 10 seconds
    });
  });

  describe('Integration', () => {
    it('should work with existing request data structure', async () => {
      // Test with the actual PublicRecordRequest structure
      const result = await aiResponseService.generateResponse(
        mockGenerationRequest
      );

      expect(result.success).toBe(true);
      expect(result.response?.content).toContain(mockRequest.contactInfo?.name);
      expect(result.response?.content).toContain(mockRequest.title);
    });

    it('should generate consistent metadata', async () => {
      const result = await aiResponseService.generateResponse(
        mockGenerationRequest
      );

      expect(result.success).toBe(true);
      if (result.response) {
        expect(result.response.requestId).toBe(mockGenerationRequest.requestId);
        expect(result.response.metadata.tone).toBe(mockGenerationRequest.tone);
        expect(result.response.metadata.length).toBe(
          mockGenerationRequest.length
        );
        expect(result.response.metadata.generatedAt).toBeInstanceOf(Date);
        expect(result.response.metadata.confidence).toBeGreaterThan(0);
        expect(result.response.metadata.confidence).toBeLessThanOrEqual(1);
      }
    });
  });
});
