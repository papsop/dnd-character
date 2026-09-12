import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h1 className="font-display text-4xl">Build a character</h1>
        <p className="text-ink-500 max-w-prose">
          Guided creation against the 2024 rules, checked as you go, ending in a print-ready
          double-sided A4 sheet. Everything runs in your browser - no account, nothing uploaded.
        </p>
      </div>

      <Link
        to="/build/class"
        className="bg-accent-500 text-parchment-50 inline-block rounded px-4 py-2 font-semibold"
      >
        Start building
      </Link>
    </section>
  );
}
