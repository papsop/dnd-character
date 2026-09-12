import { pdf } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import type { CharacterSheet } from '../domain/schema/character';
import { CharacterSheetDocument } from './CharacterSheetDocument';

const slug = (value: string): string =>
  value
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
  const element = createElement(CharacterSheetDocument, { sheet }) as ReactElement<DocumentProps>;
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
