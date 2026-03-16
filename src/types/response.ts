/**
 * Types for AI Response Generation System
 * Supports AI-powered response drafting with templates, tone adjustment, and smart editing
 */

import { PublicRecordRequest } from './index';

/**
 * Response generation tone options
 */
export type ResponseTone = 'formal' | 'friendly' | 'legal' | 'professional';

/**
 * Response length controls
 */
export type ResponseLength = 'concise' | 'standard' | 'detailed';

/**
 * Response section types for structured content generation
 */
export type ResponseSection =
  | 'greeting'
  | 'acknowledgment'
  | 'explanation'
  | 'records_summary'
  | 'redaction_explanation'
  | 'exemptions'
  | 'fees'
  | 'next_steps'
  | 'closing'
  | 'contact_info';

/**
 * Response template for different request scenarios
 */
export interface ResponseTemplate {
  id: string;
  name: string;
  description: string;
  requestType: string[];
  baseTemplate: string;
  sections: ResponseSection[];
  placeholders: ResponseTemplatePlaceholder[];
  tone: ResponseTone;
  compliance: {
    foia: boolean;
    cpra: boolean;
    hipaa?: boolean;
    ferpa?: boolean;
  };
  usage: {
    frequency: number;
    lastUsed: Date;
    rating: number;
  };
}

/**
 * Template placeholder configuration
 */
export interface ResponseTemplatePlaceholder {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'boolean' | 'list' | 'computed';
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
  description?: string;
}

/**
 * AI response generation request
 */
export interface ResponseGenerationRequest {
  requestId: string;
  templateId?: string;
  tone: ResponseTone;
  length: ResponseLength;
  includeSections: ResponseSection[];
  customInstructions?: string;
  placeholderValues?: Record<string, any>;
  context: {
    requestDetails: PublicRecordRequest;
    recordsFound: boolean;
    recordCount?: number;
    redactionsApplied?: boolean;
    exemptionsUsed?: string[];
    fees?: number;
  };
}

/**
 * Generated response from AI service
 */
export interface GeneratedResponse {
  id: string;
  requestId: string;
  content: string;
  sections: GeneratedResponseSection[];
  metadata: {
    templateId?: string;
    tone: ResponseTone;
    length: ResponseLength;
    wordsCount: number;
    generatedAt: Date;
    confidence: number;
    model: string;
  };
  suggestions: ResponseSuggestion[];
  placeholders: Record<string, any>;
}

/**
 * Individual response section with AI-generated content
 */
export interface GeneratedResponseSection {
  type: ResponseSection;
  content: string;
  confidence: number;
  alternatives?: string[];
  reasoning?: string;
}

/**
 * AI suggestions for response improvement
 */
export interface ResponseSuggestion {
  id: string;
  type: 'tone' | 'length' | 'clarity' | 'compliance' | 'grammar' | 'style';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion: string;
  section?: ResponseSection;
  position?: {
    start: number;
    end: number;
  };
}

/**
 * Smart editing context for real-time assistance
 */
export interface SmartEditingContext {
  currentContent: string;
  cursorPosition: number;
  selectedText?: string;
  tone: ResponseTone;
  length: ResponseLength;
  requestContext: PublicRecordRequest;
}

/**
 * AI writing assistance suggestion
 */
export interface WritingAssistanceSuggestion {
  id: string;
  type: 'completion' | 'improvement' | 'replacement' | 'addition';
  content: string;
  reasoning: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

/**
 * Response validation result
 */
export interface ResponseValidation {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  compliance: {
    foia: boolean;
    cpra: boolean;
    accessibility: boolean;
    legalLanguage: boolean;
  };
  recommendations: string[];
}

/**
 * Response validation issue
 */
export interface ValidationIssue {
  type:
    | 'compliance'
    | 'grammar'
    | 'tone'
    | 'length'
    | 'completeness'
    | 'accuracy';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  section?: ResponseSection;
  position?: {
    start: number;
    end: number;
  };
  suggestion?: string;
}

/**
 * Response draft version for history tracking
 */
export interface ResponseDraftVersion {
  id: string;
  responseId: string;
  version: number;
  content: string;
  changes: {
    type: 'manual' | 'ai_suggestion' | 'template_change' | 'tone_adjustment';
    description: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  createdBy: string;
}

/**
 * Response generation service configuration
 */
export interface ResponseGenerationConfig {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  templates: ResponseTemplate[];
  complianceRules: {
    requiredSections: ResponseSection[];
    forbiddenPhrases: string[];
    mandatoryDisclosures: string[];
  };
}

/**
 * Service response for response generation
 */
export interface ResponseGenerationResult {
  success: boolean;
  response?: GeneratedResponse;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  usage?: {
    tokensUsed: number;
    cost: number;
    processingTime: number;
  };
}
