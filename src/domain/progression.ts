import type { CharClass, Choice, ContentPack, Feature, Subclass } from './schema/content';
import type { CharacterBuild } from './schema/character';

/**
 * What a character has access to at their level. Everything here is read from content data - the
 * only thing this module knows is how to filter by level and assemble the choice list.
 */

export function classOf(build: CharacterBuild, content: ContentPack): CharClass | undefined {
  return content.classes.find((c) => c.id === build.classId);
}

export function subclassOf(build: CharacterBuild, content: ContentPack): Subclass | undefined {
  return build.subclassId ? content.subclasses.find((s) => s.id === build.subclassId) : undefined;
}

export function levelRow(charClass: CharClass, level: number) {
  return charClass.levels[level - 1];
}

export function proficiencyBonus(charClass: CharClass, level: number): number {
  return levelRow(charClass, level)?.proficiencyBonus ?? 2 + Math.floor((level - 1) / 4);
}

/** Masteries the character can use at their level. 0 for classes without the feature. */
export function masteryCount(charClass: CharClass, level: number): number {
  return charClass.weaponMasteryByLevel[level - 1] ?? 0;
}

/** ASI-or-feat levels reached, plus the Epic Boon level if reached. */
export function featLevelsReached(charClass: CharClass, level: number): number[] {
  const levels = charClass.featLevels.filter((l) => l <= level);
  if (charClass.epicBoonLevel !== undefined && charClass.epicBoonLevel <= level) {
    levels.push(charClass.epicBoonLevel);
  }
  return [...new Set(levels)].sort((a, b) => a - b);
}

export const featChoiceId = (classId: string, level: number) => `${classId}-feat-${level}`;
export const masteryChoiceId = (classId: string) => `${classId}-weapon-mastery`;
export const skillChoiceId = (classId: string) => `${classId}-skills`;

/**
 * Every decision the character owes at their level, assembled in one place so the wizard can render
 * them generically and the validator can check them without knowing what any of them mean.
 */
export function choicesFor(build: CharacterBuild, content: ContentPack): Choice[] {
  const charClass = classOf(build, content);
  if (!charClass) return [];

  const choices: Choice[] = [];

  if (charClass.skillChoices.count > 0) {
    choices.push({
      id: skillChoiceId(charClass.id),
      prompt: `Choose ${charClass.skillChoices.count} skills`,
      count: charClass.skillChoices.count,
      level: 1,
      unique: true,
      from: { kind: 'ref', ref: 'skills', ids: charClass.skillChoices.from },
    });
  }

  const masteries = masteryCount(charClass, build.level);
  if (masteries > 0) {
    choices.push({
      id: masteryChoiceId(charClass.id),
      prompt: `Choose ${masteries} weapons whose mastery property you can use`,
      count: masteries,
      level: 1,
      unique: true,
      from: { kind: 'ref', ref: 'weapons' },
    });
  }

  for (const level of featLevelsReached(charClass, build.level)) {
    const isEpicBoon = level === charClass.epicBoonLevel;
    choices.push({
      id: featChoiceId(charClass.id, level),
      prompt: isEpicBoon ? 'Choose an Epic Boon feat' : 'Ability Score Improvement or a feat',
      count: 1,
      level,
      unique: true,
      from: {
        kind: 'ref',
        ref: 'feats',
        ids: content.feats
          .filter((f) => (isEpicBoon ? f.category === 'epic-boon' : f.category === 'general'))
          .map((f) => f.id),
      },
    });
  }

  // Class and subclass may define their own extra decisions (fighting styles and the like).
  choices.push(...charClass.choices.filter((c) => c.level <= build.level));
  const subclass = subclassOf(build, content);
  if (subclass) choices.push(...subclass.choices.filter((c) => c.level <= build.level));

  return choices;
}

/** Class, subclass, species, lineage, background feat and taken feats - everything printable. */
export function activeFeatures(build: CharacterBuild, content: ContentPack): Feature[] {
  const features: Feature[] = [];

  const charClass = classOf(build, content);
  if (charClass) features.push(...charClass.features.filter((f) => f.level <= build.level));

  const subclass = subclassOf(build, content);
  if (subclass) features.push(...subclass.features.filter((f) => f.level <= build.level));

  const species = content.species.find((s) => s.id === build.speciesId);
  if (species) {
    features.push(...species.traits);
    const lineage = species.lineages.find((l) => l.id === build.lineageId);
    if (lineage) features.push(...lineage.traits.filter((t) => t.level <= build.level));
  }

  for (const feat of takenFeats(build, content)) {
    features.push({
      id: feat.id,
      name: feat.name,
      level: 1,
      source: 'feat',
      text: feat.text,
      grants: feat.grants,
    });
  }

  return features.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

/** The background's origin feat plus every feat taken at an ASI level. */
export function takenFeats(build: CharacterBuild, content: ContentPack) {
  const ids = new Set<string>();

  const background = content.backgrounds.find((b) => b.id === build.backgroundId);
  if (background) ids.add(background.originFeat);

  const charClass = classOf(build, content);
  if (charClass) {
    for (const level of featLevelsReached(charClass, build.level)) {
      for (const chosen of build.choices[featChoiceId(charClass.id, level)] ?? []) ids.add(chosen);
    }
  }

  return content.feats.filter((f) => ids.has(f.id));
}
