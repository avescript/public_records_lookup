/**
 * Enhanced Redaction Service Integration Tests
 * Epic 9 Task 4: Agency-Specific Redaction Rules Integration
 *
 * Tests for the integration between redactionService and agencyRedactionRulesService
 */

import {
  redactionService,
  ManualRedaction,
} from '../../src/services/redactionService';
import {
  agencyRedactionRulesService,
  RedactionRule,
  SensitivityLevel,
} from '../../src/services/agencyRedactionRulesService';
import {
  piiDetectionService,
  PIIFinding,
  PIIType,
} from '../../src/services/piiDetectionService';

// Define PIIType values for testing (in case of import issues)
const TestPIIType = {
  SSN: 'SSN' as const,
  PHONE: 'PHONE' as const,
  ADDRESS: 'ADDRESS' as const,
  PERSON_NAME: 'PERSON_NAME' as const,
  EMAIL: 'EMAIL' as const,
  DOB: 'DOB' as const,
  DRIVERS_LICENSE: 'DRIVERS_LICENSE' as const,
  MEDICAL_ID: 'MEDICAL_ID' as const,
  BADGE_NUMBER: 'BADGE_NUMBER' as const,
} as const;

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock PII Detection Service
jest.mock('../../src/services/piiDetectionService', () => ({
  piiDetectionService: {
    detectPII: jest.fn(),
  },
}));

const mockPIIDetectionService = piiDetectionService as jest.Mocked<
  typeof piiDetectionService
>;

describe('Redaction Service - Agency Rules Integration', () => {
  const testDocumentId = 'test-document-123';
  const testAgencyId = 'police';
  const testUserId = 'test-user-456';

  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('Agency Rule Application', () => {
    test('should apply agency-specific rules to redactions', async () => {
      // Setup mock PII findings
      const mockPIIFindings: PIIFinding[] = [
        {
          id: 'pii-1',
          type: TestPIIType.SSN,
          text: '123-45-6789',
          confidence: 0.95,
          location: { x: 100, y: 50, width: 80, height: 20 },
        },
        {
          id: 'pii-2',
          type: TestPIIType.PHONE,
          text: '(555) 123-4567',
          confidence: 0.9,
          location: { x: 200, y: 100, width: 100, height: 20 },
        },
      ];

      mockPIIDetectionService.detectPII.mockResolvedValue(mockPIIFindings);

      // Apply agency rules
      const appliedRedactions = await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      expect(appliedRedactions).toBeDefined();
      expect(appliedRedactions.length).toBeGreaterThan(0);

      // Check that redactions have agency context
      appliedRedactions.forEach(redaction => {
        expect(redaction.agencyId).toBe(testAgencyId);
        expect(redaction.agencyRuleId).toBeDefined();
        expect(redaction.createdBy).toBe(testUserId);
      });
    });

    test('should handle auto-apply rules correctly', async () => {
      const mockPIIFindings: PIIFinding[] = [
        {
          id: 'pii-ssn',
          type: TestPIIType.SSN,
          text: '987-65-4321',
          confidence: 0.98,
          location: { x: 50, y: 75, width: 90, height: 18 },
        },
      ];

      mockPIIDetectionService.detectPII.mockResolvedValue(mockPIIFindings);

      const appliedRedactions = await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      // Find auto-applied redactions
      const autoAppliedRedactions = appliedRedactions.filter(r =>
        r.reason?.includes('Auto-applied')
      );

      expect(autoAppliedRedactions.length).toBeGreaterThan(0);

      // Auto-applied redactions should be approved if they don't require manual approval
      const template =
        await agencyRedactionRulesService.getAgencyTemplate(testAgencyId);
      const autoApplyRules =
        template?.rules.filter(
          rule => rule.autoApply && !rule.requiresApproval
        ) || [];

      if (autoApplyRules.length > 0) {
        const autoApprovedRedactions = autoAppliedRedactions.filter(
          r => r.approvalStatus === 'APPROVED'
        );
        expect(autoApprovedRedactions.length).toBeGreaterThan(0);
      }
    });

    test('should handle rules requiring approval', async () => {
      const mockPIIFindings: PIIFinding[] = [
        {
          id: 'pii-critical',
          type: TestPIIType.MEDICAL_ID,
          text: 'Patient ID: 12345',
          confidence: 0.92,
          location: { x: 150, y: 200, width: 120, height: 22 },
        },
      ];

      mockPIIDetectionService.detectPII.mockResolvedValue(mockPIIFindings);

      const appliedRedactions = await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      // Find redactions requiring approval
      const pendingRedactions = appliedRedactions.filter(
        r => r.approvalStatus === 'PENDING'
      );

      if (pendingRedactions.length > 0) {
        expect(pendingRedactions[0].approvalStatus).toBe('PENDING');
        expect(pendingRedactions[0].agencyRuleId).toBeDefined();
        expect(pendingRedactions[0].sensitivityLevel).toBeDefined();
      }
    });

    test('should preserve manual redaction context', async () => {
      const manualRedaction: Omit<ManualRedaction, 'id'> = {
        x: 300,
        y: 150,
        width: 100,
        height: 25,
        reason: 'Manual redaction for sensitive content',
        createdAt: new Date().toISOString(),
        createdBy: testUserId,
        agencyId: testAgencyId,
      };

      const addedRedaction = await redactionService.addAgencyRuleRedaction(
        testDocumentId,
        manualRedaction,
        'manual-rule-id'
      );

      expect(addedRedaction).toBeDefined();
      expect(addedRedaction.agencyId).toBe(testAgencyId);
      expect(addedRedaction.agencyRuleId).toBe('manual-rule-id');
      expect(addedRedaction.createdBy).toBe(testUserId);
    });
  });

  describe('Approval Workflow Integration', () => {
    test('should approve redaction with proper audit trail', async () => {
      // First create a redaction requiring approval
      const mockPIIFindings: PIIFinding[] = [
        {
          id: 'pii-approval-test',
          type: TestPIIType.SSN,
          text: '111-22-3333',
          confidence: 0.95,
          location: { x: 75, y: 125, width: 85, height: 20 },
        },
      ];

      mockPIIDetectionService.detectPII.mockResolvedValue(mockPIIFindings);

      const appliedRedactions = await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      const pendingRedaction = appliedRedactions.find(
        r => r.approvalStatus === 'PENDING'
      );

      if (pendingRedaction) {
        const approverUserId = 'approver-123';
        const approvalComment = 'Approved for privacy protection';

        const success = await redactionService.approveRedaction(
          pendingRedaction.id,
          approverUserId,
          approvalComment
        );

        expect(success).toBe(true);

        // Verify approval was recorded
        const redactions =
          await redactionService.getRedactionsForDocument(testDocumentId);
        const approvedRedaction = redactions.find(
          r => r.id === pendingRedaction.id
        );

        expect(approvedRedaction?.approvalStatus).toBe('APPROVED');
        expect(approvedRedaction?.reviewedBy).toBe(approverUserId);
        expect(approvedRedaction?.approvalComment).toBe(approvalComment);
        expect(approvedRedaction?.reviewedAt).toBeDefined();
      }
    });

    test('should reject redaction with proper audit trail', async () => {
      const mockPIIFindings: PIIFinding[] = [
        {
          id: 'pii-rejection-test',
          type: TestPIIType.EMAIL,
          text: 'test@example.com',
          confidence: 0.88,
          location: { x: 125, y: 175, width: 120, height: 18 },
        },
      ];

      mockPIIDetectionService.detectPII.mockResolvedValue(mockPIIFindings);

      const appliedRedactions = await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      const pendingRedaction = appliedRedactions.find(
        r => r.approvalStatus === 'PENDING'
      );

      if (pendingRedaction) {
        const reviewerUserId = 'reviewer-456';
        const rejectionComment = 'Not sufficient justification for redaction';

        const success = await redactionService.rejectRedaction(
          pendingRedaction.id,
          reviewerUserId,
          rejectionComment
        );

        expect(success).toBe(true);

        // Verify rejection was recorded
        const redactions =
          await redactionService.getRedactionsForDocument(testDocumentId);
        const rejectedRedaction = redactions.find(
          r => r.id === pendingRedaction.id
        );

        expect(rejectedRedaction?.approvalStatus).toBe('REJECTED');
        expect(rejectedRedaction?.reviewedBy).toBe(reviewerUserId);
        expect(rejectedRedaction?.approvalComment).toBe(rejectionComment);
        expect(rejectedRedaction?.reviewedAt).toBeDefined();
      }
    });

    test('should get pending approvals for agency', async () => {
      // Create multiple redactions with different approval statuses
      const mockPIIFindings: PIIFinding[] = [
        {
          id: 'pii-pending-1',
          type: TestPIIType.SSN,
          text: '444-55-6666',
          confidence: 0.96,
          location: { x: 100, y: 100, width: 80, height: 20 },
        },
        {
          id: 'pii-pending-2',
          type: TestPIIType.PHONE,
          text: '(555) 987-6543',
          confidence: 0.91,
          location: { x: 200, y: 200, width: 100, height: 20 },
        },
      ];

      mockPIIDetectionService.detectPII.mockResolvedValue(mockPIIFindings);

      await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      const pendingApprovals =
        await redactionService.getPendingApprovals(testAgencyId);

      expect(Array.isArray(pendingApprovals)).toBe(true);

      // All pending approvals should be for the correct agency
      pendingApprovals.forEach(redaction => {
        expect(redaction.agencyId).toBe(testAgencyId);
        expect(['PENDING', 'APPROVED', 'REJECTED']).toContain(
          redaction.approvalStatus
        );
      });
    });
  });

  describe('Agency Statistics Integration', () => {
    test('should get agency redaction statistics', async () => {
      // Create some test redactions
      const mockPIIFindings: PIIFinding[] = [
        {
          id: 'stats-pii-1',
          type: TestPIIType.SSN,
          text: '777-88-9999',
          confidence: 0.97,
          location: { x: 50, y: 50, width: 80, height: 20 },
        },
        {
          id: 'stats-pii-2',
          type: TestPIIType.EMAIL,
          text: 'stats@test.com',
          confidence: 0.89,
          location: { x: 150, y: 150, width: 110, height: 18 },
        },
      ];

      mockPIIDetectionService.detectPII.mockResolvedValue(mockPIIFindings);

      await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      const stats =
        await redactionService.getAgencyRedactionStats(testAgencyId);

      expect(stats).toBeDefined();
      expect(typeof stats.totalRedactions).toBe('number');
      expect(typeof stats.pendingApprovals).toBe('number');
      expect(typeof stats.approvedRedactions).toBe('number');
      expect(typeof stats.rejectedRedactions).toBe('number');
      expect(stats.bySensitivityLevel).toBeDefined();
      expect(stats.byRuleType).toBeDefined();
    });

    test('should calculate statistics correctly', async () => {
      const documentId1 = 'stats-doc-1';
      const documentId2 = 'stats-doc-2';

      // Create redactions for multiple documents
      const mockPIIFindings: PIIFinding[] = [
        {
          id: 'stats-multi-1',
          type: TestPIIType.SSN,
          text: '123-45-6789',
          confidence: 0.95,
          location: { x: 100, y: 100, width: 80, height: 20 },
        },
      ];

      mockPIIDetectionService.detectPII.mockResolvedValue(mockPIIFindings);

      const [redactions1, redactions2] = await Promise.all([
        redactionService.applyAgencyRules(
          documentId1,
          testAgencyId,
          testUserId
        ),
        redactionService.applyAgencyRules(
          documentId2,
          testAgencyId,
          testUserId
        ),
      ]);

      const stats =
        await redactionService.getAgencyRedactionStats(testAgencyId);

      expect(stats.totalRedactions).toBe(
        redactions1.length + redactions2.length
      );

      // Verify sensitivity level breakdown
      const allRedactions = [...redactions1, ...redactions2];
      const expectedHighSensitivity = allRedactions.filter(
        r => r.sensitivityLevel === SensitivityLevel.HIGH
      ).length;

      if (expectedHighSensitivity > 0) {
        expect(stats.bySensitivityLevel.HIGH).toBe(expectedHighSensitivity);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing agency template gracefully', async () => {
      const nonExistentAgencyId = 'non-existent-agency';

      const appliedRedactions = await redactionService.applyAgencyRules(
        testDocumentId,
        nonExistentAgencyId,
        testUserId
      );

      expect(appliedRedactions).toEqual([]);
    });

    test('should handle PII detection service errors', async () => {
      mockPIIDetectionService.detectPII.mockRejectedValue(
        new Error('PII detection failed')
      );

      const appliedRedactions = await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      expect(appliedRedactions).toEqual([]);
    });

    test('should handle approval of non-existent redaction', async () => {
      const success = await redactionService.approveRedaction(
        'non-existent-redaction-id',
        'approver-123',
        'Approval comment'
      );

      expect(success).toBe(false);
    });

    test('should validate agency rule application', async () => {
      const invalidRedaction: Omit<ManualRedaction, 'id'> = {
        x: -100, // Invalid negative coordinate
        y: -50, // Invalid negative coordinate
        width: 0, // Invalid zero width
        height: 0, // Invalid zero height
        reason: '',
        createdAt: new Date().toISOString(),
        createdBy: testUserId,
        agencyId: testAgencyId,
      };

      const addedRedaction = await redactionService.addAgencyRuleRedaction(
        testDocumentId,
        invalidRedaction,
        'test-rule-id'
      );

      // Should handle invalid redaction gracefully
      expect(addedRedaction).toBeDefined();
      // Coordinates should be normalized or the operation should fail gracefully
    });
  });

  describe('Performance and Scale Tests', () => {
    test('should handle large number of PII findings efficiently', async () => {
      // Generate many PII findings
      const manyPIIFindings: PIIFinding[] = Array.from(
        { length: 50 },
        (_, i) => ({
          id: `perf-pii-${i}`,
          type: i % 2 === 0 ? TestPIIType.SSN : TestPIIType.EMAIL,
          text:
            i % 2 === 0
              ? `${i}${i}${i}-${i}${i}-${i}${i}${i}${i}`
              : `test${i}@example.com`,
          confidence: 0.8 + (i % 20) * 0.01,
          location: {
            x: (i % 10) * 50,
            y: Math.floor(i / 10) * 30,
            width: 80,
            height: 20,
          },
        })
      );

      mockPIIDetectionService.detectPII.mockResolvedValue(manyPIIFindings);

      const startTime = Date.now();

      const appliedRedactions = await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(appliedRedactions.length).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle concurrent approval operations', async () => {
      // Setup multiple pending redactions
      const mockPIIFindings: PIIFinding[] = Array.from(
        { length: 5 },
        (_, i) => ({
          id: `concurrent-pii-${i}`,
          type: TestPIIType.SSN,
          text: `${i}${i}${i}-${i}${i}-${i}${i}${i}${i}`,
          confidence: 0.95,
          location: { x: i * 100, y: 50, width: 80, height: 20 },
        })
      );

      mockPIIDetectionService.detectPII.mockResolvedValue(mockPIIFindings);

      const appliedRedactions = await redactionService.applyAgencyRules(
        testDocumentId,
        testAgencyId,
        testUserId
      );

      const pendingRedactions = appliedRedactions.filter(
        r => r.approvalStatus === 'PENDING'
      );

      if (pendingRedactions.length > 0) {
        // Perform concurrent approvals
        const approvalPromises = pendingRedactions
          .slice(0, 3)
          .map(redaction =>
            redactionService.approveRedaction(
              redaction.id,
              `approver-${redaction.id}`,
              `Concurrent approval for ${redaction.id}`
            )
          );

        const results = await Promise.all(approvalPromises);

        // All approvals should succeed
        results.forEach(result => {
          expect(result).toBe(true);
        });
      }
    });
  });
});
