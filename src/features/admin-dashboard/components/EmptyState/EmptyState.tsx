import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface EmptyStateProps {
  message: string;
  title?: string;
}

/** Empty/all-calm state for the dashboard. */
export const EmptyState = ({ message, title }: EmptyStateProps) => (
  <StatePlaceholder variant="idle" message={message} title={title} />
);
