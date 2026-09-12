import type { CharClass, ContentPack, Grant, Item, Species } from '../schema/content';
import type { Ability } from '../schema/content';
import type { AbilityDetail, CharacterBuild, CharacterSheet } from '../schema/character';
import { grantsOf } from './grants';

type Defenses = CharacterSheet['defenses'];

const armorOf = (items: Item[]) =>
  items.find((i): i is Extract<Item, { kind: 'armor' }> => i.kind === 'armor' && i.armorType !== 'shield');

const shieldOf = (items: Item[]) =>
  items.find((i): i is Extract<Item, { kind: 'armor' }> => i.kind === 'armor' && i.armorType === 'shield');

/**
 * Armour Class. Take the best applicable base, then add the shield and any flat bonuses.
 *
 * The breakdown string is not decoration - it goes on the sheet under the AC box so a player can
 * see where the number came from without recomputing it at the table.
 */
export function deriveArmorClass(
  equipped: Item[],
  abilities: Record<Ability, AbilityDetail>,
  grants: Grant[],
): { ac: number; breakdown: string; stealthDisadvantage: boolean } {
  const dex = abilities.dex.mod;
  const armor = armorOf(equipped);
  const shield = shieldOf(equipped);

  const candidates: { ac: number; parts: string[] }[] = [];

  if (armor) {
    const capped = armor.dexCap === undefined ? dex : Math.min(dex, armor.dexCap);
    const parts = [`${armor.name} ${armor.baseAc}`];
    if (capped !== 0) parts.push(`Dex ${capped >= 0 ? '+' : ''}${capped}`);
    candidates.push({ ac: armor.baseAc + capped, parts });
  } else {
    candidates.push({ ac: 10 + dex, parts: ['Base 10', `Dex ${dex >= 0 ? '+' : ''}${dex}`] });

    // Unarmored Defense only applies with no armor. The Monk's also forbids a shield, but that is
    // enforced by the validator rather than silently dropping the feature here.
    for (const grant of grantsOf(grants, 'unarmored-defense')) {
      const extra = abilities[grant.ability].mod;
      candidates.push({
        ac: 10 + dex + extra,
        parts: [
          'Unarmored Defense 10',
          `Dex ${dex >= 0 ? '+' : ''}${dex}`,
          `${grant.ability.toUpperCase()} ${extra >= 0 ? '+' : ''}${extra}`,
        ],
      });
    }
  }

  const best = candidates.reduce((a, b) => (b.ac > a.ac ? b : a));
  const parts = [...best.parts];
  let ac = best.ac;

  if (shield) {
    ac += shield.baseAc;
    parts.push(`${shield.name} +${shield.baseAc}`);
  }

  for (const grant of grantsOf(grants, 'ac-bonus')) {
    ac += grant.amount;
    parts.push(`Bonus ${grant.amount >= 0 ? '+' : ''}${grant.amount}`);
  }

  return {
    ac,
    breakdown: parts.join(' + '),
    stealthDisadvantage: Boolean(armor?.stealthDisadvantage),
  };
}

/**
 * Level 1 is always the full hit die. Later levels take the roll if the player has one, otherwise
 * the fixed average. Every level adds the Constitution modifier, and never gains less than 1 HP.
 */
export function deriveHitPoints(
  charClass: CharClass,
  level: number,
  conMod: number,
  rolled: number[] | undefined,
  grants: Grant[],
): number {
  const perLevelBonus = grantsOf(grants, 'hp-per-level').reduce((total, g) => total + g.amount, 0);
  const average = Math.floor(charClass.hitDie / 2) + 1;

  let total = charClass.hitDie + conMod + perLevelBonus;
  for (let l = 2; l <= level; l += 1) {
    const roll = rolled?.[l - 2] ?? average;
    total += Math.max(1, roll + conMod + perLevelBonus);
  }
  return total;
}

export function deriveDefenses(
  build: CharacterBuild,
  content: ContentPack,
  charClass: CharClass,
  species: Species | undefined,
  abilities: Record<Ability, AbilityDetail>,
  proficiencyBonus: number,
  grants: Grant[],
  equipped: Item[],
): Defenses {
  const { ac, breakdown, stealthDisadvantage } = deriveArmorClass(equipped, abilities, grants);

  const initiativeProficient = grantsOf(grants, 'initiative-proficiency').length > 0;
  const initiative =
    abilities.dex.mod +
    (initiativeProficient ? proficiencyBonus : 0) +
    grantsOf(grants, 'initiative-bonus').reduce((total, g) => total + g.amount, 0);

  let speed = species?.speed ?? 30;
  speed += grantsOf(grants, 'speed').reduce((total, g) => total + g.amount, 0);

  // Heavy armour you lack the Strength for costs 10 feet of speed.
  const armor = armorOf(equipped);
  if (armor?.strengthRequirement && abilities.str.score < armor.strengthRequirement) speed -= 10;

  const darkvision = grantsOf(grants, 'darkvision').map((g) => g.range);
  const senses = darkvision.length > 0 ? [`Darkvision ${Math.max(...darkvision)} ft.`] : [];

  const resistances = [...new Set(grantsOf(grants, 'resistance').map((g) => g.damageType))].sort();

  return {
    ac,
    acBreakdown: breakdown,
    initiative,
    initiativeProficient,
    speed,
    hpMax: deriveHitPoints(charClass, build.level, abilities.con.mod, build.hp.rolled, grants),
    hitDice: { count: build.level, die: charClass.hitDie },
    resistances: resistances.map((type) => resistanceName(type, content)),
    senses,
    stealthDisadvantage,
  };
}

function resistanceName(damageType: string, content: ContentPack): string {
  return content.damageTypes.find((d) => d.id === damageType)?.name ?? damageType;
}
