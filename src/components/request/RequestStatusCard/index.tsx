import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { type Theme } from '@mui/material/styles';

interface RequestStatus {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  requestDate: string;
  lastUpdated: string;
}

const mockStatus: RequestStatus[] = [
  {
    id: 'REQ-2023-001',
    status: 'in-progress',
    requestDate: '2023-09-01',
    lastUpdated: '2023-09-07',
  },
];

const getStatusColor = (
  status: RequestStatus['status']
): 'warning' | 'info' | 'success' | 'error' => {
  const colors = {
    pending: 'warning',
    'in-progress': 'info',
    completed: 'success',
    rejected: 'error',
  } as const;
  return colors[status];
};

export const RequestStatusCard = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Current Request Status
      </Typography>
      <List>
        {mockStatus.map(request => (
          <ListItem key={request.id} divider>
            <ListItemText
              primary={request.id}
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={request.status}
                    color={getStatusColor(request.status)}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Requested: {request.requestDate}
                    <br />
                    Last Updated: {request.lastUpdated}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
