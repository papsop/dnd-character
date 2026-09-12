import type { Item } from './schema/content';

export type Weapon = Extract<Item, { kind: 'weapon' }>;

export const isWeapon = (item: Item): item is Weapon => item.kind === 'weapon';

/**
 * Matches a weapon against a proficiency entry.
 *
 * Entries arrive either as a category ("Martial Weapons") or as a plural weapon name
 * ("Longswords", "Hand crossbows"), which is how the source writes the Rogue and Monk lists.
 *
 * Shared by the attack table and the weapon mastery picker so the two can never disagree about
 * what the character is allowed to use.
 */
export function matchesWeaponProficiency(weapon: Weapon, entry: string): boolean {
  const name = weapon.name.toLowerCase();
  const value = entry.toLowerCase().trim();

  if (value === 'simple weapons') return weapon.category === 'simple';
  if (value === 'martial weapons') return weapon.category === 'martial';

  return value === name || value === `${name}s` || value.replace(/s$/, '') === name;
}

export const isProficientWithWeapon = (weapon: Weapon, entries: string[]): boolean =>
  entries.some((entry) => matchesWeaponProficiency(weapon, entry));
