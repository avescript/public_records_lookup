/**
 * Simple audit service tests to verify basic functionality
 */

import { auditService } from '../auditService';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AuditService - Basic Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
  });

  it('should log a basic audit event', async () => {
    const event = await auditService.logEvent(
      'TestService',
      'test_action',
      'user123',
      'Test User',
      'records_officer',
      'request',
      'req_123'
    );

    expect(event).toBeDefined();
    expect(event.service).toBe('TestService');
    expect(event.action).toBe('test_action');
    expect(event.actor.name).toBe('Test U.'); // Name is sanitized for privacy
    expect(event.actor.role).toBe('records_officer');
  });

  it('should retrieve events', async () => {
    // Mock some existing events in storage
    const mockEvents = [
      {
        eventId: 'event1',
        timestamp: new Date().toISOString(),
        service: 'TestService',
        action: 'test_action',
        actor: { id: 'user123', name: 'Test U.', role: 'records_officer' },
        subject: { type: 'request', id: 'req_123' },
        severity: 'info',
        category: 'user_action'
      }
    ];
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEvents));

    const events = await auditService.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].service).toBe('TestService');
  });

  it('should handle storage errors gracefully', async () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    // Should not throw, should handle gracefully
    const event = await auditService.logEvent(
      'TestService',
      'test_action',
      'user123',
      'Test User',
      'records_officer',
      'request',
      'req_123'
    );

    expect(event).toBeDefined();
  });
});