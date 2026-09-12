import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { Issue } from '../domain/schema/character';

export function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-ink-900 dark:text-parchment-100 text-2xl">{children}</h2>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-ink-500 max-w-prose text-sm">{children}</p>;
}

/** A selectable card. Used for classes, species, backgrounds, equipment kits - anything picked. */
export function ChoiceCard({
  selected,
  onClick,
  disabled,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        'rounded-lg border p-3 text-left transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        selected
          ? 'border-accent-500 bg-accent-500/10 dark:border-accent-400'
          : 'border-parchment-200 hover:border-accent-400 dark:border-ink-700 dark:hover:border-accent-400',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-ink-500 text-xs font-semibold tracking-wide uppercase">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'border-parchment-200 dark:border-ink-700 dark:bg-ink-900 w-full rounded border bg-white px-2 py-1.5 text-sm';

export function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="space-y-1 text-sm">
      {issues.map((issue, index) => (
        <li
          key={`${issue.field}-${index}`}
          className={clsx(
            'rounded border-l-4 px-2 py-1',
            issue.severity === 'error'
              ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
              : 'border-parchment-200 bg-parchment-100 text-ink-700 dark:border-ink-700 dark:bg-ink-700/40 dark:text-parchment-200',
          )}
        >
          {issue.message}
        </li>
      ))}
    </ul>
  );
}

export function Counter({ chosen, max }: { chosen: number; max: number }) {
  const done = chosen === max;
  return (
    <span
      className={clsx(
        'rounded-full px-2 py-0.5 text-xs font-semibold',
        done ? 'bg-parchment-200 text-ink-700' : 'bg-accent-500/15 text-accent-600 dark:text-accent-400',
      )}
    >
      {chosen} / {max}
    </span>
  );
}
