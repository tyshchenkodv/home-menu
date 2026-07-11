import { ErrorPage } from './ErrorPage';

/** Conventional catch-all `/404` not-found page, reached for any unknown path. */
export const NotFoundPage = () => <ErrorPage titleKey="error.notFoundTitle" />;
