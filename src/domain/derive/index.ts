import type { ContentPack, Item } from '../schema/content';
import type { CharacterBuild, CharacterSheet, EquipmentLine } from '../schema/character';
import { activeFeatures, classOf, proficiencyBonus as pbOf, subclassOf } from '../progression';
import { validateBuild } from '../validate';
import { deriveAbilities } from './abilities';
import { deriveAttacks } from './attacks';
import { deriveDefenses } from './defenses';
import { collectGrants, grantsOf } from './grants';
import { deriveProficiencies } from './proficiency';
import { derivePassive, deriveSaves, deriveSkills } from './skills';
import { deriveSpellcasting } from './spellcasting';

/**
 * The whole engine: raw choices in, a fully derived sheet out.
 *
 * Pure - no React, no DOM, no content imported directly. Cheap enough to re-run on every keystroke,
 * which is what lets the UI keep zero derived state.
 */
export function deriveSheet(build: CharacterBuild, content: ContentPack): CharacterSheet {
  const charClass = classOf(build, content);
  const subclass = subclassOf(build, content);
  const species = content.species.find((s) => s.id === build.speciesId);
  const lineage = species?.lineages.find((l) => l.id === build.lineageId);
  const background = content.backgrounds.find((b) => b.id === build.backgroundId);

  const grants = collectGrants(build, content);
  const abilities = deriveAbilities(build, grants);
  const proficiencyBonus = charClass ? pbOf(charClass, build.level) : 2 + Math.floor((build.level - 1) / 4);
  const proficiencies = deriveProficiencies(build, content, grants);

  const itemById = new Map(content.items.map((i) => [i.id, i]));
  const equipment: EquipmentLine[] = build.equipment.flatMap((entry) => {
    const item = itemById.get(entry.itemId);
    if (!item) return [];
    return [
      {
        itemId: item.id,
        name: item.name,
        quantity: entry.quantity,
        weight: item.weight,
        cost: item.cost,
        equipped: entry.equipped,
      },
    ];
  });

  const equipped: Item[] = build.equipment
    .filter((entry) => entry.equipped)
    .flatMap((entry) => {
      const item = itemById.get(entry.itemId);
      return item ? [item] : [];
    });

  const skills = deriveSkills(content, abilities, proficiencies, proficiencyBonus);
  const spellcasting = charClass
    ? deriveSpellcasting(build, content, charClass, abilities, proficiencyBonus)
    : undefined;

  const { attacks, masteries } = deriveAttacks(
    build,
    content,
    abilities,
    proficiencyBonus,
    proficiencies,
    equipped,
    spellcasting?.attackBonus,
    spellcasting?.saveDc,
  );

  const extraAttack = grantsOf(grants, 'extra-attack').reduce((best, g) => Math.max(best, g.count), 1);

  const defenses = charClass
    ? deriveDefenses(build, content, charClass, species, abilities, proficiencyBonus, grants, equipped)
    : {
        ac: 10 + abilities.dex.mod,
        acBreakdown: `Base 10 + Dex ${abilities.dex.mod}`,
        initiative: abilities.dex.mod,
        initiativeProficient: false,
        speed: species?.speed ?? 30,
        hpMax: 0,
        hitDice: { count: build.level, die: 8 },
        resistances: [],
        senses: [],
        stealthDisadvantage: false,
      };

  return {
    identity: {
      name: build.name,
      className: charClass?.name ?? '',
      ...(subclass ? { subclassName: subclass.name } : {}),
      level: build.level,
      speciesName: species?.name ?? '',
      ...(lineage ? { lineageName: lineage.name } : {}),
      backgroundName: background?.name ?? '',
      ...(build.details.alignment ? { alignment: build.details.alignment } : {}),
      ...(build.details.playerName ? { playerName: build.details.playerName } : {}),
      ...(build.details.portraitDataUrl ? { portraitDataUrl: build.details.portraitDataUrl } : {}),
    },
    abilities,
    proficiencyBonus,
    saves: deriveSaves(charClass, abilities, proficiencyBonus),
    skills,
    passive: derivePassive(skills),
    defenses,
    attacks,
    attacksPerAction: extraAttack,
    ...(spellcasting ? { spellcasting } : {}),
    features: activeFeatures(build, content),
    proficiencies: {
      armor: proficiencies.armor,
      weapons: proficiencies.weapons,
      tools: proficiencies.tools,
      languages: proficiencies.languages,
    },
    equipment,
    currency: build.currency,
    totalWeight: equipment.reduce((total, line) => total + line.weight * line.quantity, 0),
    masteries,
    sheetOptions: build.sheetOptions,
    details: build.details,
    issues: validateBuild(build, content),
  };
}

export { deriveAbilities } from './abilities';
export { deriveAttacks, cantripDamage, isProficientWith } from './attacks';
export { deriveArmorClass, deriveHitPoints } from './defenses';
export { deriveProficiencies } from './proficiency';
export { derivePassive, deriveSaves, deriveSkills } from './skills';
export { deriveSpellcasting, spellAttackBonus, spellSaveDc, highestSlotLevel } from './spellcasting';
export { collectGrants, grantsOf } from './grants';
