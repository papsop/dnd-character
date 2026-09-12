import { describe, expect, it } from 'vitest';
import { contentPack } from '../content';
import { choicesFor, featLevelsReached, masteryChoiceId, masteryCount } from './progression';
import { makeBuild } from './test/fixtures';

const classOf = (id: string) => {
  const found = contentPack.classes.find((c) => c.id === id);
  if (!found) throw new Error(`No class ${id}`);
  return found;
};

const masteryOptions = (classId: string, level = 1) => {
  const choice = choicesFor(makeBuild({ classId, level }), contentPack).find(
    (c) => c.id === masteryChoiceId(classId),
  );
  return choice?.from.kind === 'ref' ? (choice.from.ids ?? []) : [];
};

describe('weapon mastery', () => {
  it('scales for Fighter and Barbarian', () => {
    expect(masteryCount(classOf('fighter'), 1)).toBe(3);
    expect(masteryCount(classOf('fighter'), 10)).toBe(5);
    expect(masteryCount(classOf('barbarian'), 1)).toBe(2);
    expect(masteryCount(classOf('barbarian'), 10)).toBe(4);
  });

  it('stays flat for Paladin, Ranger and Rogue', () => {
    for (const id of ['paladin', 'ranger', 'rogue']) {
      expect(masteryCount(classOf(id), 1)).toBe(2);
      expect(masteryCount(classOf(id), 20)).toBe(2);
    }
  });

  it('is absent for classes without the feature', () => {
    for (const id of ['wizard', 'cleric', 'bard', 'druid', 'monk', 'sorcerer', 'warlock']) {
      expect(masteryCount(classOf(id), 20), id).toBe(0);
    }
  });

  it('offers only weapons the class is proficient with', () => {
    // A Rogue is proficient with simple weapons plus a short named list - not greataxes.
    const rogue = masteryOptions('rogue');
    expect(rogue).toContain('dagger');
    expect(rogue).toContain('shortsword');
    expect(rogue).toContain('rapier');
    expect(rogue).not.toContain('greataxe');
    expect(rogue).not.toContain('halberd');
  });

  it('offers a Fighter every martial weapon', () => {
    const fighter = masteryOptions('fighter');
    expect(fighter).toContain('greataxe');
    expect(fighter).toContain('longsword');
    expect(fighter.length).toBeGreaterThan(masteryOptions('rogue').length);
  });

  it('offers no options to a class without the feature', () => {
    expect(masteryOptions('wizard')).toEqual([]);
  });
});

describe('feat levels', () => {
  it('gives most classes 4, 8, 12, 16 plus the level 19 Epic Boon', () => {
    expect(featLevelsReached(classOf('wizard'), 20)).toEqual([4, 8, 12, 16, 19]);
  });

  it('gives Fighter two extra', () => {
    expect(featLevelsReached(classOf('fighter'), 20)).toEqual([4, 6, 8, 12, 14, 16, 19]);
  });

  it('gives Rogue one extra', () => {
    expect(featLevelsReached(classOf('rogue'), 20)).toEqual([4, 8, 10, 12, 16, 19]);
  });

  it('only counts levels actually reached', () => {
    expect(featLevelsReached(classOf('fighter'), 6)).toEqual([4, 6]);
    expect(featLevelsReached(classOf('fighter'), 3)).toEqual([]);
  });

  it('offers Epic Boon feats at 19 and general feats before that', () => {
    const choices = choicesFor(makeBuild({ classId: 'fighter', level: 19 }), contentPack);
    const boon = choices.find((c) => c.id === 'fighter-feat-19');
    const normal = choices.find((c) => c.id === 'fighter-feat-4');

    const idsOf = (choice: typeof boon) =>
      choice?.from.kind === 'ref' ? (choice.from.ids ?? []) : [];

    expect(idsOf(boon).every((id) => id.startsWith('boon-of-'))).toBe(true);
    expect(idsOf(normal).some((id) => id.startsWith('boon-of-'))).toBe(false);
  });
});
