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
}

export interface PIIFindingsResult {
  recordId: string;
  findings: PIIFinding[];
  totalFindings: number;
  highConfidenceFindings: number;
  piiTypesDetected: PIIType[];
}

export class PIIDetectionService {
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
        throw new Error(`Failed to load redactions.csv: ${response.statusText}`);
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
      };

      findings.push(finding);
    }

    return findings;
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
  async getFindingsForRecord(recordId: string): Promise<PIIFindingsResult> {
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
          (finding) => finding.recordId === mappedRecordId
        );
        allFindings.push(...recordFindings);
      }
    } else {
      // This is a direct record ID
      allFindings = this.findings.filter(
        (finding) => finding.recordId === recordId
      );
    }

    const highConfidenceFindings = allFindings.filter(
      (finding) => finding.confidence >= 0.8
    );

    const piiTypesDetected = Array.from(
      new Set(allFindings.map((finding) => finding.piiType))
    );

    return {
      recordId,
      findings: allFindings,
      totalFindings: allFindings.length,
      highConfidenceFindings: highConfidenceFindings.length,
      piiTypesDetected,
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
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get PII findings for a specific record (original method preserved)
   */
  async getFindingsForRecordDirect(recordId: string): Promise<PIIFindingsResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const recordFindings = this.findings.filter(
      (finding) => finding.recordId === recordId
    );

    const highConfidenceFindings = recordFindings.filter(
      (finding) => finding.confidence >= 0.8
    );

    const piiTypesDetected = Array.from(
      new Set(recordFindings.map((finding) => finding.piiType))
    );

    return {
      recordId,
      findings: recordFindings,
      totalFindings: recordFindings.length,
      highConfidenceFindings: highConfidenceFindings.length,
      piiTypesDetected,
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
          (finding) =>
            finding.recordId === mappedRecordId &&
            finding.fileName === fileName &&
            finding.pageNumber === pageNumber
        );
        allFindings.push(...pageFindings);
      }
    } else {
      // This is a direct record ID
      allFindings = this.findings.filter(
        (finding) =>
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

    return Array.from(new Set(this.findings.map((finding) => finding.piiType)));
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
      ? this.findings.filter((finding) => finding.recordId === recordId)
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

    const confidenceScores = relevantFindings.map((finding) => finding.confidence);
    const highConfidenceCount = relevantFindings.filter(
      (finding) => finding.confidence >= 0.8
    ).length;

    return {
      average: confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length,
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