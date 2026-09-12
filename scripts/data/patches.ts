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

/**
 * Literal text fixes applied before de-hyphenation.
 *
 * The source was extracted from a PDF and carries line-break hyphenation ("lev- els", "Mar- tial")
 * that would otherwise print onto a character sheet. De-hyphenation merges those automatically, but
 * a few hyphens are really em-dashes and must not be merged - they are listed here.
 */
export const TEXT_REPLACEMENTS: [string, string][] = [
  ['at a time- the most recent one', 'at a time—the most recent one'],
];

/**
 * Armour the source files under the wrong category. SRD 5.2.1: Hide Armor is Medium armour - the
 * source lists it as Light while giving it a Medium armour Dex cap, so its own data disagrees with
 * its own label. The label is what proficiency checks read, so it has to be right.
 */
export const ARMOR_TYPE: Record<string, 'light' | 'medium' | 'heavy' | 'shield'> = {
  'hide-armor': 'medium',
};

/** Spells the source ships with an empty description. Text transcribed from the SRD 5.2.1. */
export const SPELL_TEXT: Record<string, string[]> = {
  'greater-invisibility': ['A creature you touch has the Invisible condition until the spell ends.'],
};
