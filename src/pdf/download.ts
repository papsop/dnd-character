import { pdf } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import type { CharacterSheet } from '../domain/schema/character';
import { CharacterSheetDocument } from './CharacterSheetDocument';
import { registerSheetFonts } from './fonts/register';
import { toPrintablePortrait } from './portrait';

/**
 * Filenames are ASCII. A sheet is shared, mailed and dropped on a VTT, and every one of those
 * handles a plain name better than an encoded one - so accents are folded to their base letter
 * (Křížová -> krizova) rather than stripped, which would have left "character" for a name written
 * in Czech or Polish.
 */
const slug = (value: string): string =>
  value
    .normalize('NFD')
    // Drop the combining marks NFD just separated out, keeping the letters they sat on.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'character';

export const sheetFilename = (sheet: CharacterSheet): string =>
  `${slug(sheet.identity.name || 'character')}-${slug(sheet.identity.className)}${sheet.identity.level}.pdf`;

/**
 * Renders the sheet and hands it to the browser as a download.
 *
 * The object URL is revoked on the next tick rather than immediately - Safari cancels the download
 * if the URL disappears in the same frame as the click.
 */
export async function downloadSheet(sheet: CharacterSheet): Promise<void> {
  registerSheetFonts();

  const element = createElement(CharacterSheetDocument, {
    sheet: await withPrintablePortrait(sheet),
  }) as ReactElement<DocumentProps>;
  const blob = await pdf(element).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sheetFilename(sheet);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Portraits from older saves may be in a format react-pdf cannot embed. See ./portrait.ts. */
async function withPrintablePortrait(sheet: CharacterSheet): Promise<CharacterSheet> {
  const { portraitDataUrl } = sheet.identity;
  if (!portraitDataUrl) return sheet;

  const printable = await toPrintablePortrait(portraitDataUrl);
  if (printable === portraitDataUrl) return sheet;

  const identity = { ...sheet.identity };
  if (printable) identity.portraitDataUrl = printable;
  else delete identity.portraitDataUrl;
  return { ...sheet, identity };
}
