import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cream-100 via-sage-50 to-sand-100 px-4 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <h1 className="font-display text-6xl font-bold italic text-sage-500 dark:font-sans dark:not-italic dark:text-primary-600">404</h1>
      <p className="mt-4 text-xl font-medium text-ink-deep dark:text-white">Page not found</p>
      <p className="mt-2 text-sm text-ink-muted dark:text-gray-400">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn-primary mt-6">
        Go to Dashboard
      </Link>
    </div>
  );
}
