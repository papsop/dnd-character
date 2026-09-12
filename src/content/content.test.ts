import { describe, expect, it } from 'vitest';
import { classesById, contentPack, spellsForClass, subclassesForClass } from './index';

/**
 * These tests exist to catch bad *data*, not bad code. The build already enforces the schema and
 * referential integrity; what it cannot know is whether the numbers match the SRD 5.2.1. The spell
 * slot tables below were transcribed from the ruleset independently of the source dataset, so if
 * upstream ever ships a wrong table, these fail.
 */

const cls = (id: string) => {
  const found = classesById.get(id);
  if (!found) throw new Error(`No class "${id}" in the content pack`);
  return found;
};

const slotsAt = (classId: string, level: number) => {
  const row = cls(classId).levels[level - 1];
  return row?.spellcasting?.slots ?? [];
};

describe('content pack integrity', () => {
  it('is built from the SRD 5.2.1 under CC BY 4.0', () => {
    expect(contentPack.meta.source).toBe('SRD 5.2.1');
    expect(contentPack.meta.license).toBe('CC BY 4.0');
    expect(contentPack.meta.attribution).toMatch(/Creative Commons Attribution 4\.0/);
  });

  it('has the eighteen skills, each tied to an ability', () => {
    expect(contentPack.skills).toHaveLength(18);
    for (const skill of contentPack.skills) {
      expect(skill.ability).toMatch(/^(str|dex|con|int|wis|cha)$/);
    }
  });

  it('gives every class twenty level rows and at least one subclass', () => {
    expect(contentPack.classes.length).toBeGreaterThan(0);
    for (const charClass of contentPack.classes) {
      expect(charClass.levels).toHaveLength(20);
      expect(subclassesForClass(charClass.id).length).toBeGreaterThan(0);
      expect(charClass.savingThrows).toHaveLength(2);
      expect(charClass.startingEquipment.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate ids in any collection', () => {
    for (const [name, records] of Object.entries(contentPack)) {
      if (!Array.isArray(records)) continue;
      const ids = (records as { id: string }[]).map((r) => r.id);
      expect(new Set(ids).size, `${name} has duplicate ids`).toBe(ids.length);
    }
  });
});

describe('printable text', () => {
  const allText = (): string[] => {
    const out: string[] = [];
    const walk = (value: unknown): void => {
      if (typeof value === 'string') out.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    walk(contentPack);
    return out;
  };

  it('carries no Markdown bold markers - they would print literally on the sheet', () => {
    expect(allText().filter((text) => text.includes('**'))).toEqual([]);
  });

  it('carries no Markdown italic markers', () => {
    expect(allText().filter((text) => /_[A-Za-z][^_]*_/.test(text))).toEqual([]);
  });

  it('carries no PDF line-break hyphenation artifacts', () => {
    const broken = allText().filter((text) => /[A-Za-z]- [a-z]/.test(text));
    expect(broken).toEqual([]);
  });
});

describe('2024 ruleset markers', () => {
  it('gives species no ability score increases - those moved to backgrounds', () => {
    for (const species of contentPack.species) {
      const traits = [...species.traits, ...species.lineages.flatMap((l) => l.traits)];
      const increases = traits.flatMap((t) => t.grants).filter((g) => g.kind === 'ability-increase');
      expect(increases, `${species.id} carries an ability increase`).toHaveLength(0);
    }
  });

  it('gives every background three ability options, two skills and an origin feat', () => {
    for (const background of contentPack.backgrounds) {
      expect(background.abilityOptions).toHaveLength(3);
      expect(new Set(background.abilityOptions).size).toBe(3);
      expect(background.skills).toHaveLength(2);
      expect(background.originFeat).not.toBe('');
      expect(background.toolProficiency).not.toBe('');
    }
  });

  it('gives weapons a mastery property', () => {
    const weapons = contentPack.items.filter((item) => item.kind === 'weapon');
    expect(weapons.length).toBeGreaterThan(0);
    expect(weapons.filter((w) => w.mastery).length).toBeGreaterThan(0);
  });

  it('has all eight weapon masteries', () => {
    expect(contentPack.masteries.map((m) => m.name).sort()).toEqual([
      'Cleave',
      'Graze',
      'Nick',
      'Push',
      'Sap',
      'Slow',
      'Topple',
      'Vex',
    ]);
  });

  it('gives paladins and rangers spellcasting from level 1', () => {
    for (const id of ['paladin', 'ranger']) {
      const level1 = cls(id).levels[0];
      expect(level1?.spellcasting?.slots[0], `${id} has no level-1 slots`).toBeGreaterThan(0);
    }
  });
});

describe('proficiency bonus', () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])('is +%i at level %i', (level, expected) => {
    for (const charClass of contentPack.classes) {
      expect(charClass.levels[level - 1]?.proficiencyBonus).toBe(expected);
    }
  });
});

describe('spell slot tables', () => {
  // Transcribed from the 2024 ruleset, independently of the source dataset.
  it.each([
    [1, [2, 0, 0, 0, 0, 0, 0, 0, 0]],
    [3, [4, 2, 0, 0, 0, 0, 0, 0, 0]],
    [5, [4, 3, 2, 0, 0, 0, 0, 0, 0]],
    [11, [4, 3, 3, 3, 2, 1, 0, 0, 0]],
    [17, [4, 3, 3, 3, 2, 1, 1, 1, 1]],
    [20, [4, 3, 3, 3, 3, 2, 2, 1, 1]],
  ])('full casters match at level %i', (level, expected) => {
    for (const id of ['bard', 'cleric', 'druid', 'sorcerer', 'wizard']) {
      expect(slotsAt(id, level), `${id} level ${level}`).toEqual(expected);
    }
  });

  it.each([
    [1, [2, 0, 0, 0, 0, 0, 0, 0, 0]],
    [5, [4, 2, 0, 0, 0, 0, 0, 0, 0]],
    [9, [4, 3, 2, 0, 0, 0, 0, 0, 0]],
    [13, [4, 3, 3, 1, 0, 0, 0, 0, 0]],
    [20, [4, 3, 3, 3, 2, 0, 0, 0, 0]],
  ])('half casters match at level %i', (level, expected) => {
    for (const id of ['paladin', 'ranger']) {
      expect(slotsAt(id, level), `${id} level ${level}`).toEqual(expected);
    }
  });

  it.each([
    [1, 1, 1],
    [2, 2, 1],
    [5, 2, 3],
    [9, 2, 5],
    [11, 3, 5],
    [17, 4, 5],
    [20, 4, 5],
  ])('warlock Pact Magic at level %i is %i slots of level %i', (level, count, slotLevel) => {
    const spellcasting = cls('warlock').levels[level - 1]?.spellcasting;
    expect(spellcasting?.pactSlots).toBe(count);
    expect(spellcasting?.pactSlotLevel).toBe(slotLevel);
  });

  it('marks the warlock as a pact caster and the rest by progression', () => {
    expect(cls('warlock').spellcasting?.progression).toBe('pact');
    expect(cls('wizard').spellcasting?.progression).toBe('full');
    expect(cls('paladin').spellcasting?.progression).toBe('half');
    expect(cls('fighter').spellcasting).toBeUndefined();
  });
});

describe('spells', () => {
  it('reaches level 9 and includes cantrips', () => {
    const levels = new Set(contentPack.spells.map((spell) => spell.level));
    expect(levels.has(0)).toBe(true);
    expect(levels.has(9)).toBe(true);
  });

  it('gives every caster class a spell list and non-casters none', () => {
    for (const charClass of contentPack.classes) {
      const list = spellsForClass(charClass.id);
      if (charClass.spellcasting) expect(list.length, charClass.id).toBeGreaterThan(0);
      else expect(list, charClass.id).toHaveLength(0);
    }
  });

  it('keeps components and concentration parseable', () => {
    for (const spell of contentPack.spells) {
      expect(spell.text.length, `${spell.id} has no text`).toBeGreaterThan(0);
      expect(typeof spell.concentration).toBe('boolean');
      expect(spell.range).not.toBe('');
    }
  });
});
