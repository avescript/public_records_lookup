/**
 * Redaction Confidence Analyzer
 * US-V2-030: Enhanced AI Redaction System
 *
 * Provides advanced analytics and confidence scoring for redaction decisions,
 * including pattern analysis, consistency checking, and quality assessment.
 */

import {
  EnhancedPIIFinding,
  LegalExemptionType,
  RedactionConfidenceMetrics,
} from './enhancedPIIEngine';
import { PIIFinding, PIIType } from './piiDetectionService';
import { ManualRedaction } from './redactionService';

export interface RedactionQualityAssessment {
  recordId: string;
  fileName: string;
  overallQuality: number; // 0-100
  completeness: number; // Percentage of PII properly redacted
  accuracy: number; // Accuracy of redaction decisions
  consistency: number; // Consistency across similar findings
  legalCompliance: number; // Legal exemption coverage
  recommendations: QualityRecommendation[];
  riskAssessment: RedactionRiskLevel;
}

export interface RedactionQualityReport extends RedactionQualityAssessment {
  generatedAt: Date;
  processingTime: number;
  totalFindings: number;
  redactedFindings: number;
  manualReviews: number;
}

export interface QualityRecommendation {
  id: string;
  type:
    | 'missing_redaction'
    | 'over_redaction'
    | 'inconsistency'
    | 'legal_gap'
    | 'low_confidence';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedFindings: string[];
  suggestedAction: string;
  autoFixAvailable: boolean;
}

export enum RedactionRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface RedactionPatternAnalysis {
  commonPatterns: {
    piiType: PIIType;
    pattern: string;
    occurrences: number;
    averageConfidence: number;
  }[];
  anomalies: {
    findingId: string;
    anomalyType:
      | 'confidence_outlier'
      | 'pattern_mismatch'
      | 'context_inconsistency';
    description: string;
    severity: number; // 0-10
  }[];
  suggestions: {
    description: string;
    potentialImpact: string;
    implementationDifficulty: 'easy' | 'medium' | 'hard';
  }[];
}

export interface RedactionConsistencyCheck {
  recordId: string;
  fileName: string;
  consistencyScore: number; // 0-100
  inconsistencies: {
    findingId1: string;
    findingId2: string;
    type:
      | 'confidence_variance'
      | 'similar_content_different_treatment'
      | 'exemption_mismatch';
    description: string;
    recommendedResolution: string;
  }[];
  patterns: {
    consistent: string[];
    inconsistent: string[];
  };
}

export interface RedactionGapAnalysis {
  recordId: string;
  fileName: string;
  potentialGaps: {
    pageNumber: number;
    coordinate: { x: number; y: number; width: number; height: number };
    suspectedPII: PIIType;
    confidence: number;
    reasoning: string;
  }[];
  overRedaction: {
    redactionId: string;
    reasoning: string;
    confidence: number;
  }[];
  missedOpportunities: {
    description: string;
    location: { pageNumber: number; x: number; y: number };
    piiType: PIIType;
    riskLevel: RedactionRiskLevel;
  }[];
}

export class RedactionConfidenceAnalyzer {
  /**
   * Analyze overall redaction quality for a document
   */
  async analyzeRedactionQuality(
    findings: EnhancedPIIFinding[],
    manualRedactions: ManualRedaction[],
    documentContext?: string
  ): Promise<RedactionQualityAssessment> {
    const completeness = await this.calculateCompleteness(
      findings,
      manualRedactions
    );
    const accuracy = await this.calculateAccuracy(findings, manualRedactions);
    const consistency = await this.calculateConsistency(findings);
    const legalCompliance = await this.calculateLegalCompliance(findings);

    const overallQuality =
      (completeness + accuracy + consistency + legalCompliance) / 4;

    const recommendations = await this.generateQualityRecommendations(
      findings,
      manualRedactions,
      completeness,
      accuracy,
      consistency,
      legalCompliance
    );

    const riskAssessment = this.assessRiskLevel(
      overallQuality,
      recommendations
    );

    return {
      recordId: findings[0]?.recordId || 'unknown',
      fileName: findings[0]?.fileName || 'unknown',
      overallQuality: Math.round(overallQuality),
      completeness: Math.round(completeness),
      accuracy: Math.round(accuracy),
      consistency: Math.round(consistency),
      legalCompliance: Math.round(legalCompliance),
      recommendations,
      riskAssessment,
    };
  }

  /**
   * Calculate completeness score (percentage of required PII that is redacted)
   */
  private async calculateCompleteness(
    findings: EnhancedPIIFinding[],
    manualRedactions: ManualRedaction[]
  ): Promise<number> {
    const requiredRedactions = findings.filter(
      f =>
        f.contextAnalysis.redactionRecommendation === 'required' ||
        (f.contextAnalysis.redactionRecommendation === 'recommended' &&
          f.confidenceScore >= 80)
    );

    if (requiredRedactions.length === 0) return 100;

    // Check how many required redactions have corresponding manual redactions
    let coveredRedactions = 0;

    for (const required of requiredRedactions) {
      const hasCoverage = manualRedactions.some(manual =>
        this.isRedactionCovered(required, manual)
      );

      if (hasCoverage) {
        coveredRedactions++;
      }
    }

    return (coveredRedactions / requiredRedactions.length) * 100;
  }

  /**
   * Check if a PII finding is covered by a manual redaction
   */
  private isRedactionCovered(
    finding: EnhancedPIIFinding,
    redaction: ManualRedaction
  ): boolean {
    // Check if they're on the same page
    if (finding.pageNumber !== redaction.pageNumber) return false;

    // Check if the redaction box covers the finding
    const findingRight = finding.x + finding.width;
    const findingBottom = finding.y + finding.height;
    const redactionRight = redaction.x + redaction.width;
    const redactionBottom = redaction.y + redaction.height;

    const overlapX = Math.max(
      0,
      Math.min(findingRight, redactionRight) - Math.max(finding.x, redaction.x)
    );
    const overlapY = Math.max(
      0,
      Math.min(findingBottom, redactionBottom) -
        Math.max(finding.y, redaction.y)
    );
    const overlapArea = overlapX * overlapY;
    const findingArea = finding.width * finding.height;

    // Consider covered if overlap is at least 70% of the finding area
    return overlapArea / findingArea >= 0.7;
  }

  /**
   * Calculate accuracy score (how accurate the redaction decisions are)
   */
  private async calculateAccuracy(
    findings: EnhancedPIIFinding[],
    manualRedactions: ManualRedaction[]
  ): Promise<number> {
    let accurateDecisions = 0;
    let totalDecisions = findings.length + manualRedactions.length;

    // Check accuracy of AI findings
    for (const finding of findings) {
      if (
        finding.confidenceScore >= 80 &&
        finding.contextAnalysis.redactionRecommendation !== 'optional'
      ) {
        accurateDecisions++;
      } else if (
        finding.confidenceScore < 50 &&
        finding.contextAnalysis.redactionRecommendation === 'optional'
      ) {
        accurateDecisions++;
      } else if (
        finding.confidenceScore >= 50 &&
        finding.confidenceScore < 80
      ) {
        accurateDecisions += 0.7; // Partial credit for moderate confidence
      }
    }

    // Check for over-redaction in manual redactions
    for (const redaction of manualRedactions) {
      const hasCorrespondingFinding = findings.some(finding =>
        this.isRedactionCovered(finding, redaction)
      );

      if (hasCorrespondingFinding) {
        accurateDecisions++;
      } else {
        // Manual redaction without corresponding AI finding - could be over-redaction
        // Give partial credit as it might be valid human judgment
        accurateDecisions += 0.5;
      }
    }

    return totalDecisions > 0
      ? (accurateDecisions / totalDecisions) * 100
      : 100;
  }

  /**
   * Calculate consistency score across similar findings
   */
  private async calculateConsistency(
    findings: EnhancedPIIFinding[]
  ): Promise<number> {
    const typeGroups: Record<PIIType, EnhancedPIIFinding[]> = {} as Record<
      PIIType,
      EnhancedPIIFinding[]
    >;

    // Group findings by PII type
    findings.forEach(finding => {
      if (!typeGroups[finding.piiType]) {
        typeGroups[finding.piiType] = [];
      }
      typeGroups[finding.piiType].push(finding);
    });

    let consistencyScores: number[] = [];

    // Calculate consistency within each PII type group
    for (const [type, groupFindings] of Object.entries(typeGroups)) {
      if (groupFindings.length > 1) {
        const confidenceVariance = this.calculateVariance(
          groupFindings.map(f => f.confidenceScore)
        );
        const recommendationConsistency =
          this.calculateRecommendationConsistency(groupFindings);

        // Lower variance and higher recommendation consistency = better score
        const groupConsistency =
          Math.max(0, 100 - confidenceVariance / 2) *
          (recommendationConsistency / 100);
        consistencyScores.push(groupConsistency);
      }
    }

    return consistencyScores.length > 0
      ? consistencyScores.reduce((sum, score) => sum + score, 0) /
          consistencyScores.length
      : 100;
  }

  /**
   * Calculate variance for a set of numbers
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  /**
   * Calculate recommendation consistency for a group of findings
   */
  private calculateRecommendationConsistency(
    findings: EnhancedPIIFinding[]
  ): number {
    const recommendations = findings.map(
      f => f.contextAnalysis.redactionRecommendation
    );
    const uniqueRecommendations = [...new Set(recommendations)];

    // More consistent if fewer unique recommendations
    if (uniqueRecommendations.length === 1) return 100;
    if (uniqueRecommendations.length === 2) return 70;
    return 40;
  }

  /**
   * Calculate legal compliance score
   */
  private async calculateLegalCompliance(
    findings: EnhancedPIIFinding[]
  ): Promise<number> {
    const requiresExemption = findings.filter(
      f =>
        f.contextAnalysis.redactionRecommendation === 'required' ||
        f.confidenceScore >= 80
    );

    if (requiresExemption.length === 0) return 100;

    const hasExemption = requiresExemption.filter(
      f => f.legalExemptions.length > 0
    ).length;
    return (hasExemption / requiresExemption.length) * 100;
  }

  /**
   * Generate quality improvement recommendations
   */
  private async generateQualityRecommendations(
    findings: EnhancedPIIFinding[],
    manualRedactions: ManualRedaction[],
    completeness: number,
    accuracy: number,
    consistency: number,
    legalCompliance: number
  ): Promise<QualityRecommendation[]> {
    const recommendations: QualityRecommendation[] = [];

    // Completeness recommendations
    if (completeness < 80) {
      const missingRedactions = this.findMissingRedactions(
        findings,
        manualRedactions
      );
      recommendations.push({
        id: 'missing_redactions',
        type: 'missing_redaction',
        severity:
          completeness < 50
            ? 'critical'
            : completeness < 70
              ? 'high'
              : 'medium',
        description: `${missingRedactions.length} high-confidence PII findings lack redaction coverage`,
        affectedFindings: missingRedactions.map(
          f => `${f.piiType}_${f.pageNumber}_${f.x}_${f.y}`
        ),
        suggestedAction:
          'Review and add manual redactions for uncovered PII findings',
        autoFixAvailable: true,
      });
    }

    // Accuracy recommendations
    if (accuracy < 70) {
      recommendations.push({
        id: 'accuracy_improvement',
        type: 'low_confidence',
        severity: 'medium',
        description: 'Several redaction decisions have low confidence scores',
        affectedFindings: findings
          .filter(f => f.confidenceScore < 60)
          .map(f => `${f.piiType}_${f.pageNumber}_${f.x}_${f.y}`),
        suggestedAction:
          'Review low-confidence findings and adjust redaction boundaries',
        autoFixAvailable: false,
      });
    }

    // Consistency recommendations
    if (consistency < 75) {
      recommendations.push({
        id: 'consistency_improvement',
        type: 'inconsistency',
        severity: 'low',
        description:
          'Inconsistent redaction decisions found for similar PII types',
        affectedFindings: this.findInconsistentFindings(findings),
        suggestedAction: 'Standardize redaction approach for similar PII types',
        autoFixAvailable: false,
      });
    }

    // Legal compliance recommendations
    if (legalCompliance < 85) {
      recommendations.push({
        id: 'legal_compliance',
        type: 'legal_gap',
        severity: 'high',
        description:
          'Some redactions lack proper legal exemption justification',
        affectedFindings: findings
          .filter(
            f =>
              f.contextAnalysis.redactionRecommendation === 'required' &&
              f.legalExemptions.length === 0
          )
          .map(f => `${f.piiType}_${f.pageNumber}_${f.x}_${f.y}`),
        suggestedAction: 'Review and assign appropriate legal exemptions',
        autoFixAvailable: true,
      });
    }

    return recommendations;
  }

  /**
   * Find PII findings that lack manual redaction coverage
   */
  private findMissingRedactions(
    findings: EnhancedPIIFinding[],
    manualRedactions: ManualRedaction[]
  ): EnhancedPIIFinding[] {
    return findings.filter(finding => {
      if (finding.contextAnalysis.redactionRecommendation === 'optional')
        return false;
      if (finding.confidenceScore < 60) return false;

      const hasCoverage = manualRedactions.some(manual =>
        this.isRedactionCovered(finding, manual)
      );

      return !hasCoverage;
    });
  }

  /**
   * Find inconsistent findings for recommendations
   */
  private findInconsistentFindings(findings: EnhancedPIIFinding[]): string[] {
    const typeGroups: Record<PIIType, EnhancedPIIFinding[]> = {} as Record<
      PIIType,
      EnhancedPIIFinding[]
    >;

    findings.forEach(finding => {
      if (!typeGroups[finding.piiType]) {
        typeGroups[finding.piiType] = [];
      }
      typeGroups[finding.piiType].push(finding);
    });

    const inconsistent: string[] = [];

    for (const [type, groupFindings] of Object.entries(typeGroups)) {
      if (groupFindings.length > 1) {
        const confidenceVariance = this.calculateVariance(
          groupFindings.map(f => f.confidenceScore)
        );

        if (confidenceVariance > 400) {
          // High variance threshold
          inconsistent.push(
            ...groupFindings.map(
              f => `${f.piiType}_${f.pageNumber}_${f.x}_${f.y}`
            )
          );
        }
      }
    }

    return inconsistent;
  }

  /**
   * Assess overall risk level based on quality metrics
   */
  private assessRiskLevel(
    overallQuality: number,
    recommendations: QualityRecommendation[]
  ): RedactionRiskLevel {
    const criticalIssues = recommendations.filter(
      r => r.severity === 'critical'
    ).length;
    const highIssues = recommendations.filter(
      r => r.severity === 'high'
    ).length;

    if (criticalIssues > 0 || overallQuality < 50) {
      return RedactionRiskLevel.CRITICAL;
    }

    if (highIssues > 2 || overallQuality < 70) {
      return RedactionRiskLevel.HIGH;
    }

    if (highIssues > 0 || overallQuality < 85) {
      return RedactionRiskLevel.MEDIUM;
    }

    return RedactionRiskLevel.LOW;
  }

  /**
   * Analyze redaction patterns across a document
   */
  async analyzeRedactionPatterns(
    findings: EnhancedPIIFinding[]
  ): Promise<RedactionPatternAnalysis> {
    const patternGroups: Record<string, EnhancedPIIFinding[]> = {};

    // Group findings by pattern
    findings.forEach(finding => {
      const pattern = this.extractPattern(finding.text, finding.piiType);
      const key = `${finding.piiType}_${pattern}`;

      if (!patternGroups[key]) {
        patternGroups[key] = [];
      }
      patternGroups[key].push(finding);
    });

    // Identify common patterns
    const commonPatterns = Object.entries(patternGroups)
      .filter(([key, group]) => group.length >= 2)
      .map(([key, group]) => {
        const [piiType, pattern] = key.split('_', 2);
        return {
          piiType: piiType as PIIType,
          pattern,
          occurrences: group.length,
          averageConfidence:
            group.reduce((sum, f) => sum + f.confidenceScore, 0) / group.length,
        };
      })
      .sort((a, b) => b.occurrences - a.occurrences);

    // Detect anomalies
    const anomalies = this.detectPatternAnomalies(findings, commonPatterns);

    // Generate suggestions
    const suggestions = this.generatePatternSuggestions(
      commonPatterns,
      anomalies
    );

    return {
      commonPatterns,
      anomalies,
      suggestions,
    };
  }

  /**
   * Extract pattern from PII text
   */
  private extractPattern(text: string, piiType: PIIType): string {
    // Simplified pattern extraction - in production this would be more sophisticated
    switch (piiType) {
      case PIIType.SSN:
        return text.replace(/\d/g, 'X');
      case PIIType.PHONE:
        return text.replace(/\d/g, 'X');
      case PIIType.EMAIL:
        return text.replace(/[a-zA-Z0-9]/g, 'X');
      case PIIType.PERSON_NAME:
        return text
          .split(' ')
          .map(word => 'X'.repeat(word.length))
          .join(' ');
      default:
        return text.replace(/[a-zA-Z0-9]/g, 'X');
    }
  }

  /**
   * Detect pattern anomalies
   */
  private detectPatternAnomalies(
    findings: EnhancedPIIFinding[],
    commonPatterns: any[]
  ): RedactionPatternAnalysis['anomalies'] {
    const anomalies: RedactionPatternAnalysis['anomalies'] = [];

    // Find confidence outliers
    findings.forEach(finding => {
      const similarFindings = findings.filter(
        f => f.piiType === finding.piiType && f !== finding
      );

      if (similarFindings.length > 0) {
        const avgConfidence =
          similarFindings.reduce((sum, f) => sum + f.confidenceScore, 0) /
          similarFindings.length;
        const confidenceDiff = Math.abs(
          finding.confidenceScore - avgConfidence
        );

        if (confidenceDiff > 30) {
          // Significant deviation
          anomalies.push({
            findingId: `${finding.piiType}_${finding.pageNumber}_${finding.x}_${finding.y}`,
            anomalyType: 'confidence_outlier',
            description: `${finding.piiType} confidence (${finding.confidenceScore}%) significantly differs from average (${Math.round(avgConfidence)}%)`,
            severity: confidenceDiff > 50 ? 8 : 5,
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Generate pattern-based suggestions
   */
  private generatePatternSuggestions(
    commonPatterns: any[],
    anomalies: RedactionPatternAnalysis['anomalies']
  ): RedactionPatternAnalysis['suggestions'] {
    const suggestions: RedactionPatternAnalysis['suggestions'] = [];

    // Suggest pattern-based rules for common patterns
    commonPatterns.slice(0, 3).forEach(pattern => {
      if (pattern.averageConfidence > 80) {
        suggestions.push({
          description: `Create automatic redaction rule for ${pattern.piiType} pattern "${pattern.pattern}"`,
          potentialImpact: `Could automatically handle ${pattern.occurrences} similar cases`,
          implementationDifficulty: 'easy',
        });
      }
    });

    // Suggest confidence threshold adjustments
    if (anomalies.length > 0) {
      suggestions.push({
        description: 'Review confidence scoring for outlier detections',
        potentialImpact:
          'Improve consistency and reduce false positives/negatives',
        implementationDifficulty: 'medium',
      });
    }

    return suggestions;
  }

  /**
   * Perform consistency check across findings
   */
  async performConsistencyCheck(
    findings: EnhancedPIIFinding[],
    recordId: string,
    fileName: string
  ): Promise<RedactionConsistencyCheck> {
    const inconsistencies: RedactionConsistencyCheck['inconsistencies'] = [];
    const consistentPatterns: string[] = [];
    const inconsistentPatterns: string[] = [];

    // Compare similar findings for consistency
    for (let i = 0; i < findings.length; i++) {
      for (let j = i + 1; j < findings.length; j++) {
        const finding1 = findings[i];
        const finding2 = findings[j];

        if (finding1.piiType === finding2.piiType) {
          const confidenceDiff = Math.abs(
            finding1.confidenceScore - finding2.confidenceScore
          );

          // Check for significant confidence variance
          if (
            confidenceDiff > 25 &&
            finding1.text.toLowerCase() === finding2.text.toLowerCase()
          ) {
            inconsistencies.push({
              findingId1: `${finding1.piiType}_${finding1.pageNumber}_${finding1.x}_${finding1.y}`,
              findingId2: `${finding2.piiType}_${finding2.pageNumber}_${finding2.x}_${finding2.y}`,
              type: 'confidence_variance',
              description: `Identical ${finding1.piiType} content has different confidence scores: ${finding1.confidenceScore}% vs ${finding2.confidenceScore}%`,
              recommendedResolution:
                'Review and standardize confidence calculation for similar content',
            });
            inconsistentPatterns.push(`${finding1.piiType}_${finding1.text}`);
          }

          // Check for recommendation inconsistency
          if (
            finding1.contextAnalysis.redactionRecommendation !==
              finding2.contextAnalysis.redactionRecommendation &&
            Math.abs(finding1.confidenceScore - finding2.confidenceScore) < 10
          ) {
            inconsistencies.push({
              findingId1: `${finding1.piiType}_${finding1.pageNumber}_${finding1.x}_${finding1.y}`,
              findingId2: `${finding2.piiType}_${finding2.pageNumber}_${finding2.x}_${finding2.y}`,
              type: 'similar_content_different_treatment',
              description: `Similar ${finding1.piiType} findings have different redaction recommendations`,
              recommendedResolution:
                'Apply consistent redaction recommendation for similar confidence levels',
            });
          }
        }
      }
    }

    // Identify consistent patterns
    const typeGroups: Record<PIIType, EnhancedPIIFinding[]> = {} as Record<
      PIIType,
      EnhancedPIIFinding[]
    >;
    findings.forEach(finding => {
      if (!typeGroups[finding.piiType]) {
        typeGroups[finding.piiType] = [];
      }
      typeGroups[finding.piiType].push(finding);
    });

    Object.entries(typeGroups).forEach(([type, groupFindings]) => {
      if (groupFindings.length > 1) {
        const variance = this.calculateVariance(
          groupFindings.map(f => f.confidenceScore)
        );
        if (variance < 100) {
          // Low variance = consistent
          consistentPatterns.push(`${type}: Consistent confidence scoring`);
        }
      }
    });

    const consistencyScore = Math.max(0, 100 - inconsistencies.length * 10);

    return {
      recordId,
      fileName,
      consistencyScore: Math.round(consistencyScore),
      inconsistencies,
      patterns: {
        consistent: consistentPatterns,
        inconsistent: [...new Set(inconsistentPatterns)],
      },
    };
  }

  /**
   * Analyze potential redaction gaps
   */
  async analyzeRedactionGaps(
    findings: EnhancedPIIFinding[],
    manualRedactions: ManualRedaction[],
    recordId: string,
    fileName: string
  ): Promise<RedactionGapAnalysis> {
    const potentialGaps: RedactionGapAnalysis['potentialGaps'] = [];
    const overRedaction: RedactionGapAnalysis['overRedaction'] = [];
    const missedOpportunities: RedactionGapAnalysis['missedOpportunities'] = [];

    // Find potential gaps (high-confidence findings without redactions)
    findings.forEach(finding => {
      if (
        finding.confidenceScore >= 75 &&
        finding.contextAnalysis.redactionRecommendation !== 'optional'
      ) {
        const hasCoverage = manualRedactions.some(redaction =>
          this.isRedactionCovered(finding, redaction)
        );

        if (!hasCoverage) {
          potentialGaps.push({
            pageNumber: finding.pageNumber,
            coordinate: {
              x: finding.x,
              y: finding.y,
              width: finding.width,
              height: finding.height,
            },
            suspectedPII: finding.piiType,
            confidence: finding.confidenceScore,
            reasoning: finding.aiReasoning,
          });
        }
      }
    });

    // Find potential over-redaction (redactions without corresponding findings)
    manualRedactions.forEach(redaction => {
      const hasCorrespondingFinding = findings.some(
        finding =>
          this.isRedactionCovered(finding, redaction) &&
          finding.confidenceScore >= 60
      );

      if (!hasCorrespondingFinding) {
        overRedaction.push({
          redactionId: redaction.id,
          reasoning:
            'Manual redaction without corresponding high-confidence PII detection',
          confidence: 30, // Low confidence in over-redaction
        });
      }
    });

    // Find missed opportunities (patterns that suggest additional PII might be present)
    // This would involve more sophisticated analysis in production
    findings.forEach(finding => {
      if (finding.relatedFindings.length > 0) {
        missedOpportunities.push({
          description: `Related ${finding.piiType} findings suggest additional instances may be present nearby`,
          location: {
            pageNumber: finding.pageNumber,
            x: finding.x,
            y: finding.y,
          },
          piiType: finding.piiType,
          riskLevel:
            finding.confidenceScore > 80
              ? RedactionRiskLevel.HIGH
              : RedactionRiskLevel.MEDIUM,
        });
      }
    });

    return {
      recordId,
      fileName,
      potentialGaps,
      overRedaction,
      missedOpportunities,
    };
  }
}

// Export singleton instance
export const redactionConfidenceAnalyzer = new RedactionConfidenceAnalyzer();
export default redactionConfidenceAnalyzer;
