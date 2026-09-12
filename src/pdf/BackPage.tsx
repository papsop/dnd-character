import { Text, View } from '@react-pdf/renderer';
import type { CharacterSheet } from '../domain/schema/character';
import type { Feature } from '../domain/schema/content';
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

export function BackPage({ sheet, bodySize }: { sheet: CharacterSheet; bodySize: number }) {
  return (
    <View style={styles.grow}>
      <View style={[styles.row, { gap: 8 }]}>
        <View style={{ width: '55%' }}>
          {ORDER.map((source) => {
            const features = sheet.features.filter((f) => f.source === source);
            if (features.length === 0) return null;
            return (
              <View key={source} style={{ marginBottom: 5 }}>
                <SectionHeader icon="section-features">{SOURCE_TITLES[source]}</SectionHeader>
                {features.map((feature) => (
                  <FeatureBlock key={`${source}-${feature.id}`} feature={feature} bodySize={bodySize} />
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
                  {mastery.text.map((paragraph, index) => (
                    <Text key={index} style={{ fontSize: bodySize, color: colors.muted }}>
                      {paragraph}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ width: '45%' }}>
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
            <Text style={{ fontSize: sizes.label, color: colors.muted, marginTop: 1 }}>
              (worn) = currently equipped
            </Text>
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
        </View>
      </View>
    </View>
  );
}

function FeatureBlock({ feature, bodySize }: { feature: Feature; bodySize: number }) {
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
      {feature.text.map((paragraph, index) => (
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
