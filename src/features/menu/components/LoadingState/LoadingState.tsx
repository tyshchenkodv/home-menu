import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface LoadingStateProps {
  message: string;
}

/** Centered loading indicator for the menu list (docs/design/screens/menu-browse.md "loading"). */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <StatePlaceholder variant="sleeping" message={message} />
);
