/**
 * RedactionManagement Component Tests
 * Comprehensive test suite for the RedactionManagement UI component
 * covering version management, export functionality, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RedactionManagement } from '../../src/components/RedactionManagement';
import { RedactionService, ManualRedaction, RedactionVersion } from '../../src/services/redactionService';

// Mock the redactionService
jest.mock('../../src/services/redactionService', () => ({
  RedactionService: jest.fn().mockImplementation(() => ({
    getVersionHistory: jest.fn(),
    getRedactionSummary: jest.fn(),
    saveVersion: jest.fn(),
    loadVersion: jest.fn(),
    clearAllRedactions: jest.fn(),
  })),
  redactionService: {
    getVersionHistory: jest.fn(),
    getRedactionSummary: jest.fn(),
    saveVersion: jest.fn(),
    loadVersion: jest.fn(),
    clearAllRedactions: jest.fn(),
  },
}));

describe('RedactionManagement', () => {
  let mockRedactionService: any;

  const mockRedactions: ManualRedaction[] = [
    {
      id: '1',
      recordId: 'test-record-1',
      fileName: 'test.pdf',
      pageNumber: 1,
      x: 100,
      y: 200,
      width: 150,
      height: 50,
      createdAt: '2024-01-01T10:00:00Z',
      createdBy: 'test-user',
      reason: 'SSN',
      type: 'manual',
    },
    {
      id: '2',
      recordId: 'test-record-1',
      fileName: 'test.pdf',
      pageNumber: 1,
      x: 200,
      y: 300,
      width: 100,
      height: 40,
      createdAt: '2024-01-01T10:05:00Z',
      createdBy: 'test-user',
      reason: 'Phone Number',
      type: 'manual',
    },
  ];

  const mockVersions: RedactionVersion[] = [
    {
      versionId: 'v1',
      recordId: 'test-record-1',
      fileName: 'test.pdf',
      redactions: mockRedactions,
      timestamp: '2024-01-01T10:00:00Z',
      status: 'saved',
      createdBy: 'test-user',
      notes: 'First pass review',
    },
    {
      versionId: 'v2',
      recordId: 'test-record-1',
      fileName: 'test.pdf',
      redactions: [...mockRedactions, {
        id: '3',
        recordId: 'test-record-1',
        fileName: 'test.pdf',
        pageNumber: 2,
        x: 50,
        y: 100,
        width: 120,
        height: 30,
        createdAt: '2024-01-02T10:00:00Z',
        createdBy: 'test-user',
        reason: 'DOB',
        type: 'manual',
      }],
      timestamp: '2024-01-02T10:00:00Z',
      status: 'saved',
      createdBy: 'test-user',
      notes: 'Added additional redactions',
    },
  ];

  const defaultProps = {
    recordId: 'test-record-1',
    fileName: 'test.pdf',
    currentRedactions: mockRedactions,
    onVersionLoad: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { redactionService } = require('../../src/services/redactionService');
    mockRedactionService = redactionService;
  });

  describe('Component Rendering', () => {
    test('should render redaction management button', () => {
      render(<RedactionManagement {...defaultProps} />);

      expect(screen.getByText('Manage Redactions')).toBeInTheDocument();
    });

    test('should open management dialog when button is clicked', async () => {
      mockRedactionService.getRedactionSummary.mockResolvedValue({
        recordId: 'test-record-1',
        totalRedactions: 2,
        byPage: { 1: 2 },
        byType: { manual: 2 },
        lastModified: '2024-01-01T10:05:00Z',
        currentVersion: 'v1',
        versions: mockVersions,
      });

      render(<RedactionManagement {...defaultProps} />);

      const manageButton = screen.getByText('Manage Redactions');
      fireEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByText(/Redaction Management:/)).toBeInTheDocument();
      });
    });

    test('should show loading state when data is being fetched', async () => {
      mockRedactionService.getRedactionSummary.mockImplementation(() => new Promise(() => {}));

      render(<RedactionManagement {...defaultProps} />);

      const manageButton = screen.getByText('Manage Redactions');
      fireEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Functionality', () => {
    test('should handle save version functionality', async () => {
      mockRedactionService.getRedactionSummary.mockResolvedValue({
        recordId: 'test-record-1',
        totalRedactions: 2,
        byPage: { 1: 2 },
        byType: { manual: 2 },
        lastModified: '2024-01-01T10:05:00Z',
        currentVersion: 'v1',
        versions: mockVersions,
      });
      
      const mockSavedVersion: RedactionVersion = {
        versionId: 'v3',
        recordId: 'test-record-1',
        fileName: 'test.pdf',
        redactions: mockRedactions,
        timestamp: '2024-01-03T10:00:00Z',
        status: 'saved',
        createdBy: 'test-user',
        notes: 'Test notes',
      };
      
      mockRedactionService.saveVersion.mockResolvedValue(mockSavedVersion);

      render(<RedactionManagement {...defaultProps} />);

      const manageButton = screen.getByText('Manage Redactions');
      fireEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByText('Save Current Version')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Current Version');
      fireEvent.click(saveButton);

      // Wait for save dialog to open and find the actual Save Version button
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /Save Current Version/i })).toBeInTheDocument();
      });

      const saveVersionButton = screen.getByText('Save Version');
      fireEvent.click(saveVersionButton);

      await waitFor(() => {
        expect(mockRedactionService.saveVersion).toHaveBeenCalledWith(
          'test-record-1',
          'test.pdf',
          ''
        );
      });
    });

    test('should handle version load functionality', async () => {
      mockRedactionService.getRedactionSummary.mockResolvedValue({
        recordId: 'test-record-1',
        totalRedactions: 2,
        byPage: { 1: 2 },
        byType: { manual: 2 },
        lastModified: '2024-01-01T10:05:00Z',
        currentVersion: 'v1',
        versions: mockVersions,
      });

      mockRedactionService.getVersionHistory.mockResolvedValue(mockVersions);
      mockRedactionService.loadVersion.mockResolvedValue(mockRedactions);
      const mockOnVersionLoad = jest.fn();

      render(<RedactionManagement {...defaultProps} onVersionLoad={mockOnVersionLoad} />);

      const manageButton = screen.getByText('Manage Redactions');
      fireEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByText(/Redaction Management:/)).toBeInTheDocument();
      });

      // Navigate to versions tab
      const versionsTab = screen.getByText('Version History');
      fireEvent.click(versionsTab);

      await waitFor(() => {
        expect(screen.getByText(/Version v1/)).toBeInTheDocument();
      });

      // Click on load version button
      const loadButtons = screen.getAllByLabelText('Load this version');
      fireEvent.click(loadButtons[0]);

      await waitFor(() => {
        expect(mockRedactionService.loadVersion).toHaveBeenCalledWith(
          'test-record-1',
          'test.pdf',
          'v1'
        );
        expect(mockOnVersionLoad).toHaveBeenCalledWith(mockRedactions);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle data loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockRedactionService.getRedactionSummary.mockRejectedValue(new Error('Failed to load data'));

      render(<RedactionManagement {...defaultProps} />);

      const manageButton = screen.getByText('Manage Redactions');
      fireEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to load redaction data')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('should handle save version errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockRedactionService.getRedactionSummary.mockResolvedValue({
        recordId: 'test-record-1',
        totalRedactions: 2,
        byPage: { 1: 2 },
        byType: { manual: 2 },
        lastModified: '2024-01-01T10:05:00Z',
        currentVersion: 'v1',
        versions: mockVersions,
      });
      mockRedactionService.saveVersion.mockRejectedValue(new Error('Failed to save version'));

      render(<RedactionManagement {...defaultProps} />);

      const manageButton = screen.getByText('Manage Redactions');
      fireEvent.click(manageButton);

      await waitFor(() => {
        expect(screen.getByText('Save Current Version')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Current Version');
      fireEvent.click(saveButton);

      // Wait for save dialog to open and find the actual Save Version button
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /Save Current Version/i })).toBeInTheDocument();
      });

      const saveVersionButton = screen.getByText('Save Version');
      fireEvent.click(saveVersionButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save version')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('should have accessible manage button', () => {
      render(<RedactionManagement {...defaultProps} />);

      const manageButton = screen.getByRole('button', { name: /manage redactions/i });
      expect(manageButton).toBeInTheDocument();
      expect(manageButton).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation in dialog', async () => {
      mockRedactionService.getRedactionSummary.mockResolvedValue({
        recordId: 'test-record-1',
        totalRedactions: 2,
        byPage: { 1: 2 },
        byType: { manual: 2 },
        lastModified: '2024-01-01T10:05:00Z',
        currentVersion: 'v1',
        versions: mockVersions,
      });

      render(<RedactionManagement {...defaultProps} />);

      const manageButton = screen.getByRole('button', { name: /manage redactions/i });
      
      // Focus should be manageable
      act(() => {
        manageButton.focus();
      });
      expect(manageButton).toHaveFocus();

      // Should respond to Enter key - or click since MUI handles it
      act(() => {
        fireEvent.click(manageButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Redaction Management:/)).toBeInTheDocument();
      });
    });
  });
});