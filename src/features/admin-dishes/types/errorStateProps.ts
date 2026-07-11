export interface ErrorStateProps {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}
