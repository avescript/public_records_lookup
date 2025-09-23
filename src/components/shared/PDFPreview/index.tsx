'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FullscreenExit as FitToWidthIcon,
  NavigateNext as NextPageIcon,
  NavigateBefore as PrevPageIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

import { PIIFinding, PIIType, piiDetectionService } from '../../../services/piiDetectionService';

// Configure PDF.js worker
import '../../../lib/pdf-worker';

interface PDFPreviewProps {
  recordId: string;
  fileName: string;
  filePath?: string; // Phase 0: optional, falls back to placeholder
  onPIIFindingsLoad?: (findings: PIIFinding[]) => void;
}

interface PIIOverlayProps {
  findings: PIIFinding[];
  pageNumber: number;
  scale: number;
  showOverlays: boolean;
  piiTypeFilters: Set<PIIType>;
}

const PIITypeColors: Record<PIIType, string> = {
  [PIIType.SSN]: '#f44336', // Red
  [PIIType.PHONE]: '#ff9800', // Orange  
  [PIIType.ADDRESS]: '#2196f3', // Blue
  [PIIType.PERSON_NAME]: '#4caf50', // Green
  [PIIType.EMAIL]: '#9c27b0', // Purple
  [PIIType.DOB]: '#ff5722', // Deep Orange
  [PIIType.DRIVERS_LICENSE]: '#795548', // Brown
  [PIIType.ACCOUNT_NUMBER]: '#607d8b', // Blue Grey
  [PIIType.ROUTING_NUMBER]: '#3f51b5', // Indigo
  [PIIType.MEDICAL_ID]: '#e91e63', // Pink
};

const PIIOverlay: React.FC<PIIOverlayProps> = ({
  findings,
  pageNumber,
  scale,
  showOverlays,
  piiTypeFilters,
}) => {
  if (!showOverlays) return null;

  const pageFindings = findings.filter(
    (finding) => finding.pageNumber === pageNumber && piiTypeFilters.has(finding.piiType)
  );

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {pageFindings.map((finding, index) => (
        <Box
          key={`${finding.recordId}-${finding.pageNumber}-${index}`}
          sx={{
            position: 'absolute',
            left: finding.x * scale,
            top: finding.y * scale,
            width: finding.width * scale,
            height: finding.height * scale,
            border: `2px solid ${PIITypeColors[finding.piiType]}`,
            backgroundColor: `${PIITypeColors[finding.piiType]}20`, // 20% opacity
            borderRadius: '2px',
            pointerEvents: 'auto',
            cursor: 'help',
          }}
          title={`${finding.piiType}: ${finding.text} (Confidence: ${(finding.confidence * 100).toFixed(0)}%)`}
        >
          <Chip
            label={finding.piiType}
            size="small"
            sx={{
              position: 'absolute',
              top: -20,
              left: 0,
              fontSize: '10px',
              height: '16px',
              backgroundColor: PIITypeColors[finding.piiType],
              color: 'white',
              '& .MuiChip-label': {
                px: 0.5,
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

const PDFPreview: React.FC<PDFPreviewProps> = ({
  recordId,
  fileName,
  filePath,
  onPIIFindingsLoad,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<PIIFinding[]>([]);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [piiTypeFilters, setPIITypeFilters] = useState<Set<PIIType>>(new Set(Object.values(PIIType)));

  // Phase 0: Use placeholder file path
  const effectiveFilePath = filePath || `/mock-data/${fileName.replace('.pdf', '.txt')}`;

  useEffect(() => {
    const loadFindings = async () => {
      try {
        const findingsResult = await piiDetectionService.getFindingsForRecord(recordId);
        setFindings(findingsResult.findings);
        onPIIFindingsLoad?.(findingsResult.findings);
      } catch (error) {
        console.error('Error loading PII findings:', error);
      }
    };

    loadFindings();
  }, [recordId, onPIIFindingsLoad]);

  const currentPageFindings = useMemo(() => {
    return findings.filter(
      (finding) => finding.fileName === fileName && finding.pageNumber === currentPage
    );
  }, [findings, fileName, currentPage]);

  const uniquePIITypes = useMemo(() => {
    return Array.from(new Set(findings.map((finding) => finding.piiType)));
  }, [findings]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const handleDocumentLoadError = (error: Error) => {
    setLoading(false);
    setError(`Failed to load PDF: ${error.message}`);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleFitToWidth = () => {
    setScale(1.0);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  const handleTogglePIIType = (piiType: PIIType) => {
    setPIITypeFilters((prev) => {
      const newFilters = new Set(prev);
      if (newFilters.has(piiType)) {
        newFilters.delete(piiType);
      } else {
        newFilters.add(piiType);
      }
      return newFilters;
    });
  };

  const handleToggleAllOverlays = () => {
    setShowOverlays(!showOverlays);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Loading PDF preview...
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              PDF Preview Not Available (Phase 0)
            </Typography>
            <Typography variant="body2">
              This is a Phase 0 implementation. In production, this would show a full PDF preview with PII overlays.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>File:</strong> {fileName}
            </Typography>
            <Typography variant="body2">
              <strong>PII Findings:</strong> {findings.length} items detected
            </Typography>
          </Alert>

          {findings.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Detected PII Types:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {uniquePIITypes.map((piiType) => (
                  <Chip
                    key={piiType}
                    label={piiType}
                    size="small"
                    sx={{
                      backgroundColor: PIITypeColors[piiType],
                      color: 'white',
                    }}
                  />
                ))}
              </Stack>

              <Typography variant="body2" color="text.secondary">
                In the production version, these would appear as colored overlays on the PDF pages.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          PDF Preview: {fileName}
        </Typography>

        {/* Controls */}
        <Stack spacing={2} sx={{ mb: 2 }}>
          {/* Zoom and Navigation Controls */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Button
              size="small"
              startIcon={<ZoomOutIcon />}
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              Zoom Out
            </Button>
            <Button
              size="small"
              startIcon={<FitToWidthIcon />}
              onClick={handleFitToWidth}
            >
              Fit ({Math.round(scale * 100)}%)
            </Button>
            <Button
              size="small"
              startIcon={<ZoomInIcon />}
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
            >
              Zoom In
            </Button>

            <Divider orientation="vertical" flexItem />

            <Button
              size="small"
              startIcon={<PrevPageIcon />}
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Typography variant="body2">
              Page {currentPage} of {numPages}
            </Typography>
            <Button
              size="small"
              startIcon={<NextPageIcon />}
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
            >
              Next
            </Button>
          </Stack>

          {/* PII Overlay Controls */}
          {findings.length > 0 && (
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOverlays}
                    onChange={handleToggleAllOverlays}
                    icon={<VisibilityOffIcon />}
                    checkedIcon={<VisibilityIcon />}
                  />
                }
                label={`Show PII Overlays (${currentPageFindings.length} on this page)`}
              />

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {uniquePIITypes.map((piiType) => (
                  <Chip
                    key={piiType}
                    label={piiType}
                    size="small"
                    clickable
                    onClick={() => handleTogglePIIType(piiType)}
                    sx={{
                      backgroundColor: piiTypeFilters.has(piiType)
                        ? PIITypeColors[piiType]
                        : 'transparent',
                      color: piiTypeFilters.has(piiType) ? 'white' : 'text.primary',
                      border: `1px solid ${PIITypeColors[piiType]}`,
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>

        {/* PDF Viewer */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: '600px',
          }}
        >
          <Document
            file={effectiveFilePath}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
          >
            <Box sx={{ position: 'relative' }}>
              <Page pageNumber={currentPage} scale={scale} />
              <PIIOverlay
                findings={findings}
                pageNumber={currentPage}
                scale={scale}
                showOverlays={showOverlays}
                piiTypeFilters={piiTypeFilters}
              />
            </Box>
          </Document>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PDFPreview;