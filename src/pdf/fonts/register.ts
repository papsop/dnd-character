import { Font } from '@react-pdf/renderer';
import { FONT_FAMILIES } from './index';
// Asset URLs, not bytes: the browser fetches a face the first time a PDF is rendered, from this
// app's own origin. Nothing is requested from a font CDN, so the builder still works offline once
// loaded and still tells no one that you are making a character.
import ptSerifRegular from './PTSerif-Regular.ttf?url';
import ptSerifBold from './PTSerif-Bold.ttf?url';
import latoRegular from './Lato-Regular.ttf?url';
import latoBold from './Lato-Bold.ttf?url';

/**
 * Registers the sheet's faces with react-pdf. Idempotent, and safe to call before every render.
 *
 * Registration only records the URL; the bytes are fetched when a document that uses the family is
 * rendered.
 */
export function registerSheetFonts(): void {
  Font.register({ family: FONT_FAMILIES.display, src: ptSerifRegular });
  Font.register({ family: FONT_FAMILIES.displayBold, src: ptSerifBold });
  Font.register({ family: FONT_FAMILIES.body, src: latoRegular });
  Font.register({ family: FONT_FAMILIES.bodyBold, src: latoBold });
}
