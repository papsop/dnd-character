/**
 * Corrections for gaps in the vendored source, each checked against the SRD 5.2.1 itself.
 *
 * Keep this file tiny and every entry justified. It exists because silently shipping a species with
 * no size, or a background with no tool proficiency, produces a character sheet that is wrong in a
 * way nobody notices until it matters at the table. Every patch is asserted to still be *needed*
 * during the build, so when upstream fixes its data the stale patch fails the build instead of
 * quietly overriding good data.
 */

/** Species whose `size` the source omits. SRD 5.2.1: Tiefling is Small or Medium, player's choice. */
export const SPECIES_SIZE: Record<string, ('Tiny' | 'Small' | 'Medium' | 'Large')[]> = {
  tiefling: ['Small', 'Medium'],
};

/** Backgrounds whose tool proficiency the source omits. SRD 5.2.1: Soldier grants a Gaming Set. */
export const BACKGROUND_TOOL: Record<string, string> = {
  soldier: 'Gaming Set',
};

/** Spells the source ships with an empty description. Text transcribed from the SRD 5.2.1. */
export const SPELL_TEXT: Record<string, string[]> = {
  'greater-invisibility': ['A creature you touch has the Invisible condition until the spell ends.'],
};
