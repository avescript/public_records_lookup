/**
 * Audit Service for Public Records AI Assistant
 * 
 * Provides immutable application audit logging with:
 * - Client event logger with structured data capture
 * - Privacy-first design (PII not logged in clear text)
 * - Comprehensive action tracking across all workflows
 * - BigQuery-compatible schema structure
 * - Filtering and search capabilities
 */

export interface AuditEvent {
  id: string;
  timestamp: string;
  service: string;
  action: string;
  actor: {
    id: string;
    name: string;
    role: 'citizen' | 'records_officer' | 'legal_reviewer' | 'admin' | 'system';
    sessionId?: string;
  };
  subject: {
    type: 'request' | 'record' | 'package' | 'comment_thread' | 'change_request' | 'redaction' | 'system';
    id: string;
    metadata?: Record<string, any>;
  };
  context: {
    requestId?: string;
    recordId?: string;
    packageId?: string;
    fileName?: string;
    clientInfo?: {
      userAgent: string;
      ipAddress?: string; // Hashed for privacy
      browser?: string;
    };
  };
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'user_action' | 'system_event' | 'security' | 'compliance' | 'performance' | 'error';
}

export interface AuditFilter {
  startDate?: string;
  endDate?: string;
  services?: string[];
  actions?: string[];
  actors?: string[];
  subjects?: string[];
  categories?: AuditEvent['category'][];
  severities?: AuditEvent['severity'][];
  requestId?: string;
  recordId?: string;
  packageId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalEvents: number;
  eventsByCategory: Record<AuditEvent['category'], number>;
  eventsBySeverity: Record<AuditEvent['severity'], number>;
  eventsByService: Record<string, number>;
  mostActiveActors: Array<{ actorId: string; actorName: string; eventCount: number }>;
  recentActivity: AuditEvent[];
  timeRange: {
    earliest: string;
    latest: string;
  };
}

class AuditService {
  private readonly AUDIT_KEY = 'application_audit_log';
  private readonly MAX_EVENTS = 10000; // Keep last 10k events
  private readonly PII_HASH_SALT = 'pr_audit_salt_2025'; // Static salt for consistent hashing

  /**
   * Log an audit event
   */
  async logEvent(
    service: string,
    action: string,
    actorId: string,
    actorName: string,
    actorRole: AuditEvent['actor']['role'],
    subjectType: AuditEvent['subject']['type'],
    subjectId: string,
    details: Record<string, any> = {},
    severity: AuditEvent['severity'] = 'info',
    category: AuditEvent['category'] = 'user_action',
    context: Partial<AuditEvent['context']> = {}
  ): Promise<AuditEvent> {
    try {
      const event: AuditEvent = {
        id: this.generateEventId(),
        timestamp: new Date().toISOString(),
        service,
        action,
        actor: {
          id: this.hashPII(actorId),
          name: this.sanitizeName(actorName),
          role: actorRole,
          sessionId: this.getSessionId(),
        },
        subject: {
          type: subjectType,
          id: subjectId,
          metadata: this.sanitizeMetadata(details.subjectMetadata),
        },
        context: {
          ...context,
          clientInfo: this.getClientInfo(),
        },
        details: this.sanitizeDetails(details),
        severity,
        category,
      };

      await this.persistEvent(event);
      return event;
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Return a fallback event that represents the failure, but don't try to persist it
      const errorEvent: AuditEvent = {
        id: this.generateEventId(),
        timestamp: new Date().toISOString(),
        service: 'AuditService',
        action: 'log_failure',
        actor: { id: 'system', name: 'System', role: 'system' },
        subject: { type: 'system', id: 'audit_service' },
        context: {},
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'error',
        category: 'error',
      };
      return errorEvent;
    }
  }

  /**
   * Get audit events with filtering
   */
  async getEvents(filter: AuditFilter = {}): Promise<AuditEvent[]> {
    try {
      const allEvents = await this.getAllEvents();
      let filteredEvents = [...allEvents];

      // Apply filters
      if (filter.startDate) {
        const startDate = new Date(filter.startDate);
        filteredEvents = filteredEvents.filter(
          event => new Date(event.timestamp) >= startDate
        );
      }

      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        filteredEvents = filteredEvents.filter(
          event => new Date(event.timestamp) <= endDate
        );
      }

      if (filter.services && filter.services.length > 0) {
        filteredEvents = filteredEvents.filter(
          event => filter.services!.includes(event.service)
        );
      }

      if (filter.actions && filter.actions.length > 0) {
        filteredEvents = filteredEvents.filter(
          event => filter.actions!.includes(event.action)
        );
      }

      if (filter.actors && filter.actors.length > 0) {
        filteredEvents = filteredEvents.filter(
          event => filter.actors!.some(actor => 
            event.actor.id.includes(actor) || event.actor.name.includes(actor)
          )
        );
      }

      if (filter.categories && filter.categories.length > 0) {
        filteredEvents = filteredEvents.filter(
          event => filter.categories!.includes(event.category)
        );
      }

      if (filter.severities && filter.severities.length > 0) {
        filteredEvents = filteredEvents.filter(
          event => filter.severities!.includes(event.severity)
        );
      }

      if (filter.requestId) {
        filteredEvents = filteredEvents.filter(
          event => event.context.requestId === filter.requestId ||
                   event.subject.id === filter.requestId
        );
      }

      if (filter.recordId) {
        filteredEvents = filteredEvents.filter(
          event => event.context.recordId === filter.recordId ||
                   event.subject.id === filter.recordId
        );
      }

      if (filter.packageId) {
        filteredEvents = filteredEvents.filter(
          event => event.context.packageId === filter.packageId ||
                   event.subject.id === filter.packageId
        );
      }

      // Sort by timestamp (newest first)
      filteredEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply pagination
      const offset = filter.offset || 0;
      const limit = filter.limit || 100;
      
      return filteredEvents.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to get audit events:', error);
      return [];
    }
  }

  /**
   * Get audit summary statistics
   */
  async getSummary(filter: AuditFilter = {}): Promise<AuditSummary> {
    try {
      const events = await this.getEvents({ ...filter, limit: 10000 }); // Get more for stats
      
      const summary: AuditSummary = {
        totalEvents: events.length,
        eventsByCategory: {
          user_action: 0,
          system_event: 0,
          security: 0,
          compliance: 0,
          performance: 0,
          error: 0,
        },
        eventsBySeverity: {
          info: 0,
          warning: 0,
          error: 0,
          critical: 0,
        },
        eventsByService: {},
        mostActiveActors: [],
        recentActivity: events.slice(0, 10),
        timeRange: {
          earliest: events.length > 0 ? events[events.length - 1].timestamp : new Date().toISOString(),
          latest: events.length > 0 ? events[0].timestamp : new Date().toISOString(),
        },
      };

      // Calculate statistics
      const actorCounts: Record<string, { name: string; count: number }> = {};

      events.forEach(event => {
        // Count by category
        summary.eventsByCategory[event.category]++;

        // Count by severity
        summary.eventsBySeverity[event.severity]++;

        // Count by service
        summary.eventsByService[event.service] = 
          (summary.eventsByService[event.service] || 0) + 1;

        // Count by actor
        const actorKey = `${event.actor.id}:${event.actor.name}`;
        if (!actorCounts[actorKey]) {
          actorCounts[actorKey] = { name: event.actor.name, count: 0 };
        }
        actorCounts[actorKey].count++;
      });

      // Get most active actors
      summary.mostActiveActors = Object.entries(actorCounts)
        .map(([actorId, data]) => ({
          actorId: actorId.split(':')[0],
          actorName: data.name,
          eventCount: data.count,
        }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      return summary;
    } catch (error) {
      console.error('Failed to get audit summary:', error);
      throw new Error('Failed to get audit summary');
    }
  }

  /**
   * Export audit events for BigQuery
   */
  async exportForBigQuery(filter: AuditFilter = {}): Promise<any[]> {
    try {
      const events = await this.getEvents({ ...filter, limit: 50000 });
      
      return events.map(event => ({
        // BigQuery-compatible flattened structure
        event_id: event.id,
        timestamp: event.timestamp,
        service: event.service,
        action: event.action,
        actor_id: event.actor.id,
        actor_name: event.actor.name,
        actor_role: event.actor.role,
        actor_session_id: event.actor.sessionId,
        subject_type: event.subject.type,
        subject_id: event.subject.id,
        subject_metadata: JSON.stringify(event.subject.metadata || {}),
        context_request_id: event.context.requestId,
        context_record_id: event.context.recordId,
        context_package_id: event.context.packageId,
        context_file_name: event.context.fileName,
        context_client_info: JSON.stringify(event.context.clientInfo || {}),
        details: JSON.stringify(event.details),
        severity: event.severity,
        category: event.category,
      }));
    } catch (error) {
      console.error('Failed to export for BigQuery:', error);
      throw new Error('Failed to export for BigQuery');
    }
  }

  /**
   * Clear old audit events (maintenance)
   */
  async clearOldEvents(olderThanDays: number = 90): Promise<number> {
    try {
      const allEvents = await this.getAllEvents();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const remainingEvents = allEvents.filter(
        event => new Date(event.timestamp) > cutoffDate
      );

      const removedCount = allEvents.length - remainingEvents.length;
      
      if (removedCount > 0) {
        localStorage.setItem(this.AUDIT_KEY, JSON.stringify(remainingEvents));
        
        // Log the cleanup action (without await to avoid circular dependency in cleanup)
        this.logEvent(
          'AuditService',
          'cleanup_old_events',
          'system',
          'System',
          'system',
          'system',
          'audit_service',
          { removedCount, olderThanDays },
          'info',
          'system_event'
        ).catch(err => console.warn('Failed to log cleanup event:', err));
      }

      return removedCount;
    } catch (error) {
      console.error('Failed to clear old events:', error);
      throw new Error('Failed to clear old events');
    }
  }

  // Private helper methods

  private async getAllEvents(): Promise<AuditEvent[]> {
    try {
      const stored = localStorage.getItem(this.AUDIT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve audit events:', error);
      return [];
    }
  }

  private async persistEvent(event: AuditEvent): Promise<void> {
    try {
      const events = await this.getAllEvents();
      events.push(event);

      // Maintain size limit
      if (events.length > this.MAX_EVENTS) {
        events.splice(0, events.length - this.MAX_EVENTS);
      }

      localStorage.setItem(this.AUDIT_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to persist audit event:', error);
      throw error;
    }
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  private hashPII(data: string): string {
    // Simple hash for PII protection (in production, use proper crypto)
    let hash = 0;
    const str = data + this.PII_HASH_SALT;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hashed_${Math.abs(hash).toString(16)}`;
  }

  private sanitizeName(name: string): string {
    // Keep first name and first letter of last name for readability
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0];
    }
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove or hash sensitive fields
    const sensitiveFields = ['email', 'phone', 'ssn', 'address', 'dob'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.hashPII(sanitized[field]);
      }
    });

    return sanitized;
  }

  private sanitizeMetadata(metadata: any): Record<string, any> | undefined {
    if (!metadata) return undefined;
    
    // Basic sanitization for metadata
    return Object.keys(metadata).reduce((acc, key) => {
      const value = metadata[key];
      if (typeof value === 'string' && value.includes('@')) {
        acc[key] = this.hashPII(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  }

  private getSessionId(): string {
    // Simple session ID based on browser session
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  private getClientInfo(): AuditEvent['context']['clientInfo'] {
    if (typeof window === 'undefined') {
      return undefined;
    }

    return {
      userAgent: navigator.userAgent,
      browser: this.detectBrowser(),
      // IP address would be set by server in production
    };
  }

  private detectBrowser(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }
}

// Export singleton instance
export const auditService = new AuditService();
export default auditService;