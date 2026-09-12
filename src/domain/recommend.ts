import { ABILITIES, type Ability, type CharClass } from './schema/content';
import { STANDARD_ARRAY } from './derive/abilities';

/**
 * The order a class wants its ability scores in, best first.
 *
 * Derived from the class's own SRD data rather than copied from a published quick-build table:
 * its primary ability first, then Constitution (everyone wants hit points), then whatever it makes
 * saving throws with, then the rest in a fixed order that favours the broadly useful defences.
 *
 * This is a recommendation, not a rule. It exists to save a new player from an empty six-row form,
 * and every value stays editable afterwards.
 */
export function abilityPriority(charClass: CharClass): Ability[] {
  const ordered: Ability[] = [];
  const add = (ability: Ability) => {
    if (!ordered.includes(ability)) ordered.push(ability);
  };

  charClass.primaryAbility.forEach(add);
  add('con');
  charClass.savingThrows.forEach(add);

  // Dexterity and Wisdom carry the most common saves, so they beat the true dump stats.
  (['dex', 'wis', 'cha', 'int', 'str'] as Ability[]).forEach(add);

  return ordered;
}

/** The standard array assigned down that priority order. */
export function recommendedArray(charClass: CharClass): Record<Ability, number> {
  const priority = abilityPriority(charClass);
  const scores = {} as Record<Ability, number>;

  priority.forEach((ability, index) => {
    scores[ability] = STANDARD_ARRAY[index] ?? 8;
  });

  // Defensive: every ability must end up with something.
  for (const ability of ABILITIES) scores[ability] ??= 8;

  return scores;
}

/**
 * The background's +2/+1 placed on the two abilities the class wants most, where the background
 * offers them. Returns nothing when the background cannot help the class, rather than guessing.
 */
export function recommendedBackgroundBonuses(
  charClass: CharClass,
  abilityOptions: readonly Ability[],
): Partial<Record<Ability, number>> {
  const wanted = abilityPriority(charClass).filter((ability) => abilityOptions.includes(ability));
  const [first, second] = wanted;

  if (first && second) return { [first]: 2, [second]: 1 };
  if (first) {
    // Only one useful ability on offer: spread +1s so the total is still legal.
    const rest = abilityOptions.filter((ability) => ability !== first).slice(0, 2);
    return Object.fromEntries([[first, 1], ...rest.map((ability) => [ability, 1])]);
  }
  return {};
}

/** 4d6, drop the lowest. Returns the dice too, so the roller can show its working. */
export function rollAbilityScore(random: () => number = Math.random): {
  total: number;
  dice: number[];
  dropped: number;
} {
  const dice = Array.from({ length: 4 }, () => Math.floor(random() * 6) + 1);
  const sorted = [...dice].sort((a, b) => a - b);
  const dropped = sorted[0] ?? 1;
  return { total: sorted.slice(1).reduce((sum, die) => sum + die, 0), dice, dropped };
}

/** Six rolled scores, assigned down the class's priority order. */
export function rolledArray(
  charClass: CharClass,
  random: () => number = Math.random,
): { scores: Record<Ability, number>; rolls: { total: number; dice: number[]; dropped: number }[] } {
  const rolls = Array.from({ length: 6 }, () => rollAbilityScore(random));
  const byBest = [...rolls].sort((a, b) => b.total - a.total);
  const priority = abilityPriority(charClass);

  const scores = {} as Record<Ability, number>;
  priority.forEach((ability, index) => {
    scores[ability] = byBest[index]?.total ?? 8;
  });
  for (const ability of ABILITIES) scores[ability] ??= 8;

  return { scores, rolls };
}
