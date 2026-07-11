import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface LoadingStateProps {
  message: string;
}

/** Loading state for the dashboard. */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <StatePlaceholder variant="sleeping" message={message} />
);
