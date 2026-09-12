import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl">Nothing here</h1>
      <Link to="/" className="text-accent-500 dark:text-accent-400 underline">
        Back to the start
      </Link>
    </section>
  );
}
