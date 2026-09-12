import type { CharacterBuild } from '../schema/character';
import type { Ability } from '../schema/content';

const zeroScores: Record<Ability, number> = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

/** A minimal legal-ish build; each test overrides only what it cares about. */
export function makeBuild(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    schemaVersion: 1,
    id: 'test',
    name: 'Test Character',
    level: 1,
    classId: 'fighter',
    speciesId: 'human',
    backgroundId: 'soldier',
    abilities: {
      method: 'manual',
      base: { ...zeroScores },
      backgroundBonuses: {},
      improvements: [],
    },
    choices: {},
    spells: { cantrips: [], prepared: [] },
    equipment: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    hp: {},
    details: {},
    ...overrides,
  };
}

export const scores = (partial: Partial<Record<Ability, number>>): Record<Ability, number> => ({
  ...zeroScores,
  ...partial,
});

export const equip = (itemId: string, equipped = true) => ({ itemId, quantity: 1, equipped });

/** A complete, legal level-1 Fighter. Used as the end-to-end baseline. */
export function fighterLevel1(): CharacterBuild {
  return makeBuild({
    name: 'Brakka',
    classId: 'fighter',
    speciesId: 'dwarf',
    backgroundId: 'soldier',
    level: 1,
    abilities: {
      method: 'standard-array',
      base: scores({ str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 }),
      backgroundBonuses: { str: 2, con: 1 },
      improvements: [],
    },
    choices: {
      'fighter-skills': ['acrobatics', 'perception'],
      'fighter-weapon-mastery': ['greatsword', 'longsword', 'javelin'],
    },
    equipment: [equip('chain-mail'), equip('greatsword'), equip('javelin')],
  });
}

/** A complete, legal level-5 Wizard - the spellcasting baseline. */
export function wizardLevel5(): CharacterBuild {
  return makeBuild({
    name: 'Ilzarai',
    classId: 'wizard',
    subclassId: 'evoker',
    speciesId: 'elf',
    backgroundId: 'sage',
    level: 5,
    abilities: {
      method: 'standard-array',
      base: scores({ str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 }),
      backgroundBonuses: { int: 2, con: 1 },
      improvements: [{ level: 4, increases: { int: 2 } }],
    },
    choices: {
      'wizard-skills': ['investigation', 'insight'],
      'wizard-feat-4': [],
    },
    spells: {
      cantrips: ['fire-bolt', 'mage-hand', 'prestidigitation', 'light'],
      prepared: [
        'magic-missile',
        'shield',
        'detect-magic',
        'misty-step',
        'scorching-ray',
        'fireball',
        'counterspell',
        'mirror-image',
        'sleep',
      ],
    },
    equipment: [equip('dagger')],
  });
}
