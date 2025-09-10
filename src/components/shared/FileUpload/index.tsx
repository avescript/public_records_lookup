'use client';

'use client';

import React, { useCallback } from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
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

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
  isLoading = false,
  error = '',
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
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
          Maximum size: {maxSize / (1024 * 1024)}MB
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

      {acceptedFiles.length > 0 && (
        <FileList>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files:
          </Typography>
          {acceptedFiles.map((file: File, index: number) => (
            <Typography
              key={index}
              variant="body2"
              color="textSecondary"
              sx={{ mt: 0.5 }}
            >
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </Typography>
          ))}
        </FileList>
      )}

      {fileRejections.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="error" gutterBottom>
            Rejected Files:
          </Typography>
          {fileRejections.map(({ file, errors }: FileRejection, index: number) => (
            <Typography key={index} variant="body2" color="error">
              {file.name}: {errors.map((e: { message: string }) => e.message).join(', ')}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
