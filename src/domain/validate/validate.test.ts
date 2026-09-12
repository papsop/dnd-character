import { describe, expect, it } from 'vitest';
import { contentPack } from '../../content';
import { validateBuild } from './index';
import { equip, fighterLevel1, makeBuild, scores, wizardLevel5 } from '../test/fixtures';
import type { CharacterBuild } from '../schema/character';

const errorsOf = (build: CharacterBuild) =>
  validateBuild(build, contentPack).filter((i) => i.severity === 'error');

const messages = (build: CharacterBuild) => validateBuild(build, contentPack).map((i) => i.message);

const hasError = (build: CharacterBuild, pattern: RegExp) =>
  errorsOf(build).some((i) => pattern.test(i.message));

describe('point buy validation', () => {
  const pointBuy = (base: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>) =>
    makeBuild({
      abilities: { method: 'point-buy', base: scores(base), backgroundBonuses: { str: 2, dex: 1 }, improvements: [] },
    });

  it('rejects spending more than 27 points', () => {
    expect(hasError(pointBuy({ str: 15, dex: 15, con: 15, int: 15, wis: 15, cha: 15 }), /27 points/)).toBe(true);
  });

  it('rejects a score above 15', () => {
    expect(hasError(pointBuy({ str: 16, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }), /Point buy allows 8-15/)).toBe(true);
  });

  it('rejects a score below 8', () => {
    expect(hasError(pointBuy({ str: 7, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }), /Point buy allows 8-15/)).toBe(true);
  });

  it('reports unspent points as incomplete, not illegal', () => {
    const build = pointBuy({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
    expect(errorsOf(build).some((i) => /point/i.test(i.message))).toBe(false);
    expect(messages(build).some((m) => /points still unspent/.test(m))).toBe(true);
  });

  it('accepts a spread costing exactly 27', () => {
    const build = pointBuy({ str: 15, dex: 14, con: 15, int: 8, wis: 10, cha: 8 });
    expect(errorsOf(build).some((i) => /point/i.test(i.message))).toBe(false);
  });
});

describe('standard array validation', () => {
  const withArray = (base: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>) =>
    makeBuild({
      abilities: { method: 'standard-array', base: scores(base), backgroundBonuses: { str: 2, dex: 1 }, improvements: [] },
    });

  it('accepts each value used exactly once', () => {
    const build = withArray({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 });
    expect(hasError(build, /standard array/i)).toBe(false);
  });

  it('rejects a duplicated value', () => {
    const build = withArray({ str: 15, dex: 15, con: 13, int: 12, wis: 10, cha: 8 });
    expect(hasError(build, /standard array/i)).toBe(true);
  });

  it('rejects a value not in the array', () => {
    const build = withArray({ str: 18, dex: 14, con: 13, int: 12, wis: 10, cha: 8 });
    expect(hasError(build, /standard array/i)).toBe(true);
  });
});

describe('background ability bonuses', () => {
  const withBonuses = (bonuses: Record<string, number>) =>
    makeBuild({
      backgroundId: 'soldier', // str, dex, con
      abilities: { method: 'manual', base: scores({}), backgroundBonuses: bonuses, improvements: [] },
    });

  it('accepts +2/+1', () => {
    expect(hasError(withBonuses({ str: 2, dex: 1 }), /Background bonuses/)).toBe(false);
  });

  it('accepts +1/+1/+1', () => {
    expect(hasError(withBonuses({ str: 1, dex: 1, con: 1 }), /Background bonuses/)).toBe(false);
  });

  it('rejects +2/+2', () => {
    expect(hasError(withBonuses({ str: 2, dex: 2 }), /Background bonuses/)).toBe(true);
  });

  it('rejects +3 to one ability', () => {
    expect(hasError(withBonuses({ str: 3 }), /Background bonuses/)).toBe(true);
  });

  it('rejects a bonus to an ability the background does not offer', () => {
    expect(hasError(withBonuses({ int: 2, wis: 1 }), /does not offer a bonus/)).toBe(true);
  });

  it('reports no bonuses at all as incomplete', () => {
    const build = withBonuses({});
    expect(errorsOf(build).some((i) => /Background bonuses/.test(i.message))).toBe(false);
    expect(messages(build).some((m) => /ability bonuses/.test(m))).toBe(true);
  });
});

describe('score cap', () => {
  it('rejects a level-1 score above 20', () => {
    const build = makeBuild({
      abilities: { method: 'manual', base: scores({ str: 19 }), backgroundBonuses: { str: 2, dex: 1 }, improvements: [] },
    });
    expect(hasError(build, /nothing may raise a score above 20/)).toBe(true);
  });
});

describe('subclass validation', () => {
  it('asks for a subclass at level 3', () => {
    const build = makeBuild({ level: 3 });
    expect(messages(build).some((m) => /Choose a subclass/.test(m))).toBe(true);
  });

  it('does not ask before level 3', () => {
    expect(messages(makeBuild({ level: 2 })).some((m) => /Choose a subclass/.test(m))).toBe(false);
  });

  it('rejects a subclass from another class', () => {
    const build = makeBuild({ level: 3, classId: 'fighter', subclassId: 'evoker' });
    expect(hasError(build, /does not belong to the chosen class/)).toBe(true);
  });

  it('rejects a subclass taken too early', () => {
    const build = makeBuild({ level: 1, classId: 'fighter', subclassId: 'champion' });
    expect(hasError(build, /only available from level 3/)).toBe(true);
  });
});

describe('choice validation', () => {
  it('rejects more skill picks than allowed', () => {
    const build = fighterLevel1();
    build.choices['fighter-skills'] = ['acrobatics', 'perception', 'survival'];
    expect(hasError(build, /only 2 allowed/)).toBe(true);
  });

  it('reports too few picks as incomplete', () => {
    const build = fighterLevel1();
    build.choices['fighter-skills'] = ['acrobatics'];
    expect(messages(build).some((m) => /1 still to choose/.test(m))).toBe(true);
  });

  it('rejects the same option picked twice', () => {
    const build = fighterLevel1();
    build.choices['fighter-skills'] = ['acrobatics', 'acrobatics'];
    expect(hasError(build, /picked twice/)).toBe(true);
  });

  it('rejects a skill outside the class list', () => {
    const build = fighterLevel1();
    build.choices['fighter-skills'] = ['acrobatics', 'arcana'];
    expect(hasError(build, /is not one of the options/)).toBe(true);
  });
});

describe('ability score improvement validation', () => {
  it('rejects an improvement at a level that grants none', () => {
    const build = makeBuild({
      level: 5,
      abilities: { method: 'manual', base: scores({}), backgroundBonuses: { str: 2, dex: 1 }, improvements: [{ level: 5, increases: { str: 2 } }] },
    });
    expect(hasError(build, /No Ability Score Improvement is granted at level 5/)).toBe(true);
  });

  it('rejects an improvement totalling more than +2', () => {
    const build = makeBuild({
      level: 4,
      abilities: { method: 'manual', base: scores({}), backgroundBonuses: { str: 2, dex: 1 }, improvements: [{ level: 4, increases: { str: 2, dex: 1 } }] },
    });
    expect(hasError(build, /exactly \+2 in total/)).toBe(true);
  });

  it('accepts +1 to two abilities', () => {
    const build = makeBuild({
      level: 4,
      abilities: { method: 'manual', base: scores({}), backgroundBonuses: { str: 2, dex: 1 }, improvements: [{ level: 4, increases: { str: 1, dex: 1 } }] },
    });
    expect(hasError(build, /Ability Score Improvement/)).toBe(false);
  });

  it('accepts a Fighter improvement at level 6, which other classes do not get', () => {
    const fighter = makeBuild({
      classId: 'fighter',
      level: 6,
      abilities: { method: 'manual', base: scores({}), backgroundBonuses: { str: 2, dex: 1 }, improvements: [{ level: 6, increases: { str: 2 } }] },
    });
    const wizard = makeBuild({
      classId: 'wizard',
      level: 6,
      abilities: { method: 'manual', base: scores({}), backgroundBonuses: { str: 2, dex: 1 }, improvements: [{ level: 6, increases: { str: 2 } }] },
    });
    expect(hasError(fighter, /No Ability Score Improvement is granted at level 6/)).toBe(false);
    expect(hasError(wizard, /No Ability Score Improvement is granted at level 6/)).toBe(true);
  });
});

describe('equipment validation', () => {
  it('rejects armour the character is not proficient with', () => {
    const build = makeBuild({ classId: 'wizard', equipment: [equip('plate-armor')] });
    expect(hasError(build, /not proficient with Plate Armor/)).toBe(true);
  });

  it('allows armour the class is proficient with', () => {
    const build = makeBuild({ classId: 'fighter', equipment: [equip('plate-armor')] });
    expect(hasError(build, /not proficient/)).toBe(false);
  });

  it('stops a light-armour class wearing Hide, which is medium armour', () => {
    const build = makeBuild({ classId: 'wizard', equipment: [equip('hide-armor')] });
    expect(hasError(build, /not proficient with Hide Armor/)).toBe(true);
  });

  it('rejects an unknown item', () => {
    const build = makeBuild({ equipment: [equip('vorpal-toothbrush')] });
    expect(hasError(build, /Unknown item/)).toBe(true);
  });
});

describe('spell validation', () => {
  it('rejects spells on a non-caster', () => {
    const build = makeBuild({ classId: 'fighter', spells: { cantrips: ['fire-bolt'], prepared: [] } });
    expect(hasError(build, /does not cast spells/)).toBe(true);
  });

  it('rejects a spell off the class list', () => {
    const build = wizardLevel5();
    build.spells.prepared = [...build.spells.prepared.slice(0, 8), 'cure-wounds'];
    expect(hasError(build, /not on the Wizard spell list/)).toBe(true);
  });

  it('rejects a spell above the highest slot level', () => {
    const build = wizardLevel5();
    build.spells.prepared = [...build.spells.prepared.slice(0, 8), 'polymorph'];
    expect(hasError(build, /your highest slot is level 3/)).toBe(true);
  });

  it('rejects a cantrip in the prepared list', () => {
    const build = wizardLevel5();
    build.spells.prepared = [...build.spells.prepared.slice(0, 8), 'ray-of-frost'];
    expect(hasError(build, /belongs in the cantrip list/)).toBe(true);
  });

  it('rejects too many cantrips', () => {
    const build = wizardLevel5();
    build.spells.cantrips = [...build.spells.cantrips, 'ray-of-frost'];
    expect(hasError(build, /cantrips chosen; you may have 4/)).toBe(true);
  });

  it('reports too few prepared spells as incomplete', () => {
    const build = wizardLevel5();
    build.spells.prepared = build.spells.prepared.slice(0, 5);
    expect(messages(build).some((m) => /Choose 4 more prepared spells/.test(m))).toBe(true);
  });

  it('rejects the same spell prepared twice', () => {
    const build = wizardLevel5();
    build.spells.prepared = [...build.spells.prepared.slice(0, 8), 'fireball'];
    expect(hasError(build, /prepared twice/)).toBe(true);
  });

  it('accepts the fully built wizard', () => {
    expect(errorsOf(wizardLevel5())).toHaveLength(0);
  });
});

describe('a finished character', () => {
  it('has no errors', () => {
    expect(errorsOf(fighterLevel1())).toHaveLength(0);
  });

  it('reports an unnamed character as incomplete', () => {
    const build = fighterLevel1();
    build.name = '';
    expect(messages(build).some((m) => /Give your character a name/.test(m))).toBe(true);
  });
});

describe('unassigned ability scores', () => {
  const unassigned = (base: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>) =>
    makeBuild({
      abilities: {
        method: 'standard-array',
        base: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, ...base },
        backgroundBonuses: { str: 2, dex: 1 },
        improvements: [],
      },
    });

  it('is reported as unfinished, not illegal', () => {
    const build = unassigned({});
    expect(errorsOf(build).some((i) => /standard array/i.test(i.message))).toBe(false);
    expect(messages(build).some((m) => /Assign your ability scores/.test(m))).toBe(true);
  });

  it('names the scores still outstanding', () => {
    const build = unassigned({ str: 15, dex: 14, con: 13, int: 12 });
    expect(messages(build).some((m) => /Still to assign: WIS, CHA/.test(m))).toBe(true);
  });

  it('goes quiet once every score is assigned', () => {
    const build = unassigned({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 });
    expect(messages(build).some((m) => /to assign/i.test(m))).toBe(false);
    expect(hasError(build, /standard array/i)).toBe(false);
  });

  it('does not complain about point buy until the scores exist', () => {
    const build = makeBuild({
      abilities: {
        method: 'point-buy',
        base: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        backgroundBonuses: { str: 2, dex: 1 },
        improvements: [],
      },
    });
    expect(hasError(build, /Point buy allows/)).toBe(false);
  });
});
