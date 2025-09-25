/**
 * Test for timestamp conversion in RequestDetailsDrawer
 */

import { format } from 'date-fns';

// Helper function to convert Firebase Timestamp or mock timestamp to Date
const convertToDate = (timestamp: any): Date => {
  try {
    if (!timestamp) {
      return new Date();
    }
    
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    } else if (timestamp instanceof Date) {
      return timestamp;
    } else if (typeof timestamp === 'number') {
      return new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp);
    } else if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    } else if (timestamp && typeof timestamp === 'object' && timestamp._isoString) {
      return new Date(timestamp._isoString);
    } else {
      return new Date(timestamp);
    }
  } catch (error) {
    console.error('Error converting timestamp to date:', error, timestamp);
    return new Date();
  }
};

describe('Timestamp conversion', () => {
  it('should handle mock timestamp objects', () => {
    const mockTimestamp = {
      toDate: () => new Date('2024-01-15T10:30:00Z'),
      seconds: 1705316600,
      _isoString: '2024-01-15T10:30:00.000Z'
    };

    const result = convertToDate(mockTimestamp);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(new Date('2024-01-15T10:30:00Z').getTime());
  });

  it('should handle regular Date objects', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = convertToDate(date);
    expect(result).toBe(date);
  });

  it('should handle ISO strings', () => {
    const isoString = '2024-01-15T10:30:00.000Z';
    const result = convertToDate(isoString);
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe(isoString);
  });

  it('should handle unix timestamps', () => {
    const timestamp = 1705316600000; // Jan 15, 2024 10:30:00 UTC
    const result = convertToDate(timestamp);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(timestamp);
  });

  it('should handle null/undefined gracefully', () => {
    expect(() => convertToDate(null)).not.toThrow();
    expect(() => convertToDate(undefined)).not.toThrow();
    expect(convertToDate(null)).toBeInstanceOf(Date);
    expect(convertToDate(undefined)).toBeInstanceOf(Date);
  });

  it('should format dates correctly', () => {
    const mockTimestamp = {
      toDate: () => new Date('2024-01-15T10:30:00Z'),
      seconds: 1705316600,
      _isoString: '2024-01-15T10:30:00.000Z'
    };

    const result = convertToDate(mockTimestamp);
    const formatted = format(result, 'MMM d, yyyy \'at\' h:mm a');
    
    // Should not throw and should produce a reasonable format
    expect(formatted).toMatch(/Jan 15, 2024 at \d{1,2}:\d{2} [AP]M/);
  });
});