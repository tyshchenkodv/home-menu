import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface LoadingStateProps {
  message: string;
}

/** Centered loading indicator for the admin orders board (docs/design/screens/admin-orders.md "Loading"). */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <StatePlaceholder variant="sleeping" message={message} />
);
