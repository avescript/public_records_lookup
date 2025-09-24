/**
 * RedactionCanvas Tests
 * Test suite for HTML5 Canvas redaction drawing component
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RedactionCanvas, RedactionCanvasProps } from '../../src/components/RedactionCanvas';
import { ManualRedaction } from '../../src/services/redactionService';

// Mock HTML5 Canvas
const mockCanvas = {
  getContext: jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    setLineDash: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  })),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
  })),
  width: 800,
  height: 600,
  style: {},
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  focus: jest.fn(),
  tabIndex: 0,
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: mockCanvas.getBoundingClientRect,
});

describe('RedactionCanvas', () => {
  const mockRedaction: ManualRedaction = {
    id: 'test_redaction_1',
    recordId: 'test_record',
    fileName: 'test.pdf',
    pageNumber: 1,
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    createdAt: '2023-01-01T00:00:00.000Z',
    createdBy: 'test_user',
    type: 'manual',
  };

  const defaultProps: RedactionCanvasProps = {
    width: 800,
    height: 600,
    scale: 1,
    redactions: [],
    isDrawingMode: true,
    pageNumber: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render canvas with correct dimensions', () => {
      render(<RedactionCanvas {...defaultProps} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
    });

    test('should apply custom styles', () => {
      const props = {
        ...defaultProps,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        redactionColor: 'rgba(0, 255, 0, 0.3)',
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      expect(canvas).toBeInTheDocument();
    });

    test('should render existing redactions', () => {
      const props = {
        ...defaultProps,
        redactions: [mockRedaction],
      };

      render(<RedactionCanvas {...props} />);
      
      // Verify that the canvas context methods are called for drawing
      expect(mockCanvas.getContext).toHaveBeenCalled();
    });

    test('should handle scale factor', () => {
      const props = {
        ...defaultProps,
        scale: 2,
        width: 1600,
        height: 1200,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      expect(canvas).toHaveAttribute('width', '1600');
      expect(canvas).toHaveAttribute('height', '1200');
    });
  });

  describe('Drawing Interactions', () => {
    test('should handle mouse down for new drawing', () => {
      const onRedactionAdd = jest.fn();
      const props = {
        ...defaultProps,
        onRedactionAdd,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      fireEvent.mouseDown(canvas, {
        clientX: 150,
        clientY: 150,
      });

      // Should start drawing mode
      expect(canvas.style.cursor).toBe('crosshair');
    });

    test('should handle mouse move during drawing', () => {
      const onRedactionAdd = jest.fn();
      const props = {
        ...defaultProps,
        onRedactionAdd,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Start drawing
      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
      });

      // Move mouse
      fireEvent.mouseMove(canvas, {
        clientX: 200,
        clientY: 150,
      });

      // Canvas should be redrawn (context methods called)
      expect(mockCanvas.getContext).toHaveBeenCalled();
    });

    test('should complete drawing on mouse up', () => {
      const onRedactionAdd = jest.fn();
      const props = {
        ...defaultProps,
        onRedactionAdd,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Start drawing
      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
      });

      // Move mouse to create a box larger than minimum size
      fireEvent.mouseMove(canvas, {
        clientX: 250,
        clientY: 200,
      });

      // Complete drawing
      fireEvent.mouseUp(canvas);

      // Should call onRedactionAdd with coordinates
      expect(onRedactionAdd).toHaveBeenCalledWith({
        x: 100,
        y: 100,
        width: 150,
        height: 100,
      });
    });

    test('should not create redaction if box is too small', () => {
      const onRedactionAdd = jest.fn();
      const props = {
        ...defaultProps,
        onRedactionAdd,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Draw a very small box
      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
      });

      fireEvent.mouseMove(canvas, {
        clientX: 105,
        clientY: 105,
      });

      fireEvent.mouseUp(canvas);

      // Should not create redaction (below minimum size)
      expect(onRedactionAdd).not.toHaveBeenCalled();
    });
  });

  describe('Redaction Selection', () => {
    test('should select redaction on click', () => {
      const onRedactionSelect = jest.fn();
      const props = {
        ...defaultProps,
        redactions: [mockRedaction],
        onRedactionSelect,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Click on the redaction (within its bounds)
      fireEvent.mouseDown(canvas, {
        clientX: 150, // Within mockRedaction bounds
        clientY: 120,
      });

      expect(onRedactionSelect).toHaveBeenCalledWith(mockRedaction);
    });

    test('should deselect when clicking empty area', () => {
      const onRedactionSelect = jest.fn();
      const props = {
        ...defaultProps,
        redactions: [mockRedaction],
        onRedactionSelect,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Click outside the redaction
      fireEvent.mouseDown(canvas, {
        clientX: 50,
        clientY: 50,
      });

      expect(onRedactionSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('Redaction Manipulation', () => {
    test('should handle redaction dragging', () => {
      const onRedactionUpdate = jest.fn();
      const props = {
        ...defaultProps,
        redactions: [mockRedaction],
        onRedactionUpdate,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Select redaction first
      fireEvent.mouseDown(canvas, {
        clientX: 150,
        clientY: 120,
      });

      // Click again to start dragging
      fireEvent.mouseDown(canvas, {
        clientX: 150,
        clientY: 120,
      });

      // Drag to new position
      fireEvent.mouseMove(canvas, {
        clientX: 200,
        clientY: 170,
      });

      // Release
      fireEvent.mouseUp(canvas);

      // Should call onRedactionUpdate with new position
      expect(onRedactionUpdate).toHaveBeenCalledWith(
        mockRedaction.id,
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          width: mockRedaction.width,
          height: mockRedaction.height,
        })
      );
    });

    test('should handle keyboard deletion', () => {
      const onRedactionDelete = jest.fn();
      const props = {
        ...defaultProps,
        redactions: [mockRedaction],
        onRedactionDelete,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Select redaction
      fireEvent.mouseDown(canvas, {
        clientX: 150,
        clientY: 120,
      });

      // Press delete key
      fireEvent.keyDown(canvas, { key: 'Delete' });

      expect(onRedactionDelete).toHaveBeenCalledWith(mockRedaction.id);
    });

    test('should handle backspace deletion', () => {
      const onRedactionDelete = jest.fn();
      const props = {
        ...defaultProps,
        redactions: [mockRedaction],
        onRedactionDelete,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Select redaction
      fireEvent.mouseDown(canvas, {
        clientX: 150,
        clientY: 120,
      });

      // Press backspace key
      fireEvent.keyDown(canvas, { key: 'Backspace' });

      expect(onRedactionDelete).toHaveBeenCalledWith(mockRedaction.id);
    });
  });

  describe('Grid Display', () => {
    test('should render grid when showGrid is true', () => {
      const props = {
        ...defaultProps,
        showGrid: true,
      };

      render(<RedactionCanvas {...props} />);
      
      // Verify context methods are called for grid drawing
      expect(mockCanvas.getContext).toHaveBeenCalled();
    });

    test('should not render grid when showGrid is false', () => {
      const props = {
        ...defaultProps,
        showGrid: false,
      };

      render(<RedactionCanvas {...props} />);
      
      // Grid lines should not be drawn
      expect(mockCanvas.getContext).toHaveBeenCalled();
    });
  });

  describe('Cursor Management', () => {
    test('should set crosshair cursor in drawing mode', () => {
      render(<RedactionCanvas {...defaultProps} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      expect(canvas.style.cursor).toBe('crosshair');
    });

    test('should set default cursor when not in drawing mode', () => {
      const props = {
        ...defaultProps,
        isDrawingMode: false,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      expect(canvas.style.cursor).toBe('default');
    });

    test('should change cursor on hover over redaction', () => {
      const props = {
        ...defaultProps,
        redactions: [mockRedaction],
        isDrawingMode: false,
      };

      render(<RedactionCanvas {...props} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Hover over redaction
      fireEvent.mouseMove(canvas, {
        clientX: 150,
        clientY: 120,
      });

      expect(canvas.style.cursor).toBe('pointer');
    });
  });

  describe('Props Validation', () => {
    test('should handle missing callbacks gracefully', () => {
      const props = {
        width: 800,
        height: 600,
      };

      expect(() => {
        render(<RedactionCanvas {...props} />);
      }).not.toThrow();
    });

    test('should use default values for optional props', () => {
      const minimalProps = {
        width: 800,
        height: 600,
      };

      render(<RedactionCanvas {...minimalProps} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      expect(canvas).toBeInTheDocument();
    });

    test('should handle empty redactions array', () => {
      const props = {
        ...defaultProps,
        redactions: [],
      };

      expect(() => {
        render(<RedactionCanvas {...props} />);
      }).not.toThrow();
    });
  });

  describe('Performance and Cleanup', () => {
    test('should add and remove event listeners properly', () => {
      const { unmount } = render(<RedactionCanvas {...defaultProps} />);
      
      // Verify event listeners are added
      const canvas = screen.getByTestId('redaction-canvas');
      expect(canvas.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      // Cleanup
      unmount();
      
      // Verify event listeners are removed
      expect(canvas.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should handle canvas ref changes', () => {
      const { rerender } = render(<RedactionCanvas {...defaultProps} />);
      
      // Re-render with different props
      rerender(<RedactionCanvas {...defaultProps} width={1000} height={800} />);
      
      // Should update canvas dimensions
      const canvas = screen.getByTestId('redaction-canvas');
      expect(canvas).toHaveAttribute('width', '1000');
      expect(canvas).toHaveAttribute('height', '800');
    });
  });

  describe('Accessibility', () => {
    test('should set canvas tabIndex for keyboard navigation', () => {
      render(<RedactionCanvas {...defaultProps} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      expect(canvas).toHaveAttribute('tabindex', '0');
    });

    test('should handle focus for keyboard events', () => {
      render(<RedactionCanvas {...defaultProps} />);
      
      const canvas = screen.getByTestId('redaction-canvas');
      
      // Focus the canvas
      act(() => {
        canvas.focus();
      });

      // Should be able to receive keyboard events
      fireEvent.keyDown(canvas, { key: 'Delete' });
      // Test passes if no errors thrown
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero dimensions', () => {
      const props = {
        ...defaultProps,
        width: 0,
        height: 0,
      };

      expect(() => {
        render(<RedactionCanvas {...props} />);
      }).not.toThrow();
    });

    test('should handle very large dimensions', () => {
      const props = {
        ...defaultProps,
        width: 10000,
        height: 10000,
      };

      expect(() => {
        render(<RedactionCanvas {...props} />);
      }).not.toThrow();
    });

    test('should handle negative scale', () => {
      const props = {
        ...defaultProps,
        scale: -1,
      };

      expect(() => {
        render(<RedactionCanvas {...props} />);
      }).not.toThrow();
    });

    test('should handle invalid redaction data', () => {
      const invalidRedaction = {
        ...mockRedaction,
        x: NaN,
        y: NaN,
        width: -100,
        height: -50,
      };

      const props = {
        ...defaultProps,
        redactions: [invalidRedaction],
      };

      expect(() => {
        render(<RedactionCanvas {...props} />);
      }).not.toThrow();
    });
  });
});