import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface Request {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  submittedDate: string;
  department: string;
}

const mockRequests: Request[] = [
  {
    id: 'REQ-2023-001',
    title: 'Police Department Budget 2023',
    status: 'in-progress',
    submittedDate: '2023-09-01',
    department: 'Police Department',
  },
  {
    id: 'REQ-2023-002',
    title: 'City Council Meeting Minutes',
    status: 'completed',
    submittedDate: '2023-08-15',
    department: 'City Clerk',
  },
];

const getStatusColor = (status: Request['status']): "warning" | "info" | "success" | "error" => {
  const colors = {
    'pending': 'warning',
    'in-progress': 'info',
    'completed': 'success',
    'rejected': 'error',
  } as const;
  return colors[status];
};

export const RecentRequestsList = () => {
  return (
    <List>
      {mockRequests.map((request) => (
        <ListItem key={request.id} divider>
          <ListItemText
            primary={
              <Typography variant="subtitle1" component="div">
                {request.title}
              </Typography>
            }
            secondary={
              <>
                <Typography variant="body2" color="text.secondary">
                  {request.department} - Submitted: {request.submittedDate}
                </Typography>
                <Chip
                  label={request.status}
                  color={getStatusColor(request.status)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </>
            }
          />
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="view details">
              <VisibilityIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};
