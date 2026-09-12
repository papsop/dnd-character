import { StyleSheet } from '@react-pdf/renderer';

/**
 * A4 at 10mm margins, in points. The sheet is used at a table, under bad light, mid-combat:
 * the numbers a player needs on their turn have to be findable in under two seconds.
 *
 * Everything must read correctly printed in pure black and white on a cheap office printer, so
 * separation comes from borders, weight and whitespace - never from colour alone. Large fills are
 * avoided: they drain toner and make the sheet impossible to write on.
 */

export const PAGE = { width: 595.28, height: 841.89, margin: 28.35 } as const;
export const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

export const colors = {
  ink: '#1a1a1a',
  muted: '#5f5f5f',
  rule: '#9a9a9a',
  faint: '#d8d8d8',
  /** Used sparingly, and never as the only thing distinguishing two states. */
  accent: '#7f1d1d',
  paper: '#ffffff',
} as const;

/**
 * react-pdf ships Helvetica, Times-Roman and Courier as standard PDF fonts. Using them means no
 * font files to bundle and nothing fetched at render time, which is what keeps the PDF offline.
 */
export const fonts = { display: 'Times-Roman', displayBold: 'Times-Bold', body: 'Helvetica', bodyBold: 'Helvetica-Bold' } as const;

export const sizes = { label: 6, tiny: 6.5, small: 7.5, body: 8.5, large: 11, huge: 16, giant: 22 } as const;

export const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE.margin,
    // Extra room at the foot so content never collides with the fixed attribution line.
    paddingBottom: PAGE.margin + 10,
    paddingHorizontal: PAGE.margin,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: sizes.body,
  },

  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  grow: { flexGrow: 1 },

  /** Small letterspaced uppercase label. The only thing allowed below 7.5pt. */
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: sizes.label,
    letterSpacing: 0.6,
    color: colors.muted,
    textTransform: 'uppercase',
  },

  sectionHeader: {
    fontFamily: fonts.displayBold,
    fontSize: sizes.large,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    paddingBottom: 1.5,
    marginBottom: 3,
  },

  box: {
    borderWidth: 0.75,
    borderColor: colors.rule,
    borderRadius: 2,
    padding: 4,
  },

  /** A field the player writes in. A rule, never a fill - you cannot write on a filled box. */
  writeBox: {
    borderWidth: 0.75,
    borderColor: colors.rule,
    borderRadius: 2,
    height: 16,
  },

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.75,
    borderBottomColor: colors.ink,
    paddingBottom: 1.5,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.faint,
    paddingVertical: 1.5,
  },

  footer: {
    position: 'absolute',
    bottom: 12,
    left: PAGE.margin,
    right: PAGE.margin,
    fontSize: sizes.label,
    color: colors.muted,
    textAlign: 'center',
  },
});

export const signed = (value: number): string => `${value >= 0 ? '+' : ''}${value}`;
