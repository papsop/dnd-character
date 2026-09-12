import { describe, expect, it } from 'vitest';
import { characterBuildSchema } from '../domain/schema/character';
import { contentPack } from '../content';
import { deriveSheet } from '../domain/derive';
import { newCharacter } from './characterStore';

/**
 * Saved characters are untrusted input: older app versions, hand-edited localStorage, half-written
 * saves. Anything that survives parsing must be safe to hand straight to the engine.
 */
describe('persisted build parsing', () => {
  it('accepts a fresh character', () => {
    expect(characterBuildSchema.safeParse(newCharacter()).success).toBe(true);
  });

  it('fills in collections an older save is missing', () => {
    const partial = {
      schemaVersion: 1,
      id: 'old',
      name: 'Ilzarai',
      level: 5,
      classId: 'wizard',
      speciesId: 'elf',
      backgroundId: 'sage',
      abilities: {
        method: 'standard-array',
        base: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
        backgroundBonuses: { int: 2, con: 1 },
      },
    };

    const parsed = characterBuildSchema.safeParse(partial);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.choices).toEqual({});
    expect(parsed.data.equipment).toEqual([]);
    expect(parsed.data.sheetOptions.spellDetail).toBe('condensed');

    // The real assertion: the engine must not throw on it.
    expect(() => deriveSheet(parsed.data, contentPack)).not.toThrow();
  });

  it('rejects junk rather than handing it to the engine', () => {
    expect(characterBuildSchema.safeParse({ schemaVersion: 2 }).success).toBe(false);
    expect(characterBuildSchema.safeParse(null).success).toBe(false);
    expect(characterBuildSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a build with a level outside 1-20', () => {
    const build = { ...newCharacter(), level: 25 };
    expect(characterBuildSchema.safeParse(build).success).toBe(false);
  });
});
