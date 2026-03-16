'use client';

import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Grid,
  Snackbar,
  Typography,
} from '@/components/migration';
import { Button, Select, TextField } from '@/components/migration';

import { saveRequest } from '../../../services/requestService';
import DateRangePicker, { DateRange } from '../../shared/DateRangePicker';
import FileUpload from '../../shared/FileUpload';

import {
  RequestFormData,
  RequestFormDataWithFiles,
  requestSchema,
} from './types';

const departments = [
  { value: 'police', label: 'Police Department' },
  { value: 'fire', label: 'Fire Department' },
  { value: 'clerk', label: 'City Clerk' },
  { value: 'finance', label: 'Finance Department' },
  { value: 'other', label: 'Other' },
];

export const RequestForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileUploadError, setFileUploadError] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      department: '',
      description: '',
      dateRange: {
        startDate: '',
        endDate: '',
        preset: '',
      },
      contactEmail: '',
    },
  });

  const handleDateRangeChange = (dateRange: DateRange) => {
    setValue('dateRange', dateRange, { shouldValidate: true });
  };

  const currentDateRange = watch('dateRange');

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setFileUploadError('');
  };

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const formDataWithFiles: RequestFormDataWithFiles = {
        ...data,
        files: selectedFiles,
      };

      // Save to Firebase
      const result = await saveRequest(formDataWithFiles);

      console.log('✅ Request saved successfully:', result);
      setTrackingId(result.trackingId);
      setSubmitSuccess(true);

      // Wait a moment to let the user see the success message, then redirect
      setTimeout(() => {
        const confirmationUrl = `/confirmation?trackingId=${encodeURIComponent(result.trackingId)}`;
        window.location.href = confirmationUrl;
      }, 2000);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'An error occurred while submitting your request'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Controller
            name='title'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='Request Title'
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 3,
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Controller
              name='department'
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label='Department *'
                  options={departments}
                  fullWidth
                  required
                  disabled={isSubmitting}
                  error={errors.department?.message}
                  helperText={
                    errors.department?.message ||
                    'Select the department for your request'
                  }
                  placeholder='Choose a department...'
                  data-testid='department-select'
                />
              )}
            />
          </Box>
        </Box>

        <Box>
          <DateRangePicker
            value={currentDateRange}
            onChange={handleDateRangeChange}
            error={
              errors.dateRange?.message || errors.dateRange?.startDate?.message
            }
            disabled={isSubmitting}
            label='Records Date Range'
          />
        </Box>

        <Box>
          <Controller
            name='description'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='Request Description'
                multiline
                rows={4}
                fullWidth
                error={!!errors.description}
                helperText={errors.description?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Box>

        <Box>
          <Controller
            name='contactEmail'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='Contact Email'
                type='email'
                fullWidth
                error={!!errors.contactEmail}
                helperText={errors.contactEmail?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Box>

        <Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant='h6' gutterBottom>
            Supporting Documents (Optional)
          </Typography>
          <Typography variant='body2' color='textSecondary' sx={{ mb: 2 }}>
            Upload any documents that help clarify or support your records
            request.
          </Typography>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            maxFiles={5}
            maxSize={10 * 1024 * 1024} // 10MB
            acceptedFileTypes={[
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain',
              'image/jpeg',
              'image/png',
            ]}
            isLoading={isSubmitting}
            error={fileUploadError}
          />
        </Box>

        <Box>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            size='large'
            fullWidth
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={!!submitError || submitSuccess}
        autoHideDuration={submitSuccess ? null : 6000} // Keep success message open until manually closed
        onClose={() => {
          setSubmitError(null);
          setSubmitSuccess(false);
          setTrackingId(null);
        }}
      >
        <Alert
          severity={submitError ? 'error' : 'success'}
          variant='filled'
          onClose={() => {
            setSubmitError(null);
            setSubmitSuccess(false);
            setTrackingId(null);
          }}
        >
          {submitError ||
            (trackingId
              ? `Request submitted successfully! Your tracking ID is: ${trackingId}. Please save this ID to track your request status.`
              : 'Request submitted successfully!')}
        </Alert>
      </Snackbar>
    </form>
  );
};
