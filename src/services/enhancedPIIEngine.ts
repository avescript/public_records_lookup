/**
 * Enhanced PII Detection Engine
 * US-V2-030: Enhanced AI Redaction System
 *
 * Advanced PII detection with multi-level sensitivity, confidence scoring,
 * legal exemption detection, and context-aware analysis.
 */

import { SensitivityLevel } from './agencyTypes';
import { PIIFinding, PIIType } from './piiDetectionService';

export enum RedactionSensitivityMode {
  LIGHT = 'light',
  STANDARD = 'standard',
  STRICT = 'strict',
}

export enum LegalExemptionType {
  FOIA_B1_NATIONAL_SECURITY = 'foia_b1_national_security',
  FOIA_B2_INTERNAL_RULES = 'foia_b2_internal_rules',
  FOIA_B3_STATUTORY_PROHIBITION = 'foia_b3_statutory_prohibition',
  FOIA_B4_TRADE_SECRETS = 'foia_b4_trade_secrets',
  FOIA_B5_DELIBERATIVE_PROCESS = 'foia_b5_deliberative_process',
  FOIA_B6_PERSONAL_PRIVACY = 'foia_b6_personal_privacy',
  FOIA_B7_LAW_ENFORCEMENT = 'foia_b7_law_enforcement',
  FOIA_B8_FINANCIAL_INSTITUTIONS = 'foia_b8_financial_institutions',
  FOIA_B9_GEOLOGICAL_INFORMATION = 'foia_b9_geological_information',
  STATE_PRIVACY_ACT = 'state_privacy_act',
  HIPAA_HEALTH_INFORMATION = 'hipaa_health_information',
  FERPA_EDUCATION_RECORDS = 'ferpa_education_records',
  LAW_ENFORCEMENT_SENSITIVE = 'law_enforcement_sensitive',
  ONGOING_INVESTIGATION = 'ongoing_investigation',
  CONFIDENTIAL_SOURCE = 'confidential_source',
}

export interface EnhancedPIIFinding extends PIIFinding {
  sensitivityLevel: RedactionSensitivityMode;
  confidenceScore: number; // 0-100
  legalExemptions: LegalExemptionType[];
  contextAnalysis: {
    surroundingText: string;
    contextRelevance: number;
    redactionRecommendation: 'required' | 'recommended' | 'optional';
  };
  aiReasoning: string;
  relatedFindings: string[]; // IDs of related findings
}

export interface RedactionConfidenceMetrics {
  overallConfidence: number;
  detectionAccuracy: number;
  contextRelevance: number;
  legalCompliance: number;
  consistencyScore: number;
}

export interface SensitivityModeConfig {
  mode: RedactionSensitivityMode;
  description: string;
  piiTypesIncluded: PIIType[];
  confidenceThreshold: number;
  legalExemptionsEnabled: boolean;
  contextAnalysisDepth: 'basic' | 'standard' | 'deep';
}

export class EnhancedPIIEngine {
  private readonly LIGHT_MODE_THRESHOLD = 75;
  private readonly STANDARD_MODE_THRESHOLD = 60;
  private readonly STRICT_MODE_THRESHOLD = 40;

  private readonly sensitivityConfigs: Record<
    RedactionSensitivityMode,
    SensitivityModeConfig
  > = {
    [RedactionSensitivityMode.LIGHT]: {
      mode: RedactionSensitivityMode.LIGHT,
      description:
        'Basic PII protection - only high-confidence, clearly identifiable PII',
      piiTypesIncluded: [
        PIIType.SSN,
        PIIType.PHONE,
        PIIType.EMAIL,
        PIIType.DRIVERS_LICENSE,
        PIIType.ACCOUNT_NUMBER,
      ],
      confidenceThreshold: this.LIGHT_MODE_THRESHOLD,
      legalExemptionsEnabled: false,
      contextAnalysisDepth: 'basic',
    },
    [RedactionSensitivityMode.STANDARD]: {
      mode: RedactionSensitivityMode.STANDARD,
      description:
        'Comprehensive PII protection - includes names, addresses, and contextual PII',
      piiTypesIncluded: [
        PIIType.SSN,
        PIIType.PHONE,
        PIIType.EMAIL,
        PIIType.DRIVERS_LICENSE,
        PIIType.ACCOUNT_NUMBER,
        PIIType.PERSON_NAME,
        PIIType.ADDRESS,
        PIIType.DOB,
        PIIType.MEDICAL_ID,
        PIIType.BADGE_NUMBER,
      ],
      confidenceThreshold: this.STANDARD_MODE_THRESHOLD,
      legalExemptionsEnabled: true,
      contextAnalysisDepth: 'standard',
    },
    [RedactionSensitivityMode.STRICT]: {
      mode: RedactionSensitivityMode.STRICT,
      description:
        'Maximum protection - includes all PII types, case numbers, and potential identifiers',
      piiTypesIncluded: Object.values(PIIType),
      confidenceThreshold: this.STRICT_MODE_THRESHOLD,
      legalExemptionsEnabled: true,
      contextAnalysisDepth: 'deep',
    },
  };

  /**
   * Enhance existing PII findings with advanced analysis
   */
  async enhanceFindings(
    findings: PIIFinding[],
    sensitivityMode: RedactionSensitivityMode = RedactionSensitivityMode.STANDARD,
    documentContext?: string
  ): Promise<EnhancedPIIFinding[]> {
    const config = this.sensitivityConfigs[sensitivityMode];
    const enhancedFindings: EnhancedPIIFinding[] = [];

    for (const finding of findings) {
      // Skip findings not included in current sensitivity mode
      if (!config.piiTypesIncluded.includes(finding.piiType)) {
        continue;
      }

      // Calculate enhanced confidence score
      const confidenceScore = this.calculateEnhancedConfidence(
        finding,
        config,
        documentContext
      );

      // Skip if below confidence threshold
      if (confidenceScore < config.confidenceThreshold) {
        continue;
      }

      // Detect legal exemptions
      const legalExemptions = config.legalExemptionsEnabled
        ? await this.detectLegalExemptions(finding, documentContext)
        : [];

      // Perform context analysis
      const contextAnalysis = await this.analyzeContext(
        finding,
        documentContext,
        config.contextAnalysisDepth
      );

      // Generate AI reasoning
      const aiReasoning = this.generateAIReasoning(
        finding,
        confidenceScore,
        legalExemptions,
        contextAnalysis
      );

      // Find related findings
      const relatedFindings = this.findRelatedFindings(finding, findings);

      enhancedFindings.push({
        ...finding,
        sensitivityLevel: sensitivityMode,
        confidenceScore,
        legalExemptions,
        contextAnalysis,
        aiReasoning,
        relatedFindings,
      });
    }

    return enhancedFindings;
  }

  /**
   * Calculate enhanced confidence score using multiple factors
   */
  private calculateEnhancedConfidence(
    finding: PIIFinding,
    config: SensitivityModeConfig,
    documentContext?: string
  ): number {
    let baseScore = finding.confidence;

    // Apply PII type confidence modifiers
    const typeConfidenceModifier = this.getPIITypeConfidenceModifier(
      finding.piiType
    );
    baseScore *= typeConfidenceModifier;

    // Apply pattern matching confidence
    const patternScore = this.calculatePatternMatchingScore(finding);
    baseScore = (baseScore + patternScore) / 2;

    // Apply context relevance boost
    if (documentContext && config.contextAnalysisDepth !== 'basic') {
      const contextBoost = this.calculateContextRelevanceScore(
        finding,
        documentContext
      );
      baseScore = baseScore * (1 + contextBoost * 0.2); // Up to 20% boost
    }

    // Apply length and format validation
    const formatScore = this.validatePIIFormat(finding);
    baseScore *= formatScore;

    return Math.min(100, Math.max(0, Math.round(baseScore)));
  }

  /**
   * Get confidence modifier based on PII type characteristics
   */
  private getPIITypeConfidenceModifier(piiType: PIIType): number {
    const modifiers: Record<PIIType, number> = {
      [PIIType.SSN]: 1.1, // SSNs have distinct patterns
      [PIIType.PHONE]: 1.05, // Phone numbers are fairly distinct
      [PIIType.EMAIL]: 1.1, // Email addresses have clear patterns
      [PIIType.DRIVERS_LICENSE]: 1.0,
      [PIIType.ACCOUNT_NUMBER]: 0.9, // Can be confused with other numbers
      [PIIType.PERSON_NAME]: 0.8, // Names can be ambiguous
      [PIIType.ADDRESS]: 0.85, // Addresses can be partial
      [PIIType.DOB]: 0.95, // Dates can be ambiguous
      [PIIType.MEDICAL_ID]: 1.0,
      [PIIType.BADGE_NUMBER]: 0.9,
      [PIIType.CASE_NUMBER]: 0.85, // Can be confused with other references
      [PIIType.INCIDENT_NUMBER]: 0.85,
      [PIIType.VEHICLE_ID]: 0.9,
      [PIIType.ROUTING_NUMBER]: 1.05, // Bank routing numbers have specific format
      [PIIType.CONFIDENTIAL_SOURCE]: 1.1, // High importance for redaction
    };

    return modifiers[piiType] || 1.0;
  }

  /**
   * Calculate pattern matching score for PII finding
   */
  private calculatePatternMatchingScore(finding: PIIFinding): number {
    const patterns: Record<PIIType, RegExp> = {
      [PIIType.SSN]: /^\d{3}-?\d{2}-?\d{4}$/,
      [PIIType.PHONE]: /^(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
      [PIIType.EMAIL]: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      [PIIType.DRIVERS_LICENSE]: /^[A-Z]{1,2}\d{6,8}$/i,
      [PIIType.ACCOUNT_NUMBER]: /^\d{8,17}$/,
      [PIIType.ROUTING_NUMBER]: /^\d{9}$/,
      [PIIType.DOB]: /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,
      [PIIType.MEDICAL_ID]: /^[A-Z]{2,3}\d{6,9}$/i,
      [PIIType.BADGE_NUMBER]: /^(BADGE|#)?\s*\d{3,6}$/i,
      [PIIType.CASE_NUMBER]: /^(CASE|#)?\s*\d{4,10}$/i,
      [PIIType.INCIDENT_NUMBER]: /^(INC|INCIDENT)?\s*\d{4,10}$/i,
      [PIIType.VEHICLE_ID]: /^[A-Z0-9]{6,17}$/i,
      [PIIType.PERSON_NAME]: /^[A-Z][a-z]+\s+[A-Z][a-z]+/,
      [PIIType.ADDRESS]:
        /^\d+\s+[A-Za-z0-9\s]+,?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/,
      [PIIType.CONFIDENTIAL_SOURCE]:
        /^(SOURCE|CI|INFORMANT|WITNESS)\s*[A-Z0-9]+$/i,
    };

    const pattern = patterns[finding.piiType];
    if (!pattern) return finding.confidence;

    const matches = pattern.test(finding.text.trim());
    return matches
      ? Math.min(100, finding.confidence + 15)
      : Math.max(0, finding.confidence - 10);
  }

  /**
   * Calculate context relevance score
   */
  private calculateContextRelevanceScore(
    finding: PIIFinding,
    documentContext: string
  ): number {
    const contextWindow = this.extractContextWindow(finding, documentContext);

    // Look for privacy-sensitive context indicators
    const privacySensitiveTerms = [
      'confidential',
      'private',
      'personal',
      'sensitive',
      'classified',
      'investigation',
      'witness',
      'victim',
      'informant',
      'medical',
      'attorney-client',
      'privileged',
      'redact',
      'protect',
    ];

    const contextLower = contextWindow.toLowerCase();
    const sensitiveTermMatches = privacySensitiveTerms.filter(term =>
      contextLower.includes(term)
    ).length;

    return Math.min(1.0, sensitiveTermMatches * 0.2);
  }

  /**
   * Extract context window around PII finding
   */
  private extractContextWindow(
    finding: PIIFinding,
    documentContext: string,
    windowSize: number = 100
  ): string {
    // In a real implementation, this would extract text around the finding's coordinates
    // For now, return a simulated context window
    const startPos = Math.max(
      0,
      documentContext.indexOf(finding.text) - windowSize
    );
    const endPos = Math.min(
      documentContext.length,
      documentContext.indexOf(finding.text) + finding.text.length + windowSize
    );

    return documentContext.substring(startPos, endPos);
  }

  /**
   * Validate PII format and return confidence multiplier
   */
  private validatePIIFormat(finding: PIIFinding): number {
    // Basic format validation - in production this would be more sophisticated
    const text = finding.text.trim();

    if (text.length === 0) return 0;
    if (text.length < 3) return 0.5;

    // Check for obvious false positives
    const falsePositivePatterns = [
      /^(test|sample|example|xxx)/i,
      /^[0-9]+$/, // Pure numbers without context
      /^[a-z]+$/, // Pure lowercase letters
      /^\*+$/, // Just asterisks
    ];

    for (const pattern of falsePositivePatterns) {
      if (pattern.test(text)) {
        return 0.3;
      }
    }

    return 1.0;
  }

  /**
   * Detect applicable legal exemptions
   */
  private async detectLegalExemptions(
    finding: PIIFinding,
    documentContext?: string
  ): Promise<LegalExemptionType[]> {
    const exemptions: LegalExemptionType[] = [];

    // Always include personal privacy for personal PII
    const personalPIITypes = [
      PIIType.SSN,
      PIIType.PERSON_NAME,
      PIIType.ADDRESS,
      PIIType.DOB,
      PIIType.PHONE,
      PIIType.EMAIL,
      PIIType.DRIVERS_LICENSE,
      PIIType.MEDICAL_ID,
    ];

    if (personalPIITypes.includes(finding.piiType)) {
      exemptions.push(LegalExemptionType.FOIA_B6_PERSONAL_PRIVACY);
    }

    // Law enforcement related exemptions
    const lawEnforcementTypes = [
      PIIType.BADGE_NUMBER,
      PIIType.CASE_NUMBER,
      PIIType.INCIDENT_NUMBER,
      PIIType.CONFIDENTIAL_SOURCE,
      PIIType.VEHICLE_ID,
    ];

    if (lawEnforcementTypes.includes(finding.piiType)) {
      exemptions.push(LegalExemptionType.FOIA_B7_LAW_ENFORCEMENT);
      exemptions.push(LegalExemptionType.LAW_ENFORCEMENT_SENSITIVE);
    }

    // Medical information
    if (finding.piiType === PIIType.MEDICAL_ID) {
      exemptions.push(LegalExemptionType.HIPAA_HEALTH_INFORMATION);
    }

    // Financial information
    if (
      [PIIType.ACCOUNT_NUMBER, PIIType.ROUTING_NUMBER].includes(finding.piiType)
    ) {
      exemptions.push(LegalExemptionType.FOIA_B8_FINANCIAL_INSTITUTIONS);
    }

    // Confidential sources
    if (finding.piiType === PIIType.CONFIDENTIAL_SOURCE) {
      exemptions.push(LegalExemptionType.CONFIDENTIAL_SOURCE);
      exemptions.push(LegalExemptionType.ONGOING_INVESTIGATION);
    }

    // Context-based detection (simplified)
    if (documentContext) {
      const contextLower = documentContext.toLowerCase();

      if (
        contextLower.includes('investigation') ||
        contextLower.includes('ongoing')
      ) {
        exemptions.push(LegalExemptionType.ONGOING_INVESTIGATION);
      }

      if (
        contextLower.includes('national security') ||
        contextLower.includes('classified')
      ) {
        exemptions.push(LegalExemptionType.FOIA_B1_NATIONAL_SECURITY);
      }

      if (
        contextLower.includes('trade secret') ||
        contextLower.includes('proprietary')
      ) {
        exemptions.push(LegalExemptionType.FOIA_B4_TRADE_SECRETS);
      }
    }

    return [...new Set(exemptions)]; // Remove duplicates
  }

  /**
   * Analyze context around PII finding
   */
  private async analyzeContext(
    finding: PIIFinding,
    documentContext?: string,
    depth: 'basic' | 'standard' | 'deep' = 'standard'
  ): Promise<EnhancedPIIFinding['contextAnalysis']> {
    const contextWindow = documentContext
      ? this.extractContextWindow(
          finding,
          documentContext,
          depth === 'deep' ? 200 : 100
        )
      : finding.text;

    const relevanceScore = documentContext
      ? this.calculateContextRelevanceScore(finding, documentContext)
      : 0.5;

    // Determine redaction recommendation based on PII type and context
    let recommendation: 'required' | 'recommended' | 'optional' = 'recommended';

    // Required redaction for high-risk PII
    const highRiskTypes = [
      PIIType.SSN,
      PIIType.ACCOUNT_NUMBER,
      PIIType.ROUTING_NUMBER,
      PIIType.DRIVERS_LICENSE,
      PIIType.MEDICAL_ID,
      PIIType.CONFIDENTIAL_SOURCE,
    ];

    if (highRiskTypes.includes(finding.piiType)) {
      recommendation = 'required';
    }

    // Optional for low-risk in certain contexts
    const lowRiskTypes = [
      PIIType.CASE_NUMBER,
      PIIType.INCIDENT_NUMBER,
      PIIType.BADGE_NUMBER,
    ];
    if (lowRiskTypes.includes(finding.piiType) && relevanceScore < 0.3) {
      recommendation = 'optional';
    }

    return {
      surroundingText: contextWindow,
      contextRelevance: relevanceScore,
      redactionRecommendation: recommendation,
    };
  }

  /**
   * Generate AI reasoning explanation
   */
  private generateAIReasoning(
    finding: PIIFinding,
    confidenceScore: number,
    legalExemptions: LegalExemptionType[],
    contextAnalysis: EnhancedPIIFinding['contextAnalysis']
  ): string {
    const reasons: string[] = [];

    // Confidence-based reasoning
    if (confidenceScore >= 90) {
      reasons.push(
        `High confidence (${confidenceScore}%) ${finding.piiType} detected with clear pattern match`
      );
    } else if (confidenceScore >= 70) {
      reasons.push(
        `Moderate confidence (${confidenceScore}%) ${finding.piiType} identified`
      );
    } else {
      reasons.push(
        `Low confidence (${confidenceScore}%) potential ${finding.piiType}`
      );
    }

    // Legal exemption reasoning
    if (legalExemptions.length > 0) {
      const exemptionNames = legalExemptions.map(ex =>
        ex.replace(/_/g, ' ').toLowerCase()
      );
      reasons.push(`Protected under: ${exemptionNames.join(', ')}`);
    }

    // Context reasoning
    if (contextAnalysis.contextRelevance > 0.5) {
      reasons.push('Found in privacy-sensitive context');
    }

    // Recommendation reasoning
    if (contextAnalysis.redactionRecommendation === 'required') {
      reasons.push('Redaction required for compliance');
    } else if (contextAnalysis.redactionRecommendation === 'recommended') {
      reasons.push('Redaction recommended for privacy protection');
    } else {
      reasons.push('Redaction optional - review for necessity');
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Find related findings (same person, document section, etc.)
   */
  private findRelatedFindings(
    finding: PIIFinding,
    allFindings: PIIFinding[]
  ): string[] {
    const related: string[] = [];

    for (const other of allFindings) {
      if (
        other.recordId === finding.recordId &&
        other.fileName === finding.fileName
      ) {
        // Same page proximity
        if (other.pageNumber === finding.pageNumber) {
          const distance = Math.sqrt(
            Math.pow(other.x - finding.x, 2) + Math.pow(other.y - finding.y, 2)
          );
          if (distance < 200) {
            // Within 200 pixels
            related.push(
              `${other.piiType}_${other.pageNumber}_${other.x}_${other.y}`
            );
          }
        }

        // Same text content (potential duplicates)
        if (
          other.text.toLowerCase() === finding.text.toLowerCase() &&
          other !== finding
        ) {
          related.push(
            `${other.piiType}_${other.pageNumber}_${other.x}_${other.y}`
          );
        }
      }
    }

    return related;
  }

  /**
   * Get sensitivity mode configuration
   */
  getSensitivityModeConfig(
    mode: RedactionSensitivityMode
  ): SensitivityModeConfig {
    return this.sensitivityConfigs[mode];
  }

  /**
   * Get all available sensitivity modes
   */
  getAllSensitivityModes(): SensitivityModeConfig[] {
    return Object.values(this.sensitivityConfigs);
  }

  /**
   * Calculate overall confidence metrics for a set of findings
   */
  calculateConfidenceMetrics(
    findings: EnhancedPIIFinding[]
  ): RedactionConfidenceMetrics {
    if (findings.length === 0) {
      return {
        overallConfidence: 0,
        detectionAccuracy: 0,
        contextRelevance: 0,
        legalCompliance: 100,
        consistencyScore: 0,
      };
    }

    const overallConfidence =
      findings.reduce((sum, f) => sum + f.confidenceScore, 0) / findings.length;

    const detectionAccuracy =
      (findings.filter(f => f.confidenceScore >= 70).length / findings.length) *
      100;

    const contextRelevance =
      (findings.reduce(
        (sum, f) => sum + f.contextAnalysis.contextRelevance,
        0
      ) /
        findings.length) *
      100;

    const legalCompliance =
      (findings.filter(f => f.legalExemptions.length > 0).length /
        findings.length) *
      100;

    // Calculate consistency score based on similar findings having similar confidence
    const consistencyScore = this.calculateConsistencyScore(findings);

    return {
      overallConfidence: Math.round(overallConfidence),
      detectionAccuracy: Math.round(detectionAccuracy),
      contextRelevance: Math.round(contextRelevance),
      legalCompliance: Math.round(legalCompliance),
      consistencyScore: Math.round(consistencyScore),
    };
  }

  /**
   * Calculate consistency score for findings
   */
  private calculateConsistencyScore(findings: EnhancedPIIFinding[]): number {
    const typeGroups: Record<PIIType, number[]> = {} as Record<
      PIIType,
      number[]
    >;

    // Group confidence scores by PII type
    findings.forEach(finding => {
      if (!typeGroups[finding.piiType]) {
        typeGroups[finding.piiType] = [];
      }
      typeGroups[finding.piiType].push(finding.confidenceScore);
    });

    // Calculate variance within each type
    let totalVariance = 0;
    let typeCount = 0;

    for (const [type, scores] of Object.entries(typeGroups)) {
      if (scores.length > 1) {
        const mean =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance =
          scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
          scores.length;
        totalVariance += variance;
        typeCount++;
      }
    }

    // Convert variance to consistency score (lower variance = higher consistency)
    const averageVariance = typeCount > 0 ? totalVariance / typeCount : 0;
    return Math.max(0, 100 - averageVariance / 10); // Scale variance to 0-100
  }
}

// Export singleton instance
export const enhancedPIIEngine = new EnhancedPIIEngine();
export default enhancedPIIEngine;
