/**
 * Shortens rules text for the printed sheet.
 *
 * A character sheet is a play aid, not a spellbook. Printed in full, a handful of spells - Wish,
 * Control Water, Guards and Wards - each eat a third of a page, which buries the numbers you
 * actually need mid-combat and turns a caster's sheet into six pages of wall-to-wall text.
 *
 * Cutting always happens at a sentence boundary: half a sentence is worse than a short one, and a
 * player who needs the rest has the rulebook.
 */

const ELLIPSIS = '…';

/** True when the text was shortened, so the caller can say so on the sheet. */
export type Condensed = { text: string[]; truncated: boolean };

export function condenseParagraphs(paragraphs: string[], budget: number): Condensed {
  const full = paragraphs.join(' ');
  if (full.length <= budget) return { text: paragraphs, truncated: false };

  const kept: string[] = [];
  let used = 0;

  for (const paragraph of paragraphs) {
    if (used + paragraph.length <= budget) {
      kept.push(paragraph);
      used += paragraph.length;
      continue;
    }

    const remaining = budget - used;
    // Only bother cutting into a paragraph if there is room for something worth reading.
    if (remaining > 80) {
      const clipped = clipToSentence(paragraph, remaining);
      if (clipped) kept.push(`${clipped} ${ELLIPSIS}`);
    }
    break;
  }

  // Never return nothing: a spell with one enormous paragraph still needs its opening.
  if (kept.length === 0) {
    const first = paragraphs[0] ?? '';
    kept.push(`${clipToSentence(first, budget) || first.slice(0, budget)} ${ELLIPSIS}`);
  }

  return { text: kept, truncated: true };
}

/** Longest prefix of `text` that fits `limit` and ends on a full stop. */
function clipToSentence(text: string, limit: number): string {
  if (text.length <= limit) return text;

  const window = text.slice(0, limit);
  const lastStop = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('. '),
    window.endsWith('.') ? window.length - 1 : -1,
  );

  return lastStop > 0 ? window.slice(0, lastStop + 1) : '';
}
