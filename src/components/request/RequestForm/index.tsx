'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { RequestFormData, requestSchema } from './types';
import { zodResolver } from '@hookform/resolvers/zod';

const departments = [
  { id: 'police', name: 'Police Department' },
  { id: 'fire', name: 'Fire Department' },
  { id: 'clerk', name: 'City Clerk' },
  { id: 'finance', name: 'Finance Department' },
  { id: 'other', name: 'Other' },
];

export const RequestForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      department: '',
      description: '',
      timeframe: '',
      contactEmail: '',
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      console.log('Form data:', data);
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while submitting your request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Request Title"
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.department}>
                  <InputLabel>Department</InputLabel>
                  <Select {...field} label="Department" disabled={isSubmitting} data-testid="department-select">
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.department?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Controller
              name="timeframe"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.timeframe}>
                  <InputLabel>Timeframe</InputLabel>
                  <Select {...field} label="Timeframe" disabled={isSubmitting} data-testid="timeframe-select">
                    <MenuItem value="last-month">Last Month</MenuItem>
                    <MenuItem value="last-quarter">Last Quarter</MenuItem>
                    <MenuItem value="last-year">Last Year</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                  <FormHelperText>{errors.timeframe?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Box>
        </Box>

        <Box>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Request Description"
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
            name="contactEmail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contact Email"
                type="email"
                fullWidth
                error={!!errors.contactEmail}
                helperText={errors.contactEmail?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Box>

        <Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
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
        autoHideDuration={6000}
        onClose={() => {
          setSubmitError(null);
          setSubmitSuccess(false);
        }}
      >
        <Alert
          severity={submitError ? 'error' : 'success'}
          variant="filled"
          onClose={() => {
            setSubmitError(null);
            setSubmitSuccess(false);
          }}
        >
          {submitError || 'Request submitted successfully!'}
        </Alert>
      </Snackbar>
    </Box>
  );
};
