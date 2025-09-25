/**
 * Package Builder Component
 * UI for building and managing document packages for delivery
 * Epic 6: Package & Delivery (Mock Sends)
 * US-060: Build combined package with cover sheet & index
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  Switch,
} from '@mui/material';
import {
  Build as BuildIcon,
  Close as CloseIcon,
  Description as DocumentIcon,
  Download as DownloadIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Email as EmailIcon,
  Folder as FolderIcon,
  Preview as PreviewIcon,
  Reorder as ReorderIcon,
} from '@mui/icons-material';
import { PackageManifest, PackageRecord, createPackageManifest, buildPackage, toggleRecordInclusion, updatePackageRecordOrder } from '../../../services/packageService';
import { AssociatedRecord } from '../../../services/requestService';

interface PackageBuilderProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  associatedRecords: AssociatedRecord[];
  requestInfo: {
    title: string;
    contactEmail: string;
    department: string;
    submittedAt: any;
  };
  onPackageBuilt?: (packageId: string) => void;
}

export const PackageBuilder: React.FC<PackageBuilderProps> = ({
  open,
  onClose,
  requestId,
  associatedRecords,
  requestInfo,
  onPackageBuilt,
}) => {
  const [packageTitle, setPackageTitle] = useState(requestInfo.title || 'Public Records Package');
  const [manifest, setManifest] = useState<PackageManifest | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<any>(null);
  const [step, setStep] = useState<'configure' | 'preview' | 'built'>('configure');

  // Initialize package manifest
  const initializeManifest = async () => {
    try {
      const newManifest = await createPackageManifest(
        requestId,
        associatedRecords,
        packageTitle,
        {
          name: requestInfo.contactEmail.split('@')[0], // Extract name from email
          department: requestInfo.department,
          requestDate: new Date(requestInfo.submittedAt.toDate()).toLocaleDateString(),
        }
      );
      setManifest(newManifest);
      setStep('preview');
    } catch (error) {
      console.error('Error initializing package manifest:', error);
    }
  };

  // Handle record reordering
  const handleMoveRecord = (recordIndex: number, direction: 'up' | 'down') => {
    if (!manifest) return;

    const newIndex = direction === 'up' ? recordIndex - 1 : recordIndex + 1;
    if (newIndex < 0 || newIndex >= manifest.records.length) return;

    const reorderedRecords = [...manifest.records];
    const [moved] = reorderedRecords.splice(recordIndex, 1);
    reorderedRecords.splice(newIndex, 0, moved);

    // Update order numbers
    const updatedRecords = reorderedRecords.map((record, index) => ({
      ...record,
      order: index + 1,
    }));

    setManifest({
      ...manifest,
      records: updatedRecords,
    });
  };

  // Toggle record inclusion
  const handleToggleRecord = (recordId: string) => {
    if (!manifest) return;
    setManifest(toggleRecordInclusion(manifest, recordId));
  };

  // Build the package
  const handleBuildPackage = async () => {
    if (!manifest) return;

    setIsBuilding(true);
    try {
      const result = await buildPackage(manifest);
      setBuildResult(result);
      setStep('built');
      onPackageBuilt?.(manifest.id);
    } catch (error) {
      console.error('Error building package:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  // Reset dialog state when closed
  const handleClose = () => {
    setStep('configure');
    setManifest(null);
    setBuildResult(null);
    setPackageTitle(requestInfo.title || 'Public Records Package');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon color="primary" />
            <Typography variant="h6">
              {step === 'configure' && 'Configure Package'}
              {step === 'preview' && 'Package Preview'}
              {step === 'built' && 'Package Ready'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Step 1: Configure Package */}
        {step === 'configure' && (
          <Stack spacing={3}>
            <TextField
              label="Package Title"
              value={packageTitle}
              onChange={(e) => setPackageTitle(e.target.value)}
              fullWidth
              variant="outlined"
            />

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Records to Include ({associatedRecords.length})
                </Typography>
                <List>
                  {associatedRecords.map((record, index) => (
                    <ListItem key={record.candidateId} divider>
                      <ListItemIcon>
                        <DocumentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={record.title}
                        secondary={`${record.source} • ${record.metadata?.pageCount || 1} pages`}
                      />
                      <Chip
                        label={record.confidence.toUpperCase()}
                        size="small"
                        color={record.confidence === 'high' ? 'success' : record.confidence === 'medium' ? 'warning' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Package will include:</strong><br />
                • Cover sheet with request details<br />
                • {associatedRecords.length} selected records<br />
                • Table of contents with page numbers<br />
                • Estimated total: {associatedRecords.reduce((sum, r) => sum + (r.metadata?.pageCount || 1), 0) + 1} pages
              </Typography>
            </Paper>
          </Stack>
        )}

        {/* Step 2: Package Preview with Reordering */}
        {step === 'preview' && manifest && (
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Cover Sheet Preview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Package Title</Typography>
                    <Typography variant="body1">{manifest.title}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Requestor</Typography>
                    <Typography variant="body1">{manifest.coverSheet.requestorName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Department</Typography>
                    <Typography variant="body1">{manifest.coverSheet.department}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Request Date</Typography>
                    <Typography variant="body1">{manifest.coverSheet.requestDate}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Total Records</Typography>
                    <Typography variant="body1">{manifest.coverSheet.totalRecords}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Total Pages</Typography>
                    <Typography variant="body1">{manifest.coverSheet.totalPages}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Record Order</Typography>
                  <Chip 
                    icon={<ReorderIcon />} 
                    label="Use arrow buttons to reorder" 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>

                <List>
                  {manifest.records.map((record, index) => (
                    <ListItem
                      key={record.recordId}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <ListItemIcon>
                        <Stack direction="column" spacing={0}>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveRecord(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUpIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveRecord(index, 'down')}
                            disabled={index === manifest.records.length - 1}
                          >
                            <ArrowDownIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {record.order}.
                            </Typography>
                            <Typography variant="body1">{record.title}</Typography>
                          </Box>
                        }
                        secondary={`${record.source} • ${record.pageCount} pages`}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={record.includeInPackage}
                            onChange={() => handleToggleRecord(record.recordId)}
                            size="small"
                          />
                        }
                        label="Include"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
              <Typography variant="body2">
                <strong>Final Package Summary:</strong><br />
                • {manifest.records.filter(r => r.includeInPackage).length} records included<br />
                • {manifest.metadata.totalPages} total pages<br />
                • Estimated size: {manifest.metadata.estimatedDeliverySize}
              </Typography>
            </Paper>
          </Stack>
        )}

        {/* Step 3: Package Built */}
        {step === 'built' && buildResult && (
          <Stack spacing={3} alignItems="center">
            <Box sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Package Built Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Package ID: {buildResult.manifest.id}
              </Typography>
            </Box>

            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Package Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label={buildResult.manifest.metadata.status.toUpperCase()} color="success" size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Created By</Typography>
                    <Typography variant="body1">{buildResult.manifest.metadata.createdBy}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Records Included</Typography>
                    <Typography variant="body1">{buildResult.manifest.records.filter((r: any) => r.includeInPackage).length}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">File Size</Typography>
                    <Typography variant="body1">{buildResult.manifest.metadata.estimatedDeliverySize}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => window.open(buildResult.previewUrl, '_blank')}
              >
                Preview Package
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => window.open(buildResult.downloadUrl, '_blank')}
              >
                Download PDF
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'configure' && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={initializeManifest}
              disabled={!packageTitle.trim()}
            >
              Next: Preview Package
            </Button>
          </>
        )}

        {step === 'preview' && (
          <>
            <Button onClick={() => setStep('configure')}>Back</Button>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<BuildIcon />}
              onClick={handleBuildPackage}
              disabled={isBuilding || !manifest?.records.some(r => r.includeInPackage)}
              color="success"
            >
              {isBuilding ? 'Building...' : 'Build Package'}
            </Button>
          </>
        )}

        {step === 'built' && (
          <>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() => {
                console.log('TODO: Open delivery scheduler');
                // This will be implemented in US-061
              }}
            >
              Schedule Delivery
            </Button>
            <Button variant="contained" onClick={handleClose}>
              Done
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};