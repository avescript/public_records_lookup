// RedactionCanvas Component
// Provides HTML5 Canvas overlay for drawing redaction boxes
// Handles mouse interactions, coordinate transformations, and visual feedback

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ManualRedaction, RedactionCoordinates } from '../services/redactionService';

export interface RedactionCanvasProps {
  /** Canvas dimensions (should match PDF page dimensions) */
  width: number;
  height: number;
  /** Scale factor for PDF display */
  scale?: number;
  /** Existing redactions to display */
  redactions?: ManualRedaction[];
  /** Callback when new redaction is drawn */
  onRedactionAdd?: (coordinates: RedactionCoordinates) => void;
  /** Callback when redaction is selected */
  onRedactionSelect?: (redaction: ManualRedaction | null) => void;
  /** Callback when redaction is updated */
  onRedactionUpdate?: (redactionId: string, coordinates: RedactionCoordinates) => void;
  /** Callback when redaction is deleted */
  onRedactionDelete?: (redactionId: string) => void;
  /** Whether the canvas is in drawing mode */
  isDrawingMode?: boolean;
  /** Canvas background color */
  backgroundColor?: string;
  /** Redaction box color */
  redactionColor?: string;
  /** Selected redaction color */
  selectedColor?: string;
  /** Whether to show grid helper */
  showGrid?: boolean;
  /** Page number for context */
  pageNumber?: number;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface ResizeHandle {
  x: number;
  y: number;
  cursor: string;
  position: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w';
}

const HANDLE_SIZE = 8;
const MIN_REDACTION_SIZE = 10;

export const RedactionCanvas: React.FC<RedactionCanvasProps> = ({
  width,
  height,
  scale = 1,
  redactions = [],
  onRedactionAdd,
  onRedactionSelect,
  onRedactionUpdate,
  onRedactionDelete,
  isDrawingMode = true,
  backgroundColor = 'transparent',
  redactionColor = 'rgba(255, 0, 0, 0.3)',
  selectedColor = 'rgba(255, 0, 0, 0.5)',
  showGrid = false,
  pageNumber = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  
  const [selectedRedaction, setSelectedRedaction] = useState<ManualRedaction | null>(null);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  /**
   * Get canvas context
   */
  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  }, []);

  /**
   * Convert screen coordinates to canvas coordinates
   */
  const screenToCanvas = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  /**
   * Check if point is inside a redaction
   */
  const isPointInRedaction = useCallback((x: number, y: number, redaction: ManualRedaction): boolean => {
    return (
      x >= redaction.x &&
      x <= redaction.x + redaction.width &&
      y >= redaction.y &&
      y <= redaction.y + redaction.height
    );
  }, []);

  /**
   * Get resize handles for selected redaction
   */
  const getResizeHandles = useCallback((redaction: ManualRedaction): ResizeHandle[] => {
    const handles: ResizeHandle[] = [];
    const { x, y, width, height } = redaction;

    handles.push(
      // Corners
      { x: x - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2, cursor: 'nw-resize', position: 'nw' },
      { x: x + width - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2, cursor: 'ne-resize', position: 'ne' },
      { x: x - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2, cursor: 'sw-resize', position: 'sw' },
      { x: x + width - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2, cursor: 'se-resize', position: 'se' },
      // Edges
      { x: x + width/2 - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2, cursor: 'n-resize', position: 'n' },
      { x: x + width - HANDLE_SIZE/2, y: y + height/2 - HANDLE_SIZE/2, cursor: 'e-resize', position: 'e' },
      { x: x + width/2 - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2, cursor: 's-resize', position: 's' },
      { x: x - HANDLE_SIZE/2, y: y + height/2 - HANDLE_SIZE/2, cursor: 'w-resize', position: 'w' },
    );

    return handles;
  }, []);

  /**
   * Check if point is on a resize handle
   */
  const getHandleAtPoint = useCallback((x: number, y: number): ResizeHandle | null => {
    if (!selectedRedaction) return null;

    const handles = getResizeHandles(selectedRedaction);
    return handles.find(handle => 
      x >= handle.x && x <= handle.x + HANDLE_SIZE &&
      y >= handle.y && y <= handle.y + HANDLE_SIZE
    ) || null;
  }, [selectedRedaction, getResizeHandles]);

  /**
   * Draw grid helper
   */
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;

    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    
    const gridSize = 20 * scale;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [showGrid, scale, width, height]);

  /**
   * Draw redaction boxes
   */
  const drawRedactions = useCallback((ctx: CanvasRenderingContext2D) => {
    redactions.forEach(redaction => {
      const isSelected = selectedRedaction?.id === redaction.id;
      const color = isSelected ? selectedColor : redactionColor;
      
      // Draw redaction box
      ctx.fillStyle = color;
      ctx.fillRect(redaction.x, redaction.y, redaction.width, redaction.height);
      
      // Draw border
      ctx.strokeStyle = isSelected ? '#ff0000' : '#cc0000';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(redaction.x, redaction.y, redaction.width, redaction.height);
      
      // Draw resize handles for selected redaction
      if (isSelected) {
        const handles = getResizeHandles(redaction);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        handles.forEach(handle => {
          ctx.fillRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
          ctx.strokeRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE);
        });
      }
    });
  }, [redactions, selectedRedaction, redactionColor, selectedColor, getResizeHandles]);

  /**
   * Draw current drawing preview
   */
  const drawCurrentRedaction = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!drawingState.isDrawing) return;

    const { startX, startY, currentX, currentY } = drawingState;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    if (width > MIN_REDACTION_SIZE && height > MIN_REDACTION_SIZE) {
      ctx.fillStyle = redactionColor;
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }
  }, [drawingState, redactionColor]);

  /**
   * Main render function
   */
  const render = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set background
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw grid
    drawGrid(ctx);

    // Draw existing redactions
    drawRedactions(ctx);

    // Draw current drawing
    drawCurrentRedaction(ctx);
  }, [getContext, width, height, backgroundColor, drawGrid, drawRedactions, drawCurrentRedaction]);

  /**
   * Handle mouse down
   */
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = screenToCanvas(event.clientX, event.clientY);
    
    // Check for resize handle first
    const handle = getHandleAtPoint(x, y);
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle.position);
      canvas.style.cursor = handle.cursor;
      return;
    }

    // Check if clicking on existing redaction
    const clickedRedaction = redactions.find(redaction => isPointInRedaction(x, y, redaction));
    
    if (clickedRedaction) {
      setSelectedRedaction(clickedRedaction);
      onRedactionSelect?.(clickedRedaction);
      
      if (clickedRedaction === selectedRedaction) {
        // Start dragging
        setIsDragging(true);
        setDragOffset({
          x: x - clickedRedaction.x,
          y: y - clickedRedaction.y,
        });
        canvas.style.cursor = 'move';
      }
    } else {
      // Clear selection or start new drawing
      setSelectedRedaction(null);
      onRedactionSelect?.(null);
      
      if (isDrawingMode) {
        setDrawingState({
          isDrawing: true,
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
        });
        canvas.style.cursor = 'crosshair';
      }
    }
  }, [screenToCanvas, getHandleAtPoint, redactions, isPointInRedaction, selectedRedaction, isDrawingMode, onRedactionSelect]);

  /**
   * Handle mouse move
   */
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = screenToCanvas(event.clientX, event.clientY);

    if (isResizing && selectedRedaction && resizeHandle) {
      // Handle resizing
      let newX = selectedRedaction.x;
      let newY = selectedRedaction.y;
      let newWidth = selectedRedaction.width;
      let newHeight = selectedRedaction.height;

      switch (resizeHandle) {
        case 'nw':
          newX = Math.min(x, selectedRedaction.x + selectedRedaction.width - MIN_REDACTION_SIZE);
          newY = Math.min(y, selectedRedaction.y + selectedRedaction.height - MIN_REDACTION_SIZE);
          newWidth = selectedRedaction.x + selectedRedaction.width - newX;
          newHeight = selectedRedaction.y + selectedRedaction.height - newY;
          break;
        case 'ne':
          newY = Math.min(y, selectedRedaction.y + selectedRedaction.height - MIN_REDACTION_SIZE);
          newWidth = Math.max(x - selectedRedaction.x, MIN_REDACTION_SIZE);
          newHeight = selectedRedaction.y + selectedRedaction.height - newY;
          break;
        case 'sw':
          newX = Math.min(x, selectedRedaction.x + selectedRedaction.width - MIN_REDACTION_SIZE);
          newWidth = selectedRedaction.x + selectedRedaction.width - newX;
          newHeight = Math.max(y - selectedRedaction.y, MIN_REDACTION_SIZE);
          break;
        case 'se':
          newWidth = Math.max(x - selectedRedaction.x, MIN_REDACTION_SIZE);
          newHeight = Math.max(y - selectedRedaction.y, MIN_REDACTION_SIZE);
          break;
        case 'n':
          newY = Math.min(y, selectedRedaction.y + selectedRedaction.height - MIN_REDACTION_SIZE);
          newHeight = selectedRedaction.y + selectedRedaction.height - newY;
          break;
        case 'e':
          newWidth = Math.max(x - selectedRedaction.x, MIN_REDACTION_SIZE);
          break;
        case 's':
          newHeight = Math.max(y - selectedRedaction.y, MIN_REDACTION_SIZE);
          break;
        case 'w':
          newX = Math.min(x, selectedRedaction.x + selectedRedaction.width - MIN_REDACTION_SIZE);
          newWidth = selectedRedaction.x + selectedRedaction.width - newX;
          break;
      }

      // Update the redaction coordinates
      const updatedRedaction: ManualRedaction = {
        ...selectedRedaction,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      
      setSelectedRedaction(updatedRedaction);
      render();
      
    } else if (isDragging && selectedRedaction) {
      // Handle dragging
      const newX = Math.max(0, Math.min(x - dragOffset.x, width - selectedRedaction.width));
      const newY = Math.max(0, Math.min(y - dragOffset.y, height - selectedRedaction.height));
      
      const updatedRedaction: ManualRedaction = {
        ...selectedRedaction,
        x: newX,
        y: newY,
      };
      
      setSelectedRedaction(updatedRedaction);
      render();
      
    } else if (drawingState.isDrawing) {
      // Handle drawing
      setDrawingState(prev => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
      render();
      
    } else {
      // Update cursor based on hover state
      const handle = getHandleAtPoint(x, y);
      if (handle) {
        canvas.style.cursor = handle.cursor;
      } else {
        const hoveredRedaction = redactions.find(redaction => isPointInRedaction(x, y, redaction));
        canvas.style.cursor = hoveredRedaction ? 'pointer' : (isDrawingMode ? 'crosshair' : 'default');
      }
    }
  }, [screenToCanvas, isResizing, selectedRedaction, resizeHandle, isDragging, dragOffset, drawingState, render, getHandleAtPoint, redactions, isPointInRedaction, isDrawingMode, width, height]);

  /**
   * Handle mouse up
   */
  const handleMouseUp = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isResizing && selectedRedaction) {
      // Finish resizing
      onRedactionUpdate?.(selectedRedaction.id, {
        x: selectedRedaction.x,
        y: selectedRedaction.y,
        width: selectedRedaction.width,
        height: selectedRedaction.height,
      });
      setIsResizing(false);
      setResizeHandle(null);
      
    } else if (isDragging && selectedRedaction) {
      // Finish dragging
      onRedactionUpdate?.(selectedRedaction.id, {
        x: selectedRedaction.x,
        y: selectedRedaction.y,
        width: selectedRedaction.width,
        height: selectedRedaction.height,
      });
      setIsDragging(false);
      
    } else if (drawingState.isDrawing) {
      // Finish drawing
      const { startX, startY, currentX, currentY } = drawingState;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width > MIN_REDACTION_SIZE && height > MIN_REDACTION_SIZE) {
        onRedactionAdd?.({ x, y, width, height });
      }

      setDrawingState({
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    }

    canvas.style.cursor = isDrawingMode ? 'crosshair' : 'default';
  }, [isResizing, isDragging, drawingState, selectedRedaction, onRedactionUpdate, onRedactionAdd, isDrawingMode]);

  /**
   * Handle key press for deletion
   */
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedRedaction) {
        onRedactionDelete?.(selectedRedaction.id);
        setSelectedRedaction(null);
        onRedactionSelect?.(null);
      }
    }
  }, [selectedRedaction, onRedactionDelete, onRedactionSelect]);

  // Set up canvas and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
    canvas.style.cursor = isDrawingMode ? 'crosshair' : 'default';

    // Focus canvas for keyboard events
    canvas.tabIndex = 0;
    canvas.addEventListener('keydown', handleKeyPress);

    return () => {
      canvas.removeEventListener('keydown', handleKeyPress);
    };
  }, [width, height, isDrawingMode, handleKeyPress]);

  // Render canvas when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="redaction-canvas-container"
      style={{ 
        position: 'relative',
        display: 'inline-block',
        border: '1px solid #ccc',
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid="redaction-canvas"
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
      
      {/* Debug info (remove in production) */}
      {selectedRedaction && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        >
          Selected: {selectedRedaction.id.slice(-8)}
        </div>
      )}
    </div>
  );
};

export default RedactionCanvas;