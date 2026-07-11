import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';
import type { EmptyStateProps } from '../../types/emptyStateProps';

/** Empty-state headline, body, and "+ Add dish" CTA per `admin-dishes.md`. */
export const EmptyState = ({ title, message, actionLabel, onAction }: EmptyStateProps) => (
  <StatePlaceholder
    variant="empty"
    title={title}
    message={message}
    action={{ label: actionLabel, onClick: onAction, variant: 'contained' }}
  />
);
