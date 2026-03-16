/**
 * Migration Demo Component
 *
 * Demonstrates the migration infrastructure in action with real examples
 * of legacy Material-UI components being migrated to design system patterns.
 *
 * This component serves as both a testing ground and documentation for
 * developers working on component migrations.
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';

import {
  Button as DesignButton,
  Card as DesignCard,
  Input as DesignInput,
} from '@/components/design-system';
// Import both legacy adapters and design system components
import {
  Button as MigrationButton,
  Card as MigrationCard,
  migrationConfig,
  MigrationDashboard,
  TextField as MigrationTextField,
} from '@/components/migration';

const MigrationDemo: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: event.target.value });
    };

  const handleDashboardToggle = () => {
    const newState = !showDashboard;
    setShowDashboard(newState);
    migrationConfig.enableLogging(newState);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant='h4' gutterBottom>
        Migration Infrastructure Demo
      </Typography>

      <Typography variant='body1' sx={{ mb: 4, color: 'text.secondary' }}>
        This demo shows the migration infrastructure in action. Toggle the
        migration dashboard to see warnings and tracking information for
        component usage.
      </Typography>

      <FormControlLabel
        control={
          <Switch checked={showDashboard} onChange={handleDashboardToggle} />
        }
        label='Show Migration Dashboard'
        sx={{ mb: 4 }}
      />

      <Divider sx={{ mb: 4 }} />

      <Box
        sx={{
          display: 'grid',
          gap: 4,
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        }}
      >
        {/* Legacy Components with Adapters */}
        <MigrationCard variant='outlined' sx={{ p: 3 }}>
          <Typography variant='h5' gutterBottom>
            Legacy Components (Migration Adapters)
          </Typography>

          <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
            These components use legacy Material-UI props but are automatically
            mapped to design system patterns through migration adapters.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Legacy Button Props */}
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                Buttons:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <MigrationButton color='primary' variant='contained'>
                  Primary Contained
                </MigrationButton>
                <MigrationButton color='secondary' variant='outlined'>
                  Secondary Outlined
                </MigrationButton>
                <MigrationButton color='error' variant='text'>
                  Error Text
                </MigrationButton>
                <MigrationButton color='success' variant='contained'>
                  Success Contained
                </MigrationButton>
              </Box>
            </Box>

            {/* Legacy TextField Props */}
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                Text Fields:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <MigrationTextField
                  variant='outlined'
                  label='Name'
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  fullWidth
                />
                <MigrationTextField
                  variant='filled'
                  label='Email'
                  type='email'
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={
                    !formData.email.includes('@') && formData.email.length > 0
                  }
                  helperText={
                    !formData.email.includes('@') && formData.email.length > 0
                      ? 'Please enter a valid email'
                      : ''
                  }
                  fullWidth
                />
                <MigrationTextField
                  variant='standard'
                  label='Message'
                  multiline
                  rows={3}
                  value={formData.message}
                  onChange={handleInputChange('message')}
                  fullWidth
                />
              </Box>
            </Box>
          </Box>
        </MigrationCard>

        {/* Design System Components */}
        <DesignCard variant='elevated' sx={{ p: 3 }}>
          <Typography variant='h5' gutterBottom>
            Design System Components
          </Typography>

          <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
            These components use the new design system directly with updated
            prop patterns and improved consistency.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Design System Buttons */}
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                Buttons:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <DesignButton variant='primary' size='medium'>
                  Primary
                </DesignButton>
                <DesignButton variant='secondary' size='medium'>
                  Secondary
                </DesignButton>
                <DesignButton variant='danger' size='medium'>
                  Danger
                </DesignButton>
                <DesignButton variant='success' size='medium'>
                  Success
                </DesignButton>
                <DesignButton variant='outline' size='medium'>
                  Outline
                </DesignButton>
                <DesignButton variant='ghost' size='medium'>
                  Ghost
                </DesignButton>
              </Box>
            </Box>

            {/* Design System Inputs */}
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                Inputs:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DesignInput
                  variant='outlined'
                  label='Name (Design System)'
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder='Enter your name'
                />
                <DesignInput
                  variant='filled'
                  label='Email (Design System)'
                  type='email'
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  state={
                    !formData.email.includes('@') && formData.email.length > 0
                      ? 'error'
                      : 'default'
                  }
                  helperText={
                    !formData.email.includes('@') && formData.email.length > 0
                      ? 'Please enter a valid email'
                      : ''
                  }
                  placeholder='Enter your email'
                />
                <DesignInput
                  variant='outlined'
                  label='Message (Design System)'
                  value={formData.message}
                  onChange={handleInputChange('message')}
                  placeholder='Enter your message'
                  multiline
                  rows={3}
                />
              </Box>
            </Box>
          </Box>
        </DesignCard>

        {/* Migration Examples */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <DesignCard variant='outlined' sx={{ p: 3 }}>
            <Typography variant='h5' gutterBottom>
              Migration Code Examples
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              }}
            >
              <Box>
                <Typography variant='subtitle2' gutterBottom>
                  Before (Material-UI):
                </Typography>
                <Box
                  sx={{
                    backgroundColor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <pre>{`import { Button, TextField } from '@mui/material';

<Button color="primary" variant="contained">
  Save Changes
</Button>

<TextField
  variant="outlined"
  error={hasError}
  helperText="Error message"
/>`}</pre>
                </Box>
              </Box>

              <Box>
                <Typography variant='subtitle2' gutterBottom>
                  After (Design System):
                </Typography>
                <Box
                  sx={{
                    backgroundColor: 'primary.50',
                    p: 2,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    border: '1px solid',
                    borderColor: 'primary.200',
                  }}
                >
                  <pre>{`import { Button, Input } from '@/components/design-system';

<Button variant="primary" size="medium">
  Save Changes
</Button>

<Input
  variant="outlined"
  state={hasError ? 'error' : 'default'}
  helperText="Error message"
/>`}</pre>
                </Box>
              </Box>
            </Box>
          </DesignCard>
        </Box>
      </Box>

      {/* Migration Dashboard - only show in development */}
      {showDashboard && <MigrationDashboard />}
    </Box>
  );
};

export default MigrationDemo;
