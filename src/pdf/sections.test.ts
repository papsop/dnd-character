import { describe, expect, it } from 'vitest';
import { characterBuildSchema } from '../domain/schema/character';
import { newCharacter } from '../store/characterStore';

/**
 * Section toggles decide what reaches the printed page, so their defaults and their migration from
 * older saves both matter more than they look.
 */
describe('sheet section options', () => {
  const parse = (sheetOptions?: unknown) => {
    const build = { ...newCharacter(), ...(sheetOptions === undefined ? {} : { sheetOptions }) };
    const parsed = characterBuildSchema.safeParse(build);
    if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues));
    return parsed.data.sheetOptions;
  };

  it('leaves equipment and currency off by default', () => {
    expect(parse().sections.equipment).toBe(false);
    expect(parse().sections.currency).toBe(false);
  });

  it('keeps character, conditions, attunement and notes on by default', () => {
    const { sections } = parse();
    expect(sections.character).toBe(true);
    expect(sections.conditions).toBe(true);
    expect(sections.attunement).toBe(true);
    expect(sections.notes).toBe(true);
  });

  it('fills in every section a partial save is missing', () => {
    const sections = parse({ detail: 'full', sections: { equipment: true } }).sections;
    expect(sections.equipment).toBe(true);
    expect(sections.notes).toBe(true);
    expect(Object.keys(sections).sort()).toEqual([
      'attunement',
      'character',
      'conditions',
      'currency',
      'equipment',
      'notes',
    ]);
  });

  it('migrates a save from before the sections existed', () => {
    // Older builds stored only `spellDetail` and had no section toggles at all.
    const options = parse({ spellDetail: 'full' });
    expect(options.detail).toBe('full');
    expect(options.sections.character).toBe(true);
  });

  it('round-trips an explicit choice', () => {
    const sections = parse({
      detail: 'condensed',
      sections: { equipment: true, currency: true, attunement: false, conditions: false, character: false, notes: false },
    }).sections;
    expect(sections).toEqual({
      equipment: true,
      currency: true,
      attunement: false,
      conditions: false,
      character: false,
      notes: false,
    });
  });
});
