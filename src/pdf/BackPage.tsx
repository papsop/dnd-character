import { Text, View } from '@react-pdf/renderer';
import type { CharacterSheet } from '../domain/schema/character';
import type { Feature } from '../domain/schema/content';
import { condenseParagraphs } from '../domain/condense';
import { Field, Label, Pips, RuledLines, SectionHeader, Table } from './components';
import { colors, fonts, sizes, styles } from './theme';

const SOURCE_TITLES: Record<Feature['source'], string> = {
  class: 'Class Features',
  subclass: 'Subclass Features',
  species: 'Species Traits',
  background: 'Background',
  feat: 'Feats',
};

const ORDER: Feature['source'][] = ['class', 'subclass', 'species', 'feat', 'background'];

/**
 * Roughly how many characters of feature text the left column holds at the default body size.
 * Measured by rendering, not calculated - react-pdf cannot measure text before laying it out.
 */
const COLUMN_TEXT_CAPACITY = 5400;

/** Never trim below this: a two-line feature is useless. */
const MIN_FEATURE_TEXT = 150;

/** Never trim above this: past it the reader is skimming a rulebook, not a sheet. */
const MAX_FEATURE_TEXT = 700;

/**
 * How much text each feature gets, shared out across however many the character has.
 *
 * A level-1 Fighter has eight features and room for nearly all of their text; a level-20 Wizard has
 * twenty-one, including a Spellcasting feature of seventeen paragraphs whose actual numbers are
 * already printed on the front page. Giving both the same fixed budget either wastes half a page or
 * buries everything, so the budget adapts to the character.
 */
export function featureTextBudget(featureCount: number): number {
  if (featureCount === 0) return MAX_FEATURE_TEXT;
  const share = Math.round(COLUMN_TEXT_CAPACITY / featureCount);
  return Math.min(MAX_FEATURE_TEXT, Math.max(MIN_FEATURE_TEXT, share));
}

export function BackPage({ sheet, bodySize }: { sheet: CharacterSheet; bodySize: number }) {
  const condensed = sheet.sheetOptions.detail === 'condensed';
  const budget = featureTextBudget(sheet.features.length + sheet.masteries.length);

  return (
    <View style={styles.grow}>
      <View style={[styles.row, { gap: 10 }]}>
        <View style={{ width: '52%' }}>
          {ORDER.map((source) => {
            const features = sheet.features.filter((f) => f.source === source);
            if (features.length === 0) return null;
            return (
              <View key={source} style={{ marginBottom: 5 }}>
                <SectionHeader icon="section-features">{SOURCE_TITLES[source]}</SectionHeader>
                {features.map((feature) => (
                  <FeatureBlock
                    key={`${source}-${feature.id}`}
                    feature={feature}
                    bodySize={bodySize}
                    condensed={condensed}
                    budget={budget}
                  />
                ))}
              </View>
            );
          })}

          {sheet.masteries.length > 0 ? (
            <View style={{ marginBottom: 5 }}>
              <SectionHeader>Weapon Mastery</SectionHeader>
              {sheet.masteries.map((mastery) => (
                <View key={mastery.weaponName} style={{ marginBottom: 3 }} wrap={false}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: bodySize }}>
                    {mastery.masteryName} ({mastery.weaponName})
                  </Text>
                  {(condensed
                    ? condenseParagraphs(mastery.text, budget).text
                    : mastery.text
                  ).map((paragraph, index) => (
                    <Text key={index} style={{ fontSize: bodySize, color: colors.muted }}>
                      {paragraph}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ width: '48%' }}>
          <SectionHeader>Proficiencies & Languages</SectionHeader>
          <ProficiencyLine label="Armour" values={sheet.proficiencies.armor} />
          <ProficiencyLine label="Weapons" values={sheet.proficiencies.weapons} />
          <ProficiencyLine label="Tools" values={sheet.proficiencies.tools} />
          <ProficiencyLine label="Languages" values={sheet.proficiencies.languages} />

          <View style={{ marginTop: 5 }}>
            <SectionHeader icon="section-equipment">Equipment</SectionHeader>
            {sheet.equipment.length > 0 ? (
              <Table
                columns={[
                  { header: 'Item', width: 62 },
                  { header: 'Qty', width: 14, align: 'right' },
                  { header: 'lb', width: 24, align: 'right' },
                ]}
                rows={[
                  ...sheet.equipment.map((line) => [
                    // Helvetica is a standard PDF font with no box glyph, so mark it in words.
                    line.equipped ? `${line.name} (worn)` : line.name,
                    line.quantity,
                    line.weight * line.quantity || '—',
                  ]),
                  ['Total', '', sheet.totalWeight],
                ]}
              />
            ) : (
              <RuledLines count={6} />
            )}
            {sheet.equipment.some((line) => line.equipped) ? (
              <Text style={{ fontSize: sizes.label, color: colors.muted, marginTop: 1 }}>
                (worn) = currently equipped
              </Text>
            ) : null}
          </View>

          <View style={{ marginTop: 5 }}>
            <SectionHeader>Currency</SectionHeader>
            <View style={[styles.row, { gap: 3 }]}>
              {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((coin) => (
                <View key={coin} style={[styles.box, { flexGrow: 1, alignItems: 'center', paddingVertical: 2 }]}>
                  <Label>{coin}</Label>
                  <Text style={{ fontSize: sizes.small }}>{sheet.currency[coin]}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 5 }}>
            <SectionHeader>Attunement</SectionHeader>
            {[0, 1, 2].map((slot) => (
              <View key={slot} style={[styles.row, { alignItems: 'center', gap: 3, marginBottom: 2 }]}>
                <Pips count={1} />
                <View style={{ flexGrow: 1, borderBottomWidth: 0.5, borderBottomColor: colors.faint, height: 10 }} />
              </View>
            ))}
          </View>

          <View style={{ marginTop: 5 }}>
            <SectionHeader>Character</SectionHeader>
            <DetailBlock label="Personality Trait" value={sheet.details.personalityTrait} />
            <DetailBlock label="Ideal" value={sheet.details.ideal} />
            <DetailBlock label="Bond" value={sheet.details.bond} />
            <DetailBlock label="Flaw" value={sheet.details.flaw} />
            <DetailBlock label="Appearance" value={sheet.details.appearance} lines={2} />
            <DetailBlock label="Backstory" value={sheet.details.backstory} lines={4} />
          </View>

          {/* Players scribble on the sheet all session. Whatever is left over becomes room to write. */}
          <View style={{ marginTop: 5, flexGrow: 1 }}>
            <SectionHeader>Notes</SectionHeader>
            <RuledLines count={10} />
          </View>
        </View>
      </View>
    </View>
  );
}

function FeatureBlock({
  feature,
  bodySize,
  condensed,
  budget,
}: {
  feature: Feature;
  bodySize: number;
  condensed: boolean;
  budget: number;
}) {
  const body = condensed
    ? condenseParagraphs(feature.text, budget)
    : { text: feature.text, truncated: false };

  return (
    <View style={{ marginBottom: 3 }} wrap={false}>
      <View style={[styles.row, { alignItems: 'center', gap: 3 }]}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: bodySize }}>{feature.name}</Text>
        <Text style={{ fontSize: sizes.label, color: colors.muted }}>lvl {feature.level}</Text>
        {feature.uses ? (
          <>
            <Pips count={typeof feature.uses.count === 'number' ? feature.uses.count : 3} />
            <Text style={{ fontSize: sizes.label, color: colors.muted }}>{feature.uses.per}</Text>
          </>
        ) : null}
      </View>
      {body.text.map((paragraph, index) => (
        <Text key={index} style={{ fontSize: bodySize, color: colors.muted }}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

function ProficiencyLine({ label, values }: { label: string; values: string[] }) {
  return (
    <View style={{ marginBottom: 2 }}>
      <Label>{label}</Label>
      <Text style={{ fontSize: sizes.small }}>{values.length > 0 ? values.join(', ') : '—'}</Text>
    </View>
  );
}

/** Prints what the player wrote, or ruled lines to write on if they left it blank. */
function DetailBlock({ label, value, lines = 1 }: { label: string; value: string | undefined; lines?: number }) {
  if (value && value.trim() !== '') {
    return (
      <View style={{ marginBottom: 2 }}>
        <Label>{label}</Label>
        <Text style={{ fontSize: sizes.small }}>{value}</Text>
      </View>
    );
  }
  return (
    <View style={{ marginBottom: 2 }}>
      <RuledLines count={lines} label={label} />
    </View>
  );
}

export { Field };
