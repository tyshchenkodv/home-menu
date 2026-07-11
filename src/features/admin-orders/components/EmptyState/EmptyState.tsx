import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface EmptyStateProps {
  message: string;
}

/** No-requests-yet state (docs/design/screens/admin-orders.md "Empty" — no CTA). */
export const EmptyState = ({ message }: EmptyStateProps) => <StatePlaceholder variant="empty" message={message} />;
