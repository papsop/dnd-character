/**
 * Vendors the raw SRD sources into scripts/.cache (gitignored).
 *
 * Separate from the content build on purpose: the build must be reproducible offline, so it only
 * ever reads what this script already fetched. Run this when you deliberately want newer upstream
 * data, then re-run `npm run content:build` and review the diff.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CACHE_DIR } from './lib/raw';

const DB_BASE = 'https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2024/en';
const DB_FILES = [
  'Ability-Scores', 'Alignments', 'Backgrounds', 'Classes', 'Conditions', 'Damage-Types',
  'Equipment', 'Equipment-Categories', 'Feats', 'Features', 'Languages', 'Levels', 'Magic-Items',
  'Magic-Schools', 'Proficiencies', 'Skills', 'Species', 'Subclasses', 'Subspecies', 'Traits',
  'Weapon-Mastery-Properties', 'Weapon-Properties',
];

const SPELLS_URL = 'https://api.open5e.com/v2/spells/?document__key=srd-2024&limit=200';

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

async function main(): Promise<void> {
  const dbDir = join(CACHE_DIR, '5e-database');
  const open5eDir = join(CACHE_DIR, 'open5e');
  mkdirSync(dbDir, { recursive: true });
  mkdirSync(open5eDir, { recursive: true });

  for (const name of DB_FILES) {
    const file = `5e-SRD-${name}.json`;
    const data = await getJson(`${DB_BASE}/${file}`);
    writeFileSync(join(dbDir, file), JSON.stringify(data, null, 1), 'utf8');
    console.log(`  ${file}`);
  }

  const spells: unknown[] = [];
  let next: string | null = SPELLS_URL;
  while (next) {
    const page = (await getJson(next)) as { results: unknown[]; next: string | null };
    spells.push(...page.results);
    next = page.next;
  }
  spells.sort((a, b) => String((a as { key: string }).key).localeCompare(String((b as { key: string }).key)));
  writeFileSync(join(open5eDir, 'spells-srd-2024.json'), JSON.stringify(spells, null, 1), 'utf8');
  console.log(`  spells-srd-2024.json (${spells.length} spells)`);

  console.log('\nSources vendored. Now run: npm run content:build\n');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
