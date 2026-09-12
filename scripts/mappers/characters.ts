import type {
  Background,
  CharClass,
  ClassLevel,
  EquipmentOption,
  Feat,
  Feature,
  Species,
  Subclass,
} from '../../src/domain/schema/content';
import { FEAT_GRANTS, GRANTS } from '../data/grants';
import { BACKGROUND_TOOL, SPECIES_SIZE } from '../data/patches';
import { levelFromIndex, normalizeText, paragraphs, toAbility, toId, type Raw } from '../lib/raw';

/** Records which hand-written grant keys were actually matched, so stale ones can be reported. */
export const usedGrantKeys = new Set<string>();

/** Patch keys that were actually applied, so a patch upstream has since fixed fails the build. */
export const usedPatchKeys = new Set<string>();

function grantsFor(id: string, table: Record<string, Feature['grants']>): Feature['grants'] {
  const grants = table[id];
  if (!grants) return [];
  usedGrantKeys.add(id);
  return grants;
}

function feature(r: Raw, source: Feature['source'], level: number): Feature {
  const id = toId(r.index ?? `${source}-${r.name}`);
  return {
    id,
    name: String(r.name),
    level,
    source,
    text: paragraphs(r.description ?? r.desc),
    grants: grantsFor(id, GRANTS),
  };
}

// --- Equipment options ---------------------------------------------------------

type FlatOption = {
  items: { itemId: string; quantity: number }[];
  gold: number;
  pendingChoices: EquipmentOption['pendingChoices'];
};

function categoryIdsOf(choice: Raw): string[] {
  const from = choice.from ?? {};
  if (from.option_set_type === 'equipment_category') return [toId(from.equipment_category.index)];
  return (from.options ?? []).flatMap((o: Raw) => (o.option_type === 'choice' ? categoryIdsOf(o.choice) : []));
}

function flatten(node: Raw, acc: FlatOption): void {
  switch (node.option_type) {
    case 'counted_reference': {
      // Some entries point at a whole category ("Holy Symbols") rather than one item.
      // The player picks; the URL is what tells the two apart.
      if (String(node.of.url ?? '').includes('/equipment-categories/')) {
        acc.pendingChoices.push({
          prompt: `Choose ${String(node.of.name)}`,
          categoryIds: [toId(node.of.index)],
          count: Number(node.count),
        });
        return;
      }
      acc.items.push({ itemId: toId(node.of.index), quantity: Number(node.count) });
      return;
    }
    case 'money':
      acc.gold += Number(node.count);
      return;
    case 'multiple':
      (node.items ?? []).forEach((item: Raw) => flatten(item, acc));
      return;
    case 'choice': {
      const categoryIds = categoryIdsOf(node.choice);
      if (categoryIds.length > 0) {
        acc.pendingChoices.push({
          prompt: String(node.choice.desc),
          categoryIds,
          count: Number(node.choice.choose ?? 1),
        });
      }
      return;
    }
    default:
      throw new Error(`Unhandled equipment option_type: ${String(node.option_type)}`);
  }
}

function labelFor(option: FlatOption, itemNames: Map<string, string>): string {
  const parts = option.items.map(
    (i) => `${i.quantity > 1 ? `${i.quantity} ` : ''}${itemNames.get(i.itemId) ?? i.itemId}`,
  );
  option.pendingChoices.forEach((c) => parts.push(c.prompt));
  if (option.gold > 0) parts.push(`${option.gold} GP`);
  return parts.join(', ') || 'Nothing';
}

export function mapEquipmentOptions(
  raw: Raw[] | undefined,
  prefix: string,
  itemNames: Map<string, string>,
): EquipmentOption[] {
  const group = (raw ?? [])[0];
  const options: Raw[] = group?.from?.options ?? [];
  return options.map((node, index) => {
    const flat: FlatOption = { items: [], gold: 0, pendingChoices: [] };
    flatten(node, flat);
    return {
      id: `${prefix}-kit-${String.fromCharCode(97 + index)}`,
      label: labelFor(flat, itemNames),
      items: flat.items,
      gold: flat.gold,
      pendingChoices: flat.pendingChoices,
    };
  });
}

// --- Species -------------------------------------------------------------------

function speciesSize(s: Raw): Species['size'] {
  const patch = SPECIES_SIZE[String(s.index)];
  if (patch) {
    if (s.size !== undefined) {
      throw new Error(`Species ${String(s.index)} now has a size upstream - drop the patch`);
    }
    usedPatchKeys.add(`species-size:${String(s.index)}`);
    return patch;
  }
  const sizes = (Array.isArray(s.size) ? s.size : [s.size]).map((x: unknown) => String(x));
  return sizes as Species['size'];
}

export function mapSpecies(rawSpecies: Raw[], rawTraits: Raw[], rawSubspecies: Raw[]): Species[] {
  const traitByIndex = new Map(rawTraits.map((t) => [String(t.index), t]));

  return rawSpecies.map((s): Species => {
    const speciesId = String(s.index);
    const subspecies = rawSubspecies.filter((sub) => String(sub.species.index) === speciesId);

    // Traits owned by a lineage belong to that lineage, not to the species as a whole.
    const lineageTraitIndexes = new Set(
      subspecies.flatMap((sub) => (sub.traits ?? []).map((t: Raw) => String(t.index))),
    );

    const traits = rawTraits
      .filter((t) => (t.species ?? []).some((sp: Raw) => String(sp.index) === speciesId))
      .filter((t) => !lineageTraitIndexes.has(String(t.index)))
      .map((t) => feature(t, 'species', 1));

    return {
      id: toId(s.index),
      name: String(s.name),
      size: speciesSize(s),
      speed: Number(s.speed),
      traits,
      lineages: subspecies.map((sub) => ({
        id: toId(sub.index),
        name: String(sub.name),
        traits: (sub.traits ?? []).map((ref: Raw) => {
          const full = traitByIndex.get(String(ref.index));
          if (!full) throw new Error(`Lineage ${String(sub.index)} references unknown trait ${String(ref.index)}`);
          return feature(full, 'species', Number(ref.level ?? 1));
        }),
      })),
    };
  });
}

// --- Classes -------------------------------------------------------------------

function classifyProficiency(index: string, name: string): 'armor' | 'weapons' | 'tools' | null {
  if (index.startsWith('saving-throw') || index.startsWith('skill-')) return null;
  if (/armor|shield/i.test(name)) return 'armor';
  if (index.startsWith('tool-') || /kit|supplies|tools|instrument|set/i.test(name)) return 'tools';
  return 'weapons';
}

function spellcastingProgression(levels: ClassLevel[], classId: string): 'full' | 'half' | 'third' | 'pact' {
  if (classId === 'warlock') return 'pact';
  const top = levels[19];
  const highestSlot = top?.spellcasting ? top.spellcasting.slots.findLastIndex((n) => n > 0) + 1 : 0;
  if (highestSlot >= 9) return 'full';
  if (highestSlot >= 4) return 'half';
  return 'third';
}

function mapLevels(rows: Raw[], classId: string): ClassLevel[] {
  const levels = rows
    // Subclass progression rows share this file and carry a `subclass`; they are not class levels.
    .filter((r) => String(r.class.index) === classId && !r.subclass)
    .sort((a, b) => Number(a.level) - Number(b.level))
    .map((r): ClassLevel => {
      const sc = r.spellcasting;
      const slots: number[] = sc
        ? Array.from({ length: 9 }, (_, i) => Number(sc[`spell_slots_level_${i + 1}`] ?? 0))
        : [];

      // Warlock slots are Pact Magic: one level, all slots at it, back on a short rest.
      const pactLevel = classId === 'warlock' ? slots.findLastIndex((n) => n > 0) + 1 : 0;

      return {
        level: Number(r.level),
        proficiencyBonus: Number(r.prof_bonus),
        featureIds: (r.features ?? []).map((f: Raw) => toId(f.index)),
        ...(sc
          ? {
              spellcasting: {
                cantripsKnown: Number(sc.cantrips_known ?? 0),
                preparedSpells: Number(sc.prepared_spells ?? 0),
                slots,
                ...(pactLevel > 0
                  ? { pactSlots: Number(slots[pactLevel - 1]), pactSlotLevel: pactLevel }
                  : {}),
              },
            }
          : {}),
      };
    });

  if (levels.length !== 20) throw new Error(`${classId} has ${levels.length} level rows, expected 20`);
  return levels;
}

/** Some classes list one primary ability, others offer a choice ("Strength or Dexterity"). */
function primaryAbilities(c: Raw): CharClass['primaryAbility'] {
  const direct = c.primary_ability?.ability_scores ?? [];
  if (direct.length > 0) return direct.map((a: Raw) => toAbility(a.index));
  const options = c.primary_ability?.ability_score_options?.from?.options ?? [];
  if (options.length === 0) throw new Error(`${String(c.index)}: no primary ability`);
  return options.map((o: Raw) => toAbility(o.item.index));
}

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

/**
 * Levels granting an ASI or a feat. The level-4 feature's own text enumerates the rest
 * ("You gain this feature again at Fighter levels 6, 8, 12, 14, and 16"), which is why this is read
 * rather than hardcoded - Fighter and Rogue get extra ones.
 */
function featLevels(classFeatures: Raw[], classId: string): number[] {
  const asi = classFeatures.find((f) => /ability score improvement/i.test(String(f.name)));
  if (!asi) throw new Error(`${classId}: no Ability Score Improvement feature`);

  const levels = new Set<number>([levelFromIndex(asi.level.index)]);
  const text = normalizeText(String(asi.description)).replace(/\band\b/g, ' ');
  const match = /again at [A-Za-z]+ levels? ([0-9,\s]+)/i.exec(text);
  for (const part of (match?.[1] ?? '').split(',')) {
    const level = Number(part.trim());
    if (Number.isInteger(level) && level >= 1 && level <= 20) levels.add(level);
  }
  return [...levels].sort((a, b) => a - b);
}

/**
 * Masteries usable at each level. Barbarian and Fighter scale and carry per-level counts upstream;
 * the other mastery classes state a flat count in their feature text.
 */
function weaponMasteryByLevel(rows: Raw[], classFeatures: Raw[], classId: string): number[] {
  const feature = classFeatures.find((f) => /^weapon mastery$/i.test(String(f.name)));
  if (!feature) return Array.from({ length: 20 }, () => 0);

  const fromLevel = levelFromIndex(feature.level.index);
  const perLevel = rows.map((r) => Number(r.class_specific?.weapon_mastery ?? 0));
  if (perLevel.some((n) => n > 0)) return perLevel;

  const stated = /mastery properties of (\w+) kinds/i.exec(normalizeText(String(feature.description)));
  const count = WORD_NUMBERS[String(stated?.[1] ?? '').toLowerCase()];
  if (!count) throw new Error(`${classId}: cannot read a weapon mastery count from its feature text`);
  return Array.from({ length: 20 }, (_, i) => (i + 1 >= fromLevel ? count : 0));
}

export function mapClasses(
  rawClasses: Raw[],
  rawLevels: Raw[],
  rawFeatures: Raw[],
  itemNames: Map<string, string>,
): CharClass[] {
  return rawClasses.map((c): CharClass => {
    const classId = String(c.index);
    const levels = mapLevels(rawLevels, classId);

    const proficiencies = { armor: [] as string[], weapons: [] as string[], tools: [] as string[] };
    for (const p of c.proficiencies ?? []) {
      const bucket = classifyProficiency(String(p.index), String(p.name));
      if (bucket) proficiencies[bucket].push(String(p.name));
    }

    const skillChoice = (c.proficiency_choices ?? []).find((pc: Raw) =>
      (pc.from?.options ?? []).some((o: Raw) => String(o.item?.index ?? '').startsWith('skill-')),
    );

    const ownFeatures = rawFeatures.filter((f) => String(f.class?.index) === classId);
    const features = ownFeatures.map((f) => feature(f, 'class', levelFromIndex(f.level.index)));
    const epicBoon = ownFeatures.find((f) => /epic boon/i.test(String(f.name)));
    const levelRows = rawLevels.filter((r) => String(r.class.index) === classId && !r.subclass)
      .sort((a, b) => Number(a.level) - Number(b.level));

    const sc = c.spellcasting;

    return {
      id: toId(c.index),
      name: String(c.name),
      hitDie: Number(c.hit_die) as CharClass['hitDie'],
      primaryAbility: primaryAbilities(c),
      savingThrows: (c.saving_throws ?? []).map((a: Raw) => toAbility(a.index)) as CharClass['savingThrows'],
      proficiencies,
      skillChoices: {
        count: Number(skillChoice?.choose ?? 0),
        from: (skillChoice?.from?.options ?? []).map((o: Raw) =>
          toId(String(o.item.index).replace(/^skill-/, '')),
        ),
      },
      startingEquipment: mapEquipmentOptions(c.starting_equipment_options, classId, itemNames),
      // Every class in this SRD picks a subclass at 3, but read it from data rather than assume.
      subclassLevel: 3,
      ...(sc
        ? {
            spellcasting: {
              ability: toAbility(sc.spellcasting_ability.index),
              progression: spellcastingProgression(levels, classId),
              prepares: 'prepared' as const,
              ritual: /ritual/i.test(JSON.stringify(sc.info ?? [])),
            },
          }
        : {}),
      featLevels: featLevels(ownFeatures, classId),
      ...(epicBoon ? { epicBoonLevel: levelFromIndex(epicBoon.level.index) } : {}),
      weaponMasteryByLevel: weaponMasteryByLevel(levelRows, ownFeatures, classId),
      features,
      choices: [],
      levels,
    };
  });
}

export function mapSubclasses(raw: Raw[]): Subclass[] {
  return raw.map((s): Subclass => ({
    id: toId(s.index),
    name: String(s.name),
    classId: toId(s.class.index),
    text: paragraphs(s.description),
    features: (s.features ?? []).map((f: Raw) =>
      feature({ ...f, index: toId(`${s.index}-${f.name}`) }, 'subclass', Number(f.level)),
    ),
    choices: [],
  }));
}

function backgroundTool(b: Raw, tool: Raw | undefined): string {
  const patch = BACKGROUND_TOOL[String(b.index)];
  if (patch) {
    if (tool) throw new Error(`Background ${String(b.index)} now has a tool upstream - drop the patch`);
    usedPatchKeys.add(`background-tool:${String(b.index)}`);
    return patch;
  }
  return String(tool?.name ?? '').replace(/^Tool:\s*/, '');
}

export function mapBackgrounds(raw: Raw[], itemNames: Map<string, string>): Background[] {
  return raw.map((b): Background => {
    const profs: Raw[] = b.proficiencies ?? [];
    const skills = profs
      .filter((p) => String(p.index).startsWith('skill-'))
      .map((p) => toId(String(p.index).replace(/^skill-/, '')));
    const tool = profs.find((p) => String(p.index).startsWith('tool-'));

    return {
      id: toId(b.index),
      name: String(b.name),
      abilityOptions: (b.ability_scores ?? []).map((a: Raw) => toAbility(a.index)) as Background['abilityOptions'],
      skills: skills as Background['skills'],
      toolProficiency: backgroundTool(b, tool),
      originFeat: toId(b.feat.index),
      equipment: mapEquipmentOptions(b.equipment_options, String(b.index), itemNames),
    };
  });
}

export function mapFeats(raw: Raw[]): Feat[] {
  return raw.map((f): Feat => {
    const id = toId(f.index);
    return {
      id,
      name: String(f.name),
      category: String(f.type) as Feat['category'],
      text: paragraphs(f.description),
      grants: grantsFor(id, FEAT_GRANTS),
      choices: [],
    };
  });
}
