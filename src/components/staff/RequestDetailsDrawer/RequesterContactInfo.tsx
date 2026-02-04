'use client';

import React from 'react';
import {
  AccountCircle as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  History as HistoryIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';

import { StoredRequest } from '@/services/requestService';

export interface RequesterInfo {
  contactEmail: string;
  name?: string;
  organization?: string;
  phone?: string;
  previousRequests?: number;
  lastRequestDate?: Date;
  totalRequestsThisYear?: number;
  requestHistory?: Array<{
    id: string;
    trackingId: string;
    title: string;
    status: string;
    submittedAt: Date;
    department: string;
  }>;
}

export interface RequesterContactInfoProps {
  request: StoredRequest;
  requesterInfo?: RequesterInfo;
}

// Mock requester data for demonstration
const getMockRequesterInfo = (request: StoredRequest): RequesterInfo => {
  // Extract potential name from email
  const emailLocalPart = request.contactEmail.split('@')[0];
  const mockName = emailLocalPart.includes('.')
    ? emailLocalPart
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : emailLocalPart.charAt(0).toUpperCase() + emailLocalPart.slice(1);

  // Generate mock data based on request
  const isFrequentRequester = Math.random() > 0.7;
  const isBusinessRequester =
    request.contactEmail.includes('company') ||
    request.contactEmail.includes('corp') ||
    request.contactEmail.includes('news') ||
    request.contactEmail.includes('media');

  return {
    contactEmail: request.contactEmail,
    name: mockName,
    organization: isBusinessRequester
      ? `${mockName.split(' ')[0]} Organization`
      : undefined,
    phone: isFrequentRequester ? '+1 (555) 123-4567' : undefined,
    previousRequests: isFrequentRequester
      ? Math.floor(Math.random() * 10) + 1
      : 0,
    lastRequestDate: isFrequentRequester
      ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      : undefined,
    totalRequestsThisYear: isFrequentRequester
      ? Math.floor(Math.random() * 5) + 1
      : 1,
    requestHistory: isFrequentRequester
      ? [
          {
            id: 'prev-001',
            trackingId: 'REQ-2025-098',
            title: 'Previous police reports request',
            status: 'completed',
            submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            department: 'Police',
          },
          {
            id: 'prev-002',
            trackingId: 'REQ-2025-045',
            title: 'Budget information request',
            status: 'completed',
            submittedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            department: 'Finance',
          },
        ]
      : [],
  };
};

export function RequesterContactInfo({
  request,
  requesterInfo,
}: RequesterContactInfoProps) {
  const info = requesterInfo || getMockRequesterInfo(request);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography
          variant='h6'
          sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
        >
          <PersonIcon sx={{ mr: 1 }} />
          Requester Information
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              {info.name
                ? info.name.charAt(0)
                : info.contactEmail.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant='body1' sx={{ fontWeight: 'medium' }}>
                {info.name || 'Anonymous Requester'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {info.organization && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <BusinessIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    {info.organization}
                  </Box>
                )}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmailIcon
                sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
              />
              <Typography variant='body2'>{info.contactEmail}</Typography>
            </Box>

            {info.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon
                  sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
                />
                <Typography variant='body2'>{info.phone}</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Request Statistics */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={`${info.totalRequestsThisYear} request${info.totalRequestsThisYear !== 1 ? 's' : ''} this year`}
            size='small'
            color='info'
            variant='outlined'
          />
          {(info.previousRequests ?? 0) > 0 && (
            <Chip
              label={`${info.previousRequests} previous request${info.previousRequests !== 1 ? 's' : ''}`}
              size='small'
              color='secondary'
              variant='outlined'
            />
          )}
          {info.lastRequestDate && (
            <Chip
              label={`Last: ${info.lastRequestDate.toLocaleDateString()}`}
              size='small'
              variant='outlined'
            />
          )}
        </Box>

        {/* Request History */}
        {info.requestHistory && info.requestHistory.length > 0 && (
          <Box>
            <Typography
              variant='subtitle2'
              sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
            >
              <HistoryIcon sx={{ fontSize: 18, mr: 0.5 }} />
              Recent Request History
            </Typography>
            <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
              {info.requestHistory.slice(0, 3).map(historyItem => (
                <ListItem key={historyItem.id} divider>
                  <ListItemText
                    primary={historyItem.trackingId}
                    secondary={
                      <Box>
                        <Typography variant='caption' component='div'>
                          {historyItem.title}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {historyItem.department} •{' '}
                          {historyItem.submittedAt.toLocaleDateString()} •
                          <Chip
                            label={historyItem.status}
                            size='small'
                            sx={{ ml: 0.5, height: 16, fontSize: '0.65rem' }}
                          />
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
