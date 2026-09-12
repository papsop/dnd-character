/**
 * Normalizes the vendored SRD 5.2.1 sources into src/content/*.json.
 *
 * Run with `npm run content:build`. Output is committed, so the app never fetches at runtime.
 * Any validation or integrity failure aborts - a partial content pack would produce plausible,
 * wrong character sheets, which is far worse than a broken build.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { contentPackSchema, type ContentPack } from '../src/domain/schema/content';
import { SRD_ATTRIBUTION } from '../src/attribution';
import { FEAT_GRANTS, GRANTS } from './data/grants';
import { BACKGROUND_TOOL, SPECIES_SIZE, SPELL_TEXT } from './data/patches';
import { loadJson, sortById } from './lib/raw';
import { mapItems, mapMasteries, mapNamedText, mapSkills } from './mappers/core';
import {
  mapBackgrounds,
  mapClasses,
  mapFeats,
  mapSpecies,
  mapSubclasses,
  usedGrantKeys,
  usedPatchKeys,
} from './mappers/characters';
import { mapSpells, usedSpellPatchKeys } from './mappers/spells';

const OUT_DIR = join(process.cwd(), 'src', 'content');
const DB = '5e-database/';

const problems: string[] = [];
const fail = (message: string) => problems.push(message);

// --- Load ----------------------------------------------------------------------

const raw = {
  skills: loadJson(`${DB}5e-SRD-Skills.json`),
  species: loadJson(`${DB}5e-SRD-Species.json`),
  subspecies: loadJson(`${DB}5e-SRD-Subspecies.json`),
  traits: loadJson(`${DB}5e-SRD-Traits.json`),
  classes: loadJson(`${DB}5e-SRD-Classes.json`),
  levels: loadJson(`${DB}5e-SRD-Levels.json`),
  features: loadJson(`${DB}5e-SRD-Features.json`),
  subclasses: loadJson(`${DB}5e-SRD-Subclasses.json`),
  backgrounds: loadJson(`${DB}5e-SRD-Backgrounds.json`),
  feats: loadJson(`${DB}5e-SRD-Feats.json`),
  equipment: loadJson(`${DB}5e-SRD-Equipment.json`),
  masteries: loadJson(`${DB}5e-SRD-Weapon-Mastery-Properties.json`),
  weaponProperties: loadJson(`${DB}5e-SRD-Weapon-Properties.json`),
  conditions: loadJson(`${DB}5e-SRD-Conditions.json`),
  damageTypes: loadJson(`${DB}5e-SRD-Damage-Types.json`),
  alignments: loadJson(`${DB}5e-SRD-Alignments.json`),
  languages: loadJson(`${DB}5e-SRD-Languages.json`),
  spells: loadJson('open5e/spells-srd-2024.json'),
};

// --- Guard against 2014 data ----------------------------------------------------
// Most community 5e datasets are still 2014. These four tells are cheap and decisive;
// without them, bad source data yields a sheet that looks right and is wrong.

if (raw.species.some((s) => Array.isArray(s.ability_bonuses) && s.ability_bonuses.length > 0)) {
  fail('Species carry ability score increases - this is 2014 data. 2024 moved them to Backgrounds.');
}
if (raw.backgrounds.some((b) => !Array.isArray(b.ability_scores) || b.ability_scores.length !== 3)) {
  fail('A background lacks its three ability score options - this is 2014 data.');
}
if (!raw.equipment.some((e) => e.mastery)) {
  fail('No weapon carries a mastery property - this is 2014 data.');
}
const paladin = raw.classes.find((c) => c.index === 'paladin');
if (Number(paladin?.spellcasting?.level) !== 1) {
  fail('Paladin does not gain Spellcasting at level 1 - this is 2014 data.');
}

// --- Map -------------------------------------------------------------------------

const items = sortById(mapItems(raw.equipment));
const itemNames = new Map(items.map((i) => [i.id, i.name]));

const pack: ContentPack = {
  meta: {
    source: 'SRD 5.2.1',
    sourceUrls: [
      'https://github.com/5e-bits/5e-database (src/2024/en)',
      'https://api.open5e.com/v2/spells/?document__key=srd-2024',
    ],
    license: 'CC BY 4.0',
    attribution: SRD_ATTRIBUTION,
    builtAt: new Date().toISOString().slice(0, 10),
  },
  skills: sortById(mapSkills(raw.skills)),
  species: sortById(mapSpecies(raw.species, raw.traits, raw.subspecies)),
  classes: sortById(mapClasses(raw.classes, raw.levels, raw.features, itemNames)),
  subclasses: sortById(mapSubclasses(raw.subclasses)),
  backgrounds: sortById(mapBackgrounds(raw.backgrounds, itemNames)),
  feats: sortById(mapFeats(raw.feats)),
  spells: sortById(mapSpells(raw.spells)),
  items,
  masteries: sortById(mapMasteries(raw.masteries)),
  weaponProperties: sortById(mapNamedText(raw.weaponProperties)),
  conditions: sortById(mapNamedText(raw.conditions)),
  damageTypes: sortById(mapNamedText(raw.damageTypes)),
  alignments: sortById(mapNamedText(raw.alignments)),
  languages: sortById(mapNamedText(raw.languages)),
};

// --- Validate --------------------------------------------------------------------

const parsed = contentPackSchema.safeParse(pack);
if (!parsed.success) {
  for (const issue of parsed.error.issues.slice(0, 40)) {
    fail(`schema ${issue.path.join('.')}: ${issue.message}`);
  }
  if (parsed.error.issues.length > 40) {
    fail(`...and ${parsed.error.issues.length - 40} more schema issues`);
  }
}

// --- Referential integrity --------------------------------------------------------

const ids = {
  item: new Set(items.map((i) => i.id)),
  skill: new Set(pack.skills.map((s) => s.id)),
  spell: new Set(pack.spells.map((s) => s.id)),
  feat: new Set(pack.feats.map((f) => f.id)),
  class: new Set(pack.classes.map((c) => c.id)),
  mastery: new Set(pack.masteries.map((m) => m.id)),
};

for (const cls of pack.classes) {
  if (cls.skillChoices.count > 0 && cls.skillChoices.from.length === 0) {
    fail(`${cls.id}: skill choice count ${cls.skillChoices.count} with no options`);
  }
  for (const skill of cls.skillChoices.from) {
    if (!ids.skill.has(skill)) fail(`${cls.id}: unknown skill "${skill}"`);
  }
  if (cls.proficiencies.weapons.length === 0) fail(`${cls.id}: no weapon proficiencies`);
  if (cls.startingEquipment.length === 0) fail(`${cls.id}: no starting equipment options`);
  if (!pack.subclasses.some((s) => s.classId === cls.id)) fail(`${cls.id}: no subclass`);
  for (const option of cls.startingEquipment) {
    for (const entry of option.items) {
      if (!ids.item.has(entry.itemId)) fail(`${cls.id}/${option.id}: unknown item "${entry.itemId}"`);
    }
  }
}

for (const bg of pack.backgrounds) {
  for (const skill of bg.skills) if (!ids.skill.has(skill)) fail(`${bg.id}: unknown skill "${skill}"`);
  if (!ids.feat.has(bg.originFeat)) fail(`${bg.id}: unknown origin feat "${bg.originFeat}"`);
  if (!bg.toolProficiency) fail(`${bg.id}: no tool proficiency`);
  for (const option of bg.equipment) {
    for (const entry of option.items) {
      if (!ids.item.has(entry.itemId)) fail(`${bg.id}/${option.id}: unknown item "${entry.itemId}"`);
    }
  }
}

for (const sub of pack.subclasses) {
  if (!ids.class.has(sub.classId)) fail(`${sub.id}: unknown class "${sub.classId}"`);
  if (sub.features.length === 0) fail(`${sub.id}: no features`);
}

for (const species of pack.species) {
  if (species.traits.length === 0 && species.lineages.length === 0) fail(`${species.id}: no traits`);
}

for (const item of items) {
  if (item.kind === 'weapon' && item.mastery && !ids.mastery.has(item.mastery)) {
    fail(`${item.id}: unknown mastery "${item.mastery}"`);
  }
  if (item.kind === 'pack') {
    for (const entry of item.contents) {
      if (!ids.item.has(entry.itemId)) fail(`${item.id}: pack contains unknown item "${entry.itemId}"`);
    }
  }
}

for (const spell of pack.spells) {
  for (const classId of spell.classes) {
    if (!ids.class.has(classId)) fail(`${spell.id}: unknown class "${classId}"`);
  }
}

for (const collection of Object.entries(pack)) {
  const [name, records] = collection;
  if (!Array.isArray(records)) continue;
  const seen = new Set<string>();
  for (const record of records as { id: string }[]) {
    if (seen.has(record.id)) fail(`${name}: duplicate id "${record.id}"`);
    seen.add(record.id);
  }
}

// A hand-written grant whose key no longer exists upstream is a silent loss of a rule.
for (const key of [...Object.keys(GRANTS), ...Object.keys(FEAT_GRANTS)]) {
  if (!usedGrantKeys.has(key)) fail(`grants: "${key}" matched nothing - was it renamed upstream?`);
}

// A patch that no longer applies means upstream fixed its data - drop the patch rather than
// let it keep overriding a now-correct source.
for (const key of Object.keys(SPECIES_SIZE)) {
  if (!usedPatchKeys.has(`species-size:${key}`)) fail(`patches: species size "${key}" is no longer needed`);
}
for (const key of Object.keys(BACKGROUND_TOOL)) {
  if (!usedPatchKeys.has(`background-tool:${key}`)) fail(`patches: background tool "${key}" is no longer needed`);
}
for (const key of Object.keys(SPELL_TEXT)) {
  if (!usedSpellPatchKeys.has(key)) fail(`patches: spell text "${key}" is no longer needed`);
}

// --- Emit ---------------------------------------------------------------------------

if (problems.length > 0) {
  console.error(`\nContent build failed with ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, value] of Object.entries(pack)) {
  writeFileSync(join(OUT_DIR, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const textOnlyFeatures = pack.classes
  .flatMap((c) => c.features)
  .concat(pack.subclasses.flatMap((s) => s.features))
  .concat(pack.species.flatMap((s) => [...s.traits, ...s.lineages.flatMap((l) => l.traits)]))
  .filter((f) => f.grants.length === 0).length;

console.log('\nContent build OK\n');
for (const [name, value] of Object.entries(pack)) {
  if (Array.isArray(value)) console.log(`  ${name.padEnd(18)} ${String(value.length).padStart(4)}`);
}
console.log(`\n  ${textOnlyFeatures} features are text-only (no machine-readable grant).`);
console.log('  That is expected for most; watch the number, do not chase it to zero.\n');
