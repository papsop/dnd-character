import { describe, expect, it } from 'vitest';
import { contentPack } from '../content';
import { abilityPriority, recommendedArray, recommendedBackgroundBonuses, rollAbilityScore, rolledArray } from './recommend';
import { STANDARD_ARRAY } from './derive/abilities';
import { ABILITIES } from './schema/content';

const cls = (id: string) => {
  const found = contentPack.classes.find((c) => c.id === id);
  if (!found) throw new Error(`No class ${id}`);
  return found;
};

describe('recommended ability spread', () => {
  it('puts the class primary ability first', () => {
    expect(abilityPriority(cls('wizard'))[0]).toBe('int');
    expect(abilityPriority(cls('cleric'))[0]).toBe('wis');
    expect(abilityPriority(cls('barbarian'))[0]).toBe('str');
    expect(abilityPriority(cls('rogue'))[0]).toBe('dex');
  });

  it('puts Constitution high for every class', () => {
    for (const charClass of contentPack.classes) {
      expect(abilityPriority(charClass).indexOf('con'), charClass.id).toBeLessThanOrEqual(2);
    }
  });

  it('covers all six abilities exactly once', () => {
    for (const charClass of contentPack.classes) {
      const priority = abilityPriority(charClass);
      expect(priority).toHaveLength(6);
      expect(new Set(priority).size).toBe(6);
    }
  });

  it('assigns exactly the standard array, each value once', () => {
    for (const charClass of contentPack.classes) {
      const scores = recommendedArray(charClass);
      const values = ABILITIES.map((a) => scores[a]).sort((a, b) => b - a);
      expect(values, charClass.id).toEqual([...STANDARD_ARRAY].sort((a, b) => b - a));
    }
  });

  it('gives a wizard its 15 in Intelligence and its 8 in Strength', () => {
    const scores = recommendedArray(cls('wizard'));
    expect(scores.int).toBe(15);
    expect(scores.str).toBe(8);
  });

  it('gives a fighter its 15 in Strength', () => {
    expect(recommendedArray(cls('fighter')).str).toBe(15);
  });
});

describe('recommended background bonuses', () => {
  it('puts +2 on the ability the class wants most', () => {
    // Soldier offers STR, DEX, CON.
    const bonuses = recommendedBackgroundBonuses(cls('fighter'), ['str', 'dex', 'con']);
    expect(bonuses.str).toBe(2);
    expect(Object.values(bonuses).reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('always totals exactly 3 for every class and background in the pack', () => {
    for (const charClass of contentPack.classes) {
      for (const background of contentPack.backgrounds) {
        const bonuses = recommendedBackgroundBonuses(charClass, background.abilityOptions);
        const total = Object.values(bonuses).reduce((a, b) => a + b, 0);
        expect(total, `${charClass.id}/${background.id}`).toBe(3);
      }
    }
  });

  it('only ever touches abilities the background offers', () => {
    for (const charClass of contentPack.classes) {
      for (const background of contentPack.backgrounds) {
        const bonuses = recommendedBackgroundBonuses(charClass, background.abilityOptions);
        for (const ability of Object.keys(bonuses)) {
          expect(background.abilityOptions, `${charClass.id}/${background.id}`).toContain(ability);
        }
      }
    }
  });
});

describe('dice roller', () => {
  it('drops the lowest of four dice', () => {
    // Always rolls a 1, so total is 1+1+1 with one dropped.
    expect(rollAbilityScore(() => 0)).toEqual({ total: 3, dice: [1, 1, 1, 1], dropped: 1 });
  });

  it('stays within 3-18', () => {
    for (let i = 0; i < 200; i += 1) {
      const { total, dice } = rollAbilityScore();
      expect(total).toBeGreaterThanOrEqual(3);
      expect(total).toBeLessThanOrEqual(18);
      expect(dice).toHaveLength(4);
    }
  });

  it('assigns the best roll to the class primary ability', () => {
    const { scores, rolls } = rolledArray(cls('wizard'));
    expect(rolls).toHaveLength(6);
    expect(scores.int).toBe(Math.max(...rolls.map((r) => r.total)));
  });
});
