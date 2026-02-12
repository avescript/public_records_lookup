/**
 * AI Response Generator Component Tests
 * Integration tests for the main AI response generation interface
 */

import React from 'react';
import { createTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AIResponseGenerator from '../../src/components/staff/AIResponseGenerator';
import { aiResponseService } from '../../src/services/aiResponseService';
import { PublicRecordRequest } from '../../src/types';

// Mock the AI response service
jest.mock('../../src/services/aiResponseService');
const mockAIResponseService = aiResponseService as jest.Mocked<
  typeof aiResponseService
>;

// Test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// Mock data
const mockRequest: PublicRecordRequest = {
  id: 'test-request-123',
  title: 'Police Reports for January 2024',
  description: 'Request for all police incident reports from January 2024',
  department: 'Police Department',
  submittedAt: '2024-01-15',
  status: 'in_process',
  contactInfo: {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '555-123-4567',
  },
  priority: 'normal',
  files: [],
};

const defaultProps = {
  requestDetails: mockRequest,
  recordsFound: true,
  recordCount: 5,
  redactionsApplied: true,
  exemptionsUsed: ['FOIA_B6_PERSONAL_PRIVACY'],
  fees: 25.0,
};

describe('AIResponseGenerator', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock responses
    mockAIResponseService.getTemplates.mockReturnValue([
      {
        id: 'standard-fulfillment',
        name: 'Standard Request Fulfillment',
        description: 'Template for fulfilled requests',
        requestType: ['general'],
        baseTemplate: 'Dear {{requester_name}}, Thank you for your request.',
        sections: ['greeting', 'acknowledgment', 'closing'],
        placeholders: [
          {
            key: 'requester_name',
            label: 'Requester Name',
            type: 'text',
            required: true,
          },
        ],
        tone: 'professional',
        compliance: { foia: true, cpra: true },
        usage: { frequency: 5, lastUsed: new Date(), rating: 4.5 },
      },
    ]);

    mockAIResponseService.generateResponse.mockResolvedValue({
      success: true,
      response: {
        id: 'generated-response-123',
        requestId: 'test-request-123',
        content:
          'Dear John Smith,\n\nThank you for your public records request regarding Police Reports for January 2024. We have located 5 records responsive to your request.\n\nSincerely,\nRecords Coordinator',
        sections: [
          { type: 'greeting', content: 'Dear John Smith,', confidence: 0.9 },
          {
            type: 'acknowledgment',
            content: 'Thank you for your public records request',
            confidence: 0.85,
          },
          {
            type: 'closing',
            content: 'Sincerely,\nRecords Coordinator',
            confidence: 0.9,
          },
        ],
        metadata: {
          tone: 'professional',
          length: 'standard',
          wordsCount: 35,
          generatedAt: new Date(),
          confidence: 0.87,
          model: 'gpt-4',
        },
        suggestions: [],
        placeholders: { requester_name: 'John Smith' },
      },
    });

    mockAIResponseService.validateResponse.mockResolvedValue({
      isValid: true,
      score: 92,
      issues: [],
      compliance: {
        foia: true,
        cpra: true,
        accessibility: true,
        legalLanguage: true,
      },
      recommendations: [],
    });

    mockAIResponseService.getWritingAssistance.mockResolvedValue([
      {
        id: 'suggestion-1',
        type: 'improvement',
        content: 'Consider adding more detail about the records found',
        reasoning: 'Provides better context to the requester',
        confidence: 0.8,
        position: { start: 100, end: 100 },
      },
    ]);
  });

  describe('Component Rendering', () => {
    it('should render the main interface components', () => {
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('AI Response Generation')).toBeInTheDocument();
      expect(screen.getByText('Response Configuration')).toBeInTheDocument();
      expect(screen.getByText('Response Draft')).toBeInTheDocument();
      expect(screen.getByText('Generate Response')).toBeInTheDocument();
    });

    it('should display request context information', () => {
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Request Context')).toBeInTheDocument();
      expect(
        screen.getByText('Police Reports for January 2024')
      ).toBeInTheDocument();
      expect(screen.getByText('Yes (5)')).toBeInTheDocument(); // Records found
      expect(screen.getByText('$25.00')).toBeInTheDocument(); // Fees
    });

    it('should show default tone and length selections', () => {
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      // Check that professional tone is selected by default
      expect(screen.getByDisplayValue('professional')).toBeInTheDocument();
      // Check that standard length is selected by default
      expect(screen.getByDisplayValue('standard')).toBeInTheDocument();
    });
  });

  describe('Configuration Controls', () => {
    it('should allow tone selection', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const toneSelect = screen.getByLabelText('Tone');
      await user.click(toneSelect);

      await waitFor(() => {
        expect(screen.getByText('Friendly')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Friendly'));

      expect(screen.getByDisplayValue('friendly')).toBeInTheDocument();
    });

    it('should allow length selection', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const lengthSelect = screen.getByLabelText('Length');
      await user.click(lengthSelect);

      await waitFor(() => {
        expect(screen.getByText('Detailed')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Detailed'));

      expect(screen.getByDisplayValue('detailed')).toBeInTheDocument();
    });

    it('should allow template selection', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const templateSelect = screen.getByLabelText('Template (Optional)');
      await user.click(templateSelect);

      await waitFor(() => {
        expect(
          screen.getByText('Standard Request Fulfillment')
        ).toBeInTheDocument();
      });

      await user.click(screen.getByText('Standard Request Fulfillment'));

      // Should show template name in the select
      expect(
        screen.getByDisplayValue('standard-fulfillment')
      ).toBeInTheDocument();
    });

    it('should allow section selection using chips', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      // Find and click a section chip
      const greetingChip = screen.getByText('Greeting');
      expect(greetingChip).toBeInTheDocument();

      // Chip should be selected by default (check for primary color or filled variant)
      expect(greetingChip.closest('.MuiChip-root')).toHaveClass(
        'MuiChip-colorPrimary'
      );

      // Click to deselect
      await user.click(greetingChip);

      // Should be deselected now (check for default color)\n      await waitFor(() => {\n        expect(greetingChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorDefault');\n      });\n\n      // Click to select again\n      await user.click(greetingChip);\n      \n      // Should be selected again\n      await waitFor(() => {\n        expect(greetingChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorPrimary');\n      });
    });

    it('should allow custom instructions input', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const instructionsField = screen.getByLabelText(
        'Custom Instructions (Optional)'
      );
      await user.type(
        instructionsField,
        'Please be extra formal and include legal references'
      );

      expect(instructionsField).toHaveValue(
        'Please be extra formal and include legal references'
      );
    });
  });

  describe('Response Generation', () => {
    it('should generate response when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const generateButton = screen.getByText('Generate Response');
      await user.click(generateButton);

      expect(mockAIResponseService.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-request-123',
          tone: 'professional',
          length: 'standard',
          context: expect.objectContaining({
            requestDetails: mockRequest,
            recordsFound: true,
            recordCount: 5,
          }),
        })
      );

      await waitFor(() => {
        // Should display the generated response
        expect(screen.getByText(/Dear John Smith/)).toBeInTheDocument();
        expect(
          screen.getByText(/Thank you for your public records request/)
        ).toBeInTheDocument();
      });
    });

    it('should show loading state during generation', async () => {
      const user = userEvent.setup();

      // Make the service return a delayed promise
      mockAIResponseService.generateResponse.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const generateButton = screen.getByText('Generate Response');
      await user.click(generateButton);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(generateButton).toBeDisabled();
    });

    it('should handle generation errors gracefully', async () => {
      const user = userEvent.setup();

      mockAIResponseService.generateResponse.mockResolvedValue({
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Service temporarily unavailable',
        },
      });

      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const generateButton = screen.getByText('Generate Response');
      await user.click(generateButton);

      await waitFor(() => {
        // Should not crash and should reset loading state
        expect(screen.getByText('Generate Response')).toBeInTheDocument();
        expect(generateButton).not.toBeDisabled();
      });
    });
  });

  describe('Response Validation', () => {
    it('should validate generated responses', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const generateButton = screen.getByText('Generate Response');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockAIResponseService.validateResponse).toHaveBeenCalled();
        expect(screen.getByText('Response Validation')).toBeInTheDocument();
        expect(screen.getByText('Quality Score: 92%')).toBeInTheDocument();
      });
    });

    it('should display validation issues', async () => {
      const user = userEvent.setup();

      mockAIResponseService.validateResponse.mockResolvedValue({
        isValid: false,
        score: 65,
        issues: [
          {
            type: 'compliance',
            severity: 'error',
            message: 'Missing required contact information section',
            suggestion: 'Add contact information to comply with regulations',
          },
        ],
        compliance: {
          foia: false,
          cpra: true,
          accessibility: true,
          legalLanguage: true,
        },
        recommendations: ['Add contact information'],
      });

      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const generateButton = screen.getByText('Generate Response');
      await user.click(generateButton);

      await waitFor(() => {
        expect(
          screen.getByText('Missing required contact information section')
        ).toBeInTheDocument();
        expect(screen.getByText('Quality Score: 65%')).toBeInTheDocument();
      });
    });

    it('should show compliance indicators', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const generateButton = screen.getByText('Generate Response');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('FOIA Compliant')).toBeInTheDocument();
        expect(screen.getByText('CPRA Compliant')).toBeInTheDocument();
        expect(screen.getByText('Accessible')).toBeInTheDocument();
      });
    });
  });

  describe('Template Management', () => {
    it('should open template manager dialog', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const manageTemplatesButton = screen.getByText('Manage Templates');
      await user.click(manageTemplatesButton);

      expect(screen.getByText('Template Manager')).toBeInTheDocument();
    });

    it('should load available templates', () => {
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(mockAIResponseService.getTemplates).toHaveBeenCalled();
    });
  });

  describe('Actions', () => {
    it('should call onSave when save button is clicked', async () => {
      const mockOnSave = jest.fn();
      const user = userEvent.setup();

      render(<AIResponseGenerator {...defaultProps} onSave={mockOnSave} />, {
        wrapper: TestWrapper,
      });

      // Generate a response first
      await user.click(screen.getByText('Generate Response'));

      await waitFor(() => {
        expect(screen.getByText('Save Draft')).toBeInTheDocument();
      });

      // Click save
      await user.click(screen.getByText('Save Draft'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.stringContaining('Dear John Smith')
      );
    });

    it('should call onSend when send button is clicked for valid response', async () => {
      const mockOnSend = jest.fn();
      const user = userEvent.setup();

      render(<AIResponseGenerator {...defaultProps} onSend={mockOnSend} />, {
        wrapper: TestWrapper,
      });

      // Generate a response first
      await user.click(screen.getByText('Generate Response'));

      await waitFor(() => {
        expect(screen.getByText('Send Response')).toBeInTheDocument();
      });

      // Send button should be enabled for valid response
      const sendButton = screen.getByText('Send Response');
      expect(sendButton).not.toBeDisabled();

      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith(
        expect.stringContaining('Dear John Smith')
      );
    });

    it('should disable send button for invalid response', async () => {
      const user = userEvent.setup();

      mockAIResponseService.validateResponse.mockResolvedValue({
        isValid: false,
        score: 45,
        issues: [
          {
            type: 'compliance',
            severity: 'error',
            message: 'Critical compliance issue',
            suggestion: 'Fix the issue',
          },
        ],
        compliance: {
          foia: false,
          cpra: false,
          accessibility: true,
          legalLanguage: false,
        },
        recommendations: [],
      });

      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      // Generate a response
      await user.click(screen.getByText('Generate Response'));

      await waitFor(() => {
        const sendButton = screen.getByText('Send Response');
        expect(sendButton).toBeDisabled();
      });
    });

    it('should open preview dialog', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      // Generate a response first
      await user.click(screen.getByText('Generate Response'));

      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument();
      });

      // Click preview
      await user.click(screen.getByText('Preview'));

      expect(screen.getByText('Response Preview')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests with no records found', () => {
      render(
        <AIResponseGenerator
          {...defaultProps}
          recordsFound={false}
          recordCount={0}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText('No')).toBeInTheDocument(); // Records found: No
    });

    it('should handle requests without fees', () => {
      const { fees, ...propsWithoutFees } = defaultProps;

      render(<AIResponseGenerator {...propsWithoutFees} />, {
        wrapper: TestWrapper,
      });

      // Should not display fee information
      expect(screen.queryByText(/\$\d+/)).not.toBeInTheDocument();
    });

    it('should handle empty template list', () => {
      mockAIResponseService.getTemplates.mockReturnValue([]);

      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      // Template select should still be present but with no options
      expect(screen.getByLabelText('Template (Optional)')).toBeInTheDocument();
    });

    it('should handle missing contact information', () => {
      const requestWithoutContact = {
        ...mockRequest,
        contactInfo: undefined,
      };

      render(
        <AIResponseGenerator
          {...defaultProps}
          requestDetails={requestWithoutContact}
        />,
        { wrapper: TestWrapper }
      );

      // Should still render without errors
      expect(screen.getByText('AI Response Generation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByLabelText('Tone')).toBeInTheDocument();
      expect(screen.getByLabelText('Length')).toBeInTheDocument();
      expect(screen.getByLabelText('Template (Optional)')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Custom Instructions (Optional)')
      ).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      // Test tab navigation - just check that tabbing works and focus moves
      await user.tab();
      const firstFocused = document.activeElement;
      expect(firstFocused).not.toBeNull();

      // Tab again to move focus
      await user.tab();
      const secondFocused = document.activeElement;
      expect(secondFocused).not.toBeNull();
      expect(secondFocused).not.toBe(firstFocused);
    });

    it('should announce loading states', async () => {
      // Mock a delayed response to test loading state
      let resolveGenerate: any;
      const generatePromise = new Promise(resolve => {
        resolveGenerate = resolve;
      });
      mockAIResponseService.generateResponse.mockReturnValue(generatePromise);

      const user = userEvent.setup();
      render(<AIResponseGenerator {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const generateButton = screen.getByText('Generate Response');
      await user.click(generateButton);

      // Loading state should be announced
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(generateButton).toBeDisabled();

      // Resolve the promise
      resolveGenerate({
        success: true,
        response: {
          id: 'generated-response-123',
          requestId: 'test-request-123',
          content: 'Test response content',
          sections: [],
          metadata: {
            tone: 'professional',
            length: 'standard',
            wordsCount: 5,
            generatedAt: new Date(),
            confidence: 0.9,
            model: 'gpt-4',
          },
          suggestions: [],
          placeholders: {},
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Generate Response')).toBeInTheDocument();
      });
    });
  });
});
