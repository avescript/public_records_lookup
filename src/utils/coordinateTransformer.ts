// Coordinate Transformation Utilities
// Handles conversion between canvas coordinates, PDF coordinates, and screen coordinates
// Ensures accurate positioning of redaction overlays across different zoom levels and viewports

export interface PDFPageDimensions {
  width: number;
  height: number;
  scale: number;
  rotation: number; // 0, 90, 180, 270
}

export interface CanvasDimensions {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface CoordinateRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

/**
 * Coordinate transformation utilities class
 */
export class CoordinateTransformer {
  
  /**
   * Convert PDF coordinates to canvas coordinates
   * PDF coordinates are typically in points (72 DPI), with origin at bottom-left
   * Canvas coordinates are in pixels with origin at top-left
   */
  static pdfToCanvas(
    pdfCoords: CoordinateRect,
    pdfDimensions: PDFPageDimensions,
    canvasDimensions: CanvasDimensions
  ): CoordinateRect {
    const { width: pdfWidth, height: pdfHeight, scale, rotation } = pdfDimensions;
    const { width: canvasWidth, height: canvasHeight } = canvasDimensions;

    // Calculate scale factors
    const scaleX = (canvasWidth * scale) / pdfWidth;
    const scaleY = (canvasHeight * scale) / pdfHeight;

    // Convert coordinates based on rotation
    let transformedCoords = this.applyRotationTransform(pdfCoords, rotation, pdfWidth, pdfHeight);

    // Convert from PDF coordinate system (bottom-left origin) to canvas (top-left origin)
    const canvasCoords: CoordinateRect = {
      x: transformedCoords.x * scaleX,
      y: (pdfHeight - transformedCoords.y - transformedCoords.height) * scaleY,
      width: transformedCoords.width * scaleX,
      height: transformedCoords.height * scaleY,
    };

    return canvasCoords;
  }

  /**
   * Convert canvas coordinates to PDF coordinates
   * Canvas coordinates are in pixels with origin at top-left
   * PDF coordinates are typically in points (72 DPI), with origin at bottom-left
   */
  static canvasToPdf(
    canvasCoords: CoordinateRect,
    pdfDimensions: PDFPageDimensions,
    canvasDimensions: CanvasDimensions
  ): CoordinateRect {
    const { width: pdfWidth, height: pdfHeight, scale, rotation } = pdfDimensions;
    const { width: canvasWidth, height: canvasHeight } = canvasDimensions;

    // Calculate scale factors
    const scaleX = pdfWidth / (canvasWidth * scale);
    const scaleY = pdfHeight / (canvasHeight * scale);

    // Convert from canvas coordinate system (top-left origin) to PDF (bottom-left origin)
    let pdfCoords: CoordinateRect = {
      x: canvasCoords.x * scaleX,
      y: pdfHeight - (canvasCoords.y * scaleY) - (canvasCoords.height * scaleY),
      width: canvasCoords.width * scaleX,
      height: canvasCoords.height * scaleY,
    };

    // Apply inverse rotation transform
    pdfCoords = this.applyInverseRotationTransform(pdfCoords, rotation, pdfWidth, pdfHeight);

    return pdfCoords;
  }

  /**
   * Apply rotation transformation to coordinates
   */
  private static applyRotationTransform(
    coords: CoordinateRect,
    rotation: number,
    pageWidth: number,
    pageHeight: number
  ): CoordinateRect {
    const { x, y, width, height } = coords;

    switch (rotation) {
      case 0:
        return coords;

      case 90:
        return {
          x: y,
          y: pageWidth - x - width,
          width: height,
          height: width,
        };

      case 180:
        return {
          x: pageWidth - x - width,
          y: pageHeight - y - height,
          width,
          height,
        };

      case 270:
        return {
          x: pageHeight - y - height,
          y: x,
          width: height,
          height: width,
        };

      default:
        console.warn(`Unsupported rotation: ${rotation}. Using 0 degrees.`);
        return coords;
    }
  }

  /**
   * Apply inverse rotation transformation to coordinates
   */
  private static applyInverseRotationTransform(
    coords: CoordinateRect,
    rotation: number,
    pageWidth: number,
    pageHeight: number
  ): CoordinateRect {
    // Inverse rotation is the opposite direction
    const inverseRotation = (360 - rotation) % 360;
    return this.applyRotationTransform(coords, inverseRotation, pageWidth, pageHeight);
  }

  /**
   * Convert screen coordinates to canvas coordinates
   */
  static screenToCanvas(
    screenCoords: CoordinatePoint,
    canvasElement: HTMLCanvasElement
  ): CoordinatePoint {
    const rect = canvasElement.getBoundingClientRect();
    const scaleX = canvasElement.width / rect.width;
    const scaleY = canvasElement.height / rect.height;

    return {
      x: (screenCoords.x - rect.left) * scaleX,
      y: (screenCoords.y - rect.top) * scaleY,
    };
  }

  /**
   * Convert canvas coordinates to screen coordinates
   */
  static canvasToScreen(
    canvasCoords: CoordinatePoint,
    canvasElement: HTMLCanvasElement
  ): CoordinatePoint {
    const rect = canvasElement.getBoundingClientRect();
    const scaleX = rect.width / canvasElement.width;
    const scaleY = rect.height / canvasElement.height;

    return {
      x: (canvasCoords.x * scaleX) + rect.left,
      y: (canvasCoords.y * scaleY) + rect.top,
    };
  }

  /**
   * Calculate viewport transform for a given PDF page
   */
  static calculateViewportTransform(
    pdfDimensions: PDFPageDimensions,
    viewportWidth: number,
    viewportHeight: number,
    fitMode: 'width' | 'height' | 'page' = 'width'
  ): ViewportTransform {
    const { width: pdfWidth, height: pdfHeight, scale, rotation } = pdfDimensions;

    // Adjust dimensions for rotation
    const rotatedWidth = (rotation === 90 || rotation === 270) ? pdfHeight : pdfWidth;
    const rotatedHeight = (rotation === 90 || rotation === 270) ? pdfWidth : pdfHeight;

    let scaleX: number;
    let scaleY: number;

    switch (fitMode) {
      case 'width':
        scaleX = scaleY = viewportWidth / rotatedWidth;
        break;
      case 'height':
        scaleX = scaleY = viewportHeight / rotatedHeight;
        break;
      case 'page':
        scaleX = scaleY = Math.min(
          viewportWidth / rotatedWidth,
          viewportHeight / rotatedHeight
        );
        break;
    }

    // Apply the PDF scale factor
    scaleX *= scale;
    scaleY *= scale;

    // Calculate centering offsets
    const scaledWidth = rotatedWidth * scaleX;
    const scaledHeight = rotatedHeight * scaleY;
    const offsetX = Math.max(0, (viewportWidth - scaledWidth) / 2);
    const offsetY = Math.max(0, (viewportHeight - scaledHeight) / 2);

    return {
      scaleX,
      scaleY,
      offsetX,
      offsetY,
      rotation,
    };
  }

  /**
   * Normalize coordinates to ensure they stay within bounds
   */
  static normalizeCoordinates(
    coords: CoordinateRect,
    bounds: { width: number; height: number }
  ): CoordinateRect {
    const normalized = { ...coords };

    // Ensure coordinates are not negative
    normalized.x = Math.max(0, normalized.x);
    normalized.y = Math.max(0, normalized.y);

    // Ensure coordinates don't exceed bounds
    normalized.x = Math.min(normalized.x, bounds.width - 1);
    normalized.y = Math.min(normalized.y, bounds.height - 1);

    // Ensure width and height fit within bounds
    normalized.width = Math.min(normalized.width, bounds.width - normalized.x);
    normalized.height = Math.min(normalized.height, bounds.height - normalized.y);

    // Ensure minimum size
    normalized.width = Math.max(1, normalized.width);
    normalized.height = Math.max(1, normalized.height);

    return normalized;
  }

  /**
   * Convert relative coordinates (0-1 range) to absolute coordinates
   */
  static relativeToAbsolute(
    relativeCoords: CoordinateRect,
    dimensions: { width: number; height: number }
  ): CoordinateRect {
    return {
      x: relativeCoords.x * dimensions.width,
      y: relativeCoords.y * dimensions.height,
      width: relativeCoords.width * dimensions.width,
      height: relativeCoords.height * dimensions.height,
    };
  }

  /**
   * Convert absolute coordinates to relative coordinates (0-1 range)
   */
  static absoluteToRelative(
    absoluteCoords: CoordinateRect,
    dimensions: { width: number; height: number }
  ): CoordinateRect {
    return {
      x: absoluteCoords.x / dimensions.width,
      y: absoluteCoords.y / dimensions.height,
      width: absoluteCoords.width / dimensions.width,
      height: absoluteCoords.height / dimensions.height,
    };
  }

  /**
   * Check if two rectangles overlap
   */
  static doRectsOverlap(rect1: CoordinateRect, rect2: CoordinateRect): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }

  /**
   * Calculate the intersection of two rectangles
   */
  static getIntersection(rect1: CoordinateRect, rect2: CoordinateRect): CoordinateRect | null {
    const left = Math.max(rect1.x, rect2.x);
    const top = Math.max(rect1.y, rect2.y);
    const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    if (left >= right || top >= bottom) {
      return null; // No intersection
    }

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    };
  }

  /**
   * Calculate the area of intersection as a percentage of the first rectangle
   */
  static getOverlapPercentage(rect1: CoordinateRect, rect2: CoordinateRect): number {
    const intersection = this.getIntersection(rect1, rect2);
    if (!intersection) {
      return 0;
    }

    const rect1Area = rect1.width * rect1.height;
    const intersectionArea = intersection.width * intersection.height;
    
    return (intersectionArea / rect1Area) * 100;
  }

  /**
   * Snap coordinates to a grid
   */
  static snapToGrid(
    coords: CoordinateRect,
    gridSize: number = 10
  ): CoordinateRect {
    return {
      x: Math.round(coords.x / gridSize) * gridSize,
      y: Math.round(coords.y / gridSize) * gridSize,
      width: Math.round(coords.width / gridSize) * gridSize,
      height: Math.round(coords.height / gridSize) * gridSize,
    };
  }

  /**
   * Calculate distance between two points
   */
  static getDistance(point1: CoordinatePoint, point2: CoordinatePoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get the center point of a rectangle
   */
  static getRectCenter(rect: CoordinateRect): CoordinatePoint {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
  }

  /**
   * Scale a rectangle by a factor
   */
  static scaleRect(rect: CoordinateRect, scaleFactor: number): CoordinateRect {
    const center = this.getRectCenter(rect);
    const newWidth = rect.width * scaleFactor;
    const newHeight = rect.height * scaleFactor;
    
    return {
      x: center.x - newWidth / 2,
      y: center.y - newHeight / 2,
      width: newWidth,
      height: newHeight,
    };
  }
}

/**
 * Helper hook for coordinate transformations in React components
 */
export const useCoordinateTransformer = (
  pdfDimensions: PDFPageDimensions,
  canvasDimensions: CanvasDimensions
) => {
  const pdfToCanvas = (coords: CoordinateRect) =>
    CoordinateTransformer.pdfToCanvas(coords, pdfDimensions, canvasDimensions);

  const canvasToPdf = (coords: CoordinateRect) =>
    CoordinateTransformer.canvasToPdf(coords, pdfDimensions, canvasDimensions);

  const normalizeCoordinates = (coords: CoordinateRect) =>
    CoordinateTransformer.normalizeCoordinates(coords, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
    });

  return {
    pdfToCanvas,
    canvasToPdf,
    normalizeCoordinates,
  };
};

export default CoordinateTransformer;