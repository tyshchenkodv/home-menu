import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface EmptyStateProps {
  title?: string;
  message: string;
}

/** No prepared batches yet state. */
export const EmptyState = ({ title, message }: EmptyStateProps) => (
  <StatePlaceholder variant="empty" title={title} message={message} />
);
