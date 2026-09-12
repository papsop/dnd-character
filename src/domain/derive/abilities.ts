import { ABILITIES, type Ability, type Grant } from '../schema/content';
import type { AbilityDetail } from '../schema/character';
import type { CharacterBuild } from '../schema/character';
import { grantsOf } from './grants';

export const MAX_ABILITY_SCORE = 20;

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

/** 2024 point buy: every score starts at 8, 27 points to spend, nothing above 15. */
export const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function pointBuySpend(base: Record<Ability, number>): number {
  return ABILITIES.reduce((total, ability) => total + (POINT_BUY_COST[base[ability]] ?? 0), 0);
}

/**
 * Base score plus the background bonus, plus every Ability Score Improvement taken, plus any
 * ability-increase granted by a feat or feature. Capped at 20 - no source raises a score past it.
 */
export function deriveAbilities(
  build: CharacterBuild,
  grants: Grant[],
): Record<Ability, AbilityDetail> {
  const increases = grantsOf(grants, 'ability-increase');

  const detail = {} as Record<Ability, AbilityDetail>;
  for (const ability of ABILITIES) {
    const base = build.abilities.base[ability] ?? 0;

    const background = build.abilities.backgroundBonuses[ability] ?? 0;
    const improvements = build.abilities.improvements.reduce(
      (total, improvement) => total + (improvement.increases[ability] ?? 0),
      0,
    );
    const granted = increases
      .filter((g) => g.ability === ability)
      .reduce((total, g) => total + g.amount, 0);

    const bonus = background + improvements + granted;
    const score = Math.min(base + bonus, MAX_ABILITY_SCORE);

    detail[ability] = { base, bonus, score, mod: abilityModifier(score) };
  }
  return detail;
}
