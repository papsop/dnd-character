import { contentPackSchema, type ContentPack } from '../domain/schema/content';
import meta from './meta.json';
import skills from './skills.json';
import species from './species.json';
import classes from './classes.json';
import subclasses from './subclasses.json';
import backgrounds from './backgrounds.json';
import feats from './feats.json';
import spells from './spells.json';
import items from './items.json';
import masteries from './masteries.json';
import weaponProperties from './weaponProperties.json';
import conditions from './conditions.json';
import damageTypes from './damageTypes.json';
import alignments from './alignments.json';
import languages from './languages.json';

const raw = {
  meta,
  skills,
  species,
  classes,
  subclasses,
  backgrounds,
  feats,
  spells,
  items,
  masteries,
  weaponProperties,
  conditions,
  damageTypes,
  alignments,
  languages,
};

/**
 * The SRD 5.2.1 content pack.
 *
 * The build already validated this JSON, so production trusts it and skips the parse - it is a
 * meaningful chunk of startup time. Development and tests re-parse, so a hand-edit to a JSON file
 * fails immediately instead of surfacing as a wrong number on a printed sheet.
 */
export const contentPack: ContentPack = import.meta.env.DEV
  ? contentPackSchema.parse(raw)
  : (raw as unknown as ContentPack);

export const byId = <T extends { id: string }>(records: readonly T[]): Map<string, T> =>
  new Map(records.map((record) => [record.id, record]));

export const classesById = byId(contentPack.classes);
export const speciesById = byId(contentPack.species);
export const backgroundsById = byId(contentPack.backgrounds);
export const spellsById = byId(contentPack.spells);
export const itemsById = byId(contentPack.items);
export const skillsById = byId(contentPack.skills);
export const featsById = byId(contentPack.feats);
export const masteriesById = byId(contentPack.masteries);

export const subclassesForClass = (classId: string) =>
  contentPack.subclasses.filter((subclass) => subclass.classId === classId);

export const spellsForClass = (classId: string) =>
  contentPack.spells.filter((spell) => spell.classes.includes(classId));
