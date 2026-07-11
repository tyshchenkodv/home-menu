import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface EmptyStateProps {
  message: string;
}

/** No prepared batches yet state. */
export const EmptyState = ({ message }: EmptyStateProps) => <StatePlaceholder variant="empty" message={message} />;
