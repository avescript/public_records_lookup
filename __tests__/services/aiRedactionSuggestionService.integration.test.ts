/**
 * AI Redaction Suggestion Service Integration Tests
 * US-V2-030: Enhanced AI Redaction System
 *
 * Comprehensive test suite for AI redaction suggestions,
 * auto-review functionality, and bulk operations.
 */

import {
  AIRedactionSuggestionService,
  aiRedactionSuggestionService,
  AutoReviewResult,
  BulkSuggestionOperation,
  RedactionSuggestion,
  SuggestionType,
} from '../../src/services/aiRedactionSuggestionService';
import {
  EnhancedPIIFinding,
  LegalExemptionType,
  RedactionSensitivityMode,
} from '../../src/services/enhancedPIIEngine';
import { PIIType } from '../../src/services/piiDetectionService';
import {
  ManualRedaction,
  redactionService,
} from '../../src/services/redactionService';

describe('AI Redaction Suggestion Service Integration Tests', () => {
  let suggestionService: AIRedactionSuggestionService;
  let mockEnhancedFindings: EnhancedPIIFinding[];
  let mockExistingRedactions: ManualRedaction[];

  beforeEach(async () => {
    suggestionService = new AIRedactionSuggestionService();

    // Mock enhanced PII findings
    mockEnhancedFindings = [
      {
        recordId: 'test-record-1',
        fileName: 'test-document.pdf',
        pageNumber: 1,
        piiType: PIIType.SSN,
        confidence: 95,
        x: 100,
        y: 200,
        width: 120,
        height: 20,
        text: '123-45-6789',
        reasoning: 'Strong SSN pattern match',
        sensitivityLevel: RedactionSensitivityMode.STANDARD,
        confidenceScore: 95,
        legalExemptions: [LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY],
        contextAnalysis: {
          surroundingText: 'Employee SSN: 123-45-6789 should be protected',
          contextRelevance: 0.8,
          redactionRecommendation: 'required',
        },
        aiReasoning:
          'High confidence SSN detection. Redaction required for privacy protection.',
        relatedFindings: [],
      },
      {
        recordId: 'test-record-1',
        fileName: 'test-document.pdf',
        pageNumber: 1,
        piiType: PIIType.PERSON_NAME,
        confidence: 85,
        x: 50,
        y: 150,
        width: 80,
        height: 15,
        text: 'John Doe',
        reasoning: 'Common name pattern',
        sensitivityLevel: RedactionSensitivityMode.STANDARD,
        confidenceScore: 82,
        legalExemptions: [LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY],
        contextAnalysis: {
          surroundingText: 'Employee John Doe has been assigned',
          contextRelevance: 0.6,
          redactionRecommendation: 'recommended',
        },
        aiReasoning:
          'Moderate confidence name detection. Redaction recommended for privacy.',
        relatedFindings: [],
      },
      {
        recordId: 'test-record-1',
        fileName: 'test-document.pdf',
        pageNumber: 1,
        piiType: PIIType.PHONE,
        confidence: 75,
        x: 300,
        y: 180,
        width: 100,
        height: 18,
        text: '(555) 123-4567',
        reasoning: 'Phone number format',
        sensitivityLevel: RedactionSensitivityMode.STANDARD,
        confidenceScore: 78,
        legalExemptions: [LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY],
        contextAnalysis: {
          surroundingText: 'Contact number (555) 123-4567 for follow-up',
          contextRelevance: 0.5,
          redactionRecommendation: 'recommended',
        },
        aiReasoning: 'Moderate confidence phone number. Redaction recommended.',
        relatedFindings: [],
      },
    ];

    // Mock existing manual redactions (only covers the name, not SSN or phone)
    mockExistingRedactions = [
      {
        id: 'manual-redaction-1',
        recordId: 'test-record-1',
        fileName: 'test-document.pdf',
        pageNumber: 1,
        x: 45,
        y: 145,
        width: 90,
        height: 25,
        createdAt: new Date().toISOString(),
        createdBy: 'test-user',
        reason: 'Personal name',
        type: 'manual',
      },
    ];
  });

  describe('Suggestion Generation', () => {
    it('should generate new redaction suggestions for uncovered PII', async () => {
      const suggestions = await suggestionService.generateSuggestions(
        mockEnhancedFindings,
        mockExistingRedactions
      );

      // Should suggest redactions for SSN and phone (not covered by existing redactions)
      const newRedactionSuggestions = suggestions.filter(
        s => s.type === SuggestionType.NEW_REDACTION
      );
      expect(newRedactionSuggestions.length).toBeGreaterThanOrEqual(2);

      const ssnSuggestion = newRedactionSuggestions.find(
        s => s.targetPIIType === PIIType.SSN
      );
      expect(ssnSuggestion).toBeDefined();
      expect(ssnSuggestion!.priority).toBe('critical'); // SSN should be critical priority
      expect(ssnSuggestion!.autoImplementable).toBe(true); // High confidence should be auto-implementable
      expect(ssnSuggestion!.confidence).toBe(95);

      const phoneSuggestion = newRedactionSuggestions.find(
        s => s.targetPIIType === PIIType.PHONE
      );
      expect(phoneSuggestion).toBeDefined();
      expect(phoneSuggestion!.priority).toBe('medium');
    });

    it('should not suggest redactions for already covered PII', async () => {
      const suggestions = await suggestionService.generateSuggestions(
        mockEnhancedFindings,
        mockExistingRedactions
      );

      // Should not suggest new redaction for the name (already covered)
      const nameSuggestions = suggestions.filter(
        s =>
          s.type === SuggestionType.NEW_REDACTION &&
          s.targetPIIType === PIIType.PERSON_NAME
      );
      expect(nameSuggestions.length).toBe(0);
    });

    it('should generate boundary adjustment suggestions for partial coverage', async () => {
      // Create a redaction that only partially covers the SSN
      const partialRedactions: ManualRedaction[] = [
        {
          id: 'partial-redaction-1',
          recordId: 'test-record-1',
          fileName: 'test-document.pdf',
          pageNumber: 1,
          x: 100,
          y: 200,
          width: 80, // Too narrow to fully cover SSN
          height: 20,
          createdAt: new Date().toISOString(),
          createdBy: 'test-user',
          reason: 'SSN partial',
          type: 'manual',
        },
      ];

      const suggestions = await suggestionService.generateSuggestions(
        mockEnhancedFindings,
        partialRedactions
      );

      const adjustmentSuggestions = suggestions.filter(
        s => s.type === SuggestionType.ADJUST_BOUNDARIES
      );
      expect(adjustmentSuggestions.length).toBeGreaterThan(0);

      const ssnAdjustment = adjustmentSuggestions.find(
        s => s.targetPIIType === PIIType.SSN
      );
      expect(ssnAdjustment).toBeDefined();
      expect(ssnAdjustment!.targetCoordinates.width).toBeGreaterThan(80); // Should expand width
    });

    it('should suggest merging overlapping redactions', async () => {
      // Create overlapping redactions
      const overlappingRedactions: ManualRedaction[] = [
        {
          id: 'redaction-1',
          recordId: 'test-record-1',
          fileName: 'test-document.pdf',
          pageNumber: 1,
          x: 100,
          y: 200,
          width: 80,
          height: 20,
          createdAt: new Date().toISOString(),
          createdBy: 'test-user',
          reason: 'PII part 1',
          type: 'manual',
        },
        {
          id: 'redaction-2',
          recordId: 'test-record-1',
          fileName: 'test-document.pdf',
          pageNumber: 1,
          x: 160, // Overlapping with first redaction
          y: 200,
          width: 80,
          height: 20,
          createdAt: new Date().toISOString(),
          createdBy: 'test-user',
          reason: 'PII part 2',
          type: 'manual',
        },
      ];

      const suggestions = await suggestionService.generateSuggestions(
        mockEnhancedFindings,
        overlappingRedactions
      );

      const mergeSuggestions = suggestions.filter(
        s => s.type === SuggestionType.MERGE_REDACTIONS
      );
      expect(mergeSuggestions.length).toBeGreaterThan(0);
      expect(mergeSuggestions[0].autoImplementable).toBe(true);
    });

    it('should suggest consistency fixes for similar PII types', async () => {
      // Add another SSN finding that's not redacted
      const additionalFindings: EnhancedPIIFinding[] = [
        ...mockEnhancedFindings,
        {
          recordId: 'test-record-1',
          fileName: 'test-document.pdf',
          pageNumber: 2,
          piiType: PIIType.SSN,
          confidence: 90,
          x: 150,
          y: 100,
          width: 120,
          height: 20,
          text: '987-65-4321',
          reasoning: 'Another SSN instance',
          sensitivityLevel: RedactionSensitivityMode.STANDARD,
          confidenceScore: 92,
          legalExemptions: [LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY],
          contextAnalysis: {
            surroundingText: 'Secondary SSN: 987-65-4321',
            contextRelevance: 0.8,
            redactionRecommendation: 'required',
          },
          aiReasoning: 'High confidence SSN detection. Redaction required.',
          relatedFindings: [],
        },
      ];

      // Add redaction only for the first SSN
      const partialSSNRedactions: ManualRedaction[] = [
        {
          id: 'ssn-redaction-1',
          recordId: 'test-record-1',
          fileName: 'test-document.pdf',
          pageNumber: 1,
          x: 100,
          y: 200,
          width: 120,
          height: 20,
          createdAt: new Date().toISOString(),
          createdBy: 'test-user',
          reason: 'SSN',
          type: 'manual',
        },
      ];

      const suggestions = await suggestionService.generateSuggestions(
        additionalFindings,
        partialSSNRedactions
      );

      const consistencySuggestions = suggestions.filter(
        s => s.type === SuggestionType.CONSISTENCY_FIX
      );
      expect(consistencySuggestions.length).toBeGreaterThan(0);

      const ssnConsistency = consistencySuggestions.find(
        s => s.targetPIIType === PIIType.SSN
      );
      expect(ssnConsistency).toBeDefined();
      expect(ssnConsistency!.reasoning).toContain('consistency');
    });

    it('should suggest legal exemptions for redactions without proper justification', async () => {
      // Redaction without legal exemption info
      const redactionWithoutExemption: ManualRedaction[] = [
        {
          id: 'no-exemption-redaction',
          recordId: 'test-record-1',
          fileName: 'test-document.pdf',
          pageNumber: 1,
          x: 100,
          y: 200,
          width: 120,
          height: 20,
          createdAt: new Date().toISOString(),
          createdBy: 'test-user',
          reason: 'Redacted', // Generic reason, no legal exemption
          type: 'manual',
        },
      ];

      const suggestions = await suggestionService.generateSuggestions(
        mockEnhancedFindings,
        redactionWithoutExemption
      );

      const legalSuggestions = suggestions.filter(
        s => s.type === SuggestionType.ADD_LEGAL_EXEMPTION
      );
      expect(legalSuggestions.length).toBeGreaterThan(0);
      expect(legalSuggestions[0].legalJustification.length).toBeGreaterThan(0);
      expect(legalSuggestions[0].autoImplementable).toBe(true);
    });

    it('should suggest pattern optimizations for recurring PII types', async () => {
      // Create multiple similar findings
      const patternFindings: EnhancedPIIFinding[] = Array.from(
        { length: 4 },
        (_, i) => ({
          recordId: 'test-record-1',
          fileName: 'test-document.pdf',
          pageNumber: 1,
          piiType: PIIType.CASE_NUMBER,
          confidence: 85,
          x: 100 + i * 50,
          y: 300,
          width: 90,
          height: 16,
          text: `CASE-2024-00${i + 1}`,
          reasoning: `Case number pattern ${i + 1}`,
          sensitivityLevel: RedactionSensitivityMode.STANDARD,
          confidenceScore: 85,
          legalExemptions: [LegalExemptionType.FOIA_B7_LAW_ENFORCEMENT],
          contextAnalysis: {
            surroundingText: `Case reference CASE-2024-00${i + 1}`,
            contextRelevance: 0.7,
            redactionRecommendation: 'recommended',
          },
          aiReasoning: 'Case number pattern detected.',
          relatedFindings: [],
        })
      );

      const suggestions = await suggestionService.generateSuggestions(
        patternFindings,
        []
      );

      const patternSuggestions = suggestions.filter(
        s => s.type === SuggestionType.PATTERN_OPTIMIZATION
      );
      expect(patternSuggestions.length).toBeGreaterThan(0);

      const caseNumberPattern = patternSuggestions.find(
        s => s.targetPIIType === PIIType.CASE_NUMBER
      );
      expect(caseNumberPattern).toBeDefined();
      expect(
        caseNumberPattern!.metadata.similarOccurrences
      ).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Auto Review Functionality', () => {
    it('should perform comprehensive auto review', async () => {
      const reviewResult = await suggestionService.performAutoReview(
        mockEnhancedFindings,
        mockExistingRedactions,
        'test-record-1',
        'test-document.pdf'
      );

      expect(reviewResult.recordId).toBe('test-record-1');
      expect(reviewResult.fileName).toBe('test-document.pdf');
      expect(reviewResult.overallScore).toBeGreaterThanOrEqual(0);
      expect(reviewResult.overallScore).toBeLessThanOrEqual(100);

      expect(reviewResult.qualityMetrics).toBeDefined();
      expect(reviewResult.qualityMetrics.completeness).toBeGreaterThanOrEqual(
        0
      );
      expect(reviewResult.qualityMetrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(reviewResult.qualityMetrics.consistency).toBeGreaterThanOrEqual(0);
      expect(
        reviewResult.qualityMetrics.legalCompliance
      ).toBeGreaterThanOrEqual(0);

      expect(['low', 'medium', 'high', 'critical']).toContain(
        reviewResult.riskAssessment
      );
      expect(typeof reviewResult.reviewRequired).toBe('boolean');
    });

    it('should identify missing redaction issues', async () => {
      // No redactions for high-confidence findings
      const reviewResult = await suggestionService.performAutoReview(
        mockEnhancedFindings,
        [], // No existing redactions
        'test-record-1',
        'test-document.pdf'
      );

      const missingRedactionIssues = reviewResult.issues.filter(
        issue => issue.category === 'missing_redaction'
      );
      expect(missingRedactionIssues.length).toBeGreaterThan(0);

      // Should flag the SSN as critical issue
      const criticalIssues = reviewResult.issues.filter(
        issue => issue.severity === 'critical' || issue.severity === 'error'
      );
      expect(criticalIssues.length).toBeGreaterThan(0);
    });

    it('should flag documents requiring manual review', async () => {
      // Create scenario with critical issues
      const criticalFindings: EnhancedPIIFinding[] = mockEnhancedFindings.map(
        f => ({
          ...f,
          confidenceScore: 95,
          contextAnalysis: {
            ...f.contextAnalysis,
            redactionRecommendation: 'required' as const,
          },
        })
      );

      const reviewResult = await suggestionService.performAutoReview(
        criticalFindings,
        [], // No redactions for required PII
        'test-record-1',
        'test-document.pdf'
      );

      expect(reviewResult.reviewRequired).toBe(true);
      expect(['high', 'critical']).toContain(reviewResult.riskAssessment);
    });

    it('should provide high quality scores for well-redacted documents', async () => {
      // Create comprehensive redactions covering all findings
      const comprehensiveRedactions: ManualRedaction[] =
        mockEnhancedFindings.map((finding, index) => ({
          id: `redaction-${index}`,
          recordId: finding.recordId,
          fileName: finding.fileName,
          pageNumber: finding.pageNumber,
          x: finding.x,
          y: finding.y,
          width: finding.width,
          height: finding.height,
          createdAt: new Date().toISOString(),
          createdBy: 'test-user',
          reason: `${finding.piiType} redaction with legal exemption`,
          type: 'manual',
        }));

      const reviewResult = await suggestionService.performAutoReview(
        mockEnhancedFindings,
        comprehensiveRedactions,
        'test-record-1',
        'test-document.pdf'
      );

      expect(reviewResult.overallScore).toBeGreaterThan(80);
      expect(reviewResult.qualityMetrics.completeness).toBeGreaterThan(80);
      expect(reviewResult.riskAssessment).toBe('low');
      expect(reviewResult.reviewRequired).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    it('should generate bulk operations for multiple similar suggestions', async () => {
      const suggestions = await suggestionService.generateSuggestions(
        mockEnhancedFindings,
        []
      );

      const bulkOperations =
        await suggestionService.generateBulkOperations(suggestions);
      expect(bulkOperations.length).toBeGreaterThan(0);

      bulkOperations.forEach(operation => {
        expect(operation.id).toBeDefined();
        expect(operation.name).toBeDefined();
        expect(operation.description).toBeDefined();
        expect(operation.affectedSuggestions.length).toBeGreaterThanOrEqual(2);
        expect(operation.estimatedTime).toBeGreaterThan(0);
        expect(['low', 'medium', 'high']).toContain(operation.riskLevel);

        expect(operation.previewChanges).toBeDefined();
        expect(typeof operation.previewChanges.newRedactions).toBe('number');
        expect(typeof operation.previewChanges.modifiedRedactions).toBe(
          'number'
        );
        expect(typeof operation.previewChanges.removedRedactions).toBe(
          'number'
        );
      });
    });

    it('should prioritize bulk operations by number of affected suggestions', async () => {
      // Create many similar suggestions
      const manyFindings: EnhancedPIIFinding[] = Array.from(
        { length: 10 },
        (_, i) => ({
          ...mockEnhancedFindings[0],
          x: 100 + i * 50,
          text: `SSN-${i}`,
          confidenceScore: 85,
        })
      );

      const suggestions = await suggestionService.generateSuggestions(
        manyFindings,
        []
      );

      const bulkOperations =
        await suggestionService.generateBulkOperations(suggestions);

      // Should sort by number of affected suggestions (descending)
      for (let i = 0; i < bulkOperations.length - 1; i++) {
        expect(
          bulkOperations[i].affectedSuggestions.length
        ).toBeGreaterThanOrEqual(
          bulkOperations[i + 1].affectedSuggestions.length
        );
      }
    });

    it('should calculate appropriate risk levels for bulk operations', async () => {
      const lowConfidenceFindings: EnhancedPIIFinding[] =
        mockEnhancedFindings.map(f => ({
          ...f,
          confidenceScore: 65, // Lower confidence
        }));

      const suggestions = await suggestionService.generateSuggestions(
        lowConfidenceFindings,
        []
      );

      const bulkOperations =
        await suggestionService.generateBulkOperations(suggestions);

      if (bulkOperations.length > 0) {
        // Lower confidence suggestions should result in higher risk
        expect(['medium', 'high']).toContain(bulkOperations[0].riskLevel);
      }
    });

    it('should not create bulk operations for insufficient suggestions', async () => {
      // Only one finding
      const singleFinding = [mockEnhancedFindings[0]];

      const suggestions = await suggestionService.generateSuggestions(
        singleFinding,
        []
      );

      const bulkOperations =
        await suggestionService.generateBulkOperations(suggestions);

      // Should not create bulk operations for single suggestions
      expect(bulkOperations.length).toBe(0);
    });
  });

  describe('Suggestion Prioritization', () => {
    it('should prioritize critical PII types higher', async () => {
      const mixedFindings: EnhancedPIIFinding[] = [
        {
          ...mockEnhancedFindings[0], // SSN
          confidenceScore: 85,
        },
        {
          ...mockEnhancedFindings[1], // Name
          confidenceScore: 85,
        },
      ];

      const suggestions = await suggestionService.generateSuggestions(
        mixedFindings,
        []
      );

      const ssnSuggestion = suggestions.find(
        s => s.targetPIIType === PIIType.SSN
      );
      const nameSuggestion = suggestions.find(
        s => s.targetPIIType === PIIType.PERSON_NAME
      );

      if (ssnSuggestion && nameSuggestion) {
        // SSN should have higher priority than name
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        expect(priorityOrder[ssnSuggestion.priority]).toBeGreaterThanOrEqual(
          priorityOrder[nameSuggestion.priority]
        );
      }
    });

    it('should prioritize higher confidence suggestions', async () => {
      const suggestions = await suggestionService.generateSuggestions(
        mockEnhancedFindings,
        []
      );

      // Suggestions should be sorted by priority and confidence
      for (let i = 0; i < suggestions.length - 1; i++) {
        const current = suggestions[i];
        const next = suggestions[i + 1];

        // If same priority, higher confidence should come first
        if (current.priority === next.priority) {
          expect(current.confidence).toBeGreaterThanOrEqual(next.confidence);
        }
      }
    });

    it('should mark high-confidence suggestions as auto-implementable', async () => {
      const highConfidenceFindings: EnhancedPIIFinding[] =
        mockEnhancedFindings.map(f => ({
          ...f,
          confidenceScore: 90,
        }));

      const suggestions = await suggestionService.generateSuggestions(
        highConfidenceFindings,
        []
      );

      const highConfidenceSuggestions = suggestions.filter(
        s => s.confidence >= 85
      );
      highConfidenceSuggestions.forEach(suggestion => {
        expect(suggestion.autoImplementable).toBe(true);
      });
    });
  });

  describe('Integration with Enhanced Services', () => {
    it('should integrate with redaction confidence analyzer', async () => {
      const reviewResult = await suggestionService.performAutoReview(
        mockEnhancedFindings,
        mockExistingRedactions,
        'test-record-1',
        'test-document.pdf'
      );

      // Should use confidence analyzer results
      expect(reviewResult.qualityMetrics).toBeDefined();
      expect(reviewResult.issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should incorporate legal exemption information', async () => {
      const suggestions = await suggestionService.generateSuggestions(
        mockEnhancedFindings,
        mockExistingRedactions
      );

      suggestions.forEach(suggestion => {
        if (suggestion.targetPIIType === PIIType.SSN) {
          expect(suggestion.legalJustification).toContain(
            LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY
          );
        }
      });
    });

    it('should utilize context analysis for recommendation levels', async () => {
      const suggestions = await suggestionService.generateSuggestions(
        mockEnhancedFindings,
        []
      );

      const requiredSuggestions = suggestions.filter(s =>
        mockEnhancedFindings.some(
          f =>
            f.piiType === s.targetPIIType &&
            f.contextAnalysis.redactionRecommendation === 'required'
        )
      );

      requiredSuggestions.forEach(suggestion => {
        expect(['critical', 'high']).toContain(suggestion.priority);
      });
    });
  });
});

describe('AI Redaction Suggestion Service Singleton', () => {
  it('should export a singleton instance', () => {
    expect(aiRedactionSuggestionService).toBeInstanceOf(
      AIRedactionSuggestionService
    );
  });

  it('should maintain consistent behavior across calls', async () => {
    const findings: EnhancedPIIFinding[] = [
      {
        recordId: 'singleton-test',
        fileName: 'singleton-test.pdf',
        pageNumber: 1,
        piiType: PIIType.SSN,
        confidence: 95,
        x: 100,
        y: 100,
        width: 120,
        height: 20,
        text: '123-45-6789',
        reasoning: 'Test SSN',
        sensitivityLevel: RedactionSensitivityMode.STANDARD,
        confidenceScore: 95,
        legalExemptions: [LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY],
        contextAnalysis: {
          surroundingText: 'Test context',
          contextRelevance: 0.8,
          redactionRecommendation: 'required',
        },
        aiReasoning: 'Test reasoning',
        relatedFindings: [],
      },
    ];

    const suggestions1 = await aiRedactionSuggestionService.generateSuggestions(
      findings,
      []
    );

    const suggestions2 = await aiRedactionSuggestionService.generateSuggestions(
      findings,
      []
    );

    // Should produce consistent results
    expect(suggestions1.length).toBe(suggestions2.length);
    expect(suggestions1[0].type).toBe(suggestions2[0].type);
    expect(suggestions1[0].targetPIIType).toBe(suggestions2[0].targetPIIType);
  });
});
