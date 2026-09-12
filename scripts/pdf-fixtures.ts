/**
 * Renders the test fixtures to ./tmp so the layout can actually be looked at.
 *
 * Page counts are asserted, because the one thing that must never regress is the front/back
 * pairing: page 1 is the front, page 2 is the back, and anything else comes after.
 *
 * So is the text encoding. A sheet printed with the PDF standard fonts silently mangles anything
 * outside Latin-1 - "Křížová" came out as "KYizova" - so one fixture is written in Czech and the
 * output is checked for an embedded TrueType subset rather than a standard font.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, type ReactElement } from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { contentPack } from '../src/content';
import { deriveSheet } from '../src/domain/derive';
import { CharacterSheetDocument } from '../src/pdf/CharacterSheetDocument';
import { registerSheetFonts } from '../src/pdf/fonts/registerForNode';
import type { CharacterBuild } from '../src/domain/schema/character';
import { fighterLevel1, makeBuild, scores, wizardLevel5 } from '../src/domain/test/fixtures';

const OUT = join(process.cwd(), 'tmp');
const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * A stand-in portrait, so one fixture exercises the image path. JPEG because that is what the
 * builder now stores: react-pdf embeds JPEG and PNG only, and a WebP portrait - which is what the
 * builder used to produce - is dropped from the page with nothing but a console line to say so.
 */
const portraitDataUrl = (): string =>
  `data:image/jpeg;base64,${readFileSync(join(HERE, 'fixtures/portrait.jpg')).toString('base64')}`;

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

/** Worst case for the spell pages: the ten longest spells in the game, back to back. */
const longSpellWizard = (): CharacterBuild => {
  const build = level20('wizard', 'Ilzarai the Verbose');
  const list = contentPack.spells.filter((s) => s.classes.includes('wizard'));
  const longest = [...list]
    .filter((s) => s.level > 0)
    .sort((a, b) => b.text.join(' ').length - a.text.join(' ').length)
    .slice(0, 12);
  return {
    ...build,
    subclassId: 'evoker',
    spells: {
      cantrips: list.filter((s) => s.level === 0).slice(0, 5).map((s) => s.id),
      prepared: longest.map((s) => s.id),
    },
  };
};

/** Accented Latin all the way through: name, player, and the roleplay text on the back page. */
const czechCleric = (): CharacterBuild => ({
  ...makeBuild({ name: 'Žofie Křížová', classId: 'cleric', level: 3, backgroundId: 'acolyte' }),
  subclassId: 'life-domain',
  details: {
    portraitDataUrl: portraitDataUrl(),
    playerName: 'Tomáš Dvořák',
    alignment: 'Lawful Good',
    personalityTrait: 'Příliš žluťoučký kůň úpěl ďábelské ódy.',
    ideal: 'Věrnost. Přísahu neporuším, ani když mě to bude stát život.',
    bond: 'Můj řád mě vychoval — dlužím mu všechno.',
    flaw: 'Nesnáším, když někdo zpochybňuje mé rozhodnutí.',
  },
});

const FIXTURES: [string, CharacterBuild, number | null][] = [
  ['cleric-3-czech', czechCleric(), null],
  ['wizard-20-long-spells', longSpellWizard(), null],
  ['fighter-1', fighterLevel1(), 2],
  ['wizard-5', wizardLevel5(), null],
  ['fighter-20', { ...level20('fighter', 'Brakka the Unbroken'), subclassId: 'champion' }, null],
  ['wizard-20', wizard20(), null],
  ['warlock-5', { ...makeBuild({ classId: 'warlock', level: 5, name: 'Vess' }), subclassId: 'fiend-patron' }, null],
];

async function main(): Promise<void> {
  registerSheetFonts();
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

    const raw = buffer.toString('latin1');

    // Cheap and reliable: count the page objects the PDF declares.
    const pages = (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length;

    // Every page must actually be A4. A page that is merely "about right" gets scaled by the print
    // driver, which then rotates its neighbours to match and ruins a double-sided print.
    const boxes = raw.match(/\/MediaBox\s*\[[^\]]*\]/g) ?? [];
    for (const box of boxes) {
      const [, , width, height] = (box.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      const isA4 = Math.abs((width ?? 0) - 595.28) < 1 && Math.abs((height ?? 0) - 841.89) < 1;
      if (!isA4) {
        console.error(`    page is ${width}x${height}pt, not A4 (595.28x841.89)`);
        failed = true;
      }
    }
    // The standard fonts are WinAnsi-encoded: if one is embedded, every accented letter on the
    // page is already wrong, whatever it looks like in a viewer.
    const standardFont = raw.match(/\/BaseFont\s*\/(Helvetica|Times|Courier)[^\s/>]*/);
    if (standardFont) {
      console.error(`    embeds the standard font ${standardFont[1]} - accented text will be mangled`);
      failed = true;
    }

    // A portrait that never reached the page is the failure this is here to catch.
    if (sheet.identity.portraitDataUrl && !/\/Subtype\s*\/Image/.test(raw)) {
      console.error('    the portrait is missing from the PDF');
      failed = true;
    }

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
