import type { Ability, CharClass, ContentPack } from '../schema/content';
import type { AbilityDetail, CharacterBuild, SpellcastingSheet } from '../schema/character';
import { levelRow } from '../progression';

export const spellSaveDc = (proficiencyBonus: number, abilityMod: number) => 8 + proficiencyBonus + abilityMod;
export const spellAttackBonus = (proficiencyBonus: number, abilityMod: number) => proficiencyBonus + abilityMod;

/** The highest spell level the character can cast. Pact Magic counts as its own slot level. */
export function highestSlotLevel(sheet: SpellcastingSheet | undefined): number {
  if (!sheet) return 0;
  const fromSlots = sheet.slots.reduce((best, count, index) => (count > 0 ? index + 1 : best), 0);
  return Math.max(fromSlots, sheet.pact?.level ?? 0);
}

export function deriveSpellcasting(
  build: CharacterBuild,
  content: ContentPack,
  charClass: CharClass,
  abilities: Record<Ability, AbilityDetail>,
  proficiencyBonus: number,
): SpellcastingSheet | undefined {
  const spellcasting = charClass.spellcasting;
  if (!spellcasting) return undefined;

  const row = levelRow(charClass, build.level)?.spellcasting;
  if (!row) return undefined;

  const abilityMod = abilities[spellcasting.ability].mod;
  const spellById = new Map(content.spells.map((s) => [s.id, s]));
  const resolve = (ids: string[]) =>
    ids.map((id) => spellById.get(id)).filter((s): s is NonNullable<typeof s> => s !== undefined);

  return {
    ability: spellcasting.ability,
    saveDc: spellSaveDc(proficiencyBonus, abilityMod),
    attackBonus: spellAttackBonus(proficiencyBonus, abilityMod),
    cantripsKnown: row.cantripsKnown,
    preparedMax: row.preparedSpells,
    ritual: spellcasting.ritual,
    slots: row.slots,
    ...(row.pactSlots && row.pactSlotLevel
      ? { pact: { count: row.pactSlots, level: row.pactSlotLevel } }
      : {}),
    cantrips: resolve(build.spells.cantrips).sort((a, b) => a.name.localeCompare(b.name)),
    prepared: resolve(build.spells.prepared).sort(
      (a, b) => a.level - b.level || a.name.localeCompare(b.name),
    ),
  };
}
