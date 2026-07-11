export interface ErrorStateProps {
  message: string;
  /** Body copy shown under the headline, e.g. "Check the connection." */
  body: string;
  /** Localized label for the retry CTA. */
  retryLabel: string;
  onRetry: () => void;
}
