import { describe, expect, it } from 'vitest';
import { contentPack } from '../content';
import { deriveSheet } from '../domain/derive';
import { fighterLevel1, makeBuild, wizardLevel5 } from '../domain/test/fixtures';
import { sheetFilename } from './download';

describe('sheet filename', () => {
  it('is built from the character name, class and level', () => {
    expect(sheetFilename(deriveSheet(fighterLevel1(), contentPack))).toBe('brakka-fighter1.pdf');
    expect(sheetFilename(deriveSheet(wizardLevel5(), contentPack))).toBe('ilzarai-wizard5.pdf');
  });

  it('slugifies punctuation and spaces', () => {
    const build = makeBuild({ name: "Sir Reginald O'Malley III", classId: 'fighter', level: 3 });
    expect(sheetFilename(deriveSheet(build, contentPack))).toBe('sir-reginald-o-malley-iii-fighter3.pdf');
  });

  it('folds accents instead of dropping the name', () => {
    const build = makeBuild({ name: 'Žofie Křížová', classId: 'cleric', level: 3 });
    expect(sheetFilename(deriveSheet(build, contentPack))).toBe('zofie-krizova-cleric3.pdf');
  });

  it('falls back when the character has no name yet', () => {
    const build = makeBuild({ name: '', classId: 'fighter' });
    expect(sheetFilename(deriveSheet(build, contentPack))).toBe('character-fighter1.pdf');
  });
});
