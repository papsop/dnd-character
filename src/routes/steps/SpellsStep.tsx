import { useState } from 'react';
import clsx from 'clsx';
import { contentPack } from '../../content';
import { Counter, Hint, IssueList, SectionHeading, inputClass } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { iconFor } from '../../icons/paths';
import { highestSlotLevel } from '../../domain/derive/spellcasting';
import { useBuild, useCharacterStore, useSheet } from '../../store/characterStore';

export function SpellsStep() {
  const build = useBuild();
  const sheet = useSheet();
  const update = useCharacterStore((s) => s.update);
  const [search, setSearch] = useState('');

  const spellcasting = sheet.spellcasting;
  if (!spellcasting) return <Hint>This class does not cast spells.</Hint>;

  const maxLevel = highestSlotLevel(spellcasting);
  const list = contentPack.spells.filter((spell) => spell.classes.includes(build.classId));
  const matches = (name: string) => name.toLowerCase().includes(search.trim().toLowerCase());

  const toggle = (key: 'cantrips' | 'prepared', id: string, max: number) =>
    update((draft) => {
      const current = draft.spells[key];
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id].slice(Math.max(0, current.length + 1 - max));
      return { ...draft, spells: { ...draft.spells, [key]: next } };
    });

  return (
    <section className="space-y-6">
      <SectionHeading>Spells</SectionHeading>
      <Hint>
        Save DC {spellcasting.saveDc} · Attack {spellcasting.attackBonus >= 0 ? '+' : ''}
        {spellcasting.attackBonus} · Highest slot level {maxLevel}
      </Hint>

      <IssueList issues={sheet.issues.filter((i) => i.step === 'spells')} />

      <input
        className={`${inputClass} max-w-sm`}
        placeholder="Filter spells…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label="Filter spells"
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg">Cantrips</h3>
          <Counter chosen={build.spells.cantrips.length} max={spellcasting.cantripsKnown} />
        </div>
        <SpellGrid
          spells={list.filter((s) => s.level === 0 && matches(s.name))}
          selected={build.spells.cantrips}
          onToggle={(id) => toggle('cantrips', id, spellcasting.cantripsKnown)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg">Prepared spells</h3>
          <Counter chosen={build.spells.prepared.length} max={spellcasting.preparedMax} />
        </div>
        {Array.from({ length: maxLevel }, (_, i) => i + 1).map((level) => {
          const atLevel = list.filter((s) => s.level === level && matches(s.name));
          if (atLevel.length === 0) return null;
          return (
            <div key={level} className="space-y-1">
              <p className="text-ink-500 text-xs font-semibold uppercase">Level {level}</p>
              <SpellGrid
                spells={atLevel}
                selected={build.spells.prepared}
                onToggle={(id) => toggle('prepared', id, spellcasting.preparedMax)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SpellGrid({
  spells,
  selected,
  onToggle,
}: {
  spells: typeof contentPack.spells;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (spells.length === 0) return <Hint>Nothing matches.</Hint>;
  return (
    <div className="grid gap-1 sm:grid-cols-3 lg:grid-cols-4">
      {spells.map((spell) => {
        const isSelected = selected.includes(spell.id);
        return (
          <button
            key={spell.id}
            type="button"
            onClick={() => onToggle(spell.id)}
            aria-pressed={isSelected}
            className={clsx(
              'flex items-center gap-1.5 rounded border px-2 py-1.5 text-left text-sm',
              isSelected
                ? 'border-accent-500 bg-accent-500/10'
                : 'border-parchment-200 hover:border-accent-400 dark:border-ink-700',
            )}
          >
            <Icon name={iconFor('school', spell.school.toLowerCase())} size={16} />
            <span className="min-w-0 flex-1 truncate">{spell.name}</span>
            {spell.concentration ? (
              <span className="text-ink-500 text-[0.6rem] font-bold" title="Concentration">
                C
              </span>
            ) : null}
            {spell.ritual ? (
              <span className="text-ink-500 text-[0.6rem] font-bold" title="Ritual">
                R
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
