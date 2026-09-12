import type { Grant } from '../../src/domain/schema/content';

/**
 * Hand-written machine-readable effects, keyed by feature or trait id.
 *
 * Rules *text* comes from the SRD source. Rules *effects* do not exist in any source in a form the
 * engine can use, so they live here. Only effects that change a number on the sheet belong here -
 * a feature with no entry still prints its text, it is simply invisible to the engine, which is the
 * correct outcome for most of them.
 *
 * Every key is asserted to exist during the content build, so a renamed upstream id fails loudly
 * rather than silently dropping a character's AC.
 */
export const GRANTS: Record<string, Grant[]> = {
  // --- Defenses ---------------------------------------------------------------
  'barbarian-unarmored-defense': [{ kind: 'unarmored-defense', ability: 'con' }],
  'monk-unarmored-defense': [{ kind: 'unarmored-defense', ability: 'wis' }],

  // --- Attacks per action -----------------------------------------------------
  'barbarian-extra-attack': [{ kind: 'extra-attack', count: 2 }],
  'fighter-extra-attack': [{ kind: 'extra-attack', count: 2 }],
  'fighter-two-extra-attacks': [{ kind: 'extra-attack', count: 3 }],
  'fighter-three-extra-attacks': [{ kind: 'extra-attack', count: 4 }],
  'monk-extra-attack': [{ kind: 'extra-attack', count: 2 }],
  'paladin-extra-attack': [{ kind: 'extra-attack', count: 2 }],
  'ranger-extra-attack': [{ kind: 'extra-attack', count: 2 }],

  // --- Senses -----------------------------------------------------------------
  'darkvision-60': [{ kind: 'darkvision', range: 60 }],
  'darkvision-120': [{ kind: 'darkvision', range: 120 }],

  // --- Damage resistances -----------------------------------------------------
  'draconic-damage-resistance-acid': [{ kind: 'resistance', damageType: 'acid' }],
  'draconic-damage-resistance-cold': [{ kind: 'resistance', damageType: 'cold' }],
  'draconic-damage-resistance-fire': [{ kind: 'resistance', damageType: 'fire' }],
  'draconic-damage-resistance-lightning': [{ kind: 'resistance', damageType: 'lightning' }],
  'draconic-damage-resistance-poison': [{ kind: 'resistance', damageType: 'poison' }],
  'lineage-resistance-fire': [{ kind: 'resistance', damageType: 'fire' }],
  'lineage-resistance-necrotic': [{ kind: 'resistance', damageType: 'necrotic' }],
  'lineage-resistance-poison': [{ kind: 'resistance', damageType: 'poison' }],
};

/** Feat ids whose effect the engine can express. Same contract as GRANTS. */
export const FEAT_GRANTS: Record<string, Grant[]> = {
  alert: [{ kind: 'initiative-proficiency' }],
};
