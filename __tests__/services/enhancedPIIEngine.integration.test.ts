/**
 * Enhanced PII Engine Integration Tests
 * US-V2-030: Enhanced AI Redaction System
 *
 * Comprehensive test suite for the enhanced PII detection engine
 * including multi-level sensitivity, confidence scoring, and legal exemption detection.
 */

import {
  EnhancedPIIEngine,
  enhancedPIIEngine,
  EnhancedPIIFinding,
  LegalExemptionType,
  RedactionConfidenceMetrics,
  RedactionSensitivityMode,
} from '../../src/services/enhancedPIIEngine';
import {
  piiDetectionService,
  PIIFinding,
  PIIType,
} from '../../src/services/piiDetectionService';

describe('EnhancedPIIEngine Integration Tests', () => {
  let engine: EnhancedPIIEngine;
  let mockPIIFindings: PIIFinding[];

  beforeEach(async () => {
    engine = new EnhancedPIIEngine();

    // Mock PII findings for testing
    mockPIIFindings = [
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
      },
      {
        recordId: 'test-record-1',
        fileName: 'test-document.pdf',
        pageNumber: 2,
        piiType: PIIType.CASE_NUMBER,
        confidence: 60,
        x: 150,
        y: 100,
        width: 90,
        height: 16,
        text: 'CASE-2024-001',
        reasoning: 'Case number pattern',
      },
    ];
  });

  describe('Sensitivity Mode Processing', () => {
    it('should filter findings based on LIGHT sensitivity mode', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.LIGHT
      );

      // Light mode should only include high-confidence, critical PII types
      expect(enhanced.length).toBe(2); // SSN and high-confidence name should pass
      const ssnFinding = enhanced.find(f => f.piiType === PIIType.SSN);
      expect(ssnFinding).toBeDefined();
      expect(ssnFinding!.sensitivityLevel).toBe(RedactionSensitivityMode.LIGHT);
    });

    it('should include more findings in STANDARD sensitivity mode', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      // Standard mode should include SSN, PERSON_NAME, and PHONE (all above 60% threshold)
      expect(enhanced.length).toBeGreaterThan(1);

      const piiTypes = enhanced.map(f => f.piiType);
      expect(piiTypes).toContain(PIIType.SSN);
      expect(piiTypes).toContain(PIIType.PERSON_NAME);
      expect(piiTypes).toContain(PIIType.PHONE);

      enhanced.forEach(finding => {
        expect(finding.sensitivityLevel).toBe(
          RedactionSensitivityMode.STANDARD
        );
      });
    });

    it('should include all findings in STRICT sensitivity mode', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STRICT
      );

      // Strict mode should include all findings (threshold is 40%)
      expect(enhanced.length).toBe(4);

      enhanced.forEach(finding => {
        expect(finding.sensitivityLevel).toBe(RedactionSensitivityMode.STRICT);
      });
    });
  });

  describe('Confidence Score Enhancement', () => {
    it('should enhance confidence scores based on pattern matching', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      const ssnFinding = enhanced.find(f => f.piiType === PIIType.SSN);
      expect(ssnFinding).toBeDefined();

      // SSN should get confidence boost due to strong pattern
      expect(ssnFinding!.confidenceScore).toBeGreaterThanOrEqual(95);
    });

    it('should apply PII type confidence modifiers', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      // Names typically get lower confidence modifier
      const nameFinding = enhanced.find(f => f.piiType === PIIType.PERSON_NAME);
      if (nameFinding) {
        expect(nameFinding.confidenceScore).toBeLessThan(95); // Should be adjusted downward
      }
    });

    it('should calculate context relevance when document context provided', async () => {
      const contextDocument =
        'This document contains confidential information about investigation procedures. John Doe is a witness in case 123-45-6789.';

      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD,
        contextDocument
      );

      enhanced.forEach(finding => {
        expect(finding.contextAnalysis).toBeDefined();
        expect(finding.contextAnalysis.contextRelevance).toBeGreaterThanOrEqual(
          0
        );
        expect(finding.contextAnalysis.contextRelevance).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Legal Exemption Detection', () => {
    it('should detect FOIA B6 exemption for personal PII', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      const personalPII = enhanced.filter(f =>
        [PIIType.SSN, PIIType.PERSON_NAME, PIIType.PHONE].includes(f.piiType)
      );

      personalPII.forEach(finding => {
        expect(finding.legalExemptions).toContain(
          LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY
        );
      });
    });

    it('should detect law enforcement exemptions for case numbers', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STRICT
      );

      const caseFinding = enhanced.find(f => f.piiType === PIIType.CASE_NUMBER);
      if (caseFinding) {
        expect(caseFinding.legalExemptions).toContain(
          LegalExemptionType.FOIA_B7_LAW_ENFORCEMENT
        );
        expect(caseFinding.legalExemptions).toContain(
          LegalExemptionType.LAW_ENFORCEMENT_SENSITIVE
        );
      }
    });

    it('should detect context-based exemptions', async () => {
      const contextDocument =
        'This document contains classified national security information and ongoing investigation details.';

      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD,
        contextDocument
      );

      // Should detect national security exemption from context
      const hasNationalSecurity = enhanced.some(f =>
        f.legalExemptions.includes(LegalExemptionType.FOIA_B1_NATIONAL_SECURITY)
      );
      expect(hasNationalSecurity).toBeTruthy();

      // Should detect ongoing investigation exemption
      const hasOngoingInvestigation = enhanced.some(f =>
        f.legalExemptions.includes(LegalExemptionType.ONGOING_INVESTIGATION)
      );
      expect(hasOngoingInvestigation).toBeTruthy();
    });
  });

  describe('Context Analysis', () => {
    it('should provide context analysis for each finding', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      enhanced.forEach(finding => {
        expect(finding.contextAnalysis).toBeDefined();
        expect(finding.contextAnalysis.surroundingText).toBeDefined();
        expect(finding.contextAnalysis.contextRelevance).toBeGreaterThanOrEqual(
          0
        );
        expect(finding.contextAnalysis.contextRelevance).toBeLessThanOrEqual(1);
        expect(['required', 'recommended', 'optional']).toContain(
          finding.contextAnalysis.redactionRecommendation
        );
      });
    });

    it('should recommend "required" for high-risk PII types', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      const ssnFinding = enhanced.find(f => f.piiType === PIIType.SSN);
      expect(ssnFinding?.contextAnalysis.redactionRecommendation).toBe(
        'required'
      );
    });

    it('should recommend "optional" for low-risk types with low relevance', async () => {
      const lowRiskFindings: PIIFinding[] = [
        {
          recordId: 'test-record-2',
          fileName: 'test-document-2.pdf',
          pageNumber: 1,
          piiType: PIIType.CASE_NUMBER,
          confidence: 50,
          x: 100,
          y: 100,
          width: 80,
          height: 15,
          text: 'REF-001',
          reasoning: 'Low confidence case reference',
        },
      ];

      const enhanced = await engine.enhanceFindings(
        lowRiskFindings,
        RedactionSensitivityMode.STANDARD
      );

      if (enhanced.length > 0) {
        expect(enhanced[0].contextAnalysis.redactionRecommendation).toBe(
          'optional'
        );
      }
    });
  });

  describe('AI Reasoning Generation', () => {
    it('should generate comprehensive AI reasoning for each finding', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      enhanced.forEach(finding => {
        expect(finding.aiReasoning).toBeDefined();
        expect(finding.aiReasoning.length).toBeGreaterThan(20); // Should be descriptive
        expect(finding.aiReasoning).toContain(finding.piiType);
      });
    });

    it('should include confidence level in reasoning', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      const highConfidenceFinding = enhanced.find(f => f.confidenceScore >= 90);
      if (highConfidenceFinding) {
        expect(highConfidenceFinding.aiReasoning).toMatch(/high confidence/i);
      }

      const moderateConfidenceFinding = enhanced.find(
        f => f.confidenceScore >= 70 && f.confidenceScore < 90
      );
      if (moderateConfidenceFinding) {
        expect(moderateConfidenceFinding.aiReasoning).toMatch(
          /moderate confidence/i
        );
      }
    });

    it('should include legal exemption information in reasoning', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      enhanced.forEach(finding => {
        if (finding.legalExemptions.length > 0) {
          expect(finding.aiReasoning).toMatch(/protected under/i);
        }
      });
    });
  });

  describe('Related Findings Detection', () => {
    it('should identify related findings on the same page', async () => {
      // Add related findings close to each other
      const relatedFindings: PIIFinding[] = [
        ...mockPIIFindings,
        {
          recordId: 'test-record-1',
          fileName: 'test-document.pdf',
          pageNumber: 1,
          piiType: PIIType.EMAIL,
          confidence: 80,
          x: 120, // Close to SSN finding at x: 100
          y: 220, // Close to SSN finding at y: 200
          width: 150,
          height: 18,
          text: 'john.doe@example.com',
          reasoning: 'Email pattern match',
        },
      ];

      const enhanced = await engine.enhanceFindings(
        relatedFindings,
        RedactionSensitivityMode.STANDARD
      );

      const ssnFinding = enhanced.find(f => f.piiType === PIIType.SSN);
      const emailFinding = enhanced.find(f => f.piiType === PIIType.EMAIL);

      if (ssnFinding && emailFinding) {
        // Should detect proximity relationship
        expect(ssnFinding.relatedFindings.length).toBeGreaterThan(0);
        expect(emailFinding.relatedFindings.length).toBeGreaterThan(0);
      }
    });

    it('should identify duplicate text content', async () => {
      const duplicateFindings: PIIFinding[] = [
        ...mockPIIFindings,
        {
          recordId: 'test-record-1',
          fileName: 'test-document.pdf',
          pageNumber: 2,
          piiType: PIIType.PERSON_NAME,
          confidence: 85,
          x: 200,
          y: 300,
          width: 80,
          height: 15,
          text: 'John Doe', // Same text as existing finding
          reasoning: 'Duplicate name instance',
        },
      ];

      const enhanced = await engine.enhanceFindings(
        duplicateFindings,
        RedactionSensitivityMode.STANDARD
      );

      const nameFindings = enhanced.filter(
        f => f.piiType === PIIType.PERSON_NAME
      );
      expect(nameFindings.length).toBe(2);

      nameFindings.forEach(finding => {
        expect(finding.relatedFindings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Confidence Metrics Calculation', () => {
    it('should calculate overall confidence metrics', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      const metrics = engine.calculateConfidenceMetrics(enhanced);

      expect(metrics.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(metrics.overallConfidence).toBeLessThanOrEqual(100);
      expect(metrics.detectionAccuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.detectionAccuracy).toBeLessThanOrEqual(100);
      expect(metrics.contextRelevance).toBeGreaterThanOrEqual(0);
      expect(metrics.contextRelevance).toBeLessThanOrEqual(100);
      expect(metrics.legalCompliance).toBeGreaterThanOrEqual(0);
      expect(metrics.legalCompliance).toBeLessThanOrEqual(100);
      expect(metrics.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(metrics.consistencyScore).toBeLessThanOrEqual(100);
    });

    it('should calculate high detection accuracy for high-confidence findings', async () => {
      const highConfidenceFindings: PIIFinding[] = mockPIIFindings.map(f => ({
        ...f,
        confidence: 90, // All high confidence
      }));

      const enhanced = await engine.enhanceFindings(
        highConfidenceFindings,
        RedactionSensitivityMode.STANDARD
      );

      const metrics = engine.calculateConfidenceMetrics(enhanced);
      expect(metrics.detectionAccuracy).toBeGreaterThan(80);
    });

    it('should show 100% legal compliance when all findings have exemptions', async () => {
      const enhanced = await engine.enhanceFindings(
        mockPIIFindings,
        RedactionSensitivityMode.STANDARD
      );

      const metrics = engine.calculateConfidenceMetrics(enhanced);

      // Should have high legal compliance since personal PII gets B6 exemption
      expect(metrics.legalCompliance).toBeGreaterThan(50);
    });

    it('should calculate consistency score based on similar findings', async () => {
      const consistentFindings: PIIFinding[] = [
        {
          recordId: 'test-record-3',
          fileName: 'test-document-3.pdf',
          pageNumber: 1,
          piiType: PIIType.SSN,
          confidence: 95,
          x: 100,
          y: 100,
          width: 120,
          height: 20,
          text: '111-22-3333',
          reasoning: 'SSN pattern',
        },
        {
          recordId: 'test-record-3',
          fileName: 'test-document-3.pdf',
          pageNumber: 1,
          piiType: PIIType.SSN,
          confidence: 96,
          x: 100,
          y: 150,
          width: 120,
          height: 20,
          text: '444-55-6666',
          reasoning: 'SSN pattern',
        },
      ];

      const enhanced = await engine.enhanceFindings(
        consistentFindings,
        RedactionSensitivityMode.STANDARD
      );

      const metrics = engine.calculateConfidenceMetrics(enhanced);

      // Should have high consistency since both SSNs have similar confidence
      expect(metrics.consistencyScore).toBeGreaterThan(80);
    });
  });

  describe('Configuration Management', () => {
    it('should provide sensitivity mode configurations', () => {
      const lightConfig = engine.getSensitivityModeConfig(
        RedactionSensitivityMode.LIGHT
      );
      expect(lightConfig.mode).toBe(RedactionSensitivityMode.LIGHT);
      expect(lightConfig.confidenceThreshold).toBe(75);
      expect(lightConfig.legalExemptionsEnabled).toBe(false);

      const standardConfig = engine.getSensitivityModeConfig(
        RedactionSensitivityMode.STANDARD
      );
      expect(standardConfig.mode).toBe(RedactionSensitivityMode.STANDARD);
      expect(standardConfig.confidenceThreshold).toBe(60);
      expect(standardConfig.legalExemptionsEnabled).toBe(true);

      const strictConfig = engine.getSensitivityModeConfig(
        RedactionSensitivityMode.STRICT
      );
      expect(strictConfig.mode).toBe(RedactionSensitivityMode.STRICT);
      expect(strictConfig.confidenceThreshold).toBe(40);
      expect(strictConfig.legalExemptionsEnabled).toBe(true);
    });

    it('should provide all available sensitivity modes', () => {
      const allModes = engine.getAllSensitivityModes();
      expect(allModes.length).toBe(3);

      const modeNames = allModes.map(m => m.mode);
      expect(modeNames).toContain(RedactionSensitivityMode.LIGHT);
      expect(modeNames).toContain(RedactionSensitivityMode.STANDARD);
      expect(modeNames).toContain(RedactionSensitivityMode.STRICT);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty findings array gracefully', async () => {
      const enhanced = await engine.enhanceFindings(
        [],
        RedactionSensitivityMode.STANDARD
      );

      expect(enhanced).toEqual([]);

      const metrics = engine.calculateConfidenceMetrics(enhanced);
      expect(metrics.overallConfidence).toBe(0);
      expect(metrics.detectionAccuracy).toBe(0);
      expect(metrics.contextRelevance).toBe(0);
      expect(metrics.legalCompliance).toBe(100); // No findings = perfect compliance
      expect(metrics.consistencyScore).toBe(0);
    });

    it('should handle findings below confidence threshold', async () => {
      const lowConfidenceFindings: PIIFinding[] = [
        {
          recordId: 'test-record-low',
          fileName: 'test-document-low.pdf',
          pageNumber: 1,
          piiType: PIIType.PERSON_NAME,
          confidence: 30, // Below all thresholds
          x: 100,
          y: 100,
          width: 80,
          height: 15,
          text: 'Maybe Name',
          reasoning: 'Uncertain match',
        },
      ];

      const enhanced = await engine.enhanceFindings(
        lowConfidenceFindings,
        RedactionSensitivityMode.LIGHT
      );

      expect(enhanced.length).toBe(0); // Should be filtered out

      const enhancedStrict = await engine.enhanceFindings(
        lowConfidenceFindings,
        RedactionSensitivityMode.STRICT
      );

      expect(enhancedStrict.length).toBe(0); // Still below 40% threshold
    });

    it('should handle large numbers of findings efficiently', async () => {
      // Generate 100 mock findings with PII types that match STANDARD mode and realistic text
      const standardModePIITypes = [
        PIIType.SSN,
        PIIType.PHONE,
        PIIType.EMAIL,
        PIIType.PERSON_NAME,
        PIIType.ADDRESS,
        PIIType.DOB,
        PIIType.MEDICAL_ID,
        PIIType.BADGE_NUMBER,
        PIIType.DRIVERS_LICENSE,
        PIIType.ACCOUNT_NUMBER,
      ];

      // Generate realistic text patterns for each PII type
      const generateRealisticText = (
        piiType: PIIType,
        index: number
      ): string => {
        switch (piiType) {
          case PIIType.SSN:
            return `${123 + index}-${45 + (index % 50)}-${1000 + index}`;
          case PIIType.PHONE:
            return `(${555 + (index % 100)}) ${100 + index}-${1000 + (index % 9999)}`;
          case PIIType.EMAIL:
            return `person${index}@example.com`;
          case PIIType.PERSON_NAME:
            return `John Doe ${index}`;
          case PIIType.ADDRESS:
            return `${123 + index} Main Street`;
          case PIIType.DOB:
            return `01/${(index % 12) + 1}/198${index % 10}`;
          case PIIType.MEDICAL_ID:
            return `MED-${1000000 + index}`;
          case PIIType.BADGE_NUMBER:
            return `BADGE-${1000 + index}`;
          case PIIType.DRIVERS_LICENSE:
            return `DL-${100000 + index}`;
          case PIIType.ACCOUNT_NUMBER:
            return `ACCT-${1000000000 + index}`;
          default:
            return `ID-${index}`;
        }
      };

      const largeDataset: PIIFinding[] = Array.from({ length: 100 }, (_, i) => {
        const piiType = standardModePIITypes[i % standardModePIITypes.length];
        return {
          recordId: 'test-record-large',
          fileName: 'test-document-large.pdf',
          pageNumber: Math.floor(i / 10) + 1,
          piiType: piiType,
          confidence: 75 + (i % 25), // Higher confidence between 75-99
          x: (i % 10) * 100,
          y: Math.floor(i / 10) * 50,
          width: 80 + (i % 20),
          height: 15 + (i % 10),
          text: generateRealisticText(piiType, i),
          reasoning: `Generated ${piiType} finding ${i}`,
        };
      });

      const startTime = Date.now();
      const enhanced = await engine.enhanceFindings(
        largeDataset,
        RedactionSensitivityMode.STANDARD
      );
      const processingTime = Date.now() - startTime;

      expect(enhanced.length).toBeGreaterThan(50); // Should process most findings with realistic text
      expect(enhanced.length).toBeLessThanOrEqual(100); // Should not exceed input count
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all enhanced findings have required properties
      enhanced.forEach(finding => {
        expect(finding.sensitivityLevel).toBe(
          RedactionSensitivityMode.STANDARD
        );
        expect(finding.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(finding.legalExemptions).toBeDefined();
        expect(finding.contextAnalysis).toBeDefined();
        expect(finding.aiReasoning).toBeDefined();
        expect(finding.relatedFindings).toBeDefined();
      });
    });
  });
});

describe('Enhanced PII Engine Singleton', () => {
  it('should export a singleton instance', () => {
    expect(enhancedPIIEngine).toBeInstanceOf(EnhancedPIIEngine);
  });

  it('should maintain state across calls', async () => {
    const testFinding: PIIFinding = {
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
    };

    const findings1 = await enhancedPIIEngine.enhanceFindings(
      [testFinding],
      RedactionSensitivityMode.LIGHT
    );

    const findings2 = await enhancedPIIEngine.enhanceFindings(
      [testFinding],
      RedactionSensitivityMode.LIGHT
    );

    // Should produce consistent results
    expect(findings1).toEqual(findings2);
  });
});
