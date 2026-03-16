import { Container, Paper, Typography } from '@/components/migration';
import { RequestForm } from '@/components/request/RequestForm';

export default function NewRequest() {
  return (
    <Container maxWidth='md' sx={{ py: 4 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Submit a New Public Records Request
      </Typography>

      <Paper sx={{ p: 3 }}>
        <RequestForm />
      </Paper>
    </Container>
  );
}
