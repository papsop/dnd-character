import { z } from 'zod';

/** Ability keys. Order matters - it is the order they print on the sheet. */
export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export const abilitySchema = z.enum(ABILITIES);
export type Ability = z.infer<typeof abilitySchema>;

/** A stable, lowercase-kebab identifier, unique within its collection. */
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lowercase-kebab-case');

/** Rules text, one entry per paragraph. Never HTML, never Markdown. */
const text = z.array(z.string().min(1));

export const diceSchema = z.object({
  count: z.number().int().positive(),
  die: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12), z.literal(20), z.literal(100)]),
  bonus: z.number().int().optional(),
});
export type Dice = z.infer<typeof diceSchema>;

/**
 * A machine-readable effect. The derive layer consumes only these - it never reads rules text.
 * A feature with no expressible grant still prints its text; that is fine and expected.
 */
export const grantSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('skill-proficiency'), skill: id }),
  z.object({ kind: z.literal('skill-expertise'), skill: id }),
  z.object({ kind: z.literal('save-proficiency'), ability: abilitySchema }),
  z.object({ kind: z.literal('armor-proficiency'), value: z.string() }),
  z.object({ kind: z.literal('weapon-proficiency'), value: z.string() }),
  z.object({ kind: z.literal('tool-proficiency'), value: z.string() }),
  z.object({ kind: z.literal('language'), value: z.string() }),
  z.object({ kind: z.literal('ability-increase'), ability: abilitySchema, amount: z.number().int() }),
  z.object({ kind: z.literal('speed'), amount: z.number().int() }),
  z.object({ kind: z.literal('darkvision'), range: z.number().int().positive() }),
  z.object({ kind: z.literal('resistance'), damageType: z.string() }),
  z.object({ kind: z.literal('unarmored-defense'), ability: abilitySchema }),
  z.object({ kind: z.literal('ac-bonus'), amount: z.number().int() }),
  z.object({ kind: z.literal('hp-per-level'), amount: z.number().int() }),
  z.object({ kind: z.literal('initiative-bonus'), amount: z.number().int() }),
  z.object({ kind: z.literal('initiative-proficiency') }),
  z.object({ kind: z.literal('extra-attack'), count: z.number().int().positive() }),
  z.object({ kind: z.literal('spell'), spellId: id, atWill: z.boolean().optional(), per: z.enum(['long-rest', 'short-rest']).optional() }),
  z.object({ kind: z.literal('cantrip-choice'), count: z.number().int().positive(), spellListId: id }),
  z.object({ kind: z.literal('weapon-mastery'), count: z.number().int().positive() }),
]);
export type Grant = z.infer<typeof grantSchema>;

/** The unit of printable rules text. Everything on the back of the sheet is one of these. */
export const featureSchema = z.object({
  id,
  name: z.string().min(1),
  level: z.number().int().min(1).max(20),
  source: z.enum(['class', 'subclass', 'species', 'background', 'feat']),
  text,
  uses: z
    .object({
      count: z.union([z.number().int().positive(), z.literal('pb'), z.literal('ability-mod')]),
      per: z.enum(['short-rest', 'long-rest', 'day']),
      ability: abilitySchema.optional(),
    })
    .optional(),
  grants: z.array(grantSchema).default([]),
});
export type Feature = z.infer<typeof featureSchema>;

/** A decision the player must make. The wizard renders these generically. */
export const choiceSchema = z.object({
  id,
  prompt: z.string().min(1),
  count: z.number().int().positive(),
  level: z.number().int().min(1).max(20).default(1),
  unique: z.boolean().default(true),
  from: z.union([
    z.object({
      kind: z.literal('inline'),
      options: z.array(
        z.object({
          id,
          name: z.string().min(1),
          text: text.optional(),
          grants: z.array(grantSchema).default([]),
        }),
      ),
    }),
    z.object({
      kind: z.literal('ref'),
      ref: z.enum(['skills', 'spells', 'weapons', 'feats', 'tools', 'languages']),
      ids: z.array(id).optional(),
    }),
  ]),
});
export type Choice = z.infer<typeof choiceSchema>;

export const equipmentOptionSchema = z.object({
  id,
  label: z.string().min(1),
  items: z.array(z.object({ itemId: id, quantity: z.number().int().positive() })).default([]),
  gold: z.number().int().nonnegative().default(0),
  /**
   * Picks the kit leaves open - the Monk's "Artisan's Tools or Musical Instrument", for instance.
   * The equipment step resolves these against the named category. Dropping them instead would
   * silently cost the character an item.
   */
  pendingChoices: z
    .array(
      z.object({
        prompt: z.string().min(1),
        categoryIds: z.array(id).min(1),
        count: z.number().int().positive(),
      }),
    )
    .default([]),
});

export const skillSchema = z.object({ id, name: z.string().min(1), ability: abilitySchema });

export const speciesSchema = z.object({
  id,
  name: z.string().min(1),
  size: z.array(z.enum(['Tiny', 'Small', 'Medium', 'Large'])).min(1),
  speed: z.number().int().positive(),
  traits: z.array(featureSchema),
  lineages: z
    .array(z.object({ id, name: z.string().min(1), traits: z.array(featureSchema) }))
    .default([]),
});

/** Per-level class table row: proficiency bonus, spell slots, and whatever else the class tracks. */
export const classLevelSchema = z.object({
  level: z.number().int().min(1).max(20),
  proficiencyBonus: z.number().int().min(2).max(6),
  featureIds: z.array(id).default([]),
  spellcasting: z
    .object({
      cantripsKnown: z.number().int().nonnegative(),
      preparedSpells: z.number().int().nonnegative(),
      slots: z.array(z.number().int().nonnegative()).length(9),
      pactSlots: z.number().int().nonnegative().optional(),
      pactSlotLevel: z.number().int().min(1).max(5).optional(),
    })
    .optional(),
});

export const classSchema = z.object({
  id,
  name: z.string().min(1),
  hitDie: z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
  primaryAbility: z.array(abilitySchema).min(1),
  savingThrows: z.array(abilitySchema).length(2),
  proficiencies: z.object({
    armor: z.array(z.string()).default([]),
    weapons: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
  }),
  skillChoices: z.object({ count: z.number().int().nonnegative(), from: z.array(id) }),
  startingEquipment: z.array(equipmentOptionSchema),
  subclassLevel: z.number().int().min(1).max(20),
  spellcasting: z
    .object({
      ability: abilitySchema,
      progression: z.enum(['full', 'half', 'third', 'pact']),
      prepares: z.enum(['prepared', 'known']),
      ritual: z.boolean(),
    })
    .optional(),
  /** Levels granting an Ability Score Improvement or a feat. Read from the class's own rules text. */
  featLevels: z.array(z.number().int().min(1).max(20)),
  /** Level granting an Epic Boon feat. 19 for every class in this ruleset, but read, not assumed. */
  epicBoonLevel: z.number().int().min(1).max(20).optional(),
  /** Weapon masteries usable at each level, index 0 = level 1. All zeros for classes without it. */
  weaponMasteryByLevel: z.array(z.number().int().nonnegative()).length(20),
  features: z.array(featureSchema),
  choices: z.array(choiceSchema).default([]),
  levels: z.array(classLevelSchema).length(20),
});

export const subclassSchema = z.object({
  id,
  name: z.string().min(1),
  classId: id,
  text,
  features: z.array(featureSchema),
  choices: z.array(choiceSchema).default([]),
});

export const backgroundSchema = z.object({
  id,
  name: z.string().min(1),
  abilityOptions: z.array(abilitySchema).length(3),
  skills: z.array(id).length(2),
  toolProficiency: z.string(),
  originFeat: id,
  equipment: z.array(equipmentOptionSchema),
});

export const featSchema = z.object({
  id,
  name: z.string().min(1),
  category: z.enum(['origin', 'general', 'fighting-style', 'epic-boon']),
  prerequisite: z.string().optional(),
  text,
  grants: z.array(grantSchema).default([]),
  choices: z.array(choiceSchema).default([]),
});

export const spellSchema = z.object({
  id,
  name: z.string().min(1),
  level: z.number().int().min(0).max(9),
  school: z.string().min(1),
  castingTime: z.string().min(1),
  reactionCondition: z.string().optional(),
  range: z.string().min(1),
  components: z.object({ v: z.boolean(), s: z.boolean(), m: z.string().optional() }),
  duration: z.string().min(1),
  concentration: z.boolean(),
  ritual: z.boolean(),
  text,
  atHigherLevels: z.string().optional(),
  damageRoll: z.string().optional(),
  damageTypes: z.array(z.string()).default([]),
  save: abilitySchema.optional(),
  /**
   * Whether casting it calls for a spell attack roll. The source records only that much - melee
   * versus ranged is not distinguished - and the spell's own range line tells the player which.
   */
  attackRoll: z.boolean().default(false),
  /**
   * How the spell grows. Cantrips scale with character level, levelled spells with the slot used.
   * Kept as data because the growth is not uniform - Fire Bolt gains dice, Eldritch Blast gains
   * beams - and guessing a rule of thumb would print the wrong numbers on the sheet.
   */
  scaling: z
    .array(
      z.object({
        kind: z.enum(['character-level', 'slot-level']),
        at: z.number().int().positive(),
        damageRoll: z.string().optional(),
        targetCount: z.number().int().positive().optional(),
      }),
    )
    .default([]),
  classes: z.array(id),
});
export type Spell = z.infer<typeof spellSchema>;

const itemBase = { id, name: z.string().min(1), cost: z.number().nonnegative(), weight: z.number().nonnegative() };

export const itemSchema = z.discriminatedUnion('kind', [
  z.object({
    ...itemBase,
    kind: z.literal('weapon'),
    category: z.enum(['simple', 'martial']),
    rangeType: z.enum(['melee', 'ranged']),
    damage: diceSchema.nullable(),
    damageType: z.string(),
    versatileDamage: diceSchema.optional(),
    range: z.tuple([z.number(), z.number()]).optional(),
    /** Thrown weapons keep their melee reach and gain a throwing range; both print on the sheet. */
    thrownRange: z.tuple([z.number(), z.number()]).optional(),
    properties: z.array(z.string()).default([]),
    mastery: id.optional(),
  }),
  z.object({
    ...itemBase,
    kind: z.literal('armor'),
    armorType: z.enum(['light', 'medium', 'heavy', 'shield']),
    baseAc: z.number().int().nonnegative(),
    dexCap: z.number().int().nonnegative().optional(),
    strengthRequirement: z.number().int().positive().optional(),
    stealthDisadvantage: z.boolean(),
  }),
  z.object({ ...itemBase, kind: z.literal('gear'), text: text.default([]) }),
  z.object({
    ...itemBase,
    kind: z.literal('pack'),
    contents: z.array(z.object({ itemId: id, quantity: z.number().int().positive() })),
  }),
]);
export type Item = z.infer<typeof itemSchema>;

export const masterySchema = z.object({ id, name: z.string().min(1), text });
export const namedTextSchema = z.object({ id, name: z.string().min(1), text });

export const contentPackSchema = z.object({
  meta: z.object({
    source: z.string(),
    sourceUrls: z.array(z.string()),
    license: z.string(),
    attribution: z.string(),
    builtAt: z.string(),
  }),
  skills: z.array(skillSchema),
  species: z.array(speciesSchema),
  classes: z.array(classSchema),
  subclasses: z.array(subclassSchema),
  backgrounds: z.array(backgroundSchema),
  feats: z.array(featSchema),
  spells: z.array(spellSchema),
  items: z.array(itemSchema),
  masteries: z.array(masterySchema),
  weaponProperties: z.array(namedTextSchema),
  conditions: z.array(namedTextSchema),
  damageTypes: z.array(namedTextSchema),
  alignments: z.array(namedTextSchema),
  languages: z.array(namedTextSchema),
});
export type ContentPack = z.infer<typeof contentPackSchema>;

export type Species = z.infer<typeof speciesSchema>;
export type CharClass = z.infer<typeof classSchema>;
export type Subclass = z.infer<typeof subclassSchema>;
export type Background = z.infer<typeof backgroundSchema>;
export type Feat = z.infer<typeof featSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type ClassLevel = z.infer<typeof classLevelSchema>;
export type EquipmentOption = z.infer<typeof equipmentOptionSchema>;
