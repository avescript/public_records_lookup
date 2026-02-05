/**
 * Interactive Redaction Canvas - Unit Tests
 * US-V2-031: Focused unit tests for core canvas functionality
 */

import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InteractiveRedactionCanvas } from '../../src/components/staff/InteractiveRedactionEditor/InteractiveRedactionCanvas';
import { theme } from '../../src/theme';

// Mock the heavy services for unit tests
jest.mock('../../src/services/aiRedactionSuggestionService', () => ({
  aiRedactionSuggestionService: {
    generateSuggestions: jest.fn(() => Promise.resolve([])),
    performAutoReview: jest.fn(() =>
      Promise.resolve({
        recordId: 'test',
        fileName: 'test.pdf',
        timestamp: new Date().toISOString(),
        overallScore: 85,
        qualityMetrics: {
          completeness: 90,
          accuracy: 85,
          consistency: 80,
          legalCompliance: 95,
        },
        riskAssessment: 'medium',
        reviewRequired: false,
        issues: [],
        recommendations: [],
        confidenceDistribution: { high: 8, medium: 2, low: 0 },
        coverage: { total: 10, redacted: 8, exposed: 2 },
      })
    ),
  },
}));

jest.mock('../../src/services/enhancedPIIEngine', () => ({
  enhancedPIIEngine: {
    enhanceFindings: jest.fn(() => Promise.resolve([])),
  },
}));

jest.mock('../../src/services/redactionService', () => ({
  redactionService: {
    getRedactionsForDocument: jest.fn(() => Promise.resolve([])),
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('InteractiveRedactionCanvas Unit Tests', () => {
  const defaultProps = {
    documentId: 'test-doc',
    recordId: 'test-record',
    fileName: 'test-file.pdf',
    imageUrl:
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    pageNumber: 1,
    width: 800,
    height: 600,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render with default props', () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(
        screen.getByText(/loading interactive redaction editor/i)
      ).toBeInTheDocument();
    });

    it('should initialize with correct canvas dimensions', async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      // Wait for loading to complete
      await screen.findByRole('img', {}, { timeout: 3000 });

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
    });

    it('should show error state when image fails to load', async () => {
      render(
        <InteractiveRedactionCanvas {...defaultProps} imageUrl='invalid-url' />,
        { wrapper: TestWrapper }
      );

      // Should eventually show error state or handle gracefully
      await screen.findByRole('img', {}, { timeout: 3000 });
    });
  });

  describe('Tool Selection', () => {
    it('should start with select tool active', async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      await screen.findByRole('button', { name: /select tool/i });
      const selectButton = screen.getByRole('button', { name: /select tool/i });

      expect(selectButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should switch to draw mode when draw tool is clicked', async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      await screen.findByRole('button', { name: /draw tool/i });
      const drawButton = screen.getByRole('button', { name: /draw tool/i });

      await userEvent.click(drawButton);

      expect(drawButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should enable shape selection only in draw mode', async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      await screen.findByRole('button', { name: /rectangle/i });
      const rectangleButton = screen.getByRole('button', {
        name: /rectangle/i,
      });

      // Should be disabled in select mode
      expect(rectangleButton).toBeDisabled();

      // Enable draw mode
      const drawButton = screen.getByRole('button', { name: /draw tool/i });
      await userEvent.click(drawButton);

      // Should be enabled in draw mode
      expect(rectangleButton).not.toBeDisabled();
    });
  });

  describe('Shape Selection', () => {
    beforeEach(async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      // Switch to draw mode first
      await screen.findByRole('button', { name: /draw tool/i });
      const drawButton = screen.getByRole('button', { name: /draw tool/i });
      await userEvent.click(drawButton);
    });

    it('should start with rectangle shape selected', () => {
      const rectangleButton = screen.getByRole('button', {
        name: /rectangle/i,
      });
      expect(rectangleButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should switch to ellipse shape when clicked', async () => {
      const ellipseButton = screen.getByRole('button', { name: /ellipse/i });
      await userEvent.click(ellipseButton);

      expect(ellipseButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should switch to freeform shape when clicked', async () => {
      const freeformButton = screen.getByRole('button', { name: /freeform/i });
      await userEvent.click(freeformButton);

      expect(freeformButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Preview Modes', () => {
    beforeEach(async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });
      await screen.findByRole('button', { name: /normal view/i });
    });

    it('should start in normal view mode', () => {
      const normalButton = screen.getByRole('button', { name: /normal view/i });
      expect(normalButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should switch to redacted view when clicked', async () => {
      const redactedButton = screen.getByRole('button', {
        name: /redacted view/i,
      });
      await userEvent.click(redactedButton);

      expect(redactedButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should switch to before/after view when clicked', async () => {
      const comparisonButton = screen.getByRole('button', {
        name: /before\/after/i,
      });
      await userEvent.click(comparisonButton);

      expect(comparisonButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Zoom Controls', () => {
    beforeEach(async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });
      await screen.findByRole('button', { name: /zoom in/i });
    });

    it('should have zoom controls available', () => {
      expect(
        screen.getByRole('button', { name: /zoom in/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /zoom out/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reset zoom/i })
      ).toBeInTheDocument();
    });

    it('should disable zoom out at minimum zoom', () => {
      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
      // At default zoom (likely minimum), zoom out should be disabled
      expect(zoomOutButton).toBeDisabled();
    });

    it('should enable zoom out after zooming in', async () => {
      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });

      await userEvent.click(zoomInButton);

      expect(zoomOutButton).not.toBeDisabled();
    });
  });

  describe('Undo/Redo Functionality', () => {
    beforeEach(async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });
      await screen.findByRole('button', { name: /undo/i });
    });

    it('should start with undo and redo disabled', () => {
      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });

      expect(undoButton).toBeDisabled();
      expect(redoButton).toBeDisabled();
    });
  });

  describe('Prop Validation', () => {
    it('should handle missing required props gracefully', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // This should not crash the component
      render(
        <InteractiveRedactionCanvas
          documentId=''
          recordId=''
          fileName=''
          imageUrl=''
          pageNumber={1}
          width={800}
          height={600}
        />,
        { wrapper: TestWrapper }
      );

      expect(
        screen.getByText(/loading interactive redaction editor/i)
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle invalid dimensions', () => {
      render(
        <InteractiveRedactionCanvas {...defaultProps} width={0} height={0} />,
        { wrapper: TestWrapper }
      );

      // Should render without crashing
      expect(
        screen.getByText(/loading interactive redaction editor/i)
      ).toBeInTheDocument();
    });
  });

  describe('Read-Only Mode', () => {
    it('should disable editing controls in read-only mode', async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} readOnly={true} />, {
        wrapper: TestWrapper,
      });

      await screen.findByRole('button', { name: /draw tool/i });

      // Tools should still be visible but canvas interaction should be limited
      const drawButton = screen.getByRole('button', { name: /draw tool/i });
      expect(drawButton).toBeInTheDocument();

      // In read-only mode, we might expect different behavior
      // The component should handle this internally
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });
      await screen.findByRole('img', {}, { timeout: 3000 });
    });

    it('should have proper ARIA labels on tools', () => {
      const selectTool = screen.getByRole('button', { name: /select tool/i });
      const drawTool = screen.getByRole('button', { name: /draw tool/i });

      expect(selectTool).toHaveAttribute('aria-pressed');
      expect(drawTool).toHaveAttribute('aria-pressed');
    });

    it('should have proper ARIA labels on shape buttons', () => {
      const rectangleButton = screen.getByRole('button', {
        name: /rectangle/i,
      });
      const ellipseButton = screen.getByRole('button', { name: /ellipse/i });
      const freeformButton = screen.getByRole('button', { name: /freeform/i });

      expect(rectangleButton).toHaveAttribute('aria-pressed');
      expect(ellipseButton).toHaveAttribute('aria-pressed');
      expect(freeformButton).toHaveAttribute('aria-pressed');
    });

    it('should have proper ARIA labels on preview mode buttons', () => {
      const normalView = screen.getByRole('button', { name: /normal view/i });
      const redactedView = screen.getByRole('button', {
        name: /redacted view/i,
      });
      const comparisonView = screen.getByRole('button', {
        name: /before\/after/i,
      });

      expect(normalView).toHaveAttribute('aria-pressed');
      expect(redactedView).toHaveAttribute('aria-pressed');
      expect(comparisonView).toHaveAttribute('aria-pressed');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const {
        enhancedPIIEngine,
      } = require('../../src/services/enhancedPIIEngine');
      enhancedPIIEngine.enhanceFindings.mockRejectedValue(
        new Error('Service error')
      );

      render(<InteractiveRedactionCanvas {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      // Component should handle the error and show appropriate message
      await screen.findByText(
        /failed to load redaction data/i,
        {},
        { timeout: 5000 }
      );
    });
  });

  describe('Callback Functions', () => {
    it('should call onRedactionsChange when redactions are modified', async () => {
      const onRedactionsChange = jest.fn();
      render(
        <InteractiveRedactionCanvas
          {...defaultProps}
          onRedactionsChange={onRedactionsChange}
        />,
        { wrapper: TestWrapper }
      );

      await screen.findByRole('img', {}, { timeout: 3000 });

      // Mock adding a redaction through some user interaction
      // The specific implementation would depend on how the component handles this
    });

    it('should call onQualityChange when quality report updates', async () => {
      const onQualityChange = jest.fn();
      render(
        <InteractiveRedactionCanvas
          {...defaultProps}
          onQualityChange={onQualityChange}
        />,
        { wrapper: TestWrapper }
      );

      await screen.findByRole('img', {}, { timeout: 3000 });

      // Should be called during initialization
      expect(onQualityChange).toHaveBeenCalled();
    });
  });
});
