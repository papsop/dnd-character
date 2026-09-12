import { Icon } from '../components/Icon';
import { ICON_NAMES } from '../icons/paths';
import { SectionHeading, Hint } from '../components/ui';

/** Development contact sheet. Every icon has to survive being printed at 10px in black and white. */
export function IconsPage() {
  return (
    <section className="space-y-4">
      <SectionHeading>Icons ({ICON_NAMES.length})</SectionHeading>
      <Hint>Shown at 10px, 16px and 48px. Anything unreadable at 10px needs redrawing.</Hint>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ICON_NAMES.map((name) => (
          <div
            key={name}
            className="border-parchment-200 dark:border-ink-700 flex items-center gap-3 rounded border p-2"
          >
            <Icon name={name} size={10} />
            <Icon name={name} size={16} />
            <Icon name={name} size={48} />
            <span className="text-ink-500 min-w-0 flex-1 truncate text-xs">{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
