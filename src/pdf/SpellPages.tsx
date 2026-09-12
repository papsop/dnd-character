import { Text, View } from '@react-pdf/renderer';
import type { CharacterSheet } from '../domain/schema/character';
import type { Spell } from '../domain/schema/content';
import { cantripDamage } from '../domain/derive/attacks';
import { iconFor } from '../icons/paths';
import { Icon, Label, Pips, SectionHeader } from './components';
import { colors, fonts, sizes, signed, styles } from './theme';

/**
 * One entry per cantrip and prepared spell, grouped by level. An entry never splits across a page
 * break - half a spell is worse than a page turn.
 */
export function SpellPages({ sheet }: { sheet: CharacterSheet }) {
  const spellcasting = sheet.spellcasting;
  if (!spellcasting) return null;

  const byLevel = new Map<number, Spell[]>();
  for (const spell of [...spellcasting.cantrips, ...spellcasting.prepared]) {
    byLevel.set(spell.level, [...(byLevel.get(spell.level) ?? []), spell]);
  }

  return (
    <View style={styles.grow}>
      <SpellHeader sheet={sheet} />

      {[...byLevel.keys()]
        .sort((a, b) => a - b)
        .map((level) => (
          <View key={level} style={{ marginTop: 5 }}>
            <SectionHeader icon="section-spells">
              {level === 0 ? 'Cantrips' : `Level ${level}`}
            </SectionHeader>
            {(byLevel.get(level) ?? [])
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((spell) => (
                <SpellEntry key={spell.id} spell={spell} sheet={sheet} />
              ))}
          </View>
        ))}
    </View>
  );
}

/** Repeated on every spell page - the numbers needed to actually cast anything. */
function SpellHeader({ sheet }: { sheet: CharacterSheet }) {
  const spellcasting = sheet.spellcasting;
  if (!spellcasting) return null;

  return (
    <View
      style={[
        styles.row,
        {
          alignItems: 'center',
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.ink,
          paddingBottom: 3,
        },
      ]}
      fixed
    >
      <Text style={{ fontFamily: fonts.displayBold, fontSize: sizes.large, flexGrow: 1 }}>
        {sheet.identity.name || 'Unnamed'} — {sheet.identity.className} {sheet.identity.level}
      </Text>
      <Text style={{ fontSize: sizes.small }}>Save DC {spellcasting.saveDc}</Text>
      <Text style={{ fontSize: sizes.small }}>Attack {signed(spellcasting.attackBonus)}</Text>
      {spellcasting.pact ? (
        <View style={[styles.row, { alignItems: 'center', gap: 3 }]}>
          <Text style={{ fontSize: sizes.small }}>Pact L{spellcasting.pact.level}</Text>
          <Pips count={spellcasting.pact.count} />
        </View>
      ) : (
        <View style={[styles.row, { gap: 5 }]}>
          {spellcasting.slots.map((count, index) =>
            count > 0 ? (
              <View key={index} style={[styles.row, { alignItems: 'center', gap: 2 }]}>
                <Text style={{ fontSize: sizes.tiny }}>L{index + 1}</Text>
                <Pips count={count} />
              </View>
            ) : null,
          )}
        </View>
      )}
    </View>
  );
}

function componentText(spell: Spell): string {
  const parts = [spell.components.v ? 'V' : '', spell.components.s ? 'S' : ''].filter(Boolean);
  if (spell.components.m) parts.push(`M (${spell.components.m})`);
  return parts.join(', ') || '—';
}

function SpellEntry({ spell, sheet }: { spell: Spell; sheet: CharacterSheet }) {
  // Cantrips scale with character level - print the dice actually thrown, never the scaling table.
  const scaled = spell.level === 0 ? cantripDamage(spell, sheet.identity.level) : undefined;
  const damage = scaled?.damage ?? spell.damageRoll;

  const effect = [
    damage ? `${damage} ${spell.damageTypes[0]?.toLowerCase() ?? ''}`.trim() : '',
    spell.save ? `${spell.save.toUpperCase()} save` : '',
    spell.attackRoll ? `Attack ${signed(sheet.spellcasting?.attackBonus ?? 0)}` : '',
    scaled?.beams ? `${scaled.beams} beams` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={{ marginBottom: 4 }} wrap={false}>
      <View style={[styles.row, { alignItems: 'center', gap: 3 }]}>
        <Icon name={iconFor('school', spell.school.toLowerCase())} size={7} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: sizes.body, flexGrow: 1 }}>{spell.name}</Text>
        {spell.concentration ? <Badge>Conc</Badge> : null}
        {spell.ritual ? <Badge>Ritual</Badge> : null}
        <Text style={{ fontSize: sizes.label, color: colors.muted }}>{spell.school}</Text>
      </View>

      <Text style={{ fontSize: sizes.tiny, color: colors.muted }}>
        {spell.castingTime} · {spell.range} · {componentText(spell)} · {spell.duration}
      </Text>

      {effect ? (
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: sizes.small }}>{effect}</Text>
      ) : null}

      {spell.text.map((paragraph, index) => (
        <Text key={index} style={{ fontSize: sizes.small }}>
          {paragraph}
        </Text>
      ))}

      {spell.atHigherLevels ? (
        <Text style={{ fontSize: sizes.tiny, color: colors.muted }}>
          Higher levels: {spell.atHigherLevels}
        </Text>
      ) : null}
    </View>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: sizes.label,
        borderWidth: 0.5,
        borderColor: colors.ink,
        borderRadius: 2,
        paddingHorizontal: 2,
      }}
    >
      {children}
    </Text>
  );
}

export { Label };
