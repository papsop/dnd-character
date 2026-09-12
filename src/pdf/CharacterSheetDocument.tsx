import { Document, Page, Text } from '@react-pdf/renderer';
import { SRD_ATTRIBUTION_SHORT } from '../attribution';
import { contentPack } from '../content';
import type { CharacterSheet } from '../domain/schema/character';
import { BackPage } from './BackPage';
import { FrontPage } from './FrontPage';
import { SpellPages } from './SpellPages';
import { PAGE, colors, sizes, styles } from './theme';

/**
 * How much feature text the back page has to carry, in characters. react-pdf cannot measure text
 * before laying it out, so the body size is picked from an estimate of volume rather than measured.
 * The floor is 7.5pt - below that the sheet stops being readable under table lighting, and a
 * continuation page is the better trade.
 */
function backPageBodySize(sheet: CharacterSheet): number {
  const characters =
    sheet.features.reduce((total, f) => total + f.name.length + f.text.join(' ').length, 0) +
    sheet.masteries.reduce((total, m) => total + m.text.join(' ').length, 0);

  if (characters < 3500) return sizes.body;
  if (characters < 5500) return 8;
  return sizes.small;
}

export function CharacterSheetDocument({ sheet }: { sheet: CharacterSheet }) {
  const title = `${sheet.identity.name || 'Unnamed'} — ${sheet.identity.className} ${sheet.identity.level}`;

  return (
    <Document title={title} author={sheet.identity.playerName ?? 'Character Forge'} creator="Character Forge">
      {/*
        Front: everything used on your turn.

        No `wrap={false}` here. It does not mean "keep this to one page" - it shrinks the page itself
        down to its content, producing a 595x517pt sheet instead of A4. Printers then scale that odd
        page to fit the paper and rotate the following real A4 page to match, which is what made a
        printed sheet come out sideways. The front page fits on its own; the fixture script asserts
        both the page count and that every page is genuinely A4.
      */}
      <Page size="A4" style={styles.page}>
        <FrontPage sheet={sheet} conditions={contentPack.conditions.map((c) => c.name)} />
        {/*
          The footer has to be a direct child of the Page. Absolute positioning inside the content
          View anchors it to where the content happens to end, not to the bottom of the paper.
        */}
        <Text style={styles.footer} fixed>
          {SRD_ATTRIBUTION_SHORT}
        </Text>
      </Page>

      {/*
        Back: features, kit and roleplay. Overflow continues onto its own page *after* this one, so
        the front/back duplex pairing is never broken.
      */}
      <Page size="A4" style={styles.page}>
        <BackPage sheet={sheet} bodySize={backPageBodySize(sheet)} />
        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber }) => (pageNumber > 2 ? 'Features (continued)' : '')}
        />
      </Page>

      {sheet.spellcasting ? (
        <Page size="A4" style={styles.page}>
          <SpellPages sheet={sheet} />
          <Text
            style={styles.footer}
            fixed
            render={({ pageNumber, totalPages }) => `Spells — page ${pageNumber} of ${totalPages}`}
          />
        </Page>
      ) : null}
    </Document>
  );
}

export { PAGE, colors };
