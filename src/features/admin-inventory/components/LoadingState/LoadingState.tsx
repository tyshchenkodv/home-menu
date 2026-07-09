import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';
import type { LoadingStateProps } from '../../types/loadingStateProps';

/** Generic centered loading indicator with a localized message. */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <StatePlaceholder variant="sleeping" message={message} />
);
