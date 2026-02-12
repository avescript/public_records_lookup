/**
 * Type definitions for Review & Send system (Step 4 of V2 workflow)
 */

import { RedactionLayer } from './redaction';
import { PublicRecordRequest, RequestStatus } from './request';
import { GeneratedResponse } from './response';

// Review & Approval System Types

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_revision';

export type ApprovalLevel =
  | 'staff'
  | 'supervisor'
  | 'legal'
  | 'department_head';

export interface ApprovalRequest {
  id: string;
  requestId: string;
  level: ApprovalLevel;
  approverId: string;
  approverName: string;
  approverEmail: string;
  status: ApprovalStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  comments?: string;
  checklist: ApprovalChecklist;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ApprovalChecklist {
  items: ApprovalChecklistItem[];
  overallScore: number; // 0-100%
  passThreshold: number; // Default 85%
}

export interface ApprovalChecklistItem {
  id: string;
  category: 'legal' | 'content' | 'format' | 'compliance' | 'quality';
  description: string;
  checked: boolean;
  required: boolean;
  comments?: string;
  weight: number; // For scoring calculation
}

// Delivery & Export System Types

export type DeliveryMethod = 'email' | 'portal' | 'mail' | 'pickup';

export type DocumentFormat = 'pdf' | 'docx' | 'html' | 'txt';

export interface DeliveryConfiguration {
  method: DeliveryMethod;
  format: DocumentFormat;
  scheduledDate?: Date;
  recipients: DeliveryRecipient[];
  includeAttachments: boolean;
  requireSignature: boolean;
  trackDelivery: boolean;
  customMessage?: string;
}

export interface DeliveryRecipient {
  id: string;
  name: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone?: string;
  isPrimary: boolean;
}

export interface DeliveryStatus {
  id: string;
  requestId: string;
  recipientId: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  trackingNumber?: string;
  attempts: number;
  lastAttemptAt?: Date;
}

// Review Interface Types

export interface ReviewSession {
  id: string;
  requestId: string;
  reviewerId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
  changes: ReviewChange[];
  finalDecision?: ApprovalStatus;
  overallComments?: string;
}

export interface ReviewChange {
  id: string;
  section:
    | 'request_details'
    | 'response_content'
    | 'redactions'
    | 'attachments';
  changeType: 'edit' | 'comment' | 'suggestion' | 'approval';
  originalValue: string;
  proposedValue?: string;
  comments: string;
  timestamp: Date;
  resolved: boolean;
}

export interface ReviewComparison {
  request: PublicRecordRequest;
  response: GeneratedResponse;
  redactions: RedactionLayer[];
  attachments: RequestAttachment[];
  estimatedResponseTime: number; // minutes
  complianceScore: number; // 0-100%
  qualityScore: number; // 0-100%
  riskAssessment: RiskAssessment;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
  requiresLegalReview: boolean;
  requiresSupervisorApproval: boolean;
}

export interface RiskFactor {
  category: 'privacy' | 'legal' | 'political' | 'media' | 'cost';
  severity: number; // 1-10
  description: string;
  mitigated: boolean;
}

export interface RequestAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  redacted: boolean;
  includeInDelivery: boolean;
}

// Batch Operations

export interface BatchReviewOperation {
  id: string;
  operationType: 'approve' | 'reject' | 'assign' | 'export' | 'deliver';
  requestIds: string[];
  parameters: Record<string, any>;
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  results: BatchOperationResult[];
}

export interface BatchOperationResult {
  requestId: string;
  success: boolean;
  error?: string;
  processingTime: number; // milliseconds
}

// Analytics & Reporting

export interface ReviewMetrics {
  averageReviewTime: number; // minutes
  approvalRate: number; // 0-100%
  commonRejectionReasons: string[];
  reviewerWorkload: ReviewerWorkload[];
  bottlenecks: ReviewBottleneck[];
  qualityTrends: QualityTrend[];
}

export interface ReviewerWorkload {
  reviewerId: string;
  reviewerName: string;
  pendingCount: number;
  completedCount: number;
  averageReviewTime: number;
  approvalRate: number;
}

export interface ReviewBottleneck {
  stage: string;
  averageWaitTime: number; // minutes
  count: number;
  impact: 'low' | 'medium' | 'high';
}

export interface QualityTrend {
  date: string;
  averageQualityScore: number;
  averageComplianceScore: number;
  reviewCount: number;
}

// Export Templates

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: DocumentFormat;
  template: string; // Template content with placeholders
  variables: TemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isDefault: boolean;
  agencySpecific: boolean;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: any;
}

// Integration Types

export interface ReviewWorkflowIntegration {
  requestId: string;
  currentStep: 'review';
  previousSteps: {
    locate: { completed: boolean; timestamp?: Date };
    redact: { completed: boolean; timestamp?: Date };
    respond: { completed: boolean; timestamp?: Date };
  };
  stepData: {
    selectedRecords: string[];
    appliedRedactions: RedactionLayer[];
    generatedResponse: GeneratedResponse;
  };
  readyForReview: boolean;
  validationErrors: string[];
}
