import { describe, expect, it } from 'vitest';
import { contentPack, itemsById } from '../../content';
import type { AbilityDetail, CharacterBuild } from '../schema/character';
import type { Ability, Grant, Item } from '../schema/content';
import { abilityModifier } from './abilities';
import { deriveArmorClass, deriveHitPoints } from './defenses';
import { deriveSheet } from './index';
import { equip, makeBuild, scores } from '../test/fixtures';

const abilitiesFrom = (partial: Partial<Record<Ability, number>>): Record<Ability, AbilityDetail> => {
  const base = scores(partial);
  return Object.fromEntries(
    (['str', 'dex', 'con', 'int', 'wis', 'cha'] as Ability[]).map((a) => [
      a,
      { base: base[a], bonus: 0, score: base[a], mod: abilityModifier(base[a]) },
    ]),
  ) as Record<Ability, AbilityDetail>;
};

const item = (id: string): Item => {
  const found = itemsById.get(id);
  if (!found) throw new Error(`No item "${id}"`);
  return found;
};

describe('armour class', () => {
  const dex16 = abilitiesFrom({ dex: 16, con: 16, wis: 16 });

  it('is 10 + Dex with no armour', () => {
    expect(deriveArmorClass([], dex16, []).ac).toBe(13);
  });

  it('adds full Dex under light armour', () => {
    expect(deriveArmorClass([item('leather-armor')], dex16, []).ac).toBe(14);
  });

  it('caps Dex at +2 under medium armour', () => {
    expect(deriveArmorClass([item('chain-shirt')], dex16, []).ac).toBe(15);
  });

  it('ignores Dex under heavy armour', () => {
    expect(deriveArmorClass([item('plate-armor')], dex16, []).ac).toBe(18);
  });

  it('adds a shield', () => {
    expect(deriveArmorClass([item('chain-shirt'), item('shield')], dex16, []).ac).toBe(17);
  });

  it('uses Barbarian Unarmored Defense when it beats plain 10 + Dex', () => {
    const grants: Grant[] = [{ kind: 'unarmored-defense', ability: 'con' }];
    expect(deriveArmorClass([], dex16, grants).ac).toBe(16);
  });

  it('uses Monk Unarmored Defense', () => {
    const grants: Grant[] = [{ kind: 'unarmored-defense', ability: 'wis' }];
    expect(deriveArmorClass([], dex16, grants).ac).toBe(16);
  });

  it('ignores Unarmored Defense while wearing armour', () => {
    const grants: Grant[] = [{ kind: 'unarmored-defense', ability: 'con' }];
    expect(deriveArmorClass([item('plate-armor')], dex16, grants).ac).toBe(18);
  });

  it('adds flat ac bonuses', () => {
    expect(deriveArmorClass([], dex16, [{ kind: 'ac-bonus', amount: 1 }]).ac).toBe(14);
  });

  it('explains where the number came from', () => {
    const result = deriveArmorClass([item('chain-shirt'), item('shield')], dex16, []);
    expect(result.breakdown).toBe('Chain Shirt 13 + Dex +2 + Shield +2');
  });

  it('reports stealth disadvantage from the armour worn', () => {
    expect(deriveArmorClass([item('plate-armor')], dex16, []).stealthDisadvantage).toBe(true);
    expect(deriveArmorClass([item('leather-armor')], dex16, []).stealthDisadvantage).toBe(false);
  });
});

describe('hit points', () => {
  const fighter = contentPack.classes.find((c) => c.id === 'fighter');
  const wizard = contentPack.classes.find((c) => c.id === 'wizard');
  if (!fighter || !wizard) throw new Error('missing class fixtures');

  it('is max hit die plus Con at level 1', () => {
    expect(deriveHitPoints(fighter, 1, 2, undefined, [])).toBe(12);
    expect(deriveHitPoints(wizard, 1, 1, undefined, [])).toBe(7);
  });

  it('uses the fixed average for later levels', () => {
    // d10 average is 6; level 5 fighter with +2 Con = 12 + 4 * 8
    expect(deriveHitPoints(fighter, 5, 2, undefined, [])).toBe(44);
  });

  it('uses rolls when the player has them', () => {
    expect(deriveHitPoints(fighter, 3, 0, [10, 10], [])).toBe(30);
  });

  it('never gains less than 1 HP in a level', () => {
    // Level 1 is 6 - 5 = 1. Level 2 rolls a 1, so 1 - 5 = -4, clamped up to 1. Total 2.
    expect(deriveHitPoints(wizard, 2, -5, [1], [])).toBe(2);
  });

  it('adds per-level HP grants', () => {
    const grants: Grant[] = [{ kind: 'hp-per-level', amount: 2 }];
    expect(deriveHitPoints(fighter, 2, 0, undefined, grants)).toBe(10 + 2 + 6 + 2);
  });
});

describe('speed and heavy armour', () => {
  const heavyBuild = (str: number): CharacterBuild =>
    makeBuild({
      classId: 'fighter',
      speciesId: 'human',
      abilities: { method: 'manual', base: scores({ str }), backgroundBonuses: {}, improvements: [] },
      equipment: [equip('chain-mail')],
    });

  it('costs 10 feet when Strength is below the armour requirement', () => {
    expect(deriveSheet(heavyBuild(10), contentPack).defenses.speed).toBe(20);
  });

  it('costs nothing when Strength meets it', () => {
    expect(deriveSheet(heavyBuild(14), contentPack).defenses.speed).toBe(30);
  });
});
