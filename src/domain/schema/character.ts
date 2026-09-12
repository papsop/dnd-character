import { z } from 'zod';
import { ABILITIES, abilitySchema, type Ability, type Feature, type Spell } from './content';

const id = z.string().min(1);

const abilityRecord = z.object(
  Object.fromEntries(ABILITIES.map((a) => [a, z.number().int()])) as Record<
    Ability,
    z.ZodNumber
  >,
);

/** One Ability Score Improvement taken at a level. Must total +2 across at most two abilities. */
export const improvementSchema = z.object({
  level: z.number().int().min(1).max(20),
  increases: z.record(abilitySchema, z.number().int().positive()),
});

/**
 * The player's raw choices - the only thing persisted, exported or shared.
 * Nothing derived is ever stored here; see CharacterSheet for that.
 */
export const characterBuildSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  name: z.string(),
  level: z.number().int().min(1).max(20),

  classId: z.string(),
  subclassId: z.string().optional(),
  speciesId: z.string(),
  lineageId: z.string().optional(),
  backgroundId: z.string(),

  abilities: z.object({
    method: z.enum(['standard-array', 'point-buy', 'manual']),
    base: abilityRecord,
    /** From the background. Exactly +3 total, as 2+1 or 1+1+1, on its three listed abilities. */
    backgroundBonuses: z.record(abilitySchema, z.number().int()),
    improvements: z.array(improvementSchema).default([]),
  }),

  /** Choice id -> selected option ids. Covers skills, masteries, feats, fighting styles, everything. */
  choices: z.record(z.string(), z.array(z.string())).default({}),

  spells: z
    .object({
      cantrips: z.array(z.string()).default([]),
      prepared: z.array(z.string()).default([]),
    })
    .default({ cantrips: [], prepared: [] }),

  equipment: z
    .array(
      z.object({
        itemId: z.string(),
        quantity: z.number().int().positive(),
        equipped: z.boolean().default(false),
      }),
    )
    .default([]),

  currency: z
    .object({
      cp: z.number().int().nonnegative(),
      sp: z.number().int().nonnegative(),
      ep: z.number().int().nonnegative(),
      gp: z.number().int().nonnegative(),
      pp: z.number().int().nonnegative(),
    })
    .default({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }),

  /** Per-level hit die rolls. Absent means use the fixed average, which is what most tables do. */
  hp: z.object({ rolled: z.array(z.number().int().positive()).optional() }).default({}),

  details: z
    .object({
      alignment: z.string().optional(),
      playerName: z.string().optional(),
      appearance: z.string().optional(),
      backstory: z.string().optional(),
      personalityTrait: z.string().optional(),
      ideal: z.string().optional(),
      bond: z.string().optional(),
      flaw: z.string().optional(),
      /** Supplied by the user at runtime. Never bundled, never uploaded anywhere. */
      portraitDataUrl: z.string().optional(),
    })
    .default({}),

  /** How the printed sheet is rendered. Preferences, not rules. */
  sheetOptions: z
    .object({
      /**
       * Full spell text turns a caster's sheet into six pages of wall-to-wall prose and buries the
       * numbers you need mid-combat, so the condensed view is the default.
       */
      spellDetail: z.enum(['condensed', 'full']).default('condensed'),
    })
    .default({ spellDetail: 'condensed' }),

  notes: z.string().optional(),
});

export type CharacterBuild = z.infer<typeof characterBuildSchema>;
export type Improvement = z.infer<typeof improvementSchema>;

export const WIZARD_STEPS = [
  'class',
  'origin',
  'abilities',
  'class-details',
  'equipment',
  'spells',
  'details',
] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

/**
 * Something wrong or unfinished. `error` means the build breaks a rule; `incomplete` means it is
 * legal so far but a required choice has not been made. Both block the PDF; only `error` is illegal.
 */
export type Issue = {
  step: WizardStep;
  field: string;
  severity: 'error' | 'incomplete';
  message: string;
};

export type AbilityDetail = { base: number; bonus: number; score: number; mod: number };

export type SkillDetail = {
  id: string;
  name: string;
  ability: Ability;
  mod: number;
  proficient: boolean;
  expertise: boolean;
};

/** One row of the front page's attack table - the "what to throw" list. */
export type Attack = {
  name: string;
  kind: 'weapon' | 'cantrip' | 'unarmed';
  attackBonus?: number;
  save?: { ability: Ability; dc: number };
  damage: string;
  versatile?: string;
  range: string;
  properties: string[];
  mastery?: { name: string; text: string[] };
  notes?: string;
};

export type SpellcastingSheet = {
  ability: Ability;
  saveDc: number;
  attackBonus: number;
  cantripsKnown: number;
  preparedMax: number;
  ritual: boolean;
  /** Index 0 is a 1st-level slot. */
  slots: number[];
  pact?: { count: number; level: number };
  cantrips: Spell[];
  prepared: Spell[];
};

export type EquipmentLine = {
  itemId: string;
  name: string;
  quantity: number;
  weight: number;
  cost: number;
  equipped: boolean;
};

/** Everything derived. Recomputed from the build on every change; never persisted. */
export type CharacterSheet = {
  identity: {
    name: string;
    className: string;
    subclassName?: string;
    level: number;
    speciesName: string;
    lineageName?: string;
    backgroundName: string;
    alignment?: string;
    playerName?: string;
    portraitDataUrl?: string;
  };
  abilities: Record<Ability, AbilityDetail>;
  proficiencyBonus: number;
  saves: Record<Ability, { mod: number; proficient: boolean }>;
  skills: SkillDetail[];
  passive: { perception: number; insight: number; investigation: number };
  defenses: {
    ac: number;
    acBreakdown: string;
    initiative: number;
    initiativeProficient: boolean;
    speed: number;
    hpMax: number;
    hitDice: { count: number; die: number };
    resistances: string[];
    senses: string[];
    stealthDisadvantage: boolean;
  };
  attacks: Attack[];
  attacksPerAction: number;
  spellcasting?: SpellcastingSheet;
  features: Feature[];
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; languages: string[] };
  equipment: EquipmentLine[];
  currency: CharacterBuild['currency'];
  totalWeight: number;
  masteries: { weaponName: string; masteryName: string; text: string[] }[];
  sheetOptions: CharacterBuild['sheetOptions'];
  details: CharacterBuild['details'];
  issues: Issue[];
};
