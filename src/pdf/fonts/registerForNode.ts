import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Font } from '@react-pdf/renderer';
import { FONT_FILES } from './index';

/**
 * The same registration for Node (the fixture script), where there is no bundler to turn a `.ttf`
 * import into a URL and react-pdf reads the file from disk instead.
 */
export function registerSheetFonts(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const present = new Set(readdirSync(here));

  for (const [family, file] of Object.entries(FONT_FILES)) {
    if (!present.has(file)) throw new Error(`Missing font file: ${join(here, file)}`);
    Font.register({ family, src: join(here, file) });
  }
}
