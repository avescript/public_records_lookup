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
  Button,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
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

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) {
    return <ImageIcon color="primary" />;
  } else if (file.type === 'application/pdf') {
    return <PictureAsPdfIcon color="error" />;
  } else {
    return <DescriptionIcon color="action" />;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const newFiles = [...selectedFiles, ...acceptedFiles];
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [onFilesSelected, selectedFiles]
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
          Accepted files: PDF, Word documents, text files, images (JPG, PNG)
        </Typography>
        <Typography variant="caption" display="block" color="textSecondary">
          Maximum size: {formatFileSize(maxSize)}
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} disabled={isLoading}>
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

      {selectedFiles.length > 0 && (
        <FileList>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files ({selectedFiles.length}/{maxFiles}):
          </Typography>
          {selectedFiles.map((file: File, index: number) => {
            const previewUrl = getFilePreview(file);
            return (
              <Card key={`${file.name}-${index}`} sx={{ mb: 1 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {previewUrl ? (
                      <Box
                        component="img"
                        src={previewUrl}
                        alt={file.name}
                        sx={{
                          width: 40,
                          height: 40,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {getFileIcon(file)}
                      </Box>
                    )}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap title={file.name}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => removeFile(index)}
                      disabled={isLoading}
                      aria-label={`Remove ${file.name}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </FileList>
      )}
    </Box>
  );
};

export default FileUpload;
