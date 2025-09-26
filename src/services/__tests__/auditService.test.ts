/**
 * Tests for AuditService
 */

import { auditService, AuditEvent } from '@/services/auditService';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock sessionStorage for testing
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock window object
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test) TestBrowser/1.0',
  },
});

describe('AuditService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  describe('logEvent', () => {
    it('should log a basic audit event', async () => {
      const event = await auditService.logEvent(
        'TestService',
        'test_action',
        'test_user',
        'Test User',
        'records_officer',
        'request',
        'req_123',
        { testData: 'value' },
        'info',
        'user_action',
        { requestId: 'req_123' }
      );

      expect(event).toBeDefined();
      expect(event.service).toBe('TestService');
      expect(event.action).toBe('test_action');
      expect(event.actor.name).toBe('Test U.'); // Name is sanitized for privacy
      expect(event.actor.role).toBe('records_officer');
      expect(event.subject.type).toBe('request');
      expect(event.subject.id).toBe('req_123');
      expect(event.severity).toBe('info');
      expect(event.category).toBe('user_action');
      expect(event.details.testData).toBe('value');
      expect(event.context.requestId).toBe('req_123');
    });

    it('should hash PII in actor ID', async () => {
      const event = await auditService.logEvent(
        'TestService',
        'test_action',
        'user@example.com',
        'John Doe',
        'citizen',
        'request',
        'req_123'
      );

      expect(event.actor.id).toMatch(/^hashed_[a-f0-9]+$/);
      expect(event.actor.id).not.toBe('user@example.com');
    });

    it('should sanitize actor name', async () => {
      const event = await auditService.logEvent(
        'TestService',
        'test_action',
        'user@example.com',
        'John William Doe',
        'citizen',
        'request',
        'req_123'
      );

      expect(event.actor.name).toBe('John D.');
    });

    it('should include session ID', async () => {
      const event = await auditService.logEvent(
        'TestService',
        'test_action',
        'test_user',
        'Test User',
        'records_officer',
        'request',
        'req_123'
      );

      expect(event.actor.sessionId).toBeDefined();
      expect(event.actor.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should include client info', async () => {
      const event = await auditService.logEvent(
        'TestService',
        'test_action',
        'test_user',
        'Test User',
        'records_officer',
        'request',
        'req_123'
      );

      expect(event.context.clientInfo).toBeDefined();
      expect(event.context.clientInfo?.userAgent).toBe('Mozilla/5.0 (Test) TestBrowser/1.0');
      expect(event.context.clientInfo?.browser).toBe('Other');
    });

    it('should sanitize sensitive details', async () => {
      const sensitiveDetails = {
        email: 'user@example.com',
        phone: '555-123-4567',
        normalField: 'normal_value',
      };

      const event = await auditService.logEvent(
        'TestService',
        'test_action',
        'test_user',
        'Test User',
        'records_officer',
        'request',
        'req_123',
        sensitiveDetails
      );

      expect(event.details.email).toMatch(/^hashed_[a-f0-9]+$/);
      expect(event.details.phone).toMatch(/^hashed_[a-f0-9]+$/);
      expect(event.details.normalField).toBe('normal_value');
    });
  });

  describe('getEvents', () => {
    beforeEach(async () => {
      // Add some test events
      await auditService.logEvent(
        'ServiceA',
        'action_1',
        'user1',
        'User One',
        'records_officer',
        'request',
        'req_1',
        {},
        'info',
        'user_action',
        { requestId: 'req_1' }
      );

      await auditService.logEvent(
        'ServiceB',
        'action_2',
        'user2',
        'User Two',
        'legal_reviewer',
        'package',
        'pkg_1',
        {},
        'warning',
        'compliance',
        { packageId: 'pkg_1' }
      );

      await auditService.logEvent(
        'ServiceA',
        'action_3',
        'user1',
        'User One',
        'records_officer',
        'record',
        'rec_1',
        {},
        'error',
        'error',
        { recordId: 'rec_1' }
      );
    });

    it('should retrieve all events when no filter is provided', async () => {
      const events = await auditService.getEvents();
      expect(events).toHaveLength(3);
    });

    it('should filter events by service', async () => {
      const events = await auditService.getEvents({ services: ['ServiceA'] });
      expect(events).toHaveLength(2);
      expect(events.every(e => e.service === 'ServiceA')).toBe(true);
    });

    it('should filter events by action', async () => {
      const events = await auditService.getEvents({ actions: ['action_1'] });
      expect(events).toHaveLength(1);
      expect(events[0].action).toBe('action_1');
    });

    it('should filter events by category', async () => {
      const events = await auditService.getEvents({ categories: ['compliance'] });
      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('compliance');
    });

    it('should filter events by severity', async () => {
      const events = await auditService.getEvents({ severities: ['error'] });
      expect(events).toHaveLength(1);
      expect(events[0].severity).toBe('error');
    });

    it('should filter events by request ID', async () => {
      const events = await auditService.getEvents({ requestId: 'req_1' });
      expect(events).toHaveLength(1);
      expect(events[0].context.requestId).toBe('req_1');
    });

    it('should limit results', async () => {
      const events = await auditService.getEvents({ limit: 2 });
      expect(events).toHaveLength(2);
    });

    it('should sort events by timestamp (newest first)', async () => {
      const events = await auditService.getEvents();
      expect(events).toHaveLength(3);
      
      // Check that timestamps are in descending order
      for (let i = 1; i < events.length; i++) {
        const current = new Date(events[i].timestamp);
        const previous = new Date(events[i - 1].timestamp);
        expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
      }
    });
  });

  describe('getSummary', () => {
    beforeEach(async () => {
      // Add test events with different categories and severities
      await auditService.logEvent(
        'ServiceA',
        'action_1',
        'user1',
        'User One',
        'records_officer',
        'request',
        'req_1',
        {},
        'info',
        'user_action'
      );

      await auditService.logEvent(
        'ServiceA',
        'action_2',
        'user1',
        'User One',
        'records_officer',
        'request',
        'req_2',
        {},
        'warning',
        'security'
      );

      await auditService.logEvent(
        'ServiceB',
        'action_3',
        'user2',
        'User Two',
        'legal_reviewer',
        'package',
        'pkg_1',
        {},
        'error',
        'error'
      );
    });

    it('should provide correct summary statistics', async () => {
      const summary = await auditService.getSummary();

      expect(summary.totalEvents).toBe(3);
      expect(summary.eventsByCategory.user_action).toBe(1);
      expect(summary.eventsByCategory.security).toBe(1);
      expect(summary.eventsByCategory.error).toBe(1);
      expect(summary.eventsBySeverity.info).toBe(1);
      expect(summary.eventsBySeverity.warning).toBe(1);
      expect(summary.eventsBySeverity.error).toBe(1);
      expect(summary.eventsByService.ServiceA).toBe(2);
      expect(summary.eventsByService.ServiceB).toBe(1);
    });

    it('should include most active actors', async () => {
      const summary = await auditService.getSummary();

      expect(summary.mostActiveActors).toHaveLength(2);
      expect(summary.mostActiveActors[0].eventCount).toBe(2); // User One
      expect(summary.mostActiveActors[1].eventCount).toBe(1); // User Two
    });

    it('should include recent activity', async () => {
      const summary = await auditService.getSummary();

      expect(summary.recentActivity).toHaveLength(3);
      expect(summary.recentActivity[0]).toBeDefined();
    });

    it('should include time range', async () => {
      const summary = await auditService.getSummary();

      expect(summary.timeRange.earliest).toBeDefined();
      expect(summary.timeRange.latest).toBeDefined();
      expect(new Date(summary.timeRange.latest).getTime()).toBeGreaterThanOrEqual(
        new Date(summary.timeRange.earliest).getTime()
      );
    });
  });

  describe('exportForBigQuery', () => {
    beforeEach(async () => {
      await auditService.logEvent(
        'TestService',
        'test_action',
        'test_user',
        'Test User',
        'records_officer',
        'request',
        'req_123',
        { testData: 'value' },
        'info',
        'user_action',
        { requestId: 'req_123' }
      );
    });

    it('should export events in BigQuery format', async () => {
      const exportData = await auditService.exportForBigQuery();

      expect(exportData).toHaveLength(1);
      
      const event = exportData[0];
      expect(event.event_id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.service).toBe('TestService');
      expect(event.action).toBe('test_action');
      expect(event.actor_name).toBe('Test U.'); // Name is sanitized for privacy
      expect(event.actor_role).toBe('records_officer');
      expect(event.subject_type).toBe('request');
      expect(event.subject_id).toBe('req_123');
      expect(event.context_request_id).toBe('req_123');
      expect(event.severity).toBe('info');
      expect(event.category).toBe('user_action');
      
      // Details should be stringified JSON
      const details = JSON.parse(event.details);
      expect(details.testData).toBe('value');
    });
  });

  describe('clearOldEvents', () => {
    beforeEach(async () => {
      // Create events with different timestamps relative to today
      const today = new Date();
      const oldDate = new Date();
      oldDate.setDate(today.getDate() - 60); // 60 days ago
      
      const recentDate = new Date();
      recentDate.setDate(today.getDate() - 15); // 15 days ago

      // Mock Date.now to create events with specific timestamps
      const originalNow = Date.now;
      const mockNow = jest.fn();
      Date.now = mockNow;

      mockNow.mockReturnValue(oldDate.getTime());
      await auditService.logEvent(
        'ServiceA',
        'old_action',
        'user1',
        'User One',
        'records_officer',
        'request',
        'req_old'
      );

      mockNow.mockReturnValue(recentDate.getTime());
      await auditService.logEvent(
        'ServiceA',
        'new_action',
        'user1',
        'User One',
        'records_officer',
        'request',
        'req_new'
      );

      // Restore original Date.now
      Date.now = originalNow;
    });
    });

    it('should remove events older than specified days', async () => {
      const eventsBeforeCleanup = await auditService.getEvents();
      expect(eventsBeforeCleanup).toHaveLength(2);

      const removedCount = await auditService.clearOldEvents(30);
      expect(removedCount).toBe(1);

      const eventsAfterCleanup = await auditService.getEvents();
      expect(eventsAfterCleanup).toHaveLength(1);
      expect(eventsAfterCleanup[0].action).toBe('new_action');
    });
  });
});

describe('AuditService Error Handling', () => {
  it('should handle localStorage errors gracefully', async () => {
    // Mock localStorage to throw an error
    const originalSetItem = mockLocalStorage.setItem;
    mockLocalStorage.setItem = jest.fn().mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    try {
      await auditService.logEvent(
        'TestService',
        'test_action',
        'test_user',
        'Test User',
        'records_officer',
        'request',
        'req_123'
      );
      
      // Should not reach here if error is properly thrown
      expect(false).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }

    // Restore original implementation
    mockLocalStorage.setItem = originalSetItem;
  });

  it('should return empty array when localStorage read fails', async () => {
    // Mock localStorage to throw an error on getItem
    const originalGetItem = mockLocalStorage.getItem;
    mockLocalStorage.getItem = jest.fn().mockImplementation(() => {
      throw new Error('Storage access denied');
    });

    const events = await auditService.getEvents();
    expect(events).toEqual([]);

    // Restore original implementation
    mockLocalStorage.getItem = originalGetItem;
  });
});