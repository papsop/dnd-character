import type { Ability, CharClass, ContentPack } from '../schema/content';
import { ABILITIES } from '../schema/content';
import type { AbilityDetail, CharacterSheet, SkillDetail } from '../schema/character';
import type { Proficiencies } from './proficiency';

export function deriveSkills(
  content: ContentPack,
  abilities: Record<Ability, AbilityDetail>,
  proficiencies: Proficiencies,
  proficiencyBonus: number,
): SkillDetail[] {
  return content.skills
    .map((skill): SkillDetail => {
      const proficient = proficiencies.skills.has(skill.id);
      const expertise = proficiencies.expertise.has(skill.id);
      return {
        id: skill.id,
        name: skill.name,
        ability: skill.ability,
        proficient,
        expertise,
        mod:
          abilities[skill.ability].mod +
          (proficient ? proficiencyBonus : 0) +
          (expertise ? proficiencyBonus : 0),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function deriveSaves(
  charClass: CharClass | undefined,
  abilities: Record<Ability, AbilityDetail>,
  proficiencyBonus: number,
): CharacterSheet['saves'] {
  const proficientSaves = new Set(charClass?.savingThrows ?? []);
  const saves = {} as CharacterSheet['saves'];
  for (const ability of ABILITIES) {
    const proficient = proficientSaves.has(ability);
    saves[ability] = {
      proficient,
      mod: abilities[ability].mod + (proficient ? proficiencyBonus : 0),
    };
  }
  return saves;
}

/** Passive score is 10 + the skill modifier. Printed for the three the DM asks about most. */
export function derivePassive(skills: SkillDetail[]): CharacterSheet['passive'] {
  const modOf = (id: string) => 10 + (skills.find((s) => s.id === id)?.mod ?? 0);
  return {
    perception: modOf('perception'),
    insight: modOf('insight'),
    investigation: modOf('investigation'),
  };
}
