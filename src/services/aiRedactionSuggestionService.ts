/**
 * AI Redaction Suggestion Service
 * US-V2-030: Enhanced AI Redaction System
 *
 * Intelligent service that provides smart redaction recommendations,
 * consistency checking, auto-review capabilities, and bulk operations.
 */

import {
  enhancedPIIEngine,
  EnhancedPIIFinding,
  LegalExemptionType,
  RedactionSensitivityMode,
} from './enhancedPIIEngine';
import { PIIFinding, PIIType } from './piiDetectionService';
import {
  redactionConfidenceAnalyzer,
  RedactionConsistencyCheck,
  RedactionGapAnalysis,
  RedactionQualityAssessment,
} from './redactionConfidenceAnalyzer';
import {
  ManualRedaction,
  RedactionCoordinates,
  redactionService,
} from './redactionService';

export interface RedactionSuggestion {
  id: string;
  type: SuggestionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-100
  targetCoordinates: RedactionCoordinates;
  targetPIIType: PIIType;
  legalJustification: LegalExemptionType[];
  autoImplementable: boolean;
  estimatedImpact: string;
  relatedSuggestions: string[];
  metadata: {
    pageNumber: number;
    recordId: string;
    fileName: string;
    detectedText?: string;
    contextSnippet?: string;
    similarOccurrences?: number;
  };
}

export enum SuggestionType {
  NEW_REDACTION = 'new_redaction',
  EXPAND_REDACTION = 'expand_redaction',
  MERGE_REDACTIONS = 'merge_redactions',
  SPLIT_REDACTION = 'split_redaction',
  REMOVE_REDACTION = 'remove_redaction',
  ADJUST_BOUNDARIES = 'adjust_boundaries',
  ADD_LEGAL_EXEMPTION = 'add_legal_exemption',
  CONSISTENCY_FIX = 'consistency_fix',
  PATTERN_OPTIMIZATION = 'pattern_optimization',
  BATCH_SIMILAR = 'batch_similar',
}

export interface BulkSuggestionOperation {
  id: string;
  name: string;
  description: string;
  affectedSuggestions: string[];
  estimatedTime: number; // seconds
  riskLevel: 'low' | 'medium' | 'high';
  previewChanges: {
    newRedactions: number;
    modifiedRedactions: number;
    removedRedactions: number;
  };
}

export interface AutoReviewResult {
  recordId: string;
  fileName: string;
  overallScore: number; // 0-100
  issues: AutoReviewIssue[];
  recommendations: RedactionSuggestion[];
  qualityMetrics: {
    completeness: number;
    accuracy: number;
    consistency: number;
    legalCompliance: number;
  };
  riskAssessment: 'low' | 'medium' | 'high' | 'critical';
  reviewRequired: boolean;
}

export interface AutoReviewIssue {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category:
    | 'missing_redaction'
    | 'over_redaction'
    | 'inconsistency'
    | 'legal_gap'
    | 'quality';
  title: string;
  description: string;
  location: { pageNumber: number; x: number; y: number };
  suggestedFix?: RedactionSuggestion;
  affectsCompliance: boolean;
}

export interface SmartRecommendationEngine {
  recordId: string;
  fileName: string;
  learningEnabled: boolean;
  patternRecognition: boolean;
  contextAwareness: boolean;
  agencySpecificRules: boolean;
}

export class AIRedactionSuggestionService {
  private suggestionHistory: Map<string, RedactionSuggestion[]> = new Map();
  private implementedSuggestions: Set<string> = new Set();
  private userFeedback: Map<string, 'accepted' | 'rejected' | 'modified'> =
    new Map();

  /**
   * Generate comprehensive redaction suggestions for a document
   */
  async generateSuggestions(
    findings: EnhancedPIIFinding[],
    existingRedactions: ManualRedaction[],
    sensitivityMode: RedactionSensitivityMode = RedactionSensitivityMode.STANDARD,
    documentContext?: string
  ): Promise<RedactionSuggestion[]> {
    const suggestions: RedactionSuggestion[] = [];

    // Generate new redaction suggestions
    const newRedactionSuggestions = await this.suggestNewRedactions(
      findings,
      existingRedactions
    );
    suggestions.push(...newRedactionSuggestions);

    // Generate boundary adjustment suggestions
    const boundaryAdjustments = await this.suggestBoundaryAdjustments(
      findings,
      existingRedactions
    );
    suggestions.push(...boundaryAdjustments);

    // Generate merge suggestions for overlapping/adjacent redactions
    const mergeSuggestions =
      await this.suggestRedactionMerges(existingRedactions);
    suggestions.push(...mergeSuggestions);

    // Generate consistency fix suggestions
    const consistencyFixes = await this.suggestConsistencyFixes(
      findings,
      existingRedactions
    );
    suggestions.push(...consistencyFixes);

    // Generate legal exemption suggestions
    const legalSuggestions = await this.suggestLegalExemptions(
      findings,
      existingRedactions
    );
    suggestions.push(...legalSuggestions);

    // Generate over-redaction removal suggestions
    const removalSuggestions = await this.suggestRedactionRemovals(
      findings,
      existingRedactions
    );
    suggestions.push(...removalSuggestions);

    // Generate pattern-based bulk suggestions
    const patternSuggestions = await this.suggestPatternOptimizations(
      findings,
      existingRedactions
    );
    suggestions.push(...patternSuggestions);

    // Sort suggestions by priority and confidence
    return this.prioritizeSuggestions(suggestions, sensitivityMode);
  }

  /**
   * Suggest new redactions for uncovered PII
   */
  private async suggestNewRedactions(
    findings: EnhancedPIIFinding[],
    existingRedactions: ManualRedaction[]
  ): Promise<RedactionSuggestion[]> {
    const suggestions: RedactionSuggestion[] = [];

    for (const finding of findings) {
      // Skip if already covered by existing redaction
      const isCovered = existingRedactions.some(redaction =>
        this.isRedactionCovering(redaction, finding)
      );

      if (!isCovered && finding.confidenceScore >= 60) {
        const priority = this.determineSuggestionPriority(
          finding.confidenceScore,
          finding.piiType
        );

        suggestions.push({
          id: `new_${finding.recordId}_${finding.pageNumber}_${finding.x}_${finding.y}`,
          type: SuggestionType.NEW_REDACTION,
          priority,
          title: `Add ${finding.piiType} Redaction`,
          description: `High-confidence ${finding.piiType} detected without redaction coverage`,
          reasoning: finding.aiReasoning,
          confidence: finding.confidenceScore,
          targetCoordinates: {
            x: finding.x,
            y: finding.y,
            width: finding.width,
            height: finding.height,
          },
          targetPIIType: finding.piiType,
          legalJustification: finding.legalExemptions,
          autoImplementable: finding.confidenceScore >= 85,
          estimatedImpact: this.calculateImpact(finding),
          relatedSuggestions: this.findRelatedSuggestionIds(
            finding.relatedFindings
          ),
          metadata: {
            pageNumber: finding.pageNumber,
            recordId: finding.recordId,
            fileName: finding.fileName,
            detectedText: finding.text,
            contextSnippet: finding.contextAnalysis.surroundingText.substring(
              0,
              100
            ),
            similarOccurrences: finding.relatedFindings.length,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Suggest boundary adjustments for existing redactions
   */
  private async suggestBoundaryAdjustments(
    findings: EnhancedPIIFinding[],
    existingRedactions: ManualRedaction[]
  ): Promise<RedactionSuggestion[]> {
    const suggestions: RedactionSuggestion[] = [];

    for (const redaction of existingRedactions) {
      const relatedFindings = findings.filter(
        finding =>
          finding.pageNumber === redaction.pageNumber &&
          this.calculateOverlap(redaction, finding) > 0.5
      );

      for (const finding of relatedFindings) {
        const currentOverlap = this.calculateOverlap(redaction, finding);

        if (currentOverlap < 0.9 && currentOverlap > 0.5) {
          // Suggest expanding redaction to fully cover the finding
          const adjustedBounds = this.calculateOptimalBounds(
            redaction,
            finding
          );

          suggestions.push({
            id: `adjust_${redaction.id}_${finding.pageNumber}_${finding.x}_${finding.y}`,
            type: SuggestionType.ADJUST_BOUNDARIES,
            priority: 'medium',
            title: 'Adjust Redaction Boundaries',
            description: `Expand redaction to fully cover detected ${finding.piiType}`,
            reasoning: `Current redaction only covers ${Math.round(currentOverlap * 100)}% of the PII. Expanding boundaries will ensure complete coverage.`,
            confidence: finding.confidenceScore,
            targetCoordinates: adjustedBounds,
            targetPIIType: finding.piiType,
            legalJustification: finding.legalExemptions,
            autoImplementable: true,
            estimatedImpact:
              'Improved privacy protection with complete PII coverage',
            relatedSuggestions: [],
            metadata: {
              pageNumber: finding.pageNumber,
              recordId: finding.recordId,
              fileName: finding.fileName,
              detectedText: finding.text,
            },
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest merging overlapping or adjacent redactions
   */
  private async suggestRedactionMerges(
    existingRedactions: ManualRedaction[]
  ): Promise<RedactionSuggestion[]> {
    const suggestions: RedactionSuggestion[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < existingRedactions.length; i++) {
      for (let j = i + 1; j < existingRedactions.length; j++) {
        const redaction1 = existingRedactions[i];
        const redaction2 = existingRedactions[j];

        if (
          processed.has(`${redaction1.id}_${redaction2.id}`) ||
          processed.has(`${redaction2.id}_${redaction1.id}`)
        )
          continue;

        if (redaction1.pageNumber === redaction2.pageNumber) {
          const overlap = this.calculateOverlap(redaction1, redaction2);
          const distance = this.calculateDistance(redaction1, redaction2);

          if (overlap > 0 || distance < 20) {
            // Overlapping or very close
            const mergedBounds = this.calculateMergedBounds(
              redaction1,
              redaction2
            );

            suggestions.push({
              id: `merge_${redaction1.id}_${redaction2.id}`,
              type: SuggestionType.MERGE_REDACTIONS,
              priority: 'low',
              title: 'Merge Adjacent Redactions',
              description:
                'Combine overlapping redactions for cleaner appearance',
              reasoning: `Two redactions are ${overlap > 0 ? 'overlapping' : `only ${Math.round(distance)}px apart`}. Merging will create a more professional appearance.`,
              confidence: 80,
              targetCoordinates: mergedBounds,
              targetPIIType: PIIType.PERSON_NAME, // Generic type for merged redactions
              legalJustification: [],
              autoImplementable: true,
              estimatedImpact:
                'Cleaner document appearance with maintained privacy protection',
              relatedSuggestions: [],
              metadata: {
                pageNumber: redaction1.pageNumber,
                recordId: redaction1.recordId,
                fileName: redaction1.fileName,
              },
            });

            processed.add(`${redaction1.id}_${redaction2.id}`);
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest consistency fixes across similar PII types
   */
  private async suggestConsistencyFixes(
    findings: EnhancedPIIFinding[],
    existingRedactions: ManualRedaction[]
  ): Promise<RedactionSuggestion[]> {
    const suggestions: RedactionSuggestion[] = [];

    // Group findings by PII type
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

    // Analyze each group for consistency issues
    for (const [piiType, groupFindings] of Object.entries(typeGroups)) {
      if (groupFindings.length < 2) continue;

      const redactedFindings = groupFindings.filter(finding =>
        existingRedactions.some(redaction =>
          this.isRedactionCovering(redaction, finding)
        )
      );

      const unredactedFindings = groupFindings.filter(
        finding =>
          !existingRedactions.some(redaction =>
            this.isRedactionCovering(redaction, finding)
          )
      );

      // If some similar findings are redacted but others aren't
      if (redactedFindings.length > 0 && unredactedFindings.length > 0) {
        for (const unredacted of unredactedFindings) {
          if (unredacted.confidenceScore >= 70) {
            suggestions.push({
              id: `consistency_${unredacted.recordId}_${unredacted.pageNumber}_${unredacted.x}_${unredacted.y}`,
              type: SuggestionType.CONSISTENCY_FIX,
              priority: 'medium',
              title: `Consistency Issue - Missing ${piiType} Redaction`,
              description: `Similar ${piiType} instances are redacted elsewhere but not here`,
              reasoning: `Found ${redactedFindings.length} similar ${piiType} instances that are redacted. For consistency, this instance should also be redacted.`,
              confidence: Math.min(90, unredacted.confidenceScore + 10),
              targetCoordinates: {
                x: unredacted.x,
                y: unredacted.y,
                width: unredacted.width,
                height: unredacted.height,
              },
              targetPIIType: unredacted.piiType,
              legalJustification: unredacted.legalExemptions,
              autoImplementable: unredacted.confidenceScore >= 80,
              estimatedImpact: 'Improved consistency in redaction decisions',
              relatedSuggestions: [],
              metadata: {
                pageNumber: unredacted.pageNumber,
                recordId: unredacted.recordId,
                fileName: unredacted.fileName,
                detectedText: unredacted.text,
                similarOccurrences: redactedFindings.length,
              },
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest legal exemptions for existing redactions
   */
  private async suggestLegalExemptions(
    findings: EnhancedPIIFinding[],
    existingRedactions: ManualRedaction[]
  ): Promise<RedactionSuggestion[]> {
    const suggestions: RedactionSuggestion[] = [];

    for (const redaction of existingRedactions) {
      // Find corresponding PII finding
      const correspondingFinding = findings.find(finding =>
        this.isRedactionCovering(redaction, finding)
      );

      if (
        correspondingFinding &&
        correspondingFinding.legalExemptions.length > 0
      ) {
        // Check if redaction lacks proper legal justification
        if (!redaction.reason || !redaction.reason.includes('exemption')) {
          suggestions.push({
            id: `legal_${redaction.id}`,
            type: SuggestionType.ADD_LEGAL_EXEMPTION,
            priority: 'high',
            title: 'Add Legal Exemption',
            description: `Add legal justification for ${correspondingFinding.piiType} redaction`,
            reasoning: `Detected applicable legal exemptions: ${correspondingFinding.legalExemptions.map(ex => ex.replace(/_/g, ' ')).join(', ')}`,
            confidence: 85,
            targetCoordinates: {
              x: redaction.x,
              y: redaction.y,
              width: redaction.width,
              height: redaction.height,
            },
            targetPIIType: correspondingFinding.piiType,
            legalJustification: correspondingFinding.legalExemptions,
            autoImplementable: true,
            estimatedImpact: 'Enhanced legal compliance and defensibility',
            relatedSuggestions: [],
            metadata: {
              pageNumber: redaction.pageNumber,
              recordId: redaction.recordId,
              fileName: redaction.fileName,
            },
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest removal of over-redactions
   */
  private async suggestRedactionRemovals(
    findings: EnhancedPIIFinding[],
    existingRedactions: ManualRedaction[]
  ): Promise<RedactionSuggestion[]> {
    const suggestions: RedactionSuggestion[] = [];

    for (const redaction of existingRedactions) {
      // Check if redaction has no corresponding high-confidence PII finding
      const hasCorrespondingFinding = findings.some(
        finding =>
          this.isRedactionCovering(redaction, finding) &&
          finding.confidenceScore >= 60
      );

      if (!hasCorrespondingFinding) {
        // This might be over-redaction
        suggestions.push({
          id: `remove_${redaction.id}`,
          type: SuggestionType.REMOVE_REDACTION,
          priority: 'low',
          title: 'Potential Over-Redaction',
          description: 'This redaction may not be necessary',
          reasoning:
            'No high-confidence PII detected in this area. Manual review recommended to determine if redaction is necessary.',
          confidence: 30, // Low confidence for removal suggestions
          targetCoordinates: {
            x: redaction.x,
            y: redaction.y,
            width: redaction.width,
            height: redaction.height,
          },
          targetPIIType: PIIType.PERSON_NAME, // Generic
          legalJustification: [],
          autoImplementable: false, // Never auto-remove redactions
          estimatedImpact: 'Potential improvement in document readability',
          relatedSuggestions: [],
          metadata: {
            pageNumber: redaction.pageNumber,
            recordId: redaction.recordId,
            fileName: redaction.fileName,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Suggest pattern-based optimizations and bulk operations
   */
  private async suggestPatternOptimizations(
    findings: EnhancedPIIFinding[],
    existingRedactions: ManualRedaction[]
  ): Promise<RedactionSuggestion[]> {
    const suggestions: RedactionSuggestion[] = [];

    // Group similar patterns
    const patterns = this.identifyPatterns(findings);

    for (const pattern of patterns) {
      if (pattern.occurrences >= 3 && pattern.unredactedCount > 0) {
        suggestions.push({
          id: `pattern_${pattern.type}_${pattern.confidence}`,
          type: SuggestionType.PATTERN_OPTIMIZATION,
          priority: 'medium',
          title: `Bulk Process ${pattern.type} Pattern`,
          description: `Apply consistent redaction to ${pattern.unredactedCount} similar ${pattern.type} instances`,
          reasoning: `Detected ${pattern.occurrences} instances of similar ${pattern.type} pattern. ${pattern.redactedCount} are already redacted. Suggest applying consistent treatment to remaining ${pattern.unredactedCount} instances.`,
          confidence: pattern.confidence,
          targetCoordinates: pattern.exampleCoordinates,
          targetPIIType: pattern.type,
          legalJustification: pattern.suggestedExemptions,
          autoImplementable: pattern.confidence >= 80,
          estimatedImpact: `Improved consistency across ${pattern.occurrences} similar instances`,
          relatedSuggestions: [],
          metadata: {
            pageNumber: pattern.exampleCoordinates.y > 0 ? 1 : 1, // Simplified
            recordId: findings[0]?.recordId || 'unknown',
            fileName: findings[0]?.fileName || 'unknown',
            similarOccurrences: pattern.occurrences,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Perform automatic review of redaction quality
   */
  async performAutoReview(
    findings: EnhancedPIIFinding[],
    existingRedactions: ManualRedaction[],
    recordId: string,
    fileName: string
  ): Promise<AutoReviewResult> {
    // Get quality assessment
    const qualityAssessment =
      await redactionConfidenceAnalyzer.analyzeRedactionQuality(
        findings,
        existingRedactions
      );

    // Get consistency check
    const consistencyCheck =
      await redactionConfidenceAnalyzer.performConsistencyCheck(
        findings,
        recordId,
        fileName
      );

    // Get gap analysis
    const gapAnalysis = await redactionConfidenceAnalyzer.analyzeRedactionGaps(
      findings,
      existingRedactions,
      recordId,
      fileName
    );

    // Generate issues
    const issues = this.generateAutoReviewIssues(
      qualityAssessment,
      consistencyCheck,
      gapAnalysis
    );

    // Generate suggestions based on review findings
    const suggestions = await this.generateSuggestions(
      findings,
      existingRedactions
    );

    // Calculate overall score
    const overallScore =
      (qualityAssessment.completeness +
        qualityAssessment.accuracy +
        qualityAssessment.consistency +
        qualityAssessment.legalCompliance) /
      4;

    // Determine risk assessment
    const riskAssessment = this.determineRiskLevel(overallScore, issues);

    return {
      recordId,
      fileName,
      overallScore: Math.round(overallScore),
      issues,
      recommendations: suggestions.slice(0, 10), // Top 10 suggestions
      qualityMetrics: {
        completeness: qualityAssessment.completeness,
        accuracy: qualityAssessment.accuracy,
        consistency: qualityAssessment.consistency,
        legalCompliance: qualityAssessment.legalCompliance,
      },
      riskAssessment,
      reviewRequired:
        riskAssessment === 'high' ||
        riskAssessment === 'critical' ||
        issues.some(i => i.severity === 'critical'),
    };
  }

  /**
   * Generate bulk suggestion operations
   */
  async generateBulkOperations(
    suggestions: RedactionSuggestion[]
  ): Promise<BulkSuggestionOperation[]> {
    const operations: BulkSuggestionOperation[] = [];

    // Group suggestions by type
    const typeGroups: Record<SuggestionType, RedactionSuggestion[]> =
      {} as Record<SuggestionType, RedactionSuggestion[]>;
    suggestions.forEach(suggestion => {
      if (!typeGroups[suggestion.type]) {
        typeGroups[suggestion.type] = [];
      }
      typeGroups[suggestion.type].push(suggestion);
    });

    // Create bulk operations for each type
    for (const [type, groupSuggestions] of Object.entries(typeGroups)) {
      if (groupSuggestions.length >= 3) {
        // Only create bulk operations for 3+ items
        const highConfidenceSuggestions = groupSuggestions.filter(
          s => s.confidence >= 80
        );

        if (highConfidenceSuggestions.length >= 2) {
          operations.push({
            id: `bulk_${type}_${Date.now()}`,
            name: `Bulk ${this.formatSuggestionType(type as SuggestionType)}`,
            description: `Apply ${highConfidenceSuggestions.length} high-confidence ${type.replace(/_/g, ' ')} suggestions`,
            affectedSuggestions: highConfidenceSuggestions.map(s => s.id),
            estimatedTime: highConfidenceSuggestions.length * 2, // 2 seconds per suggestion
            riskLevel: this.calculateBulkRiskLevel(highConfidenceSuggestions),
            previewChanges: this.calculatePreviewChanges(
              highConfidenceSuggestions
            ),
          });
        }
      }
    }

    // Add pattern-based bulk operations
    const patternSuggestions = suggestions.filter(
      s => s.type === SuggestionType.PATTERN_OPTIMIZATION
    );
    if (patternSuggestions.length > 0) {
      operations.push({
        id: `bulk_patterns_${Date.now()}`,
        name: 'Apply Pattern Optimizations',
        description: `Apply ${patternSuggestions.length} pattern-based improvements`,
        affectedSuggestions: patternSuggestions.map(s => s.id),
        estimatedTime: patternSuggestions.length * 3,
        riskLevel: 'medium',
        previewChanges: this.calculatePreviewChanges(patternSuggestions),
      });
    }

    return operations.sort(
      (a, b) => b.affectedSuggestions.length - a.affectedSuggestions.length
    );
  }

  // Helper methods

  private isRedactionCovering(
    redaction: ManualRedaction,
    finding: EnhancedPIIFinding
  ): boolean {
    if (redaction.pageNumber !== finding.pageNumber) return false;

    const overlap = this.calculateOverlap(redaction, finding);
    return overlap >= 0.7; // 70% overlap threshold
  }

  private calculateOverlap(rect1: any, rect2: any): number {
    const x1 = Math.max(rect1.x, rect2.x);
    const y1 = Math.max(rect1.y, rect2.y);
    const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    if (x2 <= x1 || y2 <= y1) return 0;

    const overlapArea = (x2 - x1) * (y2 - y1);
    const rect2Area = rect2.width * rect2.height;

    return rect2Area > 0 ? overlapArea / rect2Area : 0;
  }

  private calculateDistance(rect1: any, rect2: any): number {
    const centerX1 = rect1.x + rect1.width / 2;
    const centerY1 = rect1.y + rect1.height / 2;
    const centerX2 = rect2.x + rect2.width / 2;
    const centerY2 = rect2.y + rect2.height / 2;

    return Math.sqrt(
      Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2)
    );
  }

  private calculateOptimalBounds(
    redaction: ManualRedaction,
    finding: EnhancedPIIFinding
  ): RedactionCoordinates {
    return {
      x: Math.min(redaction.x, finding.x),
      y: Math.min(redaction.y, finding.y),
      width:
        Math.max(redaction.x + redaction.width, finding.x + finding.width) -
        Math.min(redaction.x, finding.x),
      height:
        Math.max(redaction.y + redaction.height, finding.y + finding.height) -
        Math.min(redaction.y, finding.y),
    };
  }

  private calculateMergedBounds(
    rect1: ManualRedaction,
    rect2: ManualRedaction
  ): RedactionCoordinates {
    return {
      x: Math.min(rect1.x, rect2.x),
      y: Math.min(rect1.y, rect2.y),
      width:
        Math.max(rect1.x + rect1.width, rect2.x + rect2.width) -
        Math.min(rect1.x, rect2.x),
      height:
        Math.max(rect1.y + rect1.height, rect2.y + rect2.height) -
        Math.min(rect1.y, rect2.y),
    };
  }

  private determineSuggestionPriority(
    confidence: number,
    piiType: PIIType
  ): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskTypes = [
      PIIType.SSN,
      PIIType.ACCOUNT_NUMBER,
      PIIType.CONFIDENTIAL_SOURCE,
    ];

    if (highRiskTypes.includes(piiType) && confidence >= 80) return 'critical';
    if (confidence >= 90) return 'high';
    if (confidence >= 75) return 'medium';
    return 'low';
  }

  private calculateImpact(finding: EnhancedPIIFinding): string {
    if (finding.confidenceScore >= 90)
      return 'High privacy protection improvement';
    if (finding.confidenceScore >= 75)
      return 'Moderate privacy protection improvement';
    return 'Minor privacy protection improvement';
  }

  private findRelatedSuggestionIds(relatedFindings: string[]): string[] {
    // In a real implementation, this would map finding IDs to suggestion IDs
    return relatedFindings.map(id => `suggestion_${id}`);
  }

  private identifyPatterns(findings: EnhancedPIIFinding[]): any[] {
    const patterns: any[] = [];

    // Group by PII type and analyze patterns
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

    for (const [piiType, groupFindings] of Object.entries(typeGroups)) {
      if (groupFindings.length >= 3) {
        const avgConfidence =
          groupFindings.reduce((sum, f) => sum + f.confidenceScore, 0) /
          groupFindings.length;

        patterns.push({
          type: piiType as PIIType,
          occurrences: groupFindings.length,
          confidence: Math.round(avgConfidence),
          redactedCount: 0, // Would be calculated based on existing redactions
          unredactedCount: groupFindings.length, // Simplified
          exampleCoordinates: {
            x: groupFindings[0].x,
            y: groupFindings[0].y,
            width: groupFindings[0].width,
            height: groupFindings[0].height,
          },
          suggestedExemptions: [
            ...new Set(groupFindings.flatMap(f => f.legalExemptions)),
          ],
        });
      }
    }

    return patterns;
  }

  private prioritizeSuggestions(
    suggestions: RedactionSuggestion[],
    mode: RedactionSensitivityMode
  ): RedactionSuggestion[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return suggestions.sort((a, b) => {
      // First by priority
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by confidence
      return b.confidence - a.confidence;
    });
  }

  private generateAutoReviewIssues(
    qualityAssessment: RedactionQualityAssessment,
    consistencyCheck: RedactionConsistencyCheck,
    gapAnalysis: RedactionGapAnalysis
  ): AutoReviewIssue[] {
    const issues: AutoReviewIssue[] = [];

    // Convert quality recommendations to issues
    qualityAssessment.recommendations.forEach((rec, index) => {
      issues.push({
        id: `quality_${index}`,
        severity: rec.severity as any,
        category: rec.type as any,
        title: rec.description,
        description: rec.suggestedAction,
        location: { pageNumber: 1, x: 0, y: 0 }, // Simplified
        affectsCompliance: rec.type === 'legal_gap',
      });
    });

    // Add consistency issues
    consistencyCheck.inconsistencies.forEach((inc, index) => {
      issues.push({
        id: `consistency_${index}`,
        severity: 'warning',
        category: 'inconsistency',
        title: 'Consistency Issue',
        description: inc.description,
        location: { pageNumber: 1, x: 0, y: 0 }, // Simplified
        affectsCompliance: false,
      });
    });

    // Add gap analysis issues
    gapAnalysis.potentialGaps.forEach((gap, index) => {
      issues.push({
        id: `gap_${index}`,
        severity: gap.confidence > 80 ? 'error' : 'warning',
        category: 'missing_redaction',
        title: 'Potential Missing Redaction',
        description: gap.reasoning,
        location: {
          pageNumber: gap.pageNumber,
          x: gap.coordinate.x,
          y: gap.coordinate.y,
        },
        affectsCompliance: true,
      });
    });

    return issues;
  }

  private determineRiskLevel(
    overallScore: number,
    issues: AutoReviewIssue[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'error').length;

    if (criticalIssues > 0 || overallScore < 50) return 'critical';
    if (highIssues > 2 || overallScore < 70) return 'high';
    if (issues.length > 5 || overallScore < 85) return 'medium';
    return 'low';
  }

  private formatSuggestionType(type: SuggestionType): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private calculateBulkRiskLevel(
    suggestions: RedactionSuggestion[]
  ): 'low' | 'medium' | 'high' {
    const avgConfidence =
      suggestions.reduce((sum, s) => sum + s.confidence, 0) /
      suggestions.length;
    const hasRemovalSuggestions = suggestions.some(
      s => s.type === SuggestionType.REMOVE_REDACTION
    );

    if (hasRemovalSuggestions || avgConfidence < 70) return 'high';
    if (avgConfidence < 85) return 'medium';
    return 'low';
  }

  private calculatePreviewChanges(
    suggestions: RedactionSuggestion[]
  ): BulkSuggestionOperation['previewChanges'] {
    return {
      newRedactions: suggestions.filter(
        s => s.type === SuggestionType.NEW_REDACTION
      ).length,
      modifiedRedactions: suggestions.filter(s =>
        [
          SuggestionType.ADJUST_BOUNDARIES,
          SuggestionType.MERGE_REDACTIONS,
        ].includes(s.type)
      ).length,
      removedRedactions: suggestions.filter(
        s => s.type === SuggestionType.REMOVE_REDACTION
      ).length,
    };
  }
}

// Export singleton instance
export const aiRedactionSuggestionService = new AIRedactionSuggestionService();
export default aiRedactionSuggestionService;
