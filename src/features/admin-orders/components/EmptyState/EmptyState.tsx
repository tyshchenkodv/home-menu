import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface EmptyStateProps {
  title: string;
  message: string;
}

/** No-requests-yet state (docs/design/screens/admin-orders.md "Empty" — no CTA). */
export const EmptyState = ({ title, message }: EmptyStateProps) => (
  <StatePlaceholder variant="empty" title={title} message={message} />
);
