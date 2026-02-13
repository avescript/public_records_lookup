/**
 * FileUpload Component - V2 Design System Migration
 *
 * Migrated from Material-UI to design system components.
 * Uses adapters for gradual transition while maintaining full functionality.
 *
 * Migration Status: Phase 2 - Gradual Migration
 * - ✅ Updated to use design system Button and Card components
 * - ✅ Implemented migration tracking and warnings
 * - ✅ Preserved all original functionality
 * - ⏳ Icons still from Material-UI (to be replaced in Phase 3)
 */

'use client';

import React, { useCallback, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  Alert,
  Box,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import { styled, Theme } from '@mui/material/styles';

// Import design system components through migration adapters
import { Button, Card } from '@/components/migration';
import { useMigrationTracking } from '@/components/migration';

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  isLoading?: boolean;
  error?: string;
}

const DropZone = styled(Box)(({ theme }: { theme: Theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
  },
  '&.drag-active': {
    backgroundColor: theme.palette.primary.main + '08',
    borderColor: theme.palette.primary.main,
  },
}));

const FileList = styled(Box)(({ theme }: { theme: Theme }) => ({
  marginTop: theme.spacing(2),
}));

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) {
    return <ImageIcon color='primary' />;
  } else if (file.type === 'application/pdf') {
    return <PictureAsPdfIcon color='error' />;
  } else {
    return <DescriptionIcon color='action' />;
  }
};

const getFilePreview = (file: File): string | null => {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return null;
};

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
  ],
  isLoading = false,
  error = '',
}) => {
  // Migration tracking
  const { logWarning } = useMigrationTracking('FileUpload', '2.0');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const newFiles = [...selectedFiles, ...acceptedFiles];

      // Log migration info about file handling improvements
      if (acceptedFiles.length > 0) {
        logWarning({
          deprecatedProp: 'file-handling',
          replacement: 'Enhanced validation and preview capabilities added',
          severity: 'low',
          message: `Successfully processed ${acceptedFiles.length} files with improved validation`,
        });
      }

      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [onFilesSelected, selectedFiles, logWarning]
  );

  const removeFile = useCallback(
    (indexToRemove: number) => {
      const newFiles = selectedFiles.filter(
        (_, index) => index !== indexToRemove
      );
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [selectedFiles, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles,
      maxSize,
      accept: acceptedFileTypes.reduce<Record<string, string[]>>(
        (acc, type) => ({ ...acc, [type]: [] }),
        {}
      ),
    });

  return (
    <Box>
      <DropZone
        {...getRootProps()}
        className={isDragActive ? 'drag-active' : ''}
        sx={{
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon
          sx={{
            fontSize: 48,
            color: 'primary.main',
            mb: 2,
            transition: 'transform 0.2s ease-in-out',
            transform: isDragActive ? 'scale(1.1)' : 'scale(1)',
          }}
        />
        <Typography variant='h6' gutterBottom>
          {isDragActive
            ? 'Drop the files here'
            : 'Drag and drop files here, or click to select files'}
        </Typography>
        <Typography variant='body2' color='textSecondary' sx={{ mb: 1 }}>
          Accepted files: PDF, Word documents, text files, images (JPG, PNG)
        </Typography>
        <Typography
          variant='caption'
          display='block'
          color='textSecondary'
          sx={{ mb: 2 }}
        >
          Maximum size: {formatFileSize(maxSize)} • Up to {maxFiles} files
        </Typography>

        {/* Using design system Button through migration adapter */}
        <Button
          variant='primary'
          disabled={isLoading}
          size='medium'
          sx={{
            minWidth: '120px',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          }}
        >
          {isLoading ? 'Processing...' : 'Select Files'}
        </Button>
      </DropZone>

      {isLoading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant='caption' color='textSecondary' sx={{ mt: 1 }}>
            Uploading files, please wait...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {fileRejections.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {fileRejections.map(({ file, errors }, index) => (
            <Alert
              key={`${file.name}-${index}`}
              severity='error'
              sx={{ mb: 1 }}
            >
              <Typography variant='body2'>
                <strong>{file.name}:</strong>{' '}
                {errors.map(e => e.message).join(', ')}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {selectedFiles.length > 0 && (
        <FileList>
          <Typography variant='subtitle1' gutterBottom>
            Selected Files ({selectedFiles.length}/{maxFiles}):
          </Typography>
          {selectedFiles.map((file: File, index: number) => {
            const previewUrl = getFilePreview(file);
            return (
              <Card
                key={`${file.name}-${index}`}
                variant='outlined'
                sx={{
                  mb: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: theme => theme.shadows[2],
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {previewUrl ? (
                    <Box
                      component='img'
                      src={previewUrl}
                      alt={file.name}
                      sx={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                      }}
                    >
                      {getFileIcon(file)}
                    </Box>
                  )}

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant='body1' noWrap title={file.name}>
                      {file.name}
                    </Typography>
                    <Typography variant='caption' color='textSecondary'>
                      {formatFileSize(file.size)} •{' '}
                      {file.type || 'Unknown type'}
                    </Typography>
                  </Box>

                  <IconButton
                    size='small'
                    onClick={() => removeFile(index)}
                    disabled={isLoading}
                    aria-label={`Remove ${file.name}`}
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'error.main',
                        color: 'error.contrastText',
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            );
          })}
        </FileList>
      )}
    </Box>
  );
};

export default FileUpload;
