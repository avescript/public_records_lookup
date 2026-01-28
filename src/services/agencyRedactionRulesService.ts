/**
 * Agency-Specific Redaction Rules Service
 * Epic 9 Task 4: Agency-Specific Redaction Rules
 * 
 * Manages redaction rules and templates specific to different agencies.
 * Different agencies may have different PII sensitivity levels and redaction requirements.
 */

import { PIIType } from './piiDetectionService';
import { 
  SensitivityLevel, 
  RedactionConfig, 
  AgencyRedactionTemplate, 
  RedactionRule 
} from './agencyTypes';

/**
 * Agency-Specific Redaction Rules Service
 */
export class AgencyRedactionRulesService {
  private templates: Map<string, AgencyRedactionTemplate> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default templates for different agencies
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates = this.createDefaultAgencyTemplates();
    
    defaultTemplates.forEach(template => {
      this.templates.set(template.agencyId, template);
    });
    
    this.initialized = true;
  }

  /**
   * Create default redaction templates for various agencies
   */
  private createDefaultAgencyTemplates(): AgencyRedactionTemplate[] {
    const now = new Date().toISOString();

    return [
      {
        id: 'police-standard',
        agencyId: 'police',
        agencyName: 'Police Department',
        name: 'Standard Police Redaction Template',
        description: 'Standard redaction rules for police records with high sensitivity for personal information',
        rules: [
          {
            id: 'police-personal-info',
            name: 'Personal Information',
            description: 'Redact all personal identifying information',
            piiTypes: [PIIType.SSN, PIIType.DOB, PIIType.DRIVERS_LICENSE, PIIType.ADDRESS, PIIType.PHONE],
            sensitivityLevel: SensitivityLevel.HIGH,
            autoApply: true,
            requiresApproval: false,
          },
          {
            id: 'police-confidential-sources',
            name: 'Confidential Sources',
            description: 'Protect confidential informant identities',
            piiTypes: [PIIType.CONFIDENTIAL_SOURCE, PIIType.PERSON_NAME],
            sensitivityLevel: SensitivityLevel.CRITICAL,
            autoApply: true,
            requiresApproval: true,
          },
          {
            id: 'police-officer-info',
            name: 'Officer Information',
            description: 'Protect officer badge numbers and personal details',
            piiTypes: [PIIType.BADGE_NUMBER, PIIType.PHONE, PIIType.ADDRESS],
            sensitivityLevel: SensitivityLevel.MEDIUM,
            autoApply: false,
            requiresApproval: true,
          },
          {
            id: 'police-case-numbers',
            name: 'Case Numbers',
            description: 'Redact case numbers for ongoing investigations',
            piiTypes: [PIIType.CASE_NUMBER, PIIType.INCIDENT_NUMBER],
            sensitivityLevel: SensitivityLevel.MEDIUM,
            autoApply: false,
            requiresApproval: false,
          },
        ],
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        isActive: true,
        version: '1.0.0',
      },
      {
        id: 'fire-standard',
        agencyId: 'fire',
        agencyName: 'Fire Department',
        name: 'Standard Fire Department Redaction Template',
        description: 'Standard redaction rules for fire department records focusing on medical privacy',
        rules: [
          {
            id: 'fire-personal-info',
            name: 'Personal Information',
            description: 'Redact personal identifying information',
            piiTypes: [PIIType.SSN, PIIType.DOB, PIIType.DRIVERS_LICENSE, PIIType.ADDRESS, PIIType.PHONE],
            sensitivityLevel: SensitivityLevel.HIGH,
            autoApply: true,
            requiresApproval: false,
          },
          {
            id: 'fire-medical-info',
            name: 'Medical Information',
            description: 'Protect medical information and patient data',
            piiTypes: [PIIType.MEDICAL_ID, PIIType.PERSON_NAME],
            sensitivityLevel: SensitivityLevel.CRITICAL,
            autoApply: true,
            requiresApproval: false,
          },
          {
            id: 'fire-incident-details',
            name: 'Incident Details',
            description: 'Redact sensitive incident numbers and case references',
            piiTypes: [PIIType.INCIDENT_NUMBER, PIIType.CASE_NUMBER],
            sensitivityLevel: SensitivityLevel.MEDIUM,
            autoApply: false,
            requiresApproval: false,
          },
        ],
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        isActive: true,
        version: '1.0.0',
      },
      {
        id: 'finance-standard',
        agencyId: 'finance',
        agencyName: 'Finance Department',
        name: 'Standard Finance Redaction Template',
        description: 'Financial records redaction template with emphasis on financial privacy',
        rules: [
          {
            id: 'finance-personal-info',
            name: 'Personal Information',
            description: 'Redact personal identifying information',
            piiTypes: [PIIType.SSN, PIIType.DOB, PIIType.ADDRESS, PIIType.PHONE],
            sensitivityLevel: SensitivityLevel.HIGH,
            autoApply: true,
            requiresApproval: false,
          },
          {
            id: 'finance-account-info',
            name: 'Financial Account Information',
            description: 'Protect bank account and routing numbers',
            piiTypes: [PIIType.ACCOUNT_NUMBER, PIIType.ROUTING_NUMBER],
            sensitivityLevel: SensitivityLevel.CRITICAL,
            autoApply: true,
            requiresApproval: false,
          },
          {
            id: 'finance-case-references',
            name: 'Case References',
            description: 'Redact case numbers and reference IDs',
            piiTypes: [PIIType.CASE_NUMBER],
            sensitivityLevel: SensitivityLevel.MEDIUM,
            autoApply: false,
            requiresApproval: false,
            retentionPeriod: 2555, // 7 years for financial records
          },
        ],
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        isActive: true,
        version: '1.0.0',
      },
      {
        id: 'parks-standard',
        agencyId: 'parks',
        agencyName: 'Parks & Recreation',
        name: 'Standard Parks Redaction Template',
        description: 'Parks department redaction template with lower sensitivity requirements',
        rules: [
          {
            id: 'parks-personal-info',
            name: 'Personal Information',
            description: 'Redact personal identifying information',
            piiTypes: [PIIType.SSN, PIIType.PHONE, PIIType.ADDRESS],
            sensitivityLevel: SensitivityLevel.MEDIUM,
            autoApply: true,
            requiresApproval: false,
          },
          {
            id: 'parks-contact-info',
            name: 'Contact Information',
            description: 'Email addresses and phone numbers',
            piiTypes: [PIIType.EMAIL, PIIType.PHONE],
            sensitivityLevel: SensitivityLevel.LOW,
            autoApply: false,
            requiresApproval: false,
          },
        ],
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        isActive: true,
        version: '1.0.0',
      },
      {
        id: 'health-standard',
        agencyId: 'health',
        agencyName: 'Health Department',
        name: 'Standard Health Redaction Template',
        description: 'Health department template with strict medical privacy requirements',
        rules: [
          {
            id: 'health-personal-info',
            name: 'Personal Information',
            description: 'Redact personal identifying information',
            piiTypes: [PIIType.SSN, PIIType.DOB, PIIType.DRIVERS_LICENSE, PIIType.ADDRESS, PIIType.PHONE],
            sensitivityLevel: SensitivityLevel.HIGH,
            autoApply: true,
            requiresApproval: false,
          },
          {
            id: 'health-medical-info',
            name: 'Medical Information',
            description: 'Strict protection for all medical data and patient information',
            piiTypes: [PIIType.MEDICAL_ID, PIIType.PERSON_NAME],
            sensitivityLevel: SensitivityLevel.CRITICAL,
            autoApply: true,
            requiresApproval: true,
          },
          {
            id: 'health-case-info',
            name: 'Case Information',
            description: 'Medical case numbers and incident references',
            piiTypes: [PIIType.CASE_NUMBER, PIIType.INCIDENT_NUMBER],
            sensitivityLevel: SensitivityLevel.HIGH,
            autoApply: true,
            requiresApproval: false,
          },
        ],
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        isActive: true,
        version: '1.0.0',
      },
    ];
  }

  /**
   * Get redaction template for a specific agency
   */
  async getAgencyTemplate(agencyId: string): Promise<AgencyRedactionTemplate | null> {
    if (!this.initialized) {
      this.initializeDefaultTemplates();
    }

    return this.templates.get(agencyId) || null;
  }

  /**
   * Get all available agency templates
   */
  async getAllTemplates(): Promise<AgencyRedactionTemplate[]> {
    if (!this.initialized) {
      this.initializeDefaultTemplates();
    }

    return Array.from(this.templates.values());
  }

  /**
   * Get redaction rules for a specific agency
   */
  async getAgencyRules(agencyId: string): Promise<RedactionRule[]> {
    const template = await this.getAgencyTemplate(agencyId);
    return template?.rules || [];
  }

  /**
   * Get rules that should be auto-applied for an agency
   */
  async getAutoApplyRules(agencyId: string): Promise<RedactionRule[]> {
    const rules = await this.getAgencyRules(agencyId);
    return rules.filter(rule => rule.autoApply);
  }

  /**
   * Get rules that require approval for an agency
   */
  async getApprovalRequiredRules(agencyId: string): Promise<RedactionRule[]> {
    const rules = await this.getAgencyRules(agencyId);
    return rules.filter(rule => rule.requiresApproval);
  }

  /**
   * Get rules by sensitivity level for an agency
   */
  async getRulesBySensitivity(agencyId: string, level: SensitivityLevel): Promise<RedactionRule[]> {
    const rules = await this.getAgencyRules(agencyId);
    return rules.filter(rule => rule.sensitivityLevel === level);
  }

  /**
   * Get rules that apply to specific PII types
   */
  async getRulesForPIITypes(agencyId: string, piiTypes: PIIType[]): Promise<RedactionRule[]> {
    const rules = await this.getAgencyRules(agencyId);
    return rules.filter(rule => 
      rule.piiTypes.some(type => piiTypes.includes(type))
    );
  }

  /**
   * Create or update a custom redaction template for an agency
   */
  async saveAgencyTemplate(template: AgencyRedactionTemplate): Promise<boolean> {
    try {
      template.updatedAt = new Date().toISOString();
      this.templates.set(template.agencyId, template);
      
      // In a real implementation, this would persist to a database
      localStorage.setItem(
        `agency_redaction_template_${template.agencyId}`,
        JSON.stringify(template)
      );
      
      return true;
    } catch (error) {
      console.error('Failed to save agency template:', error);
      return false;
    }
  }

  /**
   * Add a custom rule to an agency template
   */
  async addRuleToAgency(agencyId: string, rule: RedactionRule): Promise<boolean> {
    try {
      const template = await this.getAgencyTemplate(agencyId);
      if (!template) {
        throw new Error(`Template not found for agency: ${agencyId}`);
      }

      // Check if rule already exists
      const existingRuleIndex = template.rules.findIndex(r => r.id === rule.id);
      
      if (existingRuleIndex >= 0) {
        // Update existing rule
        template.rules[existingRuleIndex] = rule;
      } else {
        // Add new rule
        template.rules.push(rule);
      }

      return await this.saveAgencyTemplate(template);
    } catch (error) {
      console.error('Failed to add rule to agency:', error);
      return false;
    }
  }

  /**
   * Remove a rule from an agency template
   */
  async removeRuleFromAgency(agencyId: string, ruleId: string): Promise<boolean> {
    try {
      const template = await this.getAgencyTemplate(agencyId);
      if (!template) {
        throw new Error(`Template not found for agency: ${agencyId}`);
      }

      template.rules = template.rules.filter(rule => rule.id !== ruleId);
      return await this.saveAgencyTemplate(template);
    } catch (error) {
      console.error('Failed to remove rule from agency:', error);
      return false;
    }
  }

  /**
   * Get redaction configuration for a specific agency and context
   */
  async getRedactionConfig(agencyId: string, overrides?: Partial<RedactionRule>[]): Promise<RedactionConfig | null> {
    const template = await this.getAgencyTemplate(agencyId);
    if (!template) {
      return null;
    }

    return {
      agency: agencyId,
      template,
      overrides,
    };
  }

  /**
   * Validate if a rule is compatible with an agency's requirements
   */
  validateRuleForAgency(agencyId: string, rule: RedactionRule): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Basic validation
    if (!rule.id || !rule.name || !rule.piiTypes || rule.piiTypes.length === 0) {
      issues.push('Rule must have id, name, and at least one PII type');
    }

    // Agency-specific validation
    switch (agencyId) {
      case 'police':
        if (rule.sensitivityLevel === SensitivityLevel.LOW && 
            rule.piiTypes.includes(PIIType.CONFIDENTIAL_SOURCE)) {
          issues.push('Confidential source information cannot have low sensitivity');
        }
        break;
      
      case 'health':
        if (rule.piiTypes.includes(PIIType.MEDICAL_ID) && 
            !rule.requiresApproval && 
            rule.sensitivityLevel !== SensitivityLevel.CRITICAL) {
          issues.push('Medical information must be critical sensitivity or require approval');
        }
        break;

      case 'finance':
        if ((rule.piiTypes.includes(PIIType.ACCOUNT_NUMBER) || 
             rule.piiTypes.includes(PIIType.ROUTING_NUMBER)) &&
            rule.sensitivityLevel !== SensitivityLevel.CRITICAL) {
          issues.push('Financial account information must have critical sensitivity');
        }
        break;
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Get summary statistics for agency templates
   */
  async getAgencyRulesSummary(agencyId: string): Promise<{
    totalRules: number;
    autoApplyRules: number;
    approvalRequiredRules: number;
    bySensitivity: Record<SensitivityLevel, number>;
    byPIIType: Record<PIIType, number>;
  } | null> {
    const rules = await this.getAgencyRules(agencyId);
    if (rules.length === 0) return null;

    const bySensitivity = {
      [SensitivityLevel.LOW]: 0,
      [SensitivityLevel.MEDIUM]: 0,
      [SensitivityLevel.HIGH]: 0,
      [SensitivityLevel.CRITICAL]: 0,
    };

    const byPIIType: Record<PIIType, number> = Object.values(PIIType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<PIIType, number>);

    let autoApplyRules = 0;
    let approvalRequiredRules = 0;

    rules.forEach(rule => {
      if (rule.autoApply) autoApplyRules++;
      if (rule.requiresApproval) approvalRequiredRules++;
      
      bySensitivity[rule.sensitivityLevel]++;
      
      rule.piiTypes.forEach(piiType => {
        byPIIType[piiType]++;
      });
    });

    return {
      totalRules: rules.length,
      autoApplyRules,
      approvalRequiredRules,
      bySensitivity,
      byPIIType,
    };
  }

  /**
   * Load custom templates from localStorage
   */
  private loadCustomTemplates(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('agency_redaction_template_')) {
        try {
          const template = JSON.parse(localStorage.getItem(key)!);
          this.templates.set(template.agencyId, template);
        } catch (error) {
          console.warn(`Failed to load custom template from ${key}:`, error);
        }
      }
    }
  }

  /**
   * Reset agency template to default
   */
  async resetAgencyToDefault(agencyId: string): Promise<boolean> {
    try {
      // Remove custom template from localStorage
      localStorage.removeItem(`agency_redaction_template_${agencyId}`);
      
      // Reinitialize default templates
      this.initializeDefaultTemplates();
      
      return true;
    } catch (error) {
      console.error('Failed to reset agency template:', error);
      return false;
    }
  }
}

// Export singleton instance
export const agencyRedactionRulesService = new AgencyRedactionRulesService();
export default agencyRedactionRulesService;

// Re-export types for convenience
export { 
  SensitivityLevel, 
  RedactionConfig, 
  AgencyRedactionTemplate, 
  RedactionRule 
} from './agencyTypes';