import type { Ability, ContentPack, Dice, Item, Spell } from '../schema/content';
import type { AbilityDetail, Attack, CharacterBuild } from '../schema/character';
import { masteryChoiceId, classOf } from '../progression';
import type { Proficiencies } from './proficiency';

const signed = (n: number) => `${n >= 0 ? '+' : ''}${n}`;
const diceText = (dice: Dice) => `${dice.count}d${dice.die}${dice.bonus ? signed(dice.bonus) : ''}`;

const damageText = (dice: Dice | null, mod: number, type: string) => {
  const base = dice ? diceText(dice) : '—';
  const modifier = mod === 0 ? '' : ` ${signed(mod)}`;
  return `${base}${modifier} ${type.toLowerCase()}`;
};

const hasProperty = (item: Extract<Item, { kind: 'weapon' }>, name: string) =>
  item.properties.some((p) => p.toLowerCase() === name.toLowerCase());

/**
 * Strength for melee, Dexterity for ranged, and the better of the two for Finesse - which is what
 * every player actually wants, and what they forget to check.
 */
function attackAbility(weapon: Extract<Item, { kind: 'weapon' }>, abilities: Record<Ability, AbilityDetail>): Ability {
  if (weapon.rangeType === 'ranged') return 'dex';
  if (hasProperty(weapon, 'finesse')) return abilities.dex.mod > abilities.str.mod ? 'dex' : 'str';
  return 'str';
}

/** Weapon proficiency comes as a category ("Martial Weapons") or a plural name ("Longswords"). */
export function isProficientWith(
  weapon: Extract<Item, { kind: 'weapon' }>,
  proficiencies: Proficiencies,
): boolean {
  const name = weapon.name.toLowerCase();
  return proficiencies.weapons.some((entry) => {
    const value = entry.toLowerCase();
    if (value === 'simple weapons') return weapon.category === 'simple';
    if (value === 'martial weapons') return weapon.category === 'martial';
    return value === name || value === `${name}s` || value.replace(/s$/, '') === name;
  });
}

function rangeText(weapon: Extract<Item, { kind: 'weapon' }>): string {
  if (weapon.range) return `Ranged ${weapon.range[0]}/${weapon.range[1]} ft.`;
  return weapon.rangeType === 'ranged' ? 'Ranged' : 'Melee 5 ft.';
}

/** The dice a cantrip actually throws at this character's level, not the scaling table. */
export function cantripDamage(spell: Spell, characterLevel: number): { damage?: string; beams?: number } {
  let damage = spell.damageRoll;
  let beams: number | undefined;

  for (const step of spell.scaling) {
    if (step.kind !== 'character-level' || step.at > characterLevel) continue;
    if (step.damageRoll) damage = step.damageRoll;
    if (step.targetCount) beams = step.targetCount;
  }

  return {
    ...(damage ? { damage } : {}),
    ...(beams ? { beams } : {}),
  };
}

export function deriveAttacks(
  build: CharacterBuild,
  content: ContentPack,
  abilities: Record<Ability, AbilityDetail>,
  proficiencyBonus: number,
  proficiencies: Proficiencies,
  equipped: Item[],
  spellAttackBonus: number | undefined,
  spellSaveDc: number | undefined,
): { attacks: Attack[]; masteries: { weaponName: string; masteryName: string; text: string[] }[] } {
  const charClass = classOf(build, content);
  const chosenMasteries = new Set(
    charClass ? (build.choices[masteryChoiceId(charClass.id)] ?? []) : [],
  );
  const masteryById = new Map(content.masteries.map((m) => [m.id, m]));
  const masteries: { weaponName: string; masteryName: string; text: string[] }[] = [];

  const attacks: Attack[] = [];

  for (const item of equipped) {
    if (item.kind !== 'weapon') continue;

    const ability = attackAbility(item, abilities);
    const mod = abilities[ability].mod;
    const proficient = isProficientWith(item, proficiencies);

    const usesMastery = chosenMasteries.has(item.id) && item.mastery !== undefined;
    const mastery = usesMastery && item.mastery ? masteryById.get(item.mastery) : undefined;
    if (mastery) masteries.push({ weaponName: item.name, masteryName: mastery.name, text: mastery.text });

    attacks.push({
      name: item.name,
      kind: 'weapon',
      attackBonus: mod + (proficient ? proficiencyBonus : 0),
      damage: damageText(item.damage, mod, item.damageType),
      ...(item.versatileDamage ? { versatile: damageText(item.versatileDamage, mod, item.damageType) } : {}),
      range: rangeText(item),
      properties: item.properties,
      ...(mastery ? { mastery: { name: mastery.name, text: mastery.text } } : {}),
      ...(proficient ? {} : { notes: 'Not proficient' }),
    });
  }

  // Always printed: everyone can punch, and it is the one attack players forget they have.
  attacks.push({
    name: 'Unarmed Strike',
    kind: 'unarmed',
    attackBonus: abilities.str.mod + proficiencyBonus,
    damage: `${1 + abilities.str.mod} bludgeoning`,
    range: 'Melee 5 ft.',
    properties: [],
  });

  for (const spellId of build.spells.cantrips) {
    const spell = content.spells.find((s) => s.id === spellId);
    if (!spell || (!spell.attackRoll && !spell.save)) continue;

    const { damage, beams } = cantripDamage(spell, build.level);
    attacks.push({
      name: spell.name,
      kind: 'cantrip',
      ...(spell.attackRoll && spellAttackBonus !== undefined ? { attackBonus: spellAttackBonus } : {}),
      ...(spell.save && spellSaveDc !== undefined ? { save: { ability: spell.save, dc: spellSaveDc } } : {}),
      damage: damage ? `${damage} ${(spell.damageTypes[0] ?? '').toLowerCase()}`.trim() : '—',
      range: spell.range,
      properties: [],
      ...(beams ? { notes: `${beams} beams` } : {}),
    });
  }

  return { attacks, masteries };
}
