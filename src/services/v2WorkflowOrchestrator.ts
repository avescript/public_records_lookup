/**
 * V2WorkflowOrchestrator - End-to-End Workflow Integration
 * Orchestrates the complete V2 step-based workflow from request intake through delivery
 */

import { RedactionLayer } from '@/types/redaction';
import {
  PublicRecordRequest,
  RequestStatus,
  WorkflowStep,
} from '@/types/request';
import { GeneratedResponse } from '@/types/response';
import {
  ApprovalRequest,
  DeliveryConfiguration,
  DeliveryStatus,
  ReviewSession,
  ReviewWorkflowIntegration,
} from '@/types/review';

import { aiResponseService } from './aiResponseService';
import { deliveryTrackingService } from './deliveryTrackingService';

export interface WorkflowStepResult {
  stepName: WorkflowStep;
  completed: boolean;
  timestamp: Date;
  data: any;
  errors: string[];
  warnings: string[];
}

export interface WorkflowContext {
  requestId: string;
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  stepResults: Record<WorkflowStep, WorkflowStepResult>;
  metadata: WorkflowMetadata;
}

export interface WorkflowMetadata {
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  assignedTo: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  agencyId: string;
  automationLevel: 'manual' | 'assisted' | 'automated';
  qualityScore?: number;
  complianceScore?: number;
}

export interface WorkflowValidation {
  isValid: boolean;
  canProceedToNext: boolean;
  requiredFields: string[];
  missingData: string[];
  warnings: string[];
  recommendations: string[];
}

export interface WorkflowTransition {
  from: WorkflowStep;
  to: WorkflowStep;
  triggeredBy: string;
  timestamp: Date;
  reason: string;
  data?: any;
}

export interface WorkflowNotification {
  id: string;
  workflowId: string;
  type:
    | 'step_completed'
    | 'step_failed'
    | 'approval_needed'
    | 'deadline_approaching'
    | 'workflow_completed';
  title: string;
  message: string;
  recipient: string;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high';
  actionRequired: boolean;
  actionUrl?: string;
}

export class V2WorkflowOrchestrator {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string = '/api', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || '';
  }

  /**
   * Initialize a new V2 workflow for a request
   */
  async initializeWorkflow(
    request: PublicRecordRequest,
    assignedTo: string,
    automationLevel: 'manual' | 'assisted' | 'automated' = 'assisted'
  ): Promise<WorkflowContext> {
    try {
      const context: WorkflowContext = {
        requestId: request.id,
        currentStep: 'locate',
        completedSteps: [],
        stepResults: {} as Record<WorkflowStep, WorkflowStepResult>,
        metadata: {
          startedAt: new Date(),
          assignedTo,
          priority: (request.priority as any) || 'normal',
          agencyId: request.agencyId,
          automationLevel,
          estimatedCompletion: this.calculateEstimatedCompletion(request),
        },
      };

      // Persist workflow context
      const response = await fetch(`${this.baseUrl}/workflow/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to initialize workflow: ${response.statusText}`
        );
      }

      // Send initialization notification
      await this.sendWorkflowNotification(context, 'step_completed', {
        title: 'Workflow Initialized',
        message: `V2 workflow started for request ${request.id}`,
        recipient: assignedTo,
      });

      return await response.json();
    } catch (error) {
      console.error('Error initializing workflow:', error);
      throw error;
    }
  }

  /**
   * Advance workflow to the next step
   */
  async advanceWorkflow(
    workflowId: string,
    currentStepData: any,
    triggeredBy: string,
    skipValidation: boolean = false
  ): Promise<WorkflowContext> {
    try {
      const context = await this.getWorkflowContext(workflowId);

      // Validate current step completion
      if (!skipValidation) {
        const validation = await this.validateStepCompletion(
          context,
          currentStepData
        );
        if (!validation.canProceedToNext) {
          throw new Error(
            `Cannot proceed: ${validation.missingData.join(', ')}`
          );
        }
      }

      // Record current step completion
      const stepResult: WorkflowStepResult = {
        stepName: context.currentStep,
        completed: true,
        timestamp: new Date(),
        data: currentStepData,
        errors: [],
        warnings: [],
      };

      context.stepResults[context.currentStep] = stepResult;
      context.completedSteps.push(context.currentStep);

      // Determine next step
      const nextStep = this.getNextStep(context.currentStep);
      if (nextStep) {
        context.currentStep = nextStep;

        // Record transition
        const transition: WorkflowTransition = {
          from: stepResult.stepName,
          to: nextStep,
          triggeredBy,
          timestamp: new Date(),
          reason: 'Step completed successfully',
          data: currentStepData,
        };

        await this.recordWorkflowTransition(workflowId, transition);

        // Check if automation is possible for next step
        if (context.metadata.automationLevel === 'automated') {
          await this.attemptAutomatedStepExecution(context, nextStep);
        }
      } else {
        // Workflow complete
        context.metadata.completedAt = new Date();
        await this.completeWorkflow(context);
      }

      // Update context
      const updatedContext = await this.updateWorkflowContext(context);

      // Send progress notification
      await this.sendWorkflowNotification(updatedContext, 'step_completed', {
        title: `Step ${stepResult.stepName} Completed`,
        message: nextStep
          ? `Advanced to step ${nextStep}`
          : 'Workflow completed',
        recipient: triggeredBy,
      });

      return updatedContext;
    } catch (error) {
      console.error('Error advancing workflow:', error);
      throw error;
    }
  }

  /**
   * Get current workflow context
   */
  async getWorkflowContext(workflowId: string): Promise<WorkflowContext> {
    try {
      const response = await fetch(`${this.baseUrl}/workflow/${workflowId}`, {
        headers: {
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get workflow context: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflow context:', error);
      throw error;
    }
  }

  /**
   * Execute complete end-to-end workflow
   */
  async executeCompleteWorkflow(
    request: PublicRecordRequest,
    assignedTo: string,
    options: {
      automationLevel?: 'manual' | 'assisted' | 'automated';
      skipSteps?: WorkflowStep[];
      customData?: Record<WorkflowStep, any>;
    } = {}
  ): Promise<{
    context: WorkflowContext;
    deliveryStatus: DeliveryStatus[];
    completionTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Step 1: Initialize workflow
      const context = await this.initializeWorkflow(
        request,
        assignedTo,
        options.automationLevel
      );

      // Step 2: Execute Step 1 - Locate Records
      if (!options.skipSteps?.includes('locate')) {
        const locateData =
          options.customData?.locate || (await this.executeLocateStep(context));
        await this.advanceWorkflow(context.requestId, locateData, assignedTo);
      }

      // Step 3: Execute Step 2 - Redact Records
      if (!options.skipSteps?.includes('redact')) {
        const redactData =
          options.customData?.redact || (await this.executeRedactStep(context));
        await this.advanceWorkflow(context.requestId, redactData, assignedTo);
      }

      // Step 4: Execute Step 3 - Generate Response
      if (!options.skipSteps?.includes('respond')) {
        const respondData =
          options.customData?.respond ||
          (await this.executeRespondStep(context));
        await this.advanceWorkflow(context.requestId, respondData, assignedTo);
      }

      // Step 5: Execute Step 4 - Review & Send
      if (!options.skipSteps?.includes('review')) {
        const reviewData =
          options.customData?.review || (await this.executeReviewStep(context));
        const finalContext = await this.advanceWorkflow(
          context.requestId,
          reviewData,
          assignedTo
        );

        // Create delivery tracking
        const deliveryConfig =
          reviewData.deliveryConfiguration as DeliveryConfiguration;
        const deliveryStatus =
          await deliveryTrackingService.createDeliveryTracking(
            request.id,
            deliveryConfig
          );

        const completionTime = Date.now() - startTime;

        return {
          context: finalContext,
          deliveryStatus,
          completionTime,
        };
      }

      throw new Error('Workflow execution incomplete');
    } catch (error) {
      console.error('Error executing complete workflow:', error);

      // Record failure and send notification
      await this.handleWorkflowFailure(request.id, error as Error, assignedTo);

      throw error;
    }
  }

  /**
   * Validate workflow step completion
   */
  async validateStepCompletion(
    context: WorkflowContext,
    stepData: any
  ): Promise<WorkflowValidation> {
    try {
      const step = context.currentStep;
      const validation: WorkflowValidation = {
        isValid: true,
        canProceedToNext: true,
        requiredFields: [],
        missingData: [],
        warnings: [],
        recommendations: [],
      };

      switch (step) {
        case 'locate':
          return this.validateLocateStep(stepData);
        case 'redact':
          return this.validateRedactStep(stepData);
        case 'respond':
          return this.validateRespondStep(stepData);
        case 'review':
          return this.validateReviewStep(stepData);
        default:
          throw new Error(`Unknown step: ${step}`);
      }
    } catch (error) {
      console.error('Error validating step completion:', error);
      return {
        isValid: false,
        canProceedToNext: false,
        requiredFields: [],
        missingData: [`Validation error: ${error.message}`],
        warnings: [],
        recommendations: [],
      };
    }
  }

  /**
   * Generate workflow integration data for review step
   */
  async generateReviewIntegration(
    requestId: string
  ): Promise<ReviewWorkflowIntegration> {
    try {
      const context = await this.getWorkflowContext(requestId);

      const integration: ReviewWorkflowIntegration = {
        requestId,
        currentStep: 'review',
        previousSteps: {
          locate: {
            completed: context.completedSteps.includes('locate'),
            timestamp: context.stepResults.locate?.timestamp,
          },
          redact: {
            completed: context.completedSteps.includes('redact'),
            timestamp: context.stepResults.redact?.timestamp,
          },
          respond: {
            completed: context.completedSteps.includes('respond'),
            timestamp: context.stepResults.respond?.timestamp,
          },
        },
        stepData: {
          selectedRecords:
            context.stepResults.locate?.data?.selectedRecords || [],
          appliedRedactions: context.stepResults.redact?.data?.redactions || [],
          generatedResponse:
            context.stepResults.respond?.data?.response || null,
        },
        readyForReview: this.isReadyForReview(context),
        validationErrors: this.getValidationErrors(context),
      };

      return integration;
    } catch (error) {
      console.error('Error generating review integration:', error);
      throw error;
    }
  }

  /**
   * Get workflow metrics and analytics
   */
  async getWorkflowMetrics(
    agencyId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalWorkflows: number;
    completedWorkflows: number;
    averageCompletionTime: number;
    stepAnalytics: Record<
      WorkflowStep,
      {
        averageTime: number;
        successRate: number;
        commonIssues: string[];
      }
    >;
    automationEffectiveness: {
      manualAverage: number;
      assistedAverage: number;
      automatedAverage: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (agencyId) params.append('agencyId', agencyId);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(
        `${this.baseUrl}/workflow/metrics?${params}`,
        {
          headers: {
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get workflow metrics: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflow metrics:', error);
      throw error;
    }
  }

  // Private helper methods

  private getNextStep(currentStep: WorkflowStep): WorkflowStep | null {
    const stepOrder: WorkflowStep[] = ['locate', 'redact', 'respond', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    return currentIndex < stepOrder.length - 1
      ? stepOrder[currentIndex + 1]
      : null;
  }

  private calculateEstimatedCompletion(request: PublicRecordRequest): Date {
    // Base estimation logic
    const baseTime = 2 * 60 * 60 * 1000; // 2 hours
    const complexityMultiplier = request.keywords?.length > 5 ? 1.5 : 1;
    const priorityMultiplier =
      request.priority === 'urgent'
        ? 0.5
        : request.priority === 'high'
          ? 0.75
          : 1;

    const estimatedMs = baseTime * complexityMultiplier * priorityMultiplier;
    return new Date(Date.now() + estimatedMs);
  }

  private async executeLocateStep(context: WorkflowContext): Promise<any> {
    // AI-assisted record location
    const response = await fetch(`${this.baseUrl}/ai/locate-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({ requestId: context.requestId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute locate step: ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeRedactStep(context: WorkflowContext): Promise<any> {
    const locateData = context.stepResults.locate?.data;
    if (!locateData?.selectedRecords) {
      throw new Error('No records selected from locate step');
    }

    const response = await fetch(`${this.baseUrl}/ai/redact-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        requestId: context.requestId,
        records: locateData.selectedRecords,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute redact step: ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeRespondStep(context: WorkflowContext): Promise<any> {
    const locateData = context.stepResults.locate?.data;
    const redactData = context.stepResults.redact?.data;

    const response = await aiResponseService.generateResponse({
      requestId: context.requestId,
      requestDescription: 'Generate response based on processed records',
      selectedRecords: locateData?.selectedRecords || [],
      appliedRedactions: redactData?.redactions || [],
      tone: 'professional',
      length: 'standard',
      customInstructions: 'Follow agency guidelines for response generation',
    });

    return { response };
  }

  private async executeReviewStep(context: WorkflowContext): Promise<any> {
    // Auto-approve if quality/compliance scores are high enough
    const respondData = context.stepResults.respond?.data;
    const response: GeneratedResponse = respondData?.response;

    if (
      response &&
      response.qualityScore >= 90 &&
      response.complianceScore >= 95
    ) {
      return {
        approved: true,
        autoApproved: true,
        deliveryConfiguration: {
          method: 'email',
          format: 'pdf',
          recipients: [
            {
              id: '1',
              name: 'Auto Delivery',
              email: 'auto@example.com',
              isPrimary: true,
            },
          ],
          includeAttachments: true,
          requireSignature: false,
          trackDelivery: true,
        },
      };
    }

    throw new Error('Manual review required - auto-approval criteria not met');
  }

  private validateLocateStep(stepData: any): WorkflowValidation {
    const validation: WorkflowValidation = {
      isValid: true,
      canProceedToNext: true,
      requiredFields: ['selectedRecords'],
      missingData: [],
      warnings: [],
      recommendations: [],
    };

    if (!stepData?.selectedRecords || stepData.selectedRecords.length === 0) {
      validation.isValid = false;
      validation.canProceedToNext = false;
      validation.missingData.push('No records selected');
    }

    return validation;
  }

  private validateRedactStep(stepData: any): WorkflowValidation {
    const validation: WorkflowValidation = {
      isValid: true,
      canProceedToNext: true,
      requiredFields: ['redactions'],
      missingData: [],
      warnings: [],
      recommendations: [],
    };

    if (!stepData?.redactions) {
      validation.warnings.push(
        'No redactions applied - verify if this is intentional'
      );
    }

    return validation;
  }

  private validateRespondStep(stepData: any): WorkflowValidation {
    const validation: WorkflowValidation = {
      isValid: true,
      canProceedToNext: true,
      requiredFields: ['response'],
      missingData: [],
      warnings: [],
      recommendations: [],
    };

    if (!stepData?.response) {
      validation.isValid = false;
      validation.canProceedToNext = false;
      validation.missingData.push('No response generated');
    }

    const response: GeneratedResponse = stepData?.response;
    if (response) {
      if (response.qualityScore < 80) {
        validation.warnings.push('Quality score below recommended threshold');
      }
      if (response.complianceScore < 85) {
        validation.warnings.push('Compliance score below required threshold');
      }
    }

    return validation;
  }

  private validateReviewStep(stepData: any): WorkflowValidation {
    const validation: WorkflowValidation = {
      isValid: true,
      canProceedToNext: true,
      requiredFields: ['approved', 'deliveryConfiguration'],
      missingData: [],
      warnings: [],
      recommendations: [],
    };

    if (stepData?.approved === undefined) {
      validation.isValid = false;
      validation.canProceedToNext = false;
      validation.missingData.push('Approval decision required');
    }

    if (stepData?.approved && !stepData?.deliveryConfiguration) {
      validation.isValid = false;
      validation.canProceedToNext = false;
      validation.missingData.push(
        'Delivery configuration required for approved requests'
      );
    }

    return validation;
  }

  private isReadyForReview(context: WorkflowContext): boolean {
    return (
      context.completedSteps.includes('locate') &&
      context.completedSteps.includes('redact') &&
      context.completedSteps.includes('respond')
    );
  }

  private getValidationErrors(context: WorkflowContext): string[] {
    const errors: string[] = [];

    for (const step of context.completedSteps) {
      const result = context.stepResults[step];
      if (result?.errors?.length > 0) {
        errors.push(...result.errors);
      }
    }

    return errors;
  }

  private async attemptAutomatedStepExecution(
    context: WorkflowContext,
    nextStep: WorkflowStep
  ): Promise<void> {
    try {
      let stepData: any;

      switch (nextStep) {
        case 'locate':
          stepData = await this.executeLocateStep(context);
          break;
        case 'redact':
          stepData = await this.executeRedactStep(context);
          break;
        case 'respond':
          stepData = await this.executeRespondStep(context);
          break;
        case 'review':
          stepData = await this.executeReviewStep(context);
          break;
        default:
          return; // Can't automate this step
      }

      // Recursively advance if automated step succeeded
      await this.advanceWorkflow(context.requestId, stepData, 'system', false);
    } catch (error) {
      console.warn(`Automated execution of ${nextStep} failed:`, error);
      // Fall back to manual execution
      await this.sendWorkflowNotification(context, 'approval_needed', {
        title: `Manual Action Required: ${nextStep}`,
        message: 'Automated execution failed, manual intervention needed',
        recipient: context.metadata.assignedTo,
        actionRequired: true,
      });
    }
  }

  private async updateWorkflowContext(
    context: WorkflowContext
  ): Promise<WorkflowContext> {
    const response = await fetch(
      `${this.baseUrl}/workflow/${context.requestId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(context),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update workflow context: ${response.statusText}`
      );
    }

    return await response.json();
  }

  private async recordWorkflowTransition(
    workflowId: string,
    transition: WorkflowTransition
  ): Promise<void> {
    await fetch(`${this.baseUrl}/workflow/${workflowId}/transitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify(transition),
    });
  }

  private async completeWorkflow(context: WorkflowContext): Promise<void> {
    await this.sendWorkflowNotification(context, 'workflow_completed', {
      title: 'Workflow Completed',
      message: `Request ${context.requestId} has been fully processed`,
      recipient: context.metadata.assignedTo,
    });
  }

  private async handleWorkflowFailure(
    workflowId: string,
    error: Error,
    assignedTo: string
  ): Promise<void> {
    await fetch(`${this.baseUrl}/workflow/${workflowId}/failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        error: error.message,
        timestamp: new Date(),
        assignedTo,
      }),
    });
  }

  private async sendWorkflowNotification(
    context: WorkflowContext,
    type: WorkflowNotification['type'],
    details: Partial<WorkflowNotification>
  ): Promise<void> {
    const notification: WorkflowNotification = {
      id: `notification-${Date.now()}`,
      workflowId: context.requestId,
      type,
      title: details.title || 'Workflow Update',
      message: details.message || 'Workflow status updated',
      recipient: details.recipient || context.metadata.assignedTo,
      timestamp: new Date(),
      priority: details.priority || 'normal',
      actionRequired: details.actionRequired || false,
      actionUrl: details.actionUrl,
    };

    await fetch(`${this.baseUrl}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify(notification),
    });
  }
}

// Export singleton instance
export const v2WorkflowOrchestrator = new V2WorkflowOrchestrator();
