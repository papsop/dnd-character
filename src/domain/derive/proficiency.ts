import type { ContentPack, Grant } from '../schema/content';
import type { CharacterBuild } from '../schema/character';
import { classOf, skillChoiceId } from '../progression';
import { grantsOf } from './grants';

export type Proficiencies = {
  skills: Set<string>;
  expertise: Set<string>;
  armor: string[];
  weapons: string[];
  tools: string[];
  languages: string[];
  /** Skills granted by more than one source. The player wasted a pick and should re-choose. */
  duplicateSkills: string[];
};

const unique = (values: string[]): string[] => [...new Set(values)];

/**
 * Gathers proficiencies from every source and de-duplicates them.
 *
 * Duplicates matter: a class skill pick that collides with a background grant is not illegal, but it
 * silently wastes the pick, which is the most common way a sheet ends up quietly wrong. We record
 * the collision so the wizard can prompt for a different skill.
 */
export function deriveProficiencies(
  build: CharacterBuild,
  content: ContentPack,
  grants: Grant[],
): Proficiencies {
  const skills = new Set<string>();
  const duplicateSkills: string[] = [];

  const addSkill = (skillId: string) => {
    if (skills.has(skillId)) duplicateSkills.push(skillId);
    else skills.add(skillId);
  };

  const background = content.backgrounds.find((b) => b.id === build.backgroundId);
  background?.skills.forEach(addSkill);

  grantsOf(grants, 'skill-proficiency').forEach((g) => addSkill(g.skill));

  const charClass = classOf(build, content);
  if (charClass) {
    for (const skillId of build.choices[skillChoiceId(charClass.id)] ?? []) addSkill(skillId);
  }

  const armor = [...(charClass?.proficiencies.armor ?? []), ...grantsOf(grants, 'armor-proficiency').map((g) => g.value)];
  const weapons = [...(charClass?.proficiencies.weapons ?? []), ...grantsOf(grants, 'weapon-proficiency').map((g) => g.value)];
  const tools = [
    ...(charClass?.proficiencies.tools ?? []),
    ...(background?.toolProficiency ? [background.toolProficiency] : []),
    ...grantsOf(grants, 'tool-proficiency').map((g) => g.value),
  ];

  return {
    skills,
    expertise: new Set(grantsOf(grants, 'skill-expertise').map((g) => g.skill)),
    armor: unique(armor),
    weapons: unique(weapons),
    tools: unique(tools),
    languages: unique(['Common', ...grantsOf(grants, 'language').map((g) => g.value)]),
    duplicateSkills,
  };
}

/** True when the character is proficient with the given armor category. */
export function hasArmorProficiency(proficiencies: Proficiencies, armorType: string): boolean {
  return proficiencies.armor.some((value) => {
    const normalized = value.toLowerCase();
    if (normalized === 'all armor') return armorType !== 'shield';
    if (armorType === 'shield') return normalized.includes('shield');
    return normalized.includes(armorType);
  });
}
