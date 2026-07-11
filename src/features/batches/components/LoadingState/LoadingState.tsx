import { StatePlaceholder } from '../../../../shared/components/StatePlaceholder/StatePlaceholder';

interface LoadingStateProps {
  message: string;
}

/** Loading state (CatArt sleeping + skeletons). */
export const LoadingState = ({ message }: LoadingStateProps) => (
  <StatePlaceholder variant="sleeping" message={message} />
);
