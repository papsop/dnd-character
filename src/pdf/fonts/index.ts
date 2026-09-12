/**
 * The sheet's typefaces, and the one place that knows their file names.
 *
 * The PDF standard fonts (Helvetica, Times-Roman) cannot print this sheet. They are encoded
 * WinAnsi, so anything outside Latin-1 is mangled on the way into the PDF: a Czech `ř` came out as
 * `Y`, `ň` as `H`, and a name like "Křížová" was unreadable. That is not a rendering glitch a
 * reader can work around - the wrong bytes are in the file.
 *
 * So two embedded TrueType faces, subset to Latin-1, Latin Extended-A/B, combining marks and
 * typographic punctuation - enough for every language written in the Latin alphabet, Czech,
 * Polish, Hungarian and Turkish included. See README.md in this folder for how they were subset
 * and how to widen the range.
 *
 * Each weight is registered as its own family because the sheet addresses weights by name
 * (`fonts.bodyBold`) rather than through `fontWeight`.
 */

export const FONT_FAMILIES = {
  /** Headings, names and the big numbers. PT Serif, in place of Times-Roman. */
  display: 'CF Serif',
  displayBold: 'CF Serif Bold',
  /** Body text, labels and tables. Lato, in place of Helvetica. */
  body: 'CF Sans',
  bodyBold: 'CF Sans Bold',
} as const;

/** Family name to file, relative to this folder. */
export const FONT_FILES: Record<string, string> = {
  [FONT_FAMILIES.display]: 'PTSerif-Regular.ttf',
  [FONT_FAMILIES.displayBold]: 'PTSerif-Bold.ttf',
  [FONT_FAMILIES.body]: 'Lato-Regular.ttf',
  [FONT_FAMILIES.bodyBold]: 'Lato-Bold.ttf',
};
