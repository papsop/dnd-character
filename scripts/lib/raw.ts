import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Ability, Dice } from '../../src/domain/schema/content';

export const CACHE_DIR = join(process.cwd(), 'scripts', '.cache');

/** Anything read straight off disk. Mappers narrow it; nothing else may touch it. */
export type Raw = Record<string, any>;

export function loadJson(relative: string): Raw[] {
  const path = join(CACHE_DIR, relative);
  if (!existsSync(path)) {
    throw new Error(
      `Missing vendored source: ${relative}\nRun "npm run content:fetch" first - the build never fetches.`,
    );
  }
  return JSON.parse(readFileSync(path, 'utf8')) as Raw[];
}

/** Rules text arrives as one blob with newlines. The schema wants paragraphs. */
export function paragraphs(desc: unknown): string[] {
  if (typeof desc !== 'string') return [];
  return desc
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Everything is priced in gp internally; the sheet renders whatever unit reads best. */
export function toGp(cost: Raw | undefined): number {
  if (!cost) return 0;
  const q = Number(cost.quantity ?? 0);
  switch (String(cost.unit).toLowerCase()) {
    case 'cp':
      return q / 100;
    case 'sp':
      return q / 10;
    case 'ep':
      return q / 2;
    case 'gp':
      return q;
    case 'pp':
      return q * 10;
    default:
      throw new Error(`Unknown currency unit: ${String(cost.unit)}`);
  }
}

const DIE_SIZES = new Set([4, 6, 8, 10, 12, 20, 100]);

/** "1d8" -> { count: 1, die: 8 }. Returns null for weapons with no damage at all. */
export function parseDice(value: unknown): Dice | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d+)d(\d+)(?:\s*\+\s*(\d+))?$/.exec(value.trim());
  if (!match) return null;
  const die = Number(match[2]);
  if (!DIE_SIZES.has(die)) throw new Error(`Unsupported die size in "${value}"`);
  const bonus = match[3] === undefined ? undefined : Number(match[3]);
  return bonus === undefined
    ? { count: Number(match[1]), die: die as Dice['die'] }
    : { count: Number(match[1]), die: die as Dice['die'], bonus };
}

// The two sources disagree: 5e-database uses "dex", Open5e uses "dexterity".
const ABILITY_BY_CODE: Record<string, Ability> = {
  str: 'str',
  strength: 'str',
  dex: 'dex',
  dexterity: 'dex',
  con: 'con',
  constitution: 'con',
  int: 'int',
  intelligence: 'int',
  wis: 'wis',
  wisdom: 'wis',
  cha: 'cha',
  charisma: 'cha',
};

export function toAbility(value: unknown): Ability {
  const key = String(value).toLowerCase();
  const ability = ABILITY_BY_CODE[key];
  if (!ability) throw new Error(`Unknown ability: ${String(value)}`);
  return ability;
}

/** Normalize any source identifier into our lowercase-kebab id shape. */
export function toId(value: unknown): string {
  return String(value)
    .toLowerCase()
    .replace(/^srd-2024_/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "fighter-1" -> 1 */
export function levelFromIndex(index: unknown): number {
  const match = /-(\d+)$/.exec(String(index));
  if (!match) throw new Error(`Cannot read a level out of "${String(index)}"`);
  return Number(match[1]);
}

export function byId<T extends { id: string }>(records: T[]): Map<string, T> {
  return new Map(records.map((record) => [record.id, record]));
}

/** Deterministic output keeps the build idempotent and the diffs reviewable. */
export function sortById<T extends { id: string }>(records: T[]): T[] {
  return [...records].sort((a, b) => a.id.localeCompare(b.id));
}
