// PII Detection Service
// Handles loading and managing PII findings from redactions.csv (Phase 0)
// Provides structured PII findings data for PDF overlay system

export interface PIIFinding {
  recordId: string;
  fileName: string;
  pageNumber: number;
  piiType: PIIType;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  reasoning: string;
  sensitivityLevel?: PIISensitivityLevel;
  legalExemptions?: LegalExemption[];
  primaryExemptionCategory?: LegalExemptionCategory;
}

export enum PIISensitivityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface PIIDetectionOptions {
  sensitivityLevel?: PIISensitivityLevel;
  minConfidence?: number;
  piiTypes?: PIIType[];
  legalExemptionCategory?: LegalExemptionCategory;
  requireLegalExemptions?: boolean;
}

export enum LegalExemptionCategory {
  PERSONAL_PRIVACY = 'personal_privacy',
  LAW_ENFORCEMENT = 'law_enforcement',
  FINANCIAL = 'financial',
  MEDICAL = 'medical',
  INVESTIGATIVE = 'investigative',
  OTHER = 'other',
}

export interface LegalExemption {
  code: string;
  category: LegalExemptionCategory;
  description: string;
}

export enum PIIType {
  SSN = 'SSN',
  PHONE = 'PHONE',
  ADDRESS = 'ADDRESS',
  PERSON_NAME = 'PERSON_NAME',
  EMAIL = 'EMAIL',
  DOB = 'DOB',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  ACCOUNT_NUMBER = 'ACCOUNT_NUMBER',
  ROUTING_NUMBER = 'ROUTING_NUMBER',
  MEDICAL_ID = 'MEDICAL_ID',
  BADGE_NUMBER = 'BADGE_NUMBER',
  CASE_NUMBER = 'CASE_NUMBER',
  INCIDENT_NUMBER = 'INCIDENT_NUMBER',
  VEHICLE_ID = 'VEHICLE_ID',
  CONFIDENTIAL_SOURCE = 'CONFIDENTIAL_SOURCE',
}

export interface PIIFindingsResult {
  recordId: string;
  findings: PIIFinding[];
  totalFindings: number;
  highConfidenceFindings: number;
  piiTypesDetected: PIIType[];
  sensitivityBreakdown: Record<PIISensitivityLevel, number>;
  legalExemptionBreakdown: Record<LegalExemptionCategory, number>;
}

export class PIIDetectionService {
  private readonly sensitivityRank: Record<PIISensitivityLevel, number> = {
    [PIISensitivityLevel.LOW]: 1,
    [PIISensitivityLevel.MEDIUM]: 2,
    [PIISensitivityLevel.HIGH]: 3,
    [PIISensitivityLevel.CRITICAL]: 4,
  };

  private readonly criticalPIITypes: Set<PIIType> = new Set([
    PIIType.SSN,
    PIIType.ACCOUNT_NUMBER,
    PIIType.ROUTING_NUMBER,
    PIIType.MEDICAL_ID,
    PIIType.CONFIDENTIAL_SOURCE,
  ]);

  private readonly highPIITypes: Set<PIIType> = new Set([
    PIIType.DRIVERS_LICENSE,
    PIIType.DOB,
    PIIType.PERSON_NAME,
    PIIType.ADDRESS,
  ]);

  private readonly mediumPIITypes: Set<PIIType> = new Set([
    PIIType.PHONE,
    PIIType.EMAIL,
    PIIType.BADGE_NUMBER,
  ]);

  private findings: PIIFinding[] = [];
  private initialized: boolean = false;

  // Map request IDs to record IDs for demo purposes
  // In production, this would come from the database
  private requestToRecordMapping: { [requestId: string]: string[] } = {};

  /**
   * Initialize the service by loading findings from CSV
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await fetch('/mock-data/redactions.csv');
      if (!response.ok) {
        throw new Error(
          `Failed to load redactions.csv: ${response.statusText}`
        );
      }

      const csvText = await response.text();
      this.findings = this.parseCSV(csvText);
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing PII detection service:', error);
      throw error;
    }
  }

  /**
   * Parse CSV text into PII findings
   */
  private parseCSV(csvText: string): PIIFinding[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const findings: PIIFinding[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        console.warn(`Skipping malformed CSV line ${i + 1}`);
        continue;
      }

      const finding: PIIFinding = {
        recordId: values[0],
        fileName: values[1],
        pageNumber: parseInt(values[2]),
        piiType: values[3] as PIIType,
        confidence: parseFloat(values[4]),
        x: parseInt(values[5]),
        y: parseInt(values[6]),
        width: parseInt(values[7]),
        height: parseInt(values[8]),
        text: values[9],
        reasoning: values[10],
        sensitivityLevel: this.calculateSensitivityLevel(
          values[3] as PIIType,
          parseFloat(values[4])
        ),
      };

      const legalExemptions = this.detectLegalExemptions(
        finding.piiType,
        finding.text,
        finding.reasoning
      );

      finding.legalExemptions = legalExemptions;
      finding.primaryExemptionCategory = legalExemptions[0]?.category;

      findings.push(finding);
    }

    return findings;
  }

  private detectLegalExemptions(
    piiType: PIIType,
    text: string,
    reasoning: string
  ): LegalExemption[] {
    const exemptions: LegalExemption[] = [];
    const context = `${text} ${reasoning}`.toLowerCase();

    const addExemption = (exemption: LegalExemption) => {
      if (!exemptions.some(item => item.code === exemption.code)) {
        exemptions.push(exemption);
      }
    };

    if (
      [
        PIIType.SSN,
        PIIType.PHONE,
        PIIType.ADDRESS,
        PIIType.PERSON_NAME,
        PIIType.EMAIL,
        PIIType.DOB,
        PIIType.DRIVERS_LICENSE,
      ].includes(piiType)
    ) {
      addExemption({
        code: 'FOIA_B6_PERSONAL_PRIVACY',
        category: LegalExemptionCategory.PERSONAL_PRIVACY,
        description: 'Personal privacy protections for identifiable data.',
      });
    }

    if ([PIIType.ACCOUNT_NUMBER, PIIType.ROUTING_NUMBER].includes(piiType)) {
      addExemption({
        code: 'FINANCIAL_PRIVACY',
        category: LegalExemptionCategory.FINANCIAL,
        description: 'Financial account and routing information protections.',
      });
    }

    if (piiType === PIIType.MEDICAL_ID) {
      addExemption({
        code: 'HIPAA_HEALTH_INFORMATION',
        category: LegalExemptionCategory.MEDICAL,
        description: 'Medical privacy requirements under health regulations.',
      });
    }

    if (
      [
        PIIType.CASE_NUMBER,
        PIIType.INCIDENT_NUMBER,
        PIIType.BADGE_NUMBER,
        PIIType.VEHICLE_ID,
        PIIType.CONFIDENTIAL_SOURCE,
      ].includes(piiType)
    ) {
      addExemption({
        code: 'FOIA_B7_LAW_ENFORCEMENT',
        category: LegalExemptionCategory.LAW_ENFORCEMENT,
        description: 'Law-enforcement-sensitive information protections.',
      });
    }

    if (
      context.includes('investigation') ||
      context.includes('informant') ||
      context.includes('witness') ||
      context.includes('confidential source')
    ) {
      addExemption({
        code: 'ONGOING_INVESTIGATION',
        category: LegalExemptionCategory.INVESTIGATIVE,
        description: 'Investigative integrity and source protection.',
      });
    }

    if (exemptions.length === 0) {
      addExemption({
        code: 'GENERAL_SENSITIVITY_REVIEW',
        category: LegalExemptionCategory.OTHER,
        description: 'General review recommended based on sensitive context.',
      });
    }

    return exemptions;
  }

  private calculateSensitivityLevel(
    piiType: PIIType,
    confidence: number
  ): PIISensitivityLevel {
    let level: PIISensitivityLevel;

    if (this.criticalPIITypes.has(piiType)) {
      level = PIISensitivityLevel.CRITICAL;
    } else if (this.highPIITypes.has(piiType)) {
      level = PIISensitivityLevel.HIGH;
    } else if (this.mediumPIITypes.has(piiType)) {
      level = PIISensitivityLevel.MEDIUM;
    } else {
      level = PIISensitivityLevel.LOW;
    }

    if (confidence >= 0.92 && level !== PIISensitivityLevel.CRITICAL) {
      if (level === PIISensitivityLevel.HIGH) {
        return PIISensitivityLevel.CRITICAL;
      }
      if (level === PIISensitivityLevel.MEDIUM) {
        return PIISensitivityLevel.HIGH;
      }
      return PIISensitivityLevel.MEDIUM;
    }

    return level;
  }

  private meetsSensitivityThreshold(
    finding: PIIFinding,
    threshold?: PIISensitivityLevel
  ): boolean {
    if (!threshold) return true;

    const level =
      finding.sensitivityLevel ||
      this.calculateSensitivityLevel(finding.piiType, finding.confidence);

    return this.sensitivityRank[level] >= this.sensitivityRank[threshold];
  }

  private buildSensitivityBreakdown(
    findings: PIIFinding[]
  ): Record<PIISensitivityLevel, number> {
    const breakdown: Record<PIISensitivityLevel, number> = {
      [PIISensitivityLevel.LOW]: 0,
      [PIISensitivityLevel.MEDIUM]: 0,
      [PIISensitivityLevel.HIGH]: 0,
      [PIISensitivityLevel.CRITICAL]: 0,
    };

    findings.forEach(finding => {
      const level =
        finding.sensitivityLevel ||
        this.calculateSensitivityLevel(finding.piiType, finding.confidence);
      breakdown[level] += 1;
    });

    return breakdown;
  }

  private buildLegalExemptionBreakdown(
    findings: PIIFinding[]
  ): Record<LegalExemptionCategory, number> {
    const breakdown: Record<LegalExemptionCategory, number> = {
      [LegalExemptionCategory.PERSONAL_PRIVACY]: 0,
      [LegalExemptionCategory.LAW_ENFORCEMENT]: 0,
      [LegalExemptionCategory.FINANCIAL]: 0,
      [LegalExemptionCategory.MEDICAL]: 0,
      [LegalExemptionCategory.INVESTIGATIVE]: 0,
      [LegalExemptionCategory.OTHER]: 0,
    };

    findings.forEach(finding => {
      const categories = new Set(
        (finding.legalExemptions || []).map(exemption => exemption.category)
      );
      categories.forEach(category => {
        breakdown[category] += 1;
      });
    });

    return breakdown;
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Get PII findings for a specific record
   */
  async getFindingsForRecord(
    recordId: string,
    options: PIIDetectionOptions = {}
  ): Promise<PIIFindingsResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if this is actually a request ID that needs mapping
    const mappedRecordIds = this.getRecordIdsForRequest(recordId);

    let allFindings: PIIFinding[] = [];

    if (mappedRecordIds.length > 0) {
      // This is a request ID, get findings for all associated records
      for (const mappedRecordId of mappedRecordIds) {
        const recordFindings = this.findings.filter(
          finding => finding.recordId === mappedRecordId
        );
        allFindings.push(...recordFindings);
      }
    } else {
      // This is a direct record ID
      allFindings = this.findings.filter(
        finding => finding.recordId === recordId
      );
    }

    const filteredFindings = allFindings.filter(finding => {
      const typeMatches = options.piiTypes
        ? options.piiTypes.includes(finding.piiType)
        : true;
      const confidenceMatches =
        options.minConfidence !== undefined
          ? finding.confidence >= options.minConfidence
          : true;
      const sensitivityMatches = this.meetsSensitivityThreshold(
        finding,
        options.sensitivityLevel
      );
      const legalCategoryMatches = options.legalExemptionCategory
        ? (finding.legalExemptions || []).some(
            exemption => exemption.category === options.legalExemptionCategory
          )
        : true;
      const hasLegalExemptions = options.requireLegalExemptions
        ? (finding.legalExemptions || []).length > 0
        : true;

      return (
        typeMatches &&
        confidenceMatches &&
        sensitivityMatches &&
        legalCategoryMatches &&
        hasLegalExemptions
      );
    });

    const highConfidenceFindings = filteredFindings.filter(
      finding => finding.confidence >= 0.8
    );

    const piiTypesDetected = Array.from(
      new Set(filteredFindings.map(finding => finding.piiType))
    );

    const sensitivityBreakdown =
      this.buildSensitivityBreakdown(filteredFindings);
    const legalExemptionBreakdown =
      this.buildLegalExemptionBreakdown(filteredFindings);

    return {
      recordId,
      findings: filteredFindings,
      totalFindings: filteredFindings.length,
      highConfidenceFindings: highConfidenceFindings.length,
      piiTypesDetected,
      sensitivityBreakdown,
      legalExemptionBreakdown,
    };
  }

  /**
   * Map request IDs to record IDs (demo/prototype logic)
   * In production, this would query the database for associated records
   */
  private getRecordIdsForRequest(requestIdOrRecordId: string): string[] {
    // For demo purposes, map long UUIDs (request IDs) to simple numeric record IDs
    // This is a simplified mapping for the prototype

    // If it's already a simple numeric ID, it's probably a record ID
    if (/^\d+$/.test(requestIdOrRecordId)) {
      return []; // Return empty array to indicate it's a direct record ID
    }

    // For UUID-style request IDs, map them to demo record IDs
    // This is a simple hash-based mapping for consistency
    const hash = this.simpleHash(requestIdOrRecordId);
    const recordId = (hash % 5) + 1; // Map to record IDs 1-5

    return [recordId.toString()];
  }

  /**
   * Simple hash function for consistent request-to-record mapping
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get PII findings for a specific record (original method preserved)
   */
  async getFindingsForRecordDirect(
    recordId: string,
    options: PIIDetectionOptions = {}
  ): Promise<PIIFindingsResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const recordFindings = this.findings.filter(
      finding => finding.recordId === recordId
    );

    const filteredFindings = recordFindings.filter(finding => {
      const typeMatches = options.piiTypes
        ? options.piiTypes.includes(finding.piiType)
        : true;
      const confidenceMatches =
        options.minConfidence !== undefined
          ? finding.confidence >= options.minConfidence
          : true;
      const sensitivityMatches = this.meetsSensitivityThreshold(
        finding,
        options.sensitivityLevel
      );
      const legalCategoryMatches = options.legalExemptionCategory
        ? (finding.legalExemptions || []).some(
            exemption => exemption.category === options.legalExemptionCategory
          )
        : true;
      const hasLegalExemptions = options.requireLegalExemptions
        ? (finding.legalExemptions || []).length > 0
        : true;

      return (
        typeMatches &&
        confidenceMatches &&
        sensitivityMatches &&
        legalCategoryMatches &&
        hasLegalExemptions
      );
    });

    const highConfidenceFindings = filteredFindings.filter(
      finding => finding.confidence >= 0.8
    );

    const piiTypesDetected = Array.from(
      new Set(filteredFindings.map(finding => finding.piiType))
    );

    const sensitivityBreakdown =
      this.buildSensitivityBreakdown(filteredFindings);
    const legalExemptionBreakdown =
      this.buildLegalExemptionBreakdown(filteredFindings);

    return {
      recordId,
      findings: filteredFindings,
      totalFindings: filteredFindings.length,
      highConfidenceFindings: highConfidenceFindings.length,
      piiTypesDetected,
      sensitivityBreakdown,
      legalExemptionBreakdown,
    };
  }

  /**
   * Get findings for a specific file and page
   */
  async getFindingsForPage(
    recordId: string,
    fileName: string,
    pageNumber: number
  ): Promise<PIIFinding[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if this is actually a request ID that needs mapping
    const mappedRecordIds = this.getRecordIdsForRequest(recordId);

    let allFindings: PIIFinding[] = [];

    if (mappedRecordIds.length > 0) {
      // This is a request ID, get findings for all associated records
      for (const mappedRecordId of mappedRecordIds) {
        const pageFindings = this.findings.filter(
          finding =>
            finding.recordId === mappedRecordId &&
            finding.fileName === fileName &&
            finding.pageNumber === pageNumber
        );
        allFindings.push(...pageFindings);
      }
    } else {
      // This is a direct record ID
      allFindings = this.findings.filter(
        finding =>
          finding.recordId === recordId &&
          finding.fileName === fileName &&
          finding.pageNumber === pageNumber
      );
    }

    return allFindings;
  }

  /**
   * Get all unique PII types detected across all records
   */
  async getAllPIITypes(): Promise<PIIType[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return Array.from(new Set(this.findings.map(finding => finding.piiType)));
  }

  /**
   * Get confidence score statistics for findings
   */
  async getConfidenceStats(recordId?: string): Promise<{
    average: number;
    minimum: number;
    maximum: number;
    highConfidenceCount: number;
    totalCount: number;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const relevantFindings = recordId
      ? this.findings.filter(finding => finding.recordId === recordId)
      : this.findings;

    if (relevantFindings.length === 0) {
      return {
        average: 0,
        minimum: 0,
        maximum: 0,
        highConfidenceCount: 0,
        totalCount: 0,
      };
    }

    const confidenceScores = relevantFindings.map(
      finding => finding.confidence
    );
    const highConfidenceCount = relevantFindings.filter(
      finding => finding.confidence >= 0.8
    ).length;

    return {
      average:
        confidenceScores.reduce((sum, score) => sum + score, 0) /
        confidenceScores.length,
      minimum: Math.min(...confidenceScores),
      maximum: Math.max(...confidenceScores),
      highConfidenceCount,
      totalCount: relevantFindings.length,
    };
  }
}

// Export singleton instance
export const piiDetectionService = new PIIDetectionService();
export default piiDetectionService;
