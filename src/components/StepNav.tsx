import { Link } from 'react-router-dom';
import { Icon } from './Icon';

/**
 * Back / Next at the foot of every step.
 *
 * The step tabs along the top are for jumping around; this is for the common case, which is simply
 * working forward. Next is never blocked - an unfinished step is reported, not enforced, and the
 * review page is where everything outstanding gets collected.
 */
export function StepNav({
  previous,
  next,
  nextLabel,
  issueCount,
}: {
  previous?: { to: string; label: string };
  next?: { to: string; label: string };
  nextLabel?: string;
  issueCount: number;
}) {
  return (
    <nav
      aria-label="Step navigation"
      className="border-parchment-200 dark:border-ink-700 mt-8 flex items-center gap-3 border-t pt-4"
    >
      {previous ? (
        <Link
          to={previous.to}
          className="border-parchment-200 hover:border-accent-400 dark:border-ink-700 rounded border px-3 py-2 text-sm"
        >
          ← {previous.label}
        </Link>
      ) : (
        <span />
      )}

      <span className="text-ink-500 flex-1 text-center text-xs">
        {issueCount > 0
          ? `${issueCount} thing${issueCount === 1 ? '' : 's'} left on this step`
          : 'This step is done'}
      </span>

      {next ? (
        <Link
          to={next.to}
          className="bg-accent-500 text-parchment-50 flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold"
        >
          {nextLabel ?? next.label} →
        </Link>
      ) : (
        <Link
          to="/build/review"
          className="bg-accent-500 text-parchment-50 flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold"
        >
          <Icon name="section-features" size={14} />
          Review &amp; print
        </Link>
      )}
    </nav>
  );
}
