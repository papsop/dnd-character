import { describe, expect, it } from 'vitest';
import { contentPack } from '../../content';
import { deriveSheet } from './index';
import { highestSlotLevel, spellAttackBonus, spellSaveDc } from './spellcasting';
import { equip, fighterLevel1, makeBuild, scores, wizardLevel5 } from '../test/fixtures';

describe('proficiency bonus on the sheet', () => {
  it.each([
    [1, 2],
    [5, 3],
    [9, 4],
    [13, 5],
    [17, 6],
  ])('level %i gives +%i', (level, expected) => {
    const sheet = deriveSheet(makeBuild({ level }), contentPack);
    expect(sheet.proficiencyBonus).toBe(expected);
  });
});

describe('skills and saves', () => {
  it('adds the proficiency bonus only to proficient skills', () => {
    const sheet = deriveSheet(fighterLevel1(), contentPack);
    const acrobatics = sheet.skills.find((s) => s.id === 'acrobatics');
    const arcana = sheet.skills.find((s) => s.id === 'arcana');

    expect(acrobatics?.proficient).toBe(true);
    expect(acrobatics?.mod).toBe(sheet.abilities.dex.mod + sheet.proficiencyBonus);
    expect(arcana?.proficient).toBe(false);
    expect(arcana?.mod).toBe(sheet.abilities.int.mod);
  });

  it('grants exactly the class saving throws', () => {
    const sheet = deriveSheet(fighterLevel1(), contentPack);
    expect(sheet.saves.str.proficient).toBe(true);
    expect(sheet.saves.con.proficient).toBe(true);
    expect(sheet.saves.dex.proficient).toBe(false);
    expect(sheet.saves.str.mod).toBe(sheet.abilities.str.mod + sheet.proficiencyBonus);
  });

  it('takes background skills without a class pick', () => {
    const sheet = deriveSheet(fighterLevel1(), contentPack);
    expect(sheet.skills.find((s) => s.id === 'athletics')?.proficient).toBe(true);
    expect(sheet.skills.find((s) => s.id === 'intimidation')?.proficient).toBe(true);
  });

  it('computes passive scores as 10 + the modifier', () => {
    const sheet = deriveSheet(fighterLevel1(), contentPack);
    const perception = sheet.skills.find((s) => s.id === 'perception');
    expect(sheet.passive.perception).toBe(10 + (perception?.mod ?? 0));
  });

  it('flags a skill granted twice instead of silently wasting the pick', () => {
    const build = fighterLevel1();
    // Athletics already comes from the Soldier background.
    build.choices['fighter-skills'] = ['athletics', 'perception'];
    const sheet = deriveSheet(build, contentPack);
    expect(sheet.issues.some((i) => i.message.includes('Athletics'))).toBe(true);
  });
});

describe('attacks', () => {
  it('always prints an Unarmed Strike', () => {
    const sheet = deriveSheet(makeBuild(), contentPack);
    expect(sheet.attacks.some((a) => a.kind === 'unarmed')).toBe(true);
  });

  it('uses Strength for a melee weapon and adds proficiency', () => {
    const sheet = deriveSheet(fighterLevel1(), contentPack);
    const greatsword = sheet.attacks.find((a) => a.name === 'Greatsword');
    expect(greatsword?.attackBonus).toBe(sheet.abilities.str.mod + sheet.proficiencyBonus);
    expect(greatsword?.damage).toBe(`2d6 +${sheet.abilities.str.mod} slashing`);
  });

  it('uses Dexterity for a finesse weapon when it is higher', () => {
    const build = makeBuild({
      classId: 'rogue',
      abilities: { method: 'manual', base: scores({ str: 8, dex: 16 }), backgroundBonuses: {}, improvements: [] },
      equipment: [equip('dagger')],
    });
    const sheet = deriveSheet(build, contentPack);
    const dagger = sheet.attacks.find((a) => a.name === 'Dagger');
    expect(dagger?.attackBonus).toBe(3 + sheet.proficiencyBonus);
  });

  it('prints versatile damage separately', () => {
    const build = makeBuild({ equipment: [equip('longsword')] });
    const longsword = deriveSheet(build, contentPack).attacks.find((a) => a.name === 'Longsword');
    expect(longsword?.versatile).toContain('1d10');
  });

  it('marks an attack made without proficiency', () => {
    const build = makeBuild({ classId: 'wizard', equipment: [equip('greatsword')] });
    const attack = deriveSheet(build, contentPack).attacks.find((a) => a.name === 'Greatsword');
    expect(attack?.notes).toBe('Not proficient');
  });

  it('attaches mastery only to the weapons the character chose', () => {
    const sheet = deriveSheet(fighterLevel1(), contentPack);
    expect(sheet.attacks.find((a) => a.name === 'Greatsword')?.mastery?.name).toBe('Graze');
    expect(sheet.masteries.map((m) => m.weaponName)).toContain('Greatsword');
  });

  it('reports extra attacks per action', () => {
    const level1 = deriveSheet(makeBuild({ level: 1 }), contentPack);
    const level5 = deriveSheet(makeBuild({ level: 5 }), contentPack);
    expect(level1.attacksPerAction).toBe(1);
    expect(level5.attacksPerAction).toBe(2);
  });
});

describe('spellcasting', () => {
  it('computes save DC and attack bonus', () => {
    expect(spellSaveDc(3, 3)).toBe(14);
    expect(spellAttackBonus(3, 3)).toBe(6);
  });

  it('derives a level-5 wizard correctly', () => {
    const sheet = deriveSheet(wizardLevel5(), contentPack);
    const spellcasting = sheet.spellcasting;

    expect(spellcasting?.ability).toBe('int');
    // Int 15 base, +2 from Sage, +2 from the level-4 ASI = 19, modifier +4.
    expect(sheet.abilities.int.score).toBe(19);
    expect(spellcasting?.saveDc).toBe(8 + 3 + 4);
    expect(spellcasting?.attackBonus).toBe(3 + 4);
    expect(spellcasting?.slots).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    expect(spellcasting?.cantripsKnown).toBe(4);
    expect(spellcasting?.preparedMax).toBe(9);
    expect(highestSlotLevel(spellcasting)).toBe(3);
  });

  it('gives a warlock pact slots rather than normal ones', () => {
    const build = makeBuild({ classId: 'warlock', level: 5 });
    const spellcasting = deriveSheet(build, contentPack).spellcasting;
    expect(spellcasting?.pact).toEqual({ count: 2, level: 3 });
  });

  it('gives non-casters no spellcasting block', () => {
    expect(deriveSheet(makeBuild({ classId: 'fighter' }), contentPack).spellcasting).toBeUndefined();
  });

  it('scales cantrip damage to the character level', () => {
    const low = makeBuild({ classId: 'wizard', level: 1, spells: { cantrips: ['fire-bolt'], prepared: [] } });
    const high = makeBuild({ classId: 'wizard', level: 11, spells: { cantrips: ['fire-bolt'], prepared: [] } });

    const damageOf = (build: typeof low) =>
      deriveSheet(build, contentPack).attacks.find((a) => a.name === 'Fire Bolt')?.damage;

    expect(damageOf(low)).toContain('1d10');
    expect(damageOf(high)).toContain('3d10');
  });
});

describe('end-to-end sheets', () => {
  it('derives a complete level-1 Fighter', () => {
    const sheet = deriveSheet(fighterLevel1(), contentPack);

    expect(sheet.identity).toMatchObject({ className: 'Fighter', speciesName: 'Dwarf', level: 1 });
    expect(sheet.abilities.str.score).toBe(17);
    expect(sheet.proficiencyBonus).toBe(2);
    expect(sheet.defenses.ac).toBe(16); // chain mail, no Dex
    expect(sheet.defenses.hpMax).toBe(10 + 2); // d10 + Con 14 -> +2
    expect(sheet.defenses.hitDice).toEqual({ count: 1, die: 10 });
    expect(sheet.defenses.senses).toContain('Darkvision 120 ft.');
  });

  it('derives a complete level-5 Wizard', () => {
    const sheet = deriveSheet(wizardLevel5(), contentPack);

    expect(sheet.identity).toMatchObject({ className: 'Wizard', subclassName: 'Evoker', level: 5 });
    expect(sheet.proficiencyBonus).toBe(3);
    expect(sheet.defenses.hitDice).toEqual({ count: 5, die: 6 });
    expect(sheet.features.some((f) => f.source === 'subclass')).toBe(true);
  });

  it('never stores derived values back into the build', () => {
    const build = fighterLevel1();
    const before = JSON.stringify(build);
    deriveSheet(build, contentPack);
    expect(JSON.stringify(build)).toBe(before);
  });

  it('is stable - deriving twice gives the same sheet', () => {
    const build = wizardLevel5();
    expect(JSON.stringify(deriveSheet(build, contentPack))).toBe(
      JSON.stringify(deriveSheet(build, contentPack)),
    );
  });
});
