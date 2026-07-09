import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface ErrorStateProps {
  message: string;
}

/** Generic centered error message shown when a subscription or action fails. */
export const ErrorState = ({ message }: ErrorStateProps) => (
  <Stack spacing={2} sx={{ py: 6, alignItems: 'center', justifyContent: 'center' }} role="alert">
    <Typography color="error">{message}</Typography>
  </Stack>
);
