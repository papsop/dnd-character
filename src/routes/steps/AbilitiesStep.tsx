import clsx from 'clsx';
import { contentPack } from '../../content';
import { Hint, IssueList, SectionHeading, inputClass } from '../../components/ui';
import { Icon } from '../../components/Icon';
import {
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
  pointBuySpend,
} from '../../domain/derive/abilities';
import { ABILITIES, type Ability } from '../../domain/schema/content';
import { useBuild, useCharacterStore, useSheet } from '../../store/characterStore';

const ABILITY_NAMES: Record<Ability, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

const METHODS = [
  { id: 'standard-array', label: 'Standard array', hint: '15, 14, 13, 12, 10, 8' },
  { id: 'point-buy', label: 'Point buy', hint: '27 points, 8-15' },
  { id: 'manual', label: 'Rolled', hint: 'Type what you rolled' },
] as const;

export function AbilitiesStep() {
  const build = useBuild();
  const sheet = useSheet();
  const update = useCharacterStore((s) => s.update);

  const { method, base, backgroundBonuses } = build.abilities;
  const background = contentPack.backgrounds.find((b) => b.id === build.backgroundId);
  const spent = pointBuySpend(base);

  const setScore = (ability: Ability, value: number) =>
    update((draft) => ({
      ...draft,
      abilities: { ...draft.abilities, base: { ...draft.abilities.base, [ability]: value } },
    }));

  const setBonus = (ability: Ability, value: number) =>
    update((draft) => {
      const next = { ...draft.abilities.backgroundBonuses };
      if (value === 0) delete next[ability];
      else next[ability] = value;
      return { ...draft, abilities: { ...draft.abilities, backgroundBonuses: next } };
    });

  // Which array values are already spoken for, so the dropdowns can grey them out.
  const usedArrayValues = ABILITIES.map((a) => base[a]);

  return (
    <section className="space-y-5">
      <SectionHeading>Ability scores</SectionHeading>
      <Hint>
        Pick a method, assign your scores, then apply your background&apos;s bonuses. Nothing may end
        up above 20.
      </Hint>

      <div className="flex flex-wrap gap-2">
        {METHODS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() =>
              update((draft) => ({
                ...draft,
                abilities: {
                  ...draft.abilities,
                  method: option.id,
                  base:
                    option.id === 'point-buy'
                      ? { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
                      : draft.abilities.base,
                },
              }))
            }
            aria-pressed={method === option.id}
            className={clsx(
              'rounded border px-3 py-1.5 text-sm',
              method === option.id
                ? 'border-accent-500 bg-accent-500/10'
                : 'border-parchment-200 dark:border-ink-700',
            )}
          >
            {option.label}
            <span className="text-ink-500 ml-1 text-xs">{option.hint}</span>
          </button>
        ))}
      </div>

      {method === 'point-buy' ? (
        <p className="text-sm">
          <span className={clsx('font-semibold', spent > POINT_BUY_BUDGET && 'text-accent-500')}>
            {POINT_BUY_BUDGET - spent}
          </span>{' '}
          points remaining
        </p>
      ) : null}

      <IssueList issues={sheet.issues.filter((i) => i.step === 'abilities')} />

      <table className="w-full text-sm">
        <thead className="text-ink-500 text-left text-xs uppercase">
          <tr>
            <th className="py-1">Ability</th>
            <th className="py-1">Base</th>
            <th className="py-1">Background</th>
            <th className="py-1 text-right">Score</th>
            <th className="py-1 text-right">Mod</th>
          </tr>
        </thead>
        <tbody>
          {ABILITIES.map((ability) => {
            const detail = sheet.abilities[ability];
            const offered = background?.abilityOptions.includes(ability) ?? false;
            return (
              <tr key={ability} className="border-parchment-200 dark:border-ink-700 border-t">
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5">
                    <Icon name={`ability-${ability}`} size={16} />
                    {ABILITY_NAMES[ability]}
                  </span>
                </td>
                <td className="py-1.5">
                  {method === 'standard-array' ? (
                    <select
                      className={inputClass}
                      value={base[ability]}
                      onChange={(e) => setScore(ability, Number(e.target.value))}
                      aria-label={`${ABILITY_NAMES[ability]} base score`}
                    >
                      <option value={8}>—</option>
                      {STANDARD_ARRAY.map((value) => (
                        <option
                          key={value}
                          value={value}
                          disabled={usedArrayValues.includes(value) && base[ability] !== value}
                        >
                          {value}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      className={inputClass}
                      value={base[ability]}
                      min={method === 'point-buy' ? POINT_BUY_MIN : 1}
                      max={method === 'point-buy' ? POINT_BUY_MAX : 20}
                      onChange={(e) => setScore(ability, Number(e.target.value))}
                      aria-label={`${ABILITY_NAMES[ability]} base score`}
                    />
                  )}
                </td>
                <td className="py-1.5">
                  <select
                    className={inputClass}
                    value={backgroundBonuses[ability] ?? 0}
                    disabled={!offered}
                    onChange={(e) => setBonus(ability, Number(e.target.value))}
                    aria-label={`${ABILITY_NAMES[ability]} background bonus`}
                  >
                    <option value={0}>—</option>
                    <option value={1}>+1</option>
                    <option value={2}>+2</option>
                  </select>
                </td>
                <td className="py-1.5 text-right font-semibold">{detail.score}</td>
                <td className="py-1.5 text-right font-semibold">
                  {detail.mod >= 0 ? '+' : ''}
                  {detail.mod}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {background ? (
        <Hint>
          {background.name} offers bonuses to{' '}
          {background.abilityOptions.map((a) => ABILITY_NAMES[a]).join(', ')}. Spend +2 and +1, or +1
          three times.
        </Hint>
      ) : (
        <Hint>Choose a background first to apply ability bonuses.</Hint>
      )}
    </section>
  );
}
