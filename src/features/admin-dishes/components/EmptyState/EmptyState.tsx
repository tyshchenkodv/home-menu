import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';
import type { EmptyStateProps } from '../../types/emptyStateProps';

/** Generic centered empty-state message for a feed with no items. */
export const EmptyState = ({ message }: EmptyStateProps) => <StatePlaceholder variant="empty" message={message} />;
