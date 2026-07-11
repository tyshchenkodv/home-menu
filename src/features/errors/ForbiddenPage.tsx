import { ErrorPage } from './ErrorPage';

/** Conventional `/403` forbidden page, reached when an active, non-admin visitor hits an admin route. */
export const ForbiddenPage = () => <ErrorPage titleKey="error.forbiddenTitle" />;
