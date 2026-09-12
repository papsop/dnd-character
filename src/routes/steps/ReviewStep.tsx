import { useState } from 'react';
import { Link } from 'react-router-dom';
import { downloadSheet } from '../../pdf/download';
import { Hint, SectionHeading } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { useCharacterStore, useSheet } from '../../store/characterStore';
import { ABILITIES } from '../../domain/schema/content';

export function ReviewStep() {
  const sheet = useSheet();
  const update = useCharacterStore((s) => s.update);
  const blocking = sheet.issues.length;
  const [status, setStatus] = useState<'idle' | 'working' | 'failed'>('idle');

  const download = async () => {
    setStatus('working');
    try {
      await downloadSheet(sheet);
      setStatus('idle');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <section className="space-y-6">
      <SectionHeading>Review</SectionHeading>

      {blocking > 0 ? (
        <div className="space-y-2">
          <Hint>
            {blocking} thing{blocking === 1 ? '' : 's'} left before this character is ready to print.
            Each one links back to where it is fixed.
          </Hint>
          <ul className="space-y-1 text-sm">
            {sheet.issues.map((issue, index) => (
              <li key={`${issue.field}-${index}`}>
                <Link
                  to={`/build/${issue.step}`}
                  className="border-parchment-200 hover:border-accent-400 dark:border-ink-700 block rounded border-l-4 px-2 py-1 underline-offset-2 hover:underline"
                >
                  {issue.message}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm">Everything checks out.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Defenses" icon="section-defenses">
          <Row label="Armour Class" value={`${sheet.defenses.ac} (${sheet.defenses.acBreakdown})`} />
          <Row label="Hit Points" value={sheet.defenses.hpMax} />
          <Row label="Hit Dice" value={`${sheet.defenses.hitDice.count}d${sheet.defenses.hitDice.die}`} />
          <Row
            label="Initiative"
            value={`${sheet.defenses.initiative >= 0 ? '+' : ''}${sheet.defenses.initiative}`}
          />
          <Row label="Speed" value={`${sheet.defenses.speed} ft.`} />
          {sheet.defenses.senses.length > 0 ? (
            <Row label="Senses" value={sheet.defenses.senses.join(', ')} />
          ) : null}
          {sheet.defenses.resistances.length > 0 ? (
            <Row label="Resistances" value={sheet.defenses.resistances.join(', ')} />
          ) : null}
        </Panel>

        <Panel title="Abilities" icon="ability-str">
          {ABILITIES.map((ability) => (
            <Row
              key={ability}
              label={ability.toUpperCase()}
              value={`${sheet.abilities[ability].score} (${sheet.abilities[ability].mod >= 0 ? '+' : ''}${sheet.abilities[ability].mod}) · save ${sheet.saves[ability].mod >= 0 ? '+' : ''}${sheet.saves[ability].mod}${sheet.saves[ability].proficient ? ' ●' : ''}`}
            />
          ))}
        </Panel>
      </div>

      <Panel title={`Attacks${sheet.attacksPerAction > 1 ? ` · ${sheet.attacksPerAction} per action` : ''}`} icon="section-attacks">
        <table className="w-full text-sm">
          <thead className="text-ink-500 text-left text-xs uppercase">
            <tr>
              <th className="py-1">Name</th>
              <th className="py-1">Atk / DC</th>
              <th className="py-1">Damage</th>
              <th className="py-1">Range</th>
              <th className="py-1">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sheet.attacks.map((attack, index) => (
              <tr key={`${attack.name}-${index}`} className="border-parchment-200 dark:border-ink-700 border-t">
                <td className="py-1">{attack.name}</td>
                <td className="py-1">
                  {attack.attackBonus !== undefined
                    ? `${attack.attackBonus >= 0 ? '+' : ''}${attack.attackBonus}`
                    : attack.save
                      ? `DC ${attack.save.dc} ${attack.save.ability.toUpperCase()}`
                      : '—'}
                </td>
                <td className="py-1">
                  {attack.damage}
                  {attack.versatile ? ` (${attack.versatile} two-handed)` : ''}
                </td>
                <td className="py-1">{attack.range}</td>
                <td className="text-ink-500 py-1 text-xs">
                  {[attack.mastery?.name, attack.notes, ...attack.properties].filter(Boolean).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Skills" icon="section-skills">
        <ul className="grid grid-cols-2 gap-x-4 text-sm sm:grid-cols-3">
          {sheet.skills.map((skill) => (
            <li key={skill.id} className="flex justify-between gap-2">
              <span className={skill.proficient ? 'font-semibold' : 'text-ink-500'}>
                {skill.proficient ? '● ' : '○ '}
                {skill.name}
              </span>
              <span>
                {skill.mod >= 0 ? '+' : ''}
                {skill.mod}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={`Features (${sheet.features.length})`} icon="section-features">
        <ul className="space-y-1 text-sm">
          {sheet.features.map((feature) => (
            <li key={`${feature.source}-${feature.id}`}>
              <span className="font-semibold">{feature.name}</span>{' '}
              <span className="text-ink-500 text-xs">
                {feature.source} · level {feature.level}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="border-parchment-200 dark:border-ink-700 rounded-lg border p-4">
        <button
          type="button"
          disabled={blocking > 0 || status === 'working'}
          onClick={download}
          className="bg-accent-500 text-parchment-50 rounded px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'working'
            ? 'Building your sheet…'
            : blocking > 0
              ? `Download PDF (${blocking} to fix)`
              : 'Download PDF'}
        </button>
        <p className="text-ink-500 mt-2 text-xs">
          Two pages to print double-sided, plus a spell reference if you cast.
        </p>

        {sheet.spellcasting ? (
          <fieldset className="mt-4">
            <legend className="text-ink-500 text-xs font-semibold tracking-wide uppercase">
              Spell descriptions
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {(
                [
                  ['condensed', 'Condensed', 'Opening rule only. Keeps the sheet short.'],
                  ['full', 'Full text', 'Every word. Adds pages.'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={sheet.sheetOptions.spellDetail === value}
                  onClick={() =>
                    update((draft) => ({
                      ...draft,
                      sheetOptions: { ...draft.sheetOptions, spellDetail: value },
                    }))
                  }
                  className={
                    sheet.sheetOptions.spellDetail === value
                      ? 'border-accent-500 bg-accent-500/10 rounded border px-3 py-1.5 text-sm'
                      : 'border-parchment-200 dark:border-ink-700 rounded border px-3 py-1.5 text-sm'
                  }
                >
                  {label}
                  <span className="text-ink-500 ml-1 text-xs">{hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        {status === 'failed' ? (
          <p className="text-accent-500 mt-2 text-sm">
            Something went wrong building the PDF. Try again, and if it keeps failing the browser
            console will say why.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: Parameters<typeof Icon>[0]['name'];
  children: React.ReactNode;
}) {
  return (
    <div className="border-parchment-200 dark:border-ink-700 space-y-2 rounded-lg border p-4">
      <h3 className="font-display flex items-center gap-2 text-lg">
        <Icon name={icon} size={18} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
