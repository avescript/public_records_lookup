/**
 * CoordinateTransformer Tests
 * Test suite for coordinate conversion utilities
 */

import { CoordinateTransformer, PDFPageDimensions, CanvasDimensions, CoordinateRect } from '../../src/utils/coordinateTransformer';

describe('CoordinateTransformer', () => {
  const mockPdfDimensions: PDFPageDimensions = {
    width: 595, // A4 width in points
    height: 842, // A4 height in points
    scale: 1.0,
    rotation: 0,
  };

  const mockCanvasDimensions: CanvasDimensions = {
    width: 595,
    height: 842,
    offsetX: 0,
    offsetY: 0,
  };

  const mockRect: CoordinateRect = {
    x: 100,
    y: 200,
    width: 150,
    height: 50,
  };

  describe('PDF to Canvas Coordinate Conversion', () => {
    test('should convert PDF coordinates to canvas coordinates with 1:1 scale', () => {
      const result = CoordinateTransformer.pdfToCanvas(
        mockRect,
        mockPdfDimensions,
        mockCanvasDimensions
      );

      // With 1:1 scale and no rotation, X should stay the same
      // Y should be flipped (PDF has bottom-left origin, Canvas has top-left)
      expect(result.x).toBe(100);
      expect(result.y).toBe(842 - 200 - 50); // height - y - height
      expect(result.width).toBe(150);
      expect(result.height).toBe(50);
    });

    test('should handle scale factor correctly', () => {
      const scaledPdfDimensions = { ...mockPdfDimensions, scale: 2.0 };
      const scaledCanvasDimensions = { ...mockCanvasDimensions, width: 1190, height: 1684 };

      const result = CoordinateTransformer.pdfToCanvas(
        mockRect,
        scaledPdfDimensions,
        scaledCanvasDimensions
      );

      expect(result.x).toBe(200); // 100 * 2
      expect(result.width).toBe(300); // 150 * 2
      expect(result.height).toBe(100); // 50 * 2
    });

    test('should handle 90-degree rotation', () => {
      const rotatedPdfDimensions = { ...mockPdfDimensions, rotation: 90 };

      const result = CoordinateTransformer.pdfToCanvas(
        mockRect,
        rotatedPdfDimensions,
        mockCanvasDimensions
      );

      // With 90-degree rotation, coordinates should transform appropriately
      expect(result.x).toBe(200); // Original Y becomes X
      expect(result.y).toBe(842 - (595 - 100 - 150)); // Adjusted for rotation and flip
      expect(result.width).toBe(50); // Original height becomes width
      expect(result.height).toBe(150); // Original width becomes height
    });

    test('should handle 180-degree rotation', () => {
      const rotatedPdfDimensions = { ...mockPdfDimensions, rotation: 180 };

      const result = CoordinateTransformer.pdfToCanvas(
        mockRect,
        rotatedPdfDimensions,
        mockCanvasDimensions
      );

      expect(result.x).toBe(595 - 100 - 150); // width - x - width
      expect(result.y).toBe(200); // Y coordinate after double flip
      expect(result.width).toBe(150);
      expect(result.height).toBe(50);
    });

    test('should handle 270-degree rotation', () => {
      const rotatedPdfDimensions = { ...mockPdfDimensions, rotation: 270 };

      const result = CoordinateTransformer.pdfToCanvas(
        mockRect,
        rotatedPdfDimensions,
        mockCanvasDimensions
      );

      expect(result.x).toBe(842 - 200 - 50); // height - y - height
      expect(result.y).toBe(842 - 100); // Adjusted for rotation and flip
      expect(result.width).toBe(50); // Original height becomes width
      expect(result.height).toBe(150); // Original width becomes height
    });
  });

  describe('Canvas to PDF Coordinate Conversion', () => {
    test('should convert canvas coordinates to PDF coordinates with 1:1 scale', () => {
      const canvasRect: CoordinateRect = {
        x: 100,
        y: 592, // This should convert back to y=200 in PDF coords
        width: 150,
        height: 50,
      };

      const result = CoordinateTransformer.canvasToPdf(
        canvasRect,
        mockPdfDimensions,
        mockCanvasDimensions
      );

      expect(result.x).toBeCloseTo(100, 1);
      expect(result.y).toBeCloseTo(200, 1);
      expect(result.width).toBeCloseTo(150, 1);
      expect(result.height).toBeCloseTo(50, 1);
    });

    test('should be inverse of pdfToCanvas', () => {
      const pdfRect = mockRect;

      const canvasRect = CoordinateTransformer.pdfToCanvas(
        pdfRect,
        mockPdfDimensions,
        mockCanvasDimensions
      );

      const backToPdf = CoordinateTransformer.canvasToPdf(
        canvasRect,
        mockPdfDimensions,
        mockCanvasDimensions
      );

      expect(backToPdf.x).toBeCloseTo(pdfRect.x, 1);
      expect(backToPdf.y).toBeCloseTo(pdfRect.y, 1);
      expect(backToPdf.width).toBeCloseTo(pdfRect.width, 1);
      expect(backToPdf.height).toBeCloseTo(pdfRect.height, 1);
    });
  });

  describe('Screen to Canvas Conversion', () => {
    test('should convert screen coordinates to canvas coordinates', () => {
      const mockCanvas = {
        getBoundingClientRect: jest.fn(() => ({
          left: 50,
          top: 100,
          width: 300,
          height: 400,
        })),
        width: 600,
        height: 800,
      } as unknown as HTMLCanvasElement;

      const screenCoords = { x: 200, y: 300 };
      
      const result = CoordinateTransformer.screenToCanvas(screenCoords, mockCanvas);

      expect(result.x).toBe(300); // (200 - 50) * (600 / 300)
      expect(result.y).toBe(400); // (300 - 100) * (800 / 400)
    });
  });

  describe('Viewport Transform Calculation', () => {
    test('should calculate viewport transform for width fit', () => {
      const viewportWidth = 800;
      const viewportHeight = 600;

      const transform = CoordinateTransformer.calculateViewportTransform(
        mockPdfDimensions,
        viewportWidth,
        viewportHeight,
        'width'
      );

      const expectedScale = viewportWidth / mockPdfDimensions.width;
      expect(transform.scaleX).toBeCloseTo(expectedScale, 5);
      expect(transform.scaleY).toBeCloseTo(expectedScale, 5);
      expect(transform.offsetX).toBe(0); // No centering needed for width fit
    });

    test('should calculate viewport transform for height fit', () => {
      const viewportWidth = 800;
      const viewportHeight = 600;

      const transform = CoordinateTransformer.calculateViewportTransform(
        mockPdfDimensions,
        viewportWidth,
        viewportHeight,
        'height'
      );

      const expectedScale = viewportHeight / mockPdfDimensions.height;
      expect(transform.scaleX).toBeCloseTo(expectedScale, 5);
      expect(transform.scaleY).toBeCloseTo(expectedScale, 5);
    });

    test('should calculate viewport transform for page fit', () => {
      const viewportWidth = 800;
      const viewportHeight = 600;

      const transform = CoordinateTransformer.calculateViewportTransform(
        mockPdfDimensions,
        viewportWidth,
        viewportHeight,
        'page'
      );

      const expectedScale = Math.min(
        viewportWidth / mockPdfDimensions.width,
        viewportHeight / mockPdfDimensions.height
      );
      expect(transform.scaleX).toBeCloseTo(expectedScale, 5);
      expect(transform.scaleY).toBeCloseTo(expectedScale, 5);
    });
  });

  describe('Coordinate Utilities', () => {
    test('should normalize coordinates within bounds', () => {
      const outOfBoundsRect: CoordinateRect = {
        x: -10,
        y: -20,
        width: 1000,
        height: 2000,
      };

      const bounds = { width: 500, height: 600 };
      const result = CoordinateTransformer.normalizeCoordinates(outOfBoundsRect, bounds);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.width).toBe(500);
      expect(result.height).toBe(600);
    });

    test('should convert relative to absolute coordinates', () => {
      const relativeRect: CoordinateRect = {
        x: 0.2,
        y: 0.3,
        width: 0.4,
        height: 0.5,
      };

      const dimensions = { width: 1000, height: 800 };
      const result = CoordinateTransformer.relativeToAbsolute(relativeRect, dimensions);

      expect(result.x).toBe(200);
      expect(result.y).toBe(240);
      expect(result.width).toBe(400);
      expect(result.height).toBe(400);
    });

    test('should convert absolute to relative coordinates', () => {
      const absoluteRect: CoordinateRect = {
        x: 200,
        y: 240,
        width: 400,
        height: 400,
      };

      const dimensions = { width: 1000, height: 800 };
      const result = CoordinateTransformer.absoluteToRelative(absoluteRect, dimensions);

      expect(result.x).toBeCloseTo(0.2, 5);
      expect(result.y).toBeCloseTo(0.3, 5);
      expect(result.width).toBeCloseTo(0.4, 5);
      expect(result.height).toBeCloseTo(0.5, 5);
    });

    test('should detect rectangle overlap', () => {
      const rect1: CoordinateRect = { x: 0, y: 0, width: 100, height: 100 };
      const rect2: CoordinateRect = { x: 50, y: 50, width: 100, height: 100 };
      const rect3: CoordinateRect = { x: 200, y: 200, width: 100, height: 100 };

      expect(CoordinateTransformer.doRectsOverlap(rect1, rect2)).toBe(true);
      expect(CoordinateTransformer.doRectsOverlap(rect1, rect3)).toBe(false);
    });

    test('should calculate rectangle intersection', () => {
      const rect1: CoordinateRect = { x: 0, y: 0, width: 100, height: 100 };
      const rect2: CoordinateRect = { x: 50, y: 50, width: 100, height: 100 };

      const intersection = CoordinateTransformer.getIntersection(rect1, rect2);

      expect(intersection).toEqual({
        x: 50,
        y: 50,
        width: 50,
        height: 50,
      });
    });

    test('should return null for no intersection', () => {
      const rect1: CoordinateRect = { x: 0, y: 0, width: 100, height: 100 };
      const rect2: CoordinateRect = { x: 200, y: 200, width: 100, height: 100 };

      const intersection = CoordinateTransformer.getIntersection(rect1, rect2);

      expect(intersection).toBeNull();
    });

    test('should calculate overlap percentage', () => {
      const rect1: CoordinateRect = { x: 0, y: 0, width: 100, height: 100 };
      const rect2: CoordinateRect = { x: 50, y: 0, width: 100, height: 100 };

      const overlapPercentage = CoordinateTransformer.getOverlapPercentage(rect1, rect2);

      expect(overlapPercentage).toBe(50); // 50% of rect1 overlaps with rect2
    });

    test('should snap to grid', () => {
      const rect: CoordinateRect = {
        x: 123,
        y: 187,
        width: 234,
        height: 156,
      };

      const snapped = CoordinateTransformer.snapToGrid(rect, 10);

      expect(snapped.x).toBe(120);
      expect(snapped.y).toBe(190);
      expect(snapped.width).toBe(230);
      expect(snapped.height).toBe(160);
    });

    test('should calculate distance between points', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };

      const distance = CoordinateTransformer.getDistance(point1, point2);

      expect(distance).toBe(5); // 3-4-5 triangle
    });

    test('should get rectangle center', () => {
      const rect: CoordinateRect = { x: 10, y: 20, width: 100, height: 200 };
      
      const center = CoordinateTransformer.getRectCenter(rect);

      expect(center.x).toBe(60); // 10 + 100/2
      expect(center.y).toBe(120); // 20 + 200/2
    });

    test('should scale rectangle', () => {
      const rect: CoordinateRect = { x: 50, y: 50, width: 100, height: 200 };
      const scaleFactor = 2;

      const scaled = CoordinateTransformer.scaleRect(rect, scaleFactor);

      expect(scaled.width).toBe(200);
      expect(scaled.height).toBe(400);
      expect(scaled.x).toBe(0); // Center maintained: 100 - 200/2
      expect(scaled.y).toBe(-50); // Center maintained: 150 - 400/2
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle unsupported rotation gracefully', () => {
      const unsupportedRotation = { ...mockPdfDimensions, rotation: 45 };
      
      const result = CoordinateTransformer.pdfToCanvas(
        mockRect,
        unsupportedRotation,
        mockCanvasDimensions
      );

      // Should fall back to 0 degree rotation
      expect(result.x).toBe(100);
      expect(result.y).toBe(842 - 200 - 50);
    });

    test('should handle zero dimensions', () => {
      const zeroDimensions = { width: 0, height: 0 };
      
      const result = CoordinateTransformer.normalizeCoordinates(mockRect, zeroDimensions);

      expect(result.width).toBe(1); // Minimum width
      expect(result.height).toBe(1); // Minimum height
    });

    test('should handle negative coordinates', () => {
      const negativeRect: CoordinateRect = {
        x: -50,
        y: -100,
        width: 200,
        height: 300,
      };

      const bounds = { width: 500, height: 600 };
      const result = CoordinateTransformer.normalizeCoordinates(negativeRect, bounds);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.width).toBe(200);
      expect(result.height).toBe(300);
    });
  });
});