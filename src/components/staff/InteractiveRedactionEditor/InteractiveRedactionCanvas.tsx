/**
 * Interactive Redaction Canvas Editor
 * US-V2-031: Enhanced redaction editing with AI integration
 *
 * Features:
 * - Enhanced canvas with multiple shape tools (rectangle, ellipse, freeform)
 * - Layered redaction management with z-index control
 * - AI suggestion integration with one-click implementation
 * - Real-time confidence scoring and validation
 * - Before/after comparison modes
 * - Drag-and-drop redaction editing
 * - Visual suggestion indicators
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AutoAwesome as AutoAwesomeIcon,
  BlurOn as BlurOnIcon,
  BrushOutlined as BrushIcon,
  Circle as CircleIcon,
  CompareArrows as CompareIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Layers as LayersIcon,
  Lightbulb as SuggestionIcon,
  PlayArrow as PlayIcon,
  Rectangle as RectangleIcon,
  Redo as RedoIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Undo as UndoIcon,
  Visibility as PreviewIcon,
  VisibilityOff as HidePreviewIcon,
  Warning as WarningIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Fab,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Popper,
  Select,
  Slider,
  Snackbar,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import { useAgency } from '../../../contexts/AgencyContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  aiRedactionSuggestionService,
  RedactionSuggestion,
  SuggestionType,
} from '../../../services/aiRedactionSuggestionService';
import {
  enhancedPIIEngine,
  EnhancedPIIFinding,
  RedactionSensitivityMode,
} from '../../../services/enhancedPIIEngine';
import {
  redactionConfidenceAnalyzer,
  RedactionQualityReport,
} from '../../../services/redactionConfidenceAnalyzer';
import {
  ManualRedaction,
  redactionService,
} from '../../../services/redactionService';

// Redaction shape types
export enum RedactionShape {
  RECTANGLE = 'rectangle',
  ELLIPSE = 'ellipse',
  FREEFORM = 'freeform',
}

// Canvas editing modes
export enum EditingMode {
  SELECT = 'select',
  DRAW = 'draw',
  EDIT = 'edit',
}

// Preview modes
export enum PreviewMode {
  NORMAL = 'normal',
  REDACTED = 'redacted',
  COMPARISON = 'comparison',
}

// Enhanced redaction with editor-specific properties
export interface InteractiveRedaction extends ManualRedaction {
  shape: RedactionShape;
  zIndex: number;
  opacity: number;
  color?: string;
  isAISuggested?: boolean;
  suggestionId?: string;
  confidenceScore?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

// History state for undo/redo functionality
export interface EditorHistoryState {
  id: string;
  redactions: InteractiveRedaction[];
  timestamp: number;
  action: string;
}

// Props interface
interface InteractiveRedactionCanvasProps {
  documentId: string;
  recordId: string;
  fileName: string;
  imageUrl: string;
  pageNumber: number;
  width: number;
  height: number;
  onRedactionsChange?: (redactions: ManualRedaction[]) => void;
  onQualityChange?: (qualityReport: RedactionQualityReport) => void;
  readOnly?: boolean;
  sensitivityMode?: RedactionSensitivityMode;
  showAISuggestions?: boolean;
}

export const InteractiveRedactionCanvas: React.FC<
  InteractiveRedactionCanvasProps
> = ({
  documentId,
  recordId,
  fileName,
  imageUrl,
  pageNumber,
  width,
  height,
  onRedactionsChange,
  onQualityChange,
  readOnly = false,
  sensitivityMode = RedactionSensitivityMode.STANDARD,
  showAISuggestions = true,
}) => {
  const theme = useTheme();
  const { currentAgency } = useAgency();
  const { user } = useAuth();

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // State management
  const [redactions, setRedactions] = useState<InteractiveRedaction[]>([]);
  const [selectedRedactionIds, setSelectedRedactionIds] = useState<Set<string>>(
    new Set()
  );
  const [suggestions, setSuggestions] = useState<RedactionSuggestion[]>([]);
  const [enhancedFindings, setEnhancedFindings] = useState<
    EnhancedPIIFinding[]
  >([]);
  const [qualityReport, setQualityReport] =
    useState<RedactionQualityReport | null>(null);

  // Editor state
  const [editingMode, setEditingMode] = useState<EditingMode>(
    EditingMode.SELECT
  );
  const [selectedShape, setSelectedShape] = useState<RedactionShape>(
    RedactionShape.RECTANGLE
  );
  const [previewMode, setPreviewMode] = useState<PreviewMode>(
    PreviewMode.NORMAL
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // History management
  const [history, setHistory] = useState<EditorHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // UI state
  const [showSuggestions, setShowSuggestions] = useState(showAISuggestions);
  const [showLayers, setShowLayers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentDraw, setCurrentDraw] =
    useState<Partial<InteractiveRedaction> | null>(null);
  const [freeformPoints, setFreeformPoints] = useState<
    { x: number; y: number }[]
  >([]);

  /**
   * Load existing redactions and AI analysis
   */
  const loadCanvasData = useCallback(async () => {
    if (!recordId || !fileName || pageNumber === undefined) {
      console.warn('Missing required props for loading canvas data');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Load existing redactions
      const existingRedactions =
        await redactionService.getRedactionsForDocument(
          recordId,
          fileName,
          pageNumber
        );

      // Convert to interactive redactions
      const interactiveRedactions: InteractiveRedaction[] =
        existingRedactions.map((redaction, index) => ({
          ...redaction,
          shape: (redaction as any).shape || RedactionShape.RECTANGLE,
          zIndex: (redaction as any).zIndex || index,
          opacity: (redaction as any).opacity || 0.8,
          color: (redaction as any).color || theme.palette.error.main,
          isSelected: false,
          isHighlighted: false,
        }));

      setRedactions(interactiveRedactions);

      // Analyze document with Enhanced PII Engine
      if (showAISuggestions) {
        try {
          const mockPIIFindings = await generateMockPIIFindings(); // In real app, this would analyze the document
          const enhancedResults = await enhancedPIIEngine.enhanceFindings(
            mockPIIFindings,
            sensitivityMode
          );
          setEnhancedFindings(enhancedResults);

          // Generate AI suggestions
          const aiSuggestions =
            await aiRedactionSuggestionService.generateSuggestions(
              enhancedResults,
              existingRedactions
            );
          setSuggestions(aiSuggestions);

          // Generate quality report
          const quality = await aiRedactionSuggestionService.performAutoReview(
            enhancedResults,
            existingRedactions,
            recordId,
            fileName
          );
          setQualityReport(quality);
          onQualityChange?.(quality);
        } catch (aiError) {
          console.error('AI service error:', aiError);
          // Continue loading without AI features
        }
      }

      // Initialize history
      saveToHistory('Initial load', interactiveRedactions);
    } catch (error) {
      console.error('Failed to load canvas data:', error);
      setError('Failed to load redaction data');
      showNotification('Failed to load redaction data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    recordId,
    fileName,
    pageNumber,
    sensitivityMode,
    showAISuggestions,
    onQualityChange,
  ]);

  /**
   * Initialize canvas and load data
   */
  useEffect(() => {
    loadCanvasData();
  }, [
    documentId,
    recordId,
    fileName,
    pageNumber,
    sensitivityMode,
    loadCanvasData,
  ]);

  /**
   * Update showSuggestions state when showAISuggestions prop changes
   */
  useEffect(() => {
    setShowSuggestions(showAISuggestions);
  }, [showAISuggestions]);

  /**
   * Generate mock PII findings for development
   * TODO: Replace with actual document analysis
   */
  const generateMockPIIFindings = async () => {
    return [
      {
        recordId,
        fileName,
        pageNumber,
        piiType: 'SSN' as any,
        confidence: 95,
        x: 100,
        y: 200,
        width: 120,
        height: 20,
        text: '***-**-****',
        reasoning: 'High confidence SSN pattern detected',
      },
      {
        recordId,
        fileName,
        pageNumber,
        piiType: 'PERSON_NAME' as any,
        confidence: 85,
        x: 50,
        y: 150,
        width: 80,
        height: 15,
        text: 'John Doe',
        reasoning: 'Name pattern detected in context',
      },
    ];
  };

  /**
   * Save current state to history for undo/redo
   */
  const saveToHistory = (
    action: string,
    redactionsState: InteractiveRedaction[]
  ) => {
    const newState: EditorHistoryState = {
      id: `history_${Date.now()}`,
      redactions: JSON.parse(JSON.stringify(redactionsState)),
      timestamp: Date.now(),
      action,
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setRedactions(prevState.redactions);
      setHistoryIndex(prev => prev - 1);
      showNotification(`Undid: ${history[historyIndex].action}`, 'info');
    }
  }, [historyIndex, history]);

  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setRedactions(nextState.redactions);
      setHistoryIndex(prev => prev + 1);
      showNotification(`Redid: ${nextState.action}`, 'info');
    }
  }, [historyIndex, history]);

  /**
   * Handle mouse events for drawing and selection
   */
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;

    if (editingMode === EditingMode.DRAW) {
      startDrawing(x, y);
    } else if (editingMode === EditingMode.SELECT) {
      handleSelection(x, y, event.shiftKey);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;

    updateDrawing(x, y);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      finishDrawing();
    }
  };

  /**
   * Start drawing a new redaction
   */
  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);
    setDragStart({ x, y });

    const newRedaction: Partial<InteractiveRedaction> = {
      id: `redaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recordId,
      fileName,
      pageNumber,
      x,
      y,
      width: 0,
      height: 0,
      shape: selectedShape,
      zIndex: Math.max(...redactions.map(r => r.zIndex), 0) + 1,
      opacity: 0.8,
      color: theme.palette.error.main,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'user',
      type: 'manual',
    };

    if (selectedShape === RedactionShape.FREEFORM) {
      setFreeformPoints([{ x, y }]);
    }

    setCurrentDraw(newRedaction);
  };

  /**
   * Update drawing in progress
   */
  const updateDrawing = (x: number, y: number) => {
    if (!dragStart || !currentDraw) return;

    if (selectedShape === RedactionShape.FREEFORM) {
      setFreeformPoints(prev => [...prev, { x, y }]);
    } else {
      const width = Math.abs(x - dragStart.x);
      const height = Math.abs(y - dragStart.y);
      const finalX = Math.min(x, dragStart.x);
      const finalY = Math.min(y, dragStart.y);

      setCurrentDraw(prev => ({
        ...prev,
        x: finalX,
        y: finalY,
        width,
        height,
      }));
    }

    redrawCanvas();
  };

  /**
   * Finish drawing and add redaction
   */
  const finishDrawing = () => {
    if (!currentDraw) return;

    let finalRedaction = { ...currentDraw } as InteractiveRedaction;

    if (
      selectedShape === RedactionShape.FREEFORM &&
      freeformPoints.length > 2
    ) {
      // Calculate bounding box for freeform shape
      const minX = Math.min(...freeformPoints.map(p => p.x));
      const minY = Math.min(...freeformPoints.map(p => p.y));
      const maxX = Math.max(...freeformPoints.map(p => p.x));
      const maxY = Math.max(...freeformPoints.map(p => p.y));

      finalRedaction = {
        ...finalRedaction,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }

    // Only add redaction if it has meaningful size
    if (finalRedaction.width! > 5 && finalRedaction.height! > 5) {
      const newRedactions = [...redactions, finalRedaction];
      setRedactions(newRedactions);
      onRedactionsChange?.(newRedactions.map(r => ({ ...r })));
      saveToHistory('Added redaction', newRedactions);
      showNotification('Redaction added', 'success');
    }

    // Reset drawing state
    setIsDrawing(false);
    setDragStart(null);
    setCurrentDraw(null);
    setFreeformPoints([]);
  };

  /**
   * Handle redaction selection
   */
  const handleSelection = (x: number, y: number, isMultiSelect: boolean) => {
    const clickedRedaction = redactions.find(
      redaction =>
        x >= redaction.x &&
        x <= redaction.x + redaction.width &&
        y >= redaction.y &&
        y <= redaction.y + redaction.height
    );

    if (clickedRedaction) {
      if (isMultiSelect) {
        setSelectedRedactionIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(clickedRedaction.id)) {
            newSet.delete(clickedRedaction.id);
          } else {
            newSet.add(clickedRedaction.id);
          }
          return newSet;
        });
      } else {
        setSelectedRedactionIds(new Set([clickedRedaction.id]));
      }
    } else if (!isMultiSelect) {
      setSelectedRedactionIds(new Set());
    }

    updateRedactionSelection();
  };

  /**
   * Update visual selection state
   */
  const updateRedactionSelection = useCallback(() => {
    setRedactions(prev =>
      prev.map(redaction => ({
        ...redaction,
        isSelected: selectedRedactionIds.has(redaction.id),
      }))
    );
    // Redraw will be triggered by the useEffect that watches redactions
  }, [selectedRedactionIds]);

  /**
   * Implement AI suggestion
   */
  const implementSuggestion = async (suggestion: RedactionSuggestion) => {
    try {
      let newRedactions = [...redactions];

      switch (suggestion.type) {
        case SuggestionType.NEW_REDACTION:
          const newRedaction: InteractiveRedaction = {
            id: `ai_suggestion_${Date.now()}`,
            recordId,
            fileName,
            pageNumber,
            x: suggestion.targetCoordinates.x,
            y: suggestion.targetCoordinates.y,
            width: suggestion.targetCoordinates.width,
            height: suggestion.targetCoordinates.height,
            shape: RedactionShape.RECTANGLE,
            zIndex: Math.max(...redactions.map(r => r.zIndex), 0) + 1,
            opacity: 0.8,
            color: theme.palette.warning.main,
            createdAt: new Date().toISOString(),
            createdBy: user?.uid || 'ai_system',
            type: 'ai-assisted',
            reason: suggestion.reasoning,
            isAISuggested: true,
            suggestionId: suggestion.id,
            confidenceScore: suggestion.confidence,
            isSelected: false,
            isHighlighted: false,
          };
          newRedactions.push(newRedaction);
          break;

        case SuggestionType.ADJUST_BOUNDARIES:
          // Find and update the target redaction
          const targetIndex = newRedactions.findIndex(
            r =>
              Math.abs(r.x - suggestion.targetCoordinates.x) < 10 &&
              Math.abs(r.y - suggestion.targetCoordinates.y) < 10
          );
          if (targetIndex >= 0) {
            newRedactions[targetIndex] = {
              ...newRedactions[targetIndex],
              width: suggestion.targetCoordinates.width,
              height: suggestion.targetCoordinates.height,
            };
          }
          break;

        case SuggestionType.MERGE_REDACTIONS:
          // Remove overlapping redactions and create merged one
          // Implementation would depend on suggestion metadata
          break;
      }

      setRedactions(newRedactions);
      onRedactionsChange?.(newRedactions);
      saveToHistory(
        `Implemented AI suggestion: ${suggestion.type}`,
        newRedactions
      );

      // Remove implemented suggestion
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

      showNotification('AI suggestion implemented', 'success');
    } catch (error) {
      console.error('Failed to implement suggestion:', error);
      showNotification('Failed to implement suggestion', 'error');
    }
  };

  /**
   * Delete selected redactions
   */
  const deleteSelectedRedactions = useCallback(() => {
    if (selectedRedactionIds.size === 0) return;

    const newRedactions = redactions.filter(
      r => !selectedRedactionIds.has(r.id)
    );
    setRedactions(newRedactions);
    setSelectedRedactionIds(new Set());
    onRedactionsChange?.(newRedactions);
    saveToHistory(
      `Deleted ${selectedRedactionIds.size} redaction(s)`,
      newRedactions
    );
    showNotification(
      `Deleted ${selectedRedactionIds.size} redaction(s)`,
      'success'
    );
  }, [selectedRedactionIds, redactions, onRedactionsChange]);

  /**
   * Redraw canvas with current state
   */
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    const img = imageRef.current;
    if (img) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // Apply preview mode filter
    if (previewMode === PreviewMode.REDACTED) {
      ctx.globalAlpha = 0.3;
    }

    // Helper function to draw a redaction
    const drawRedactionHelper = (
      redaction: Partial<InteractiveRedaction>,
      isPreview = false
    ) => {
      if (!redaction.x || !redaction.y || !redaction.width || !redaction.height)
        return;

      ctx.save();

      // Set style
      ctx.fillStyle = redaction.color || theme.palette.error.main;
      ctx.globalAlpha = isPreview ? 0.5 : redaction.opacity || 0.8;

      // Draw based on shape
      switch (redaction.shape) {
        case RedactionShape.RECTANGLE:
          ctx.fillRect(
            redaction.x,
            redaction.y,
            redaction.width,
            redaction.height
          );
          break;

        case RedactionShape.ELLIPSE:
          ctx.beginPath();
          ctx.ellipse(
            redaction.x + redaction.width / 2,
            redaction.y + redaction.height / 2,
            redaction.width / 2,
            redaction.height / 2,
            0,
            0,
            2 * Math.PI
          );
          ctx.fill();
          break;

        case RedactionShape.FREEFORM:
          // For now, draw as rectangle with rounded corners
          ctx.beginPath();
          ctx.roundRect(
            redaction.x,
            redaction.y,
            redaction.width,
            redaction.height,
            5
          );
          ctx.fill();
          break;
      }

      // Draw selection outline
      if (redaction.isSelected) {
        ctx.strokeStyle = theme.palette.primary.main;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          redaction.x - 2,
          redaction.y - 2,
          redaction.width + 4,
          redaction.height + 4
        );
        ctx.setLineDash([]);
      }

      // Draw confidence score for AI suggestions
      if (redaction.isAISuggested && redaction.confidenceScore) {
        ctx.fillStyle = theme.palette.background.paper;
        ctx.font = '12px Arial';
        ctx.fillText(
          `${Math.round(redaction.confidenceScore)}%`,
          redaction.x + 2,
          redaction.y - 5
        );
      }

      ctx.restore();
    };

    // Helper function to draw a suggestion
    const drawSuggestionHelper = (suggestion: RedactionSuggestion) => {
      if (!suggestion.targetCoordinates) return;

      const { x, y, width, height } = suggestion.targetCoordinates;
      ctx.save();

      // Different style for suggestions
      ctx.strokeStyle = theme.palette.warning.main;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(x, y, width, height);

      // Fill with transparent overlay
      ctx.fillStyle = theme.palette.warning.light;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(x, y, width, height);

      // Draw suggestion icon
      ctx.globalAlpha = 1;
      ctx.fillStyle = theme.palette.warning.main;
      ctx.font = 'bold 12px Arial';
      ctx.fillText('AI', x + 2, y + 14);

      ctx.restore();
    };

    // Draw existing redactions
    [...redactions]
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach(redaction => {
        drawRedactionHelper(redaction);
      });

    // Draw current drawing
    if (currentDraw && isDrawing) {
      drawRedactionHelper(currentDraw as InteractiveRedaction, true);
    }

    // Draw AI suggestions if enabled
    if (showSuggestions) {
      suggestions.forEach(suggestion => {
        drawSuggestionHelper(suggestion);
      });
    }

    ctx.globalAlpha = 1;
  }, [
    redactions,
    currentDraw,
    isDrawing,
    suggestions,
    showSuggestions,
    previewMode,
  ]);

  /**
   * Draw individual redaction on canvas
   */
  const drawRedaction = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      redaction: Partial<InteractiveRedaction>,
      isPreview = false
    ) => {
      if (!redaction.x || !redaction.y || !redaction.width || !redaction.height)
        return;

      ctx.save();

      // Set style
      ctx.fillStyle = redaction.color || theme.palette.error.main;
      ctx.globalAlpha = isPreview ? 0.5 : redaction.opacity || 0.8;

      // Draw based on shape
      switch (redaction.shape) {
        case RedactionShape.RECTANGLE:
          ctx.fillRect(
            redaction.x,
            redaction.y,
            redaction.width,
            redaction.height
          );
          break;

        case RedactionShape.ELLIPSE:
          ctx.beginPath();
          ctx.ellipse(
            redaction.x + redaction.width / 2,
            redaction.y + redaction.height / 2,
            redaction.width / 2,
            redaction.height / 2,
            0,
            0,
            2 * Math.PI
          );
          ctx.fill();
          break;

        case RedactionShape.FREEFORM:
          // For now, draw as rectangle with rounded corners
          ctx.beginPath();
          ctx.roundRect(
            redaction.x,
            redaction.y,
            redaction.width,
            redaction.height,
            5
          );
          ctx.fill();
          break;
      }

      // Draw selection outline
      if (redaction.isSelected) {
        ctx.strokeStyle = theme.palette.primary.main;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          redaction.x - 2,
          redaction.y - 2,
          redaction.width + 4,
          redaction.height + 4
        );
        ctx.setLineDash([]);
      }

      // Draw confidence score for AI suggestions
      if (redaction.isAISuggested && redaction.confidenceScore) {
        ctx.fillStyle = theme.palette.background.paper;
        ctx.font = '12px Arial';
        ctx.fillText(
          `${Math.round(redaction.confidenceScore)}%`,
          redaction.x + 2,
          redaction.y - 5
        );
      }

      ctx.restore();
    },
    []
  );

  /**
   * Draw AI suggestion indicator
   */
  const drawSuggestion = useCallback(
    (ctx: CanvasRenderingContext2D, suggestion: RedactionSuggestion) => {
      ctx.save();

      // Draw suggestion outline
      ctx.strokeStyle = theme.palette.warning.main;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(
        suggestion.targetCoordinates.x,
        suggestion.targetCoordinates.y,
        suggestion.targetCoordinates.width,
        suggestion.targetCoordinates.height
      );

      // Draw suggestion icon
      ctx.fillStyle = theme.palette.warning.main;
      ctx.font = '16px Material Icons';
      ctx.fillText(
        '💡',
        suggestion.targetCoordinates.x - 20,
        suggestion.targetCoordinates.y + 16
      );

      ctx.restore();
    },
    []
  );

  /**
   * Show notification to user
   */
  const showNotification = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error'
  ) => {
    setNotification({ open: true, message, severity });
  };

  // Update canvas when redactions change
  useEffect(() => {
    redrawCanvas();
  }, [
    redactions,
    currentDraw,
    isDrawing,
    suggestions,
    showSuggestions,
    previewMode,
  ]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      redrawCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (readOnly) return;

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedRedactionIds.size > 0) {
            deleteSelectedRedactions();
          }
          break;
        case 'z':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setSelectedRedactionIds(new Set(redactions.map(r => r.id)));
            updateRedactionSelection();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedRedactionIds,
    redactions,
    readOnly,
    deleteSelectedRedactions,
    redo,
    undo,
    updateRedactionSelection,
  ]);

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height={400}
      >
        <Typography>Loading interactive redaction editor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display='flex'
        flexDirection='column'
        justifyContent='center'
        alignItems='center'
        height={400}
        gap={2}
      >
        <Typography color='error'>{error}</Typography>
        <Button variant='outlined' onClick={loadCanvasData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box position='relative' width='100%' height='100%'>
      {/* Main toolbar */}
      <Paper
        elevation={1}
        sx={{
          p: 1,
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {/* Editing mode selection */}
        <ToggleButtonGroup
          value={editingMode}
          exclusive
          onChange={(_, mode) => mode && setEditingMode(mode)}
          size='small'
        >
          <ToggleButton value={EditingMode.SELECT} aria-label='Select Tool'>
            <Tooltip title='Select Tool'>
              <EditIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value={EditingMode.DRAW} aria-label='Draw Tool'>
            <Tooltip title='Draw Tool'>
              <BrushIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation='vertical' flexItem />

        {/* Shape selection */}
        <ToggleButtonGroup
          value={selectedShape}
          exclusive
          onChange={(_, shape) => shape && setSelectedShape(shape)}
          size='small'
          disabled={editingMode !== EditingMode.DRAW}
        >
          <ToggleButton value={RedactionShape.RECTANGLE} aria-label='Rectangle'>
            <Tooltip title='Rectangle'>
              <RectangleIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value={RedactionShape.ELLIPSE} aria-label='Ellipse'>
            <Tooltip title='Ellipse'>
              <CircleIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value={RedactionShape.FREEFORM} aria-label='Freeform'>
            <Tooltip title='Freeform'>
              <BlurOnIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation='vertical' flexItem />

        {/* History controls */}
        <ButtonGroup size='small'>
          <Button
            onClick={undo}
            disabled={historyIndex <= 0}
            startIcon={<UndoIcon />}
          >
            Undo
          </Button>
          <Button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            startIcon={<RedoIcon />}
          >
            Redo
          </Button>
        </ButtonGroup>

        <Divider orientation='vertical' flexItem />

        {/* Preview mode */}
        <ToggleButtonGroup
          value={previewMode}
          exclusive
          onChange={(_, mode) => mode && setPreviewMode(mode)}
          size='small'
        >
          <ToggleButton value={PreviewMode.NORMAL} aria-label='Normal View'>
            <Tooltip title='Normal View'>
              <PreviewIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value={PreviewMode.REDACTED} aria-label='Redacted View'>
            <Tooltip title='Redacted View'>
              <HidePreviewIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
          <ToggleButton
            value={PreviewMode.COMPARISON}
            aria-label='Before/After'
          >
            <Tooltip title='Before/After'>
              <CompareIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Spacer */}
        <Box flexGrow={1} />

        {/* Action buttons */}
        <Stack direction='row' spacing={1}>
          <Badge badgeContent={suggestions.length} color='warning'>
            <IconButton
              size='small'
              onClick={() => setShowSuggestions(!showSuggestions)}
              color={showSuggestions ? 'primary' : 'default'}
              aria-label='Toggle AI Suggestions'
            >
              <SuggestionIcon />
            </IconButton>
          </Badge>

          <IconButton
            size='small'
            onClick={() => setShowLayers(true)}
            aria-label='Show Layers'
          >
            <LayersIcon />
          </IconButton>

          <IconButton
            size='small'
            onClick={() => setShowSettings(true)}
            aria-label='Show Settings'
          >
            <SettingsIcon />
          </IconButton>
        </Stack>
      </Paper>

      {/* Main canvas area */}
      <Paper elevation={2} sx={{ position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={width * zoomLevel}
          height={height * zoomLevel}
          role='img'
          aria-label='Interactive redaction canvas'
          style={{
            width: width,
            height: height,
            cursor: editingMode === EditingMode.DRAW ? 'crosshair' : 'default',
            border: '1px solid #ddd',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        {/* Zoom controls */}
        <Box
          position='absolute'
          bottom={16}
          right={16}
          display='flex'
          flexDirection='column'
          gap={1}
        >
          <IconButton
            size='small'
            onClick={() => setZoomLevel(prev => Math.min(prev * 1.2, 3))}
            sx={{ bgcolor: 'background.paper' }}
            aria-label='Zoom In'
          >
            <ZoomInIcon />
          </IconButton>
          <Typography
            variant='caption'
            sx={{
              bgcolor: 'background.paper',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            {Math.round(zoomLevel * 100)}%
          </Typography>
          <IconButton
            size='small'
            onClick={() => setZoomLevel(prev => Math.max(prev / 1.2, 0.5))}
            sx={{ bgcolor: 'background.paper' }}
            aria-label='Zoom Out'
          >
            <ZoomOutIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* AI Suggestions Panel */}
      {showSuggestions && suggestions.length > 0 && (
        <Card sx={{ mt: 1 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              AI Suggestions ({suggestions.length})
            </Typography>
            <Stack spacing={1}>
              {suggestions.slice(0, 3).map(suggestion => (
                <Alert
                  key={suggestion.id}
                  severity='info'
                  action={
                    <Button
                      color='inherit'
                      size='small'
                      onClick={() => implementSuggestion(suggestion)}
                      disabled={readOnly}
                    >
                      Implement
                    </Button>
                  }
                >
                  <Typography variant='body2'>
                    <strong>{suggestion.type.replace('_', ' ')}</strong>
                    {suggestion.targetPIIType &&
                      ` for ${suggestion.targetPIIType}`}
                    <br />
                    Confidence: {suggestion.confidence}% | Priority:{' '}
                    {suggestion.priority}
                    <br />
                    {suggestion.reasoning}
                  </Typography>
                </Alert>
              ))}
              {suggestions.length > 3 && (
                <Typography variant='caption' color='text.secondary'>
                  {suggestions.length - 3} more suggestions available...
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Quality Score */}
      {qualityReport && (
        <Paper sx={{ mt: 1, p: 2 }}>
          <Typography variant='h6' gutterBottom>
            Quality Assessment
          </Typography>
          <Stack direction='row' spacing={2} alignItems='center'>
            <Chip
              label={`Overall: ${qualityReport.overallScore}%`}
              color={
                qualityReport.overallScore > 80
                  ? 'success'
                  : qualityReport.overallScore > 60
                    ? 'warning'
                    : 'error'
              }
            />
            <Chip
              label={`Completeness: ${Math.round(qualityReport.qualityMetrics.completeness)}%`}
              variant='outlined'
            />
            <Chip
              label={`Accuracy: ${Math.round(qualityReport.qualityMetrics.accuracy)}%`}
              variant='outlined'
            />
            <Chip
              label={`Risk: ${qualityReport.riskAssessment}`}
              color={
                qualityReport.riskAssessment === 'low'
                  ? 'success'
                  : qualityReport.riskAssessment === 'medium'
                    ? 'warning'
                    : 'error'
              }
              variant='outlined'
            />
          </Stack>
        </Paper>
      )}

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          variant='filled'
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
