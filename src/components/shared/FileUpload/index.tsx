'use client';

import React, { useCallback } from 'react';
import { Box, Typography, Button, LinearProgress, Alert } from '@mui/material';
import { useDropzone, FileRejection } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled, Theme } from '@mui/material/styles';

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
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
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

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
  isLoading = false,
  error = '',
}) => {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles, fileRejections } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedFileTypes.reduce<Record<string, string[]>>((acc, type) => ({ ...acc, [type]: [] }), {}),
  });

  return (
    <Box>
      <DropZone
        {...getRootProps()}
        sx={{
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
        <Typography variant="body1" gutterBottom>
          {isDragActive
            ? 'Drop the files here'
            : 'Drag and drop files here, or click to select files'}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Accepted files: {acceptedFileTypes.join(', ')}
        </Typography>
        <Typography variant="caption" display="block" color="textSecondary">
          Maximum size: {formatFileSize(maxSize)}
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          disabled={isLoading}
        >
          Select Files
        </Button>
      </DropZone>

      {isLoading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      {fileRejections.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {fileRejections.map(({ file, errors }, index) => (
            <Alert 
              key={`${file.name}-${index}`}
              severity="error" 
              sx={{ mb: 1 }}
            >
              {file.name}: {errors.map(e => e.message).join(', ')}
            </Alert>
          ))}
        </Box>
      )}

      {acceptedFiles.length > 0 && (
        <FileList>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files:
          </Typography>
          {acceptedFiles.map((file: File, index: number) => (
            <Box key={`${file.name}-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {file.name} ({formatFileSize(file.size)})
              </Typography>
            </Box>
          ))}
        </FileList>
      )}
    </Box>
  );
};

export default FileUpload;
