export interface EmptyStateProps {
  message: string;
  /** Optional headline shown above the message. */
  title?: string;
  /** Optional call-to-action, e.g. the active-empty state's "+ Add ingredient". */
  action?: { label: string; onClick: () => void; variant?: 'contained' | 'outlined' };
}
