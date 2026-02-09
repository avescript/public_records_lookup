// Redaction Service
// Handles manual redaction storage, versioning, and management
// Provides CRUD operations for user-drawn redaction boxes
// Integrates with agency-specific redaction rules

import { RedactionConfig, SensitivityLevel } from './agencyTypes';

export interface ManualRedaction {
  id: string;
  recordId: string;
  fileName: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: string;
  createdBy: string; // User ID or email
  reason?: string; // Optional reason for redaction
  type: 'manual' | 'ai-assisted' | 'agency-rule'; // Distinguish from AI suggestions and agency rules
  agencyId?: string; // Agency that applied this redaction
  ruleId?: string; // Rule ID if applied via agency rule
  sensitivityLevel?: SensitivityLevel; // Sensitivity level from agency rule
  requiresApproval?: boolean; // Whether this redaction needs approval
  approvedBy?: string; // Who approved this redaction
  approvedAt?: string; // When this redaction was approved
}

export interface RedactionVersion {
  versionId: string;
  recordId: string;
  fileName: string;
  redactions: ManualRedaction[];
  timestamp: string;
  status: 'draft' | 'saved' | 'exported';
  createdBy: string;
  notes?: string;
}

export interface RedactionSummary {
  recordId: string;
  totalRedactions: number;
  byPage: Record<number, number>;
  byType: Record<string, number>;
  lastModified: string;
  currentVersion: string;
  versions: RedactionVersion[];
}

export interface RedactionCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class RedactionService {
  private readonly STORAGE_KEY_PREFIX = 'redactions';
  private readonly VERSION_KEY_PREFIX = 'redaction_versions';

  /**
   * Generate unique ID for redaction
   */
  private generateRedactionId(): string {
    return `redaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique version ID
   */
  private generateVersionId(): string {
    return `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user identifier (placeholder for real auth)
   */
  private getCurrentUser(): string {
    // Phase 0: Return placeholder user
    return 'staff_user_001';
  }

  /**
   * Apply agency-specific redaction rules to a record
   */
  async applyAgencyRules(
    recordId: string,
    fileName: string,
    agencyId: string,
    piiFindings: any[] = [], // PII findings from detection service
    pageNumber?: number
  ): Promise<ManualRedaction[]> {
    try {
      // Import here to avoid circular dependency
      const { agencyRedactionRulesService } = await import(
        './agencyRedactionRulesService'
      );

      const config =
        await agencyRedactionRulesService.getRedactionConfig(agencyId);
      if (!config) {
        console.warn(`No redaction config found for agency: ${agencyId}`);
        return [];
      }

      const autoApplyRules =
        await agencyRedactionRulesService.getAutoApplyRules(agencyId);
      const appliedRedactions: ManualRedaction[] = [];

      // Apply auto-apply rules to PII findings
      for (const rule of autoApplyRules) {
        // Find PII findings that match this rule's types
        const matchingFindings = piiFindings.filter(
          finding =>
            rule.piiTypes.some(type => type === finding.piiType) &&
            (pageNumber === undefined || finding.pageNumber === pageNumber)
        );

        for (const finding of matchingFindings) {
          const redaction = await this.addAgencyRuleRedaction(
            recordId,
            fileName,
            finding.pageNumber,
            {
              x: finding.x,
              y: finding.y,
              width: finding.width,
              height: finding.height,
            },
            agencyId,
            rule.id,
            rule.sensitivityLevel,
            rule.requiresApproval,
            `Applied by agency rule: ${rule.name}`
          );

          appliedRedactions.push(redaction);
        }
      }

      return appliedRedactions;
    } catch (error) {
      console.error('Failed to apply agency rules:', error);
      return [];
    }
  }

  /**
   * Add a redaction based on agency rule
   */
  async addAgencyRuleRedaction(
    recordId: string,
    fileName: string,
    pageNumber: number,
    coordinates: RedactionCoordinates,
    agencyId: string,
    ruleId: string,
    sensitivityLevel: SensitivityLevel,
    requiresApproval: boolean,
    reason?: string
  ): Promise<ManualRedaction> {
    const redaction: ManualRedaction = {
      id: this.generateRedactionId(),
      recordId,
      fileName,
      pageNumber,
      x: coordinates.x,
      y: coordinates.y,
      width: coordinates.width,
      height: coordinates.height,
      createdAt: new Date().toISOString(),
      createdBy: 'agency-rule-system',
      reason,
      type: 'agency-rule',
      agencyId,
      ruleId,
      sensitivityLevel,
      requiresApproval,
    };

    // Get existing redactions
    const existingRedactions = await this.getRedactionsForRecord(
      recordId,
      fileName
    );
    existingRedactions.push(redaction);

    // Save updated redactions
    const storageKey = `${this.STORAGE_KEY_PREFIX}_${recordId}_${fileName}`;
    localStorage.setItem(storageKey, JSON.stringify(existingRedactions));

    // Create/update version
    await this.createVersion(
      recordId,
      fileName,
      existingRedactions,
      'draft',
      `Applied agency rule: ${ruleId}`
    );

    return redaction;
  }

  /**
   * Get redactions that require approval for an agency
   */
  async getRedactionsRequiringApproval(
    agencyId: string
  ): Promise<ManualRedaction[]> {
    const allRedactions = await this.getAllRedactions();
    return allRedactions.filter(
      redaction =>
        redaction.agencyId === agencyId &&
        redaction.requiresApproval &&
        !redaction.approvedBy
    );
  }

  /**
   * Approve a redaction
   */
  async approveRedaction(
    redactionId: string,
    approverId: string
  ): Promise<boolean> {
    try {
      const allRedactions = await this.getAllRedactions();
      const redactionIndex = allRedactions.findIndex(r => r.id === redactionId);

      if (redactionIndex === -1) {
        return false;
      }

      const redaction = allRedactions[redactionIndex];
      redaction.approvedBy = approverId;
      redaction.approvedAt = new Date().toISOString();

      // Update storage
      const storageKey = `${this.STORAGE_KEY_PREFIX}_${redaction.recordId}_${redaction.fileName}`;
      const recordRedactions = await this.getRedactionsForRecord(
        redaction.recordId,
        redaction.fileName
      );
      const recordRedactionIndex = recordRedactions.findIndex(
        r => r.id === redactionId
      );

      if (recordRedactionIndex >= 0) {
        recordRedactions[recordRedactionIndex] = redaction;
        localStorage.setItem(storageKey, JSON.stringify(recordRedactions));

        // Update version
        await this.createVersion(
          redaction.recordId,
          redaction.fileName,
          recordRedactions,
          'saved',
          `Approved redaction: ${redactionId}`
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to approve redaction:', error);
      return false;
    }
  }

  /**
   * Get all redactions across all records (for approval workflow)
   */
  private async getAllRedactions(): Promise<ManualRedaction[]> {
    const allRedactions: ManualRedaction[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
        try {
          const redactions = JSON.parse(localStorage.getItem(key)!);
          if (Array.isArray(redactions)) {
            allRedactions.push(...redactions);
          }
        } catch (error) {
          console.warn(`Failed to parse redactions from ${key}:`, error);
        }
      }
    }

    return allRedactions;
  }

  /**
   * Get redaction statistics by agency
   */
  async getAgencyRedactionStats(agencyId: string): Promise<{
    totalRedactions: number;
    pendingApproval: number;
    approvedRedactions: number;
    bySensitivity: Record<SensitivityLevel, number>;
    byRule: Record<string, number>;
  }> {
    const allRedactions = await this.getAllRedactions();
    const agencyRedactions = allRedactions.filter(r => r.agencyId === agencyId);

    const bySensitivity = {
      [SensitivityLevel.LOW]: 0,
      [SensitivityLevel.MEDIUM]: 0,
      [SensitivityLevel.HIGH]: 0,
      [SensitivityLevel.CRITICAL]: 0,
    };

    const byRule: Record<string, number> = {};
    let pendingApproval = 0;
    let approvedRedactions = 0;

    agencyRedactions.forEach(redaction => {
      if (redaction.sensitivityLevel) {
        bySensitivity[redaction.sensitivityLevel]++;
      }

      if (redaction.ruleId) {
        byRule[redaction.ruleId] = (byRule[redaction.ruleId] || 0) + 1;
      }

      if (redaction.requiresApproval && !redaction.approvedBy) {
        pendingApproval++;
      } else if (redaction.approvedBy) {
        approvedRedactions++;
      }
    });

    return {
      totalRedactions: agencyRedactions.length,
      pendingApproval,
      approvedRedactions,
      bySensitivity,
      byRule,
    };
  }

  /**
   * Add a manual redaction to a record
   */
  async addRedaction(
    recordId: string,
    fileName: string,
    pageNumber: number,
    coordinates: RedactionCoordinates,
    reason?: string
  ): Promise<ManualRedaction> {
    const redaction: ManualRedaction = {
      id: this.generateRedactionId(),
      recordId,
      fileName,
      pageNumber,
      x: coordinates.x,
      y: coordinates.y,
      width: coordinates.width,
      height: coordinates.height,
      createdAt: new Date().toISOString(),
      createdBy: this.getCurrentUser(),
      reason,
      type: 'manual',
    };

    // Get existing redactions
    const existingRedactions = await this.getRedactionsForRecord(
      recordId,
      fileName
    );
    const updatedRedactions = [...existingRedactions, redaction];

    // Save to localStorage
    const storageKey = `${this.STORAGE_KEY_PREFIX}_${recordId}_${fileName}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedRedactions));

    // Update version
    await this.createVersion(recordId, fileName, updatedRedactions, 'draft');

    return redaction;
  }

  /**
   * Update an existing redaction
   */
  async updateRedaction(
    recordId: string,
    fileName: string,
    redactionId: string,
    updates: Partial<
      Pick<ManualRedaction, 'x' | 'y' | 'width' | 'height' | 'reason'>
    >
  ): Promise<ManualRedaction | null> {
    const redactions = await this.getRedactionsForRecord(recordId, fileName);
    const redactionIndex = redactions.findIndex(r => r.id === redactionId);

    if (redactionIndex === -1) {
      return null;
    }

    const updatedRedaction = {
      ...redactions[redactionIndex],
      ...updates,
    };

    redactions[redactionIndex] = updatedRedaction;

    // Save updated redactions
    const storageKey = `${this.STORAGE_KEY_PREFIX}_${recordId}_${fileName}`;
    localStorage.setItem(storageKey, JSON.stringify(redactions));

    // Update version
    await this.createVersion(recordId, fileName, redactions, 'draft');

    return updatedRedaction;
  }

  /**
   * Remove a redaction
   */
  async removeRedaction(
    recordId: string,
    fileName: string,
    redactionId: string
  ): Promise<boolean> {
    const redactions = await this.getRedactionsForRecord(recordId, fileName);
    const filteredRedactions = redactions.filter(r => r.id !== redactionId);

    if (filteredRedactions.length === redactions.length) {
      return false; // Redaction not found
    }

    // Save updated redactions
    const storageKey = `${this.STORAGE_KEY_PREFIX}_${recordId}_${fileName}`;
    localStorage.setItem(storageKey, JSON.stringify(filteredRedactions));

    // Update version
    await this.createVersion(recordId, fileName, filteredRedactions, 'draft');

    return true;
  }

  /**
   * Get all redactions for a specific record and file
   */
  async getRedactionsForRecord(
    recordId: string,
    fileName: string
  ): Promise<ManualRedaction[]> {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}_${recordId}_${fileName}`;
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        return [];
      }

      const redactions = JSON.parse(stored) as ManualRedaction[];
      return redactions.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error retrieving redactions:', error);
      return [];
    }
  }

  /**
   * Alias for backward compatibility
   */
  async getRedactionsForDocument(
    recordId: string,
    fileName: string
  ): Promise<ManualRedaction[]> {
    return this.getRedactionsForRecord(recordId, fileName);
  }

  /**
   * Get redactions for a specific page
   */
  async getRedactionsForPage(
    recordId: string,
    fileName: string,
    pageNumber: number
  ): Promise<ManualRedaction[]> {
    const allRedactions = await this.getRedactionsForRecord(recordId, fileName);
    return allRedactions.filter(r => r.pageNumber === pageNumber);
  }

  /**
   * Create a new version snapshot
   */
  async createVersion(
    recordId: string,
    fileName: string,
    redactions: ManualRedaction[],
    status: RedactionVersion['status'] = 'draft',
    notes?: string
  ): Promise<RedactionVersion> {
    const version: RedactionVersion = {
      versionId: this.generateVersionId(),
      recordId,
      fileName,
      redactions: [...redactions],
      timestamp: new Date().toISOString(),
      status,
      createdBy: this.getCurrentUser(),
      notes,
    };

    // Get existing versions
    const versions = await this.getVersionHistory(recordId, fileName);
    const updatedVersions = [...versions, version];

    // Save to localStorage
    const versionKey = `${this.VERSION_KEY_PREFIX}_${recordId}_${fileName}`;
    localStorage.setItem(versionKey, JSON.stringify(updatedVersions));

    return version;
  }

  /**
   * Get version history for a record
   */
  async getVersionHistory(
    recordId: string,
    fileName: string
  ): Promise<RedactionVersion[]> {
    try {
      const versionKey = `${this.VERSION_KEY_PREFIX}_${recordId}_${fileName}`;
      const stored = localStorage.getItem(versionKey);

      if (!stored) {
        return [];
      }

      const versions = JSON.parse(stored) as RedactionVersion[];
      return versions.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error retrieving version history:', error);
      return [];
    }
  }

  /**
   * Load a specific version
   */
  async loadVersion(
    recordId: string,
    fileName: string,
    versionId: string
  ): Promise<ManualRedaction[]> {
    const versions = await this.getVersionHistory(recordId, fileName);
    const version = versions.find(v => v.versionId === versionId);

    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Update current redactions to match this version
    const storageKey = `${this.STORAGE_KEY_PREFIX}_${recordId}_${fileName}`;
    localStorage.setItem(storageKey, JSON.stringify(version.redactions));

    return version.redactions;
  }

  /**
   * Save current draft as a finalized version
   */
  async saveVersion(
    recordId: string,
    fileName: string,
    notes?: string
  ): Promise<RedactionVersion> {
    const currentRedactions = await this.getRedactionsForRecord(
      recordId,
      fileName
    );
    return await this.createVersion(
      recordId,
      fileName,
      currentRedactions,
      'saved',
      notes
    );
  }

  /**
   * Mark version as exported
   */
  async markVersionExported(
    recordId: string,
    fileName: string,
    versionId: string
  ): Promise<boolean> {
    const versions = await this.getVersionHistory(recordId, fileName);
    const versionIndex = versions.findIndex(v => v.versionId === versionId);

    if (versionIndex === -1) {
      return false;
    }

    versions[versionIndex].status = 'exported';

    // Save updated versions
    const versionKey = `${this.VERSION_KEY_PREFIX}_${recordId}_${fileName}`;
    localStorage.setItem(versionKey, JSON.stringify(versions));

    return true;
  }

  /**
   * Get redaction summary statistics
   */
  async getRedactionSummary(
    recordId: string,
    fileName: string
  ): Promise<RedactionSummary> {
    const redactions = await this.getRedactionsForRecord(recordId, fileName);
    const versions = await this.getVersionHistory(recordId, fileName);

    // Count redactions by page
    const byPage: Record<number, number> = {};
    redactions.forEach(r => {
      byPage[r.pageNumber] = (byPage[r.pageNumber] || 0) + 1;
    });

    // Count redactions by type
    const byType: Record<string, number> = {};
    redactions.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });

    // Find last modified date
    const lastModified =
      redactions.length > 0
        ? Math.max(...redactions.map(r => new Date(r.createdAt).getTime()))
        : Date.now();

    // Get current version (most recent)
    const currentVersion = versions.length > 0 ? versions[0].versionId : '';

    return {
      recordId,
      totalRedactions: redactions.length,
      byPage,
      byType,
      lastModified: new Date(lastModified).toISOString(),
      currentVersion,
      versions,
    };
  }

  /**
   * Clear all redactions for a record (with confirmation)
   */
  async clearAllRedactions(
    recordId: string,
    fileName: string
  ): Promise<boolean> {
    try {
      // Create final version before clearing
      const currentRedactions = await this.getRedactionsForRecord(
        recordId,
        fileName
      );
      if (currentRedactions.length > 0) {
        await this.createVersion(
          recordId,
          fileName,
          currentRedactions,
          'draft',
          'Cleared all redactions'
        );
      }

      // Clear current redactions
      const storageKey = `${this.STORAGE_KEY_PREFIX}_${recordId}_${fileName}`;
      localStorage.removeItem(storageKey);

      return true;
    } catch (error) {
      console.error('Error clearing redactions:', error);
      return false;
    }
  }

  /**
   * Check if coordinates overlap with existing redactions
   */
  async checkOverlap(
    recordId: string,
    fileName: string,
    pageNumber: number,
    coordinates: RedactionCoordinates,
    threshold: number = 0.1 // 10% overlap threshold
  ): Promise<ManualRedaction[]> {
    const pageRedactions = await this.getRedactionsForPage(
      recordId,
      fileName,
      pageNumber
    );

    return pageRedactions.filter(existing => {
      // Calculate overlap area
      const left = Math.max(coordinates.x, existing.x);
      const top = Math.max(coordinates.y, existing.y);
      const right = Math.min(
        coordinates.x + coordinates.width,
        existing.x + existing.width
      );
      const bottom = Math.min(
        coordinates.y + coordinates.height,
        existing.y + existing.height
      );

      if (left >= right || top >= bottom) {
        return false; // No overlap
      }

      const overlapArea = (right - left) * (bottom - top);
      const newArea = coordinates.width * coordinates.height;
      const existingArea = existing.width * existing.height;

      const overlapRatio = overlapArea / Math.min(newArea, existingArea);
      return overlapRatio > threshold;
    });
  }
}

// Export singleton instance
export const redactionService = new RedactionService();
export default redactionService;
