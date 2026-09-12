/**
 * Renders the test fixtures to ./tmp so the layout can actually be looked at.
 *
 * Page counts are asserted, because the one thing that must never regress is the front/back
 * pairing: page 1 is the front, page 2 is the back, and anything else comes after.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, type ReactElement } from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { contentPack } from '../src/content';
import { deriveSheet } from '../src/domain/derive';
import { CharacterSheetDocument } from '../src/pdf/CharacterSheetDocument';
import type { CharacterBuild } from '../src/domain/schema/character';
import { fighterLevel1, makeBuild, scores, wizardLevel5 } from '../src/domain/test/fixtures';

const OUT = join(process.cwd(), 'tmp');

function level20(classId: string, name: string): CharacterBuild {
  return makeBuild({
    name,
    classId,
    level: 20,
    speciesId: 'human',
    backgroundId: 'soldier',
    abilities: {
      method: 'standard-array',
      base: scores({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }),
      backgroundBonuses: { str: 2, con: 1 },
      improvements: [],
    },
  });
}

const wizard20 = (): CharacterBuild => {
  const build = level20('wizard', 'Ilzarai the Elder');
  const list = contentPack.spells.filter((s) => s.classes.includes('wizard'));
  return {
    ...build,
    subclassId: 'evoker',
    spells: {
      cantrips: list.filter((s) => s.level === 0).slice(0, 5).map((s) => s.id),
      prepared: list.filter((s) => s.level > 0 && s.level <= 9).slice(0, 25).map((s) => s.id),
    },
  };
};

const FIXTURES: [string, CharacterBuild, number | null][] = [
  ['fighter-1', fighterLevel1(), 2],
  ['wizard-5', wizardLevel5(), null],
  ['fighter-20', { ...level20('fighter', 'Brakka the Unbroken'), subclassId: 'champion' }, null],
  ['wizard-20', wizard20(), null],
  ['warlock-5', { ...makeBuild({ classId: 'warlock', level: 5, name: 'Vess' }), subclassId: 'fiend-patron' }, null],
];

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  let failed = false;

  for (const [name, build, expectedPages] of FIXTURES) {
    const sheet = deriveSheet(build, contentPack);
    // CharacterSheetDocument returns a <Document>; createElement cannot see that through the
    // component boundary, so the cast tells it what renderToBuffer already requires.
    const element = createElement(CharacterSheetDocument, { sheet }) as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);
    const path = join(OUT, `${name}.pdf`);
    writeFileSync(path, buffer);

    // Cheap and reliable: count the page objects the PDF declares.
    const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    const caster = sheet.spellcasting ? ' (caster)' : '';
    console.log(`  ${name.padEnd(12)} ${String(pages).padStart(2)} pages  ${(buffer.length / 1024).toFixed(0)} KB${caster}`);

    if (expectedPages !== null && pages !== expectedPages) {
      console.error(`    expected ${expectedPages} pages, got ${pages}`);
      failed = true;
    }
    if (pages < 2) {
      console.error('    a sheet is always at least a front and a back');
      failed = true;
    }
  }

  console.log(`\nWritten to ${OUT}\n`);
  if (failed) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
