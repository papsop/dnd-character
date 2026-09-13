import { Link, Outlet } from 'react-router-dom';
import { APP_NAME, NOT_AFFILIATED, SRD_ATTRIBUTION_SHORT } from '../attribution';

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-parchment-200 dark:border-ink-700 border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="font-display text-accent-500 dark:text-accent-400 text-xl">
            {APP_NAME}
          </Link>
          <nav className="ml-auto flex gap-4 text-sm" aria-label="Main navigation"><Link to="/build/class">Characters</Link><Link to="/items">Item Forge</Link></nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-parchment-200 dark:border-ink-700 text-ink-500 border-t text-xs">
        <div className="mx-auto w-full max-w-5xl space-y-1 px-4 py-4">
          <p>{SRD_ATTRIBUTION_SHORT}</p>
          <p>{NOT_AFFILIATED}</p>
        </div>
      </footer>
    </div>
  );
}

