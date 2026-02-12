/**
 * AI Response Generation Service
 * Provides intelligent response drafting with tone adjustment, template integration,
 * and real-time writing assistance for public records requests
 */

import { PublicRecordRequest } from '../types';
import {
  GeneratedResponse,
  GeneratedResponseSection,
  ResponseGenerationConfig,
  ResponseGenerationRequest,
  ResponseGenerationResult,
  ResponseLength,
  ResponseSection,
  ResponseSuggestion,
  ResponseTemplate,
  ResponseTone,
  ResponseValidation,
  SmartEditingContext,
  ValidationIssue,
  WritingAssistanceSuggestion,
} from '../types/response';

/**
 * Default response templates for common scenarios
 */
const DEFAULT_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'standard-fulfillment',
    name: 'Standard Request Fulfillment',
    description: 'Template for fulfilled requests with records provided',
    requestType: ['general', 'document_request', 'incident_report'],
    baseTemplate: `Dear {{requester_name}},

Thank you for your public records request dated {{request_date}} regarding {{request_subject}}.

We have located {{record_count}} record(s) responsive to your request. {{redaction_explanation}}

{{records_summary}}

{{fee_information}}

If you have any questions about this response, please contact us at {{contact_email}} or {{contact_phone}}.

Sincerely,
{{staff_name}}
{{agency_name}}`,
    sections: [
      'greeting',
      'acknowledgment',
      'records_summary',
      'redaction_explanation',
      'fees',
      'closing',
      'contact_info',
    ],
    placeholders: [
      {
        key: 'requester_name',
        label: 'Requester Name',
        type: 'text',
        required: true,
      },
      {
        key: 'request_date',
        label: 'Request Date',
        type: 'date',
        required: true,
      },
      {
        key: 'request_subject',
        label: 'Request Subject',
        type: 'text',
        required: true,
      },
      {
        key: 'record_count',
        label: 'Number of Records',
        type: 'number',
        required: true,
      },
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true },
      {
        key: 'agency_name',
        label: 'Agency Name',
        type: 'text',
        required: true,
      },
    ],
    tone: 'professional',
    compliance: { foia: true, cpra: true },
    usage: { frequency: 0, lastUsed: new Date(), rating: 4.5 },
  },
  {
    id: 'no-records-found',
    name: 'No Records Found',
    description: 'Template for when no responsive records are located',
    requestType: ['general', 'document_request'],
    baseTemplate: `Dear {{requester_name}},

Thank you for your public records request dated {{request_date}} regarding {{request_subject}}.

After conducting a thorough search of our records, we were unable to locate any documents responsive to your request. {{search_explanation}}

{{appeal_rights}}

If you have any questions about this response, please contact us at {{contact_email}} or {{contact_phone}}.

Sincerely,
{{staff_name}}
{{agency_name}}`,
    sections: [
      'greeting',
      'acknowledgment',
      'explanation',
      'next_steps',
      'closing',
      'contact_info',
    ],
    placeholders: [
      {
        key: 'requester_name',
        label: 'Requester Name',
        type: 'text',
        required: true,
      },
      {
        key: 'request_date',
        label: 'Request Date',
        type: 'date',
        required: true,
      },
      {
        key: 'request_subject',
        label: 'Request Subject',
        type: 'text',
        required: true,
      },
      {
        key: 'search_explanation',
        label: 'Search Explanation',
        type: 'text',
        required: false,
      },
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true },
      {
        key: 'agency_name',
        label: 'Agency Name',
        type: 'text',
        required: true,
      },
    ],
    tone: 'professional',
    compliance: { foia: true, cpra: true },
    usage: { frequency: 0, lastUsed: new Date(), rating: 4.2 },
  },
  {
    id: 'partial-denial',
    name: 'Partial Denial with Exemptions',
    description:
      'Template for requests with some records denied due to exemptions',
    requestType: ['general', 'document_request', 'sensitive_request'],
    baseTemplate: `Dear {{requester_name}},

Thank you for your public records request dated {{request_date}} regarding {{request_subject}}.

We have located {{total_record_count}} record(s) responsive to your request. Of these, {{released_count}} record(s) are being provided and {{withheld_count}} record(s) are being withheld under the following exemptions:

{{exemption_details}}

{{redaction_explanation}}

{{fee_information}}

{{appeal_rights}}

If you have any questions about this response, please contact us at {{contact_email}} or {{contact_phone}}.

Sincerely,
{{staff_name}}
{{agency_name}}`,
    sections: [
      'greeting',
      'acknowledgment',
      'records_summary',
      'exemptions',
      'redaction_explanation',
      'fees',
      'next_steps',
      'closing',
      'contact_info',
    ],
    placeholders: [
      {
        key: 'requester_name',
        label: 'Requester Name',
        type: 'text',
        required: true,
      },
      {
        key: 'request_date',
        label: 'Request Date',
        type: 'date',
        required: true,
      },
      {
        key: 'request_subject',
        label: 'Request Subject',
        type: 'text',
        required: true,
      },
      {
        key: 'total_record_count',
        label: 'Total Records Found',
        type: 'number',
        required: true,
      },
      {
        key: 'released_count',
        label: 'Records Released',
        type: 'number',
        required: true,
      },
      {
        key: 'withheld_count',
        label: 'Records Withheld',
        type: 'number',
        required: true,
      },
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true },
      {
        key: 'agency_name',
        label: 'Agency Name',
        type: 'text',
        required: true,
      },
    ],
    tone: 'legal',
    compliance: { foia: true, cpra: true },
    usage: { frequency: 0, lastUsed: new Date(), rating: 4.8 },
  },
];

/**
 * AI Response Generation Service
 * Integrates with LLM providers to generate intelligent response drafts
 */
export class AIResponseService {
  private apiKey: string;
  private apiEndpoint: string;
  private config: ResponseGenerationConfig;
  private templates: Map<string, ResponseTemplate> = new Map();

  constructor(config?: Partial<ResponseGenerationConfig>) {
    this.config = {
      apiEndpoint:
        config?.apiEndpoint || 'https://api.openai.com/v1/chat/completions',
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY || 'mock-key',
      model: config?.model || 'gpt-4',
      maxTokens: config?.maxTokens || 2000,
      temperature: config?.temperature || 0.3,
      templates: config?.templates || DEFAULT_TEMPLATES,
      complianceRules: config?.complianceRules || {
        requiredSections: [
          'greeting',
          'acknowledgment',
          'closing',
          'contact_info',
        ],
        forbiddenPhrases: ['we refuse', 'denied', 'rejected without review'],
        mandatoryDisclosures: ['appeal rights', 'contact information'],
      },
      ...config,
    };

    // Load templates
    this.loadTemplates();
  }

  /**
   * Generate AI-powered response draft
   */
  async generateResponse(
    request: ResponseGenerationRequest
  ): Promise<ResponseGenerationResult> {
    try {
      // Validate request
      const validation = this.validateGenerationRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Request validation failed',
            details: validation,
          },
        };
      }

      // Get template if specified
      let template: ResponseTemplate | undefined;
      if (request.templateId) {
        template = this.templates.get(request.templateId);
      } else {
        template = this.selectBestTemplate(request);
      }

      // Generate content using AI
      const response = await this.generateAIContent(request, template);

      // Validate generated content
      const contentValidation = await this.validateResponse(response);

      return {
        success: true,
        response: {
          ...response,
          suggestions: this.generateImprovementSuggestions(
            response,
            contentValidation
          ),
        },
        usage: {
          tokensUsed: this.estimateTokens(response.content),
          cost: 0, // Mock cost calculation
          processingTime: Date.now() - Date.now(), // Mock processing time
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
        },
      };
    }
  }

  /**
   * Get real-time writing assistance suggestions
   */
  async getWritingAssistance(
    context: SmartEditingContext
  ): Promise<WritingAssistanceSuggestion[]> {
    // Mock implementation - in production, would call AI service
    const suggestions: WritingAssistanceSuggestion[] = [];

    // Analyze current content for improvements
    if (context.currentContent.length < 50) {
      suggestions.push({
        id: 'completion-1',
        type: 'completion',
        content:
          'Thank you for your public records request. We have reviewed your request and...',
        reasoning: 'Standard professional opening for public records responses',
        confidence: 0.85,
        position: {
          start: context.cursorPosition,
          end: context.cursorPosition,
        },
      });
    }

    // Tone-specific suggestions
    if (
      context.tone === 'friendly' &&
      !context.currentContent.includes('Thank you')
    ) {
      suggestions.push({
        id: 'tone-1',
        type: 'improvement',
        content: 'Thank you for your request',
        reasoning: 'Adding gratitude aligns with friendly tone',
        confidence: 0.9,
        position: { start: 0, end: 0 },
      });
    }

    return suggestions;
  }

  /**
   * Get available response templates
   */
  getTemplates(requestType?: string): ResponseTemplate[] {
    const templates = Array.from(this.templates.values());

    if (requestType) {
      return templates.filter(
        template =>
          template.requestType.includes(requestType) ||
          template.requestType.includes('general')
      );
    }

    return templates;
  }

  /**
   * Add or update a response template
   */
  saveTemplate(template: ResponseTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Delete a response template
   */
  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Validate response content for compliance and quality
   */
  async validateResponse(
    response: GeneratedResponse
  ): Promise<ResponseValidation> {
    const issues: ValidationIssue[] = [];

    // Check required sections
    for (const requiredSection of this.config.complianceRules
      .requiredSections) {
      const hasSection = response.sections.some(
        section => section.type === requiredSection
      );
      if (!hasSection) {
        issues.push({
          type: 'compliance',
          severity: 'error',
          message: `Missing required section: ${requiredSection}`,
          section: requiredSection,
          suggestion: `Add ${requiredSection} section to comply with regulations`,
        });
      }
    }

    // Check forbidden phrases
    for (const phrase of this.config.complianceRules.forbiddenPhrases) {
      if (response.content.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push({
          type: 'compliance',
          severity: 'warning',
          message: `Contains potentially problematic phrase: "${phrase}"`,
          suggestion: 'Consider rephrasing to maintain professional tone',
        });
      }
    }

    // Basic grammar and style checks
    if (response.content.length < 100) {
      issues.push({
        type: 'completeness',
        severity: 'warning',
        message:
          'Response appears too brief for a formal public records response',
        suggestion: 'Consider adding more detail and context',
      });
    }

    const score = Math.max(0, 100 - issues.length * 10);

    return {
      isValid: issues.filter(issue => issue.severity === 'error').length === 0,
      score,
      issues,
      compliance: {
        foia: !issues.some(
          issue => issue.type === 'compliance' && issue.severity === 'error'
        ),
        cpra: !issues.some(
          issue => issue.type === 'compliance' && issue.severity === 'error'
        ),
        accessibility: true, // Mock check
        legalLanguage: response.metadata.tone === 'legal',
      },
      recommendations: issues
        .map(issue => issue.suggestion)
        .filter(Boolean) as string[],
    };
  }

  /**
   * Private helper methods
   */
  private loadTemplates(): void {
    for (const template of this.config.templates) {
      this.templates.set(template.id, template);
    }
  }

  private validateGenerationRequest(request: ResponseGenerationRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.requestId) {
      errors.push('Request ID is required');
    }

    if (!request.context?.requestDetails) {
      errors.push('Request details context is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private selectBestTemplate(
    request: ResponseGenerationRequest
  ): ResponseTemplate | undefined {
    const templates = Array.from(this.templates.values());

    // Simple scoring algorithm - in production would be more sophisticated
    let bestTemplate = templates[0];
    let bestScore = 0;

    for (const template of templates) {
      let score = 0;

      // Score based on request type match
      if (template.requestType.includes('general')) score += 1;

      // Score based on tone compatibility
      if (template.tone === request.tone) score += 2;

      // Score based on context
      if (request.context.recordsFound && template.id.includes('fulfillment'))
        score += 3;
      if (!request.context.recordsFound && template.id.includes('no-records'))
        score += 3;
      if (
        request.context.exemptionsUsed?.length &&
        template.id.includes('denial')
      )
        score += 2;

      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    return bestTemplate;
  }

  private async generateAIContent(
    request: ResponseGenerationRequest,
    template?: ResponseTemplate
  ): Promise<GeneratedResponse> {
    // Mock AI generation - in production would call actual LLM API
    const baseContent =
      template?.baseTemplate || this.getDefaultTemplate(request);

    // Fill in placeholders with provided values or intelligent defaults
    let content = this.fillPlaceholders(baseContent, request);

    // Apply tone and length adjustments
    content = this.adjustToneAndLength(content, request.tone, request.length);

    // Generate sections
    const sections = this.generateSections(
      content,
      request.includeSections,
      template
    );

    return {
      id: `response-${Date.now()}`,
      requestId: request.requestId,
      content,
      sections,
      metadata: {
        templateId: template?.id,
        tone: request.tone,
        length: request.length,
        wordsCount: content.split(' ').length,
        generatedAt: new Date(),
        confidence: 0.85, // Mock confidence score
        model: this.config.model,
      },
      suggestions: [],
      placeholders: request.placeholderValues || {},
    };
  }

  private getDefaultTemplate(request: ResponseGenerationRequest): string {
    // Return appropriate default based on context
    if (!request.context.recordsFound) {
      return (
        DEFAULT_TEMPLATES.find(t => t.id === 'no-records-found')
          ?.baseTemplate || ''
      );
    } else if (request.context.exemptionsUsed?.length) {
      return (
        DEFAULT_TEMPLATES.find(t => t.id === 'partial-denial')?.baseTemplate ||
        ''
      );
    } else {
      return (
        DEFAULT_TEMPLATES.find(t => t.id === 'standard-fulfillment')
          ?.baseTemplate || ''
      );
    }
  }

  private fillPlaceholders(
    content: string,
    request: ResponseGenerationRequest
  ): string {
    const values = request.placeholderValues || {};
    const context = request.context;

    // Fill standard placeholders
    const standardValues = {
      requester_name: context.requestDetails.contactInfo?.name || 'Requestor',
      request_date:
        context.requestDetails.submittedAt || new Date().toLocaleDateString(),
      request_subject: context.requestDetails.title || 'your request',
      record_count: context.recordCount?.toString() || '0',
      agency_name: 'Public Records Office',
      staff_name: 'Records Coordinator',
      contact_email: 'records@agency.gov',
      contact_phone: '(555) 123-4567',
      ...values,
    };

    let filledContent = content;
    for (const [key, value] of Object.entries(standardValues)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      filledContent = filledContent.replace(regex, String(value));
    }

    return filledContent;
  }

  private adjustToneAndLength(
    content: string,
    tone: ResponseTone,
    length: ResponseLength
  ): string {
    let adjustedContent = content;

    // Tone adjustments
    switch (tone) {
      case 'friendly':
        adjustedContent = adjustedContent.replace(/Dear/g, 'Hello');
        adjustedContent = adjustedContent.replace(/Sincerely/g, 'Best regards');
        break;
      case 'legal':
        adjustedContent = adjustedContent.replace(
          /Thank you/g,
          'We acknowledge receipt'
        );
        break;
      case 'formal':
        // Already formal by default
        break;
    }

    // Length adjustments (simplified)
    if (length === 'concise') {
      // Remove some explanatory sentences (mock implementation)
      adjustedContent = adjustedContent.replace(/\. [^.]*detail[^.]*\./g, '.');
    } else if (length === 'detailed') {
      // Add more explanatory content (mock implementation)
      adjustedContent = adjustedContent.replace(
        /responsive to your request\./,
        'responsive to your request. These documents have been carefully reviewed and processed according to applicable public records laws.'
      );
    }

    return adjustedContent;
  }

  private generateSections(
    content: string,
    includeSections: ResponseSection[],
    template?: ResponseTemplate
  ): GeneratedResponseSection[] {
    const sections: GeneratedResponseSection[] = [];

    for (const sectionType of includeSections) {
      // Extract section content from full response (simplified)
      let sectionContent = '';

      switch (sectionType) {
        case 'greeting':
          sectionContent = content.split('\n')[0] || '';
          break;
        case 'acknowledgment':
          sectionContent = content.split('\n')[2] || '';
          break;
        case 'closing':
          const lines = content.split('\n');
          sectionContent = lines.slice(-3).join('\n');
          break;
        default:
          sectionContent = `[${sectionType} content would be generated here]`;
      }

      sections.push({
        type: sectionType,
        content: sectionContent,
        confidence: 0.8, // Mock confidence
        alternatives: [], // Could generate alternative phrasings
      });
    }

    return sections;
  }

  private generateImprovementSuggestions(
    response: GeneratedResponse,
    validation: ResponseValidation
  ): ResponseSuggestion[] {
    const suggestions: ResponseSuggestion[] = [];

    // Convert validation issues to suggestions
    for (const issue of validation.issues) {
      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random()}`,
        type: issue.type as any,
        severity: issue.severity,
        message: issue.message,
        suggestion: issue.suggestion || 'Please review and correct',
        section: issue.section,
        position: issue.position,
      });
    }

    // Add general improvement suggestions
    if (response.metadata.wordsCount < 100) {
      suggestions.push({
        id: `suggestion-length-${Date.now()}`,
        type: 'length',
        severity: 'info',
        message: 'Response may benefit from additional detail',
        suggestion:
          'Consider adding more context about the search process or next steps',
      });
    }

    return suggestions;
  }

  private estimateTokens(content: string): number {
    // Rough token estimation (4 characters ≈ 1 token)
    return Math.ceil(content.length / 4);
  }
}

// Export singleton instance
export const aiResponseService = new AIResponseService();
export default aiResponseService;
