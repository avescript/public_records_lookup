/**
 * Shared Types for Agency Redaction System
 * Epic 9 Task 4: Agency-Specific Redaction Rules
 */

export enum SensitivityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface RedactionConfig {
  agency: string;
  template: AgencyRedactionTemplate;
  overrides?: Partial<RedactionRule>[];
  customRules?: RedactionRule[];
}

export interface AgencyRedactionTemplate {
  id: string;
  agencyId: string;
  agencyName: string;
  name: string;
  description: string;
  rules: RedactionRule[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
  version: string;
}

export interface RedactionRule {
  id: string;
  name: string;
  description: string;
  piiTypes: import('./piiDetectionService').PIIType[];
  sensitivityLevel: SensitivityLevel;
  autoApply: boolean;
  requiresApproval: boolean;
  retentionPeriod?: number;
  customPatterns?: RegExp[];
}
