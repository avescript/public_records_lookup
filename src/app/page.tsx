import { RequestForm } from '../components/request/RequestForm';
import { Box, Typography } from '@mui/material';

export default function HomePage() {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Public Records Request
      </Typography>
      <Typography variant="body1" paragraph align="center" color="text.secondary">
        Submit a request for public records. Fill out the form below and we'll process your request.
      </Typography>
      <RequestForm />
    </Box>
  );
}