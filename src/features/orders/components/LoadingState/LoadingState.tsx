import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface LoadingStateProps {
  message: string;
}

/** Centered loading indicator for the orders list (docs/design/screens/my-orders.md "loading"). */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <StatePlaceholder variant="sleeping" message={message} />
);
