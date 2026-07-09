import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface LoadingStateProps {
  message: string;
}

/** Generic centered loading indicator with a localized message. */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <Stack spacing={2} sx={{ py: 6, alignItems: 'center', justifyContent: 'center' }}>
    <CircularProgress aria-hidden="true" />
    <Typography>{message}</Typography>
  </Stack>
);
