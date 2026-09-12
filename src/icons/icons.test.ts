import { describe, expect, it } from 'vitest';
import { contentPack } from '../content';
import { ICON_NAMES, iconPaths, isIconName, type IconName } from './paths';

describe('icon path data', () => {
  it('has no empty paths', () => {
    for (const name of ICON_NAMES) {
      expect(iconPaths[name].length, `${name} is empty`).toBeGreaterThan(10);
    }
  });

  it('contains no markup - these are path data, not SVG documents', () => {
    for (const name of ICON_NAMES) {
      expect(iconPaths[name], `${name} contains markup`).not.toMatch(/[<>]/);
    }
  });

  it('uses only path commands react-pdf can render', () => {
    // No arcs with unusual flags, no text, just the standard command set.
    for (const name of ICON_NAMES) {
      expect(iconPaths[name], `${name} has an unexpected command`).toMatch(
        /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/,
      );
    }
  });

  it('starts every path with a move command', () => {
    for (const name of ICON_NAMES) {
      expect(iconPaths[name][0], `${name} does not start with M`).toMatch(/[Mm]/);
    }
  });

  it('keeps coordinates inside the 24x24 viewBox', () => {
    for (const name of ICON_NAMES) {
      const numbers = iconPaths[name].match(/-?\d+(\.\d+)?/g) ?? [];
      for (const value of numbers) {
        expect(Math.abs(Number(value)), `${name} has coordinate ${value}`).toBeLessThanOrEqual(24);
      }
    }
  });
});

describe('icon coverage', () => {
  const missing = (names: string[]) => names.filter((name) => !isIconName(name));

  it('covers every class', () => {
    expect(missing(contentPack.classes.map((c) => `class-${c.id}`))).toEqual([]);
  });

  it('covers every weapon mastery', () => {
    expect(missing(contentPack.masteries.map((m) => `mastery-${m.id}`))).toEqual([]);
  });

  it('covers every damage type', () => {
    expect(missing(contentPack.damageTypes.map((d) => `damage-${d.id}`))).toEqual([]);
  });

  it('covers every spell school', () => {
    const schools = [...new Set(contentPack.spells.map((s) => s.school.toLowerCase()))];
    expect(missing(schools.map((s) => `school-${s}`))).toEqual([]);
  });

  it('covers all six abilities', () => {
    expect(missing(['str', 'dex', 'con', 'int', 'wis', 'cha'].map((a) => `ability-${a}`))).toEqual([]);
  });

  it('shares a silhouette only where two icons genuinely mean the same thing', () => {
    // A sunburst is the right drawing for both Radiant damage and a Cleric, so exact duplicates are
    // allowed - but only the known ones. A new duplicate means an icon was copied instead of drawn.
    const EXPECTED_SHARED = [
      'ability-wis/school-divination',
      'class-cleric/damage-radiant',
      'class-sorcerer/damage-fire',
      'damage-lightning/school-evocation',
      'damage-necrotic/school-necromancy',
      'school-abjuration/section-defenses',
    ];

    const byPath = new Map<string, IconName[]>();
    for (const name of ICON_NAMES) {
      byPath.set(iconPaths[name], [...(byPath.get(iconPaths[name]) ?? []), name]);
    }
    const shared = [...byPath.values()]
      .filter((names) => names.length > 1)
      .map((names) => [...names].sort().join('/'))
      .sort();

    expect(shared).toEqual(EXPECTED_SHARED.map((s) => s.split('/').sort().join('/')).sort());
  });
});
