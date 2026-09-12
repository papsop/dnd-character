import { describe, expect, it } from 'vitest';
import {
  POINT_BUY_BUDGET,
  abilityModifier,
  deriveAbilities,
  pointBuySpend,
} from './abilities';
import { makeBuild, scores } from '../test/fixtures';

describe('ability modifiers', () => {
  it.each([
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [12, 1],
    [15, 2],
    [16, 3],
    [20, 5],
  ])('score %i gives modifier %i', (score, expected) => {
    expect(abilityModifier(score)).toBe(expected);
  });
});

describe('point buy', () => {
  it('costs nothing for all 8s', () => {
    expect(pointBuySpend(scores({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }))).toBe(0);
  });

  it('charges the steeper rate above 13', () => {
    const base = scores({ str: 14, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
    expect(pointBuySpend(base)).toBe(7);
    const higher = scores({ str: 15, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
    expect(pointBuySpend(higher)).toBe(9);
  });

  it('spends exactly the budget on a typical spread', () => {
    const base = scores({ str: 15, dex: 14, con: 15, int: 8, wis: 10, cha: 8 });
    expect(pointBuySpend(base)).toBe(POINT_BUY_BUDGET);
  });
});

describe('deriveAbilities', () => {
  it('adds the background bonus to the base score', () => {
    const build = makeBuild({
      abilities: {
        method: 'standard-array',
        base: scores({ str: 15, con: 14 }),
        backgroundBonuses: { str: 2, con: 1 },
        improvements: [],
      },
    });
    const abilities = deriveAbilities(build, []);
    expect(abilities.str).toMatchObject({ base: 15, bonus: 2, score: 17, mod: 3 });
    expect(abilities.con).toMatchObject({ base: 14, bonus: 1, score: 15, mod: 2 });
  });

  it('adds Ability Score Improvements', () => {
    const build = makeBuild({
      level: 4,
      abilities: {
        method: 'standard-array',
        base: scores({ int: 15 }),
        backgroundBonuses: { int: 2 },
        improvements: [{ level: 4, increases: { int: 2 } }],
      },
    });
    expect(deriveAbilities(build, []).int.score).toBe(19);
  });

  it('caps a score at 20 however many sources push on it', () => {
    const build = makeBuild({
      level: 8,
      abilities: {
        method: 'manual',
        base: scores({ str: 18 }),
        backgroundBonuses: { str: 2 },
        improvements: [
          { level: 4, increases: { str: 2 } },
          { level: 8, increases: { str: 2 } },
        ],
      },
    });
    const str = deriveAbilities(build, []).str;
    expect(str.score).toBe(20);
    expect(str.mod).toBe(5);
  });

  it('applies ability-increase grants from feats', () => {
    const build = makeBuild({ abilities: { method: 'manual', base: scores({ cha: 14 }), backgroundBonuses: {}, improvements: [] } });
    const abilities = deriveAbilities(build, [{ kind: 'ability-increase', ability: 'cha', amount: 1 }]);
    expect(abilities.cha.score).toBe(15);
  });
});
