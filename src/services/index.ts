// Enhanced AI Services
export { AIChatService, aiChatService } from './aiChatService';
export { enhancedAIRecordService } from './enhancedAIRecordService';

// Core Services (to be imported from existing codebase)
export * from './aiService';
export * from './approvalService';
export * from './auditService';
export * from './documentService';
export * from './redactionService';
export * from './requestService';

// Types
export type * from '../types/chat';
export type * from '../types/enhanced-search';
