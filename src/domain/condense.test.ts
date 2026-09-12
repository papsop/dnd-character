import { describe, expect, it } from 'vitest';
import { contentPack } from '../content';
import { condenseParagraphs } from './condense';

const SPELL_BUDGET = 420;

describe('condenseParagraphs', () => {
  it('leaves short text alone', () => {
    const paragraphs = ['A short spell.', 'With two paragraphs.'];
    expect(condenseParagraphs(paragraphs, 420)).toEqual({ text: paragraphs, truncated: false });
  });

  it('keeps whole paragraphs while they fit', () => {
    const result = condenseParagraphs(['One.', 'Two.', 'x'.repeat(500)], 100);
    expect(result.text[0]).toBe('One.');
    expect(result.text[1]).toBe('Two.');
    expect(result.truncated).toBe(true);
  });

  it('cuts at a sentence boundary, never mid-sentence', () => {
    const text = 'First sentence here. Second sentence here. Third sentence runs on and on and on.';
    const result = condenseParagraphs([text], 25);
    expect(result.text[0]).toBe('First sentence here. …');

    // A larger budget keeps more whole sentences, still never a partial one.
    expect(condenseParagraphs([text], 45).text[0]).toBe(
      'First sentence here. Second sentence here. …',
    );
    expect(result.truncated).toBe(true);
  });

  it('always returns something, even for one enormous paragraph', () => {
    const result = condenseParagraphs(['x'.repeat(4000)], 300);
    expect(result.text.join(' ').length).toBeGreaterThan(0);
    expect(result.truncated).toBe(true);
  });

  it('marks truncation so the sheet can say so', () => {
    expect(condenseParagraphs(['x'.repeat(1000)], 200).truncated).toBe(true);
    expect(condenseParagraphs(['short'], 200).truncated).toBe(false);
  });
});

describe('every spell in the pack', () => {
  it('condenses to within a bounded size', () => {
    for (const spell of contentPack.spells) {
      const result = condenseParagraphs(spell.text, SPELL_BUDGET);
      // Allow headroom for the sentence boundary landing past the budget, but bound it hard.
      expect(result.text.join(' ').length, spell.id).toBeLessThanOrEqual(SPELL_BUDGET + 120);
    }
  });

  it('never returns empty text', () => {
    for (const spell of contentPack.spells) {
      expect(condenseParagraphs(spell.text, SPELL_BUDGET).text.join('').length, spell.id).toBeGreaterThan(0);
    }
  });

  it('shortens the notorious offenders', () => {
    for (const id of ['wish', 'control-water', 'guards-and-wards', 'magic-jar']) {
      const spell = contentPack.spells.find((s) => s.id === id);
      expect(spell, id).toBeDefined();
      expect(condenseParagraphs(spell?.text ?? [], SPELL_BUDGET).truncated, id).toBe(true);
    }
  });

  it('leaves a typical combat spell intact', () => {
    const fireball = contentPack.spells.find((s) => s.id === 'fireball');
    expect(condenseParagraphs(fireball?.text ?? [], SPELL_BUDGET).truncated).toBe(false);
  });
});
