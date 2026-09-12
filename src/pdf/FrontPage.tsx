import { Image, Text, View } from '@react-pdf/renderer';
import type { CharacterSheet } from '../domain/schema/character';
import { ABILITIES } from '../domain/schema/content';
import { iconFor } from '../icons/paths';
import { DetailBlock } from './BackPage';
import { AbilityBox, Field, Icon, Label, Pips, ProficiencyDot, RuledLines, SectionHeader, StatBox, Table } from './components';
import { colors, fonts, front, sizes, signed, styles } from './theme';

const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export function FrontPage({ sheet, conditions }: { sheet: CharacterSheet; conditions: string[] }) {
  const { defenses, spellcasting } = sheet;
  const show = sheet.sheetOptions.sections;

  return (
    <View style={styles.grow}>
      <Header sheet={sheet} />

      <View style={[styles.row, { gap: 6, marginTop: 6 }]}>
        {/* Left: abilities, saves, passive scores - the reference column. */}
        <View style={{ width: '27%' }}>
          {ABILITIES.map((ability) => (
            <AbilityBox
              key={ability}
              name={ABILITY_LABELS[ability] ?? ability}
              mod={signed(sheet.abilities[ability].mod)}
              score={sheet.abilities[ability].score}
            />
          ))}

          <SectionHeader icon="section-defenses">Saving Throws</SectionHeader>
          {ABILITIES.map((ability) => (
            <View key={ability} style={[styles.row, { alignItems: 'center', paddingVertical: 0.75 }]}>
              <ProficiencyDot proficient={sheet.saves[ability].proficient} />
              <Text style={{ flexGrow: 1, fontSize: front.small }}>{ABILITY_LABELS[ability]}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: front.small }}>
                {signed(sheet.saves[ability].mod)}
              </Text>
            </View>
          ))}

          <View style={{ marginTop: 5 }}>
            <SectionHeader>Passive</SectionHeader>
            <PassiveRow label="Perception" value={sheet.passive.perception} />
            <PassiveRow label="Insight" value={sheet.passive.insight} />
            <PassiveRow label="Investigation" value={sheet.passive.investigation} />
          </View>

          {defenses.senses.length > 0 || defenses.resistances.length > 0 ? (
            <View style={{ marginTop: 5 }}>
              <SectionHeader>Senses</SectionHeader>
              {defenses.senses.map((sense) => (
                <Text key={sense} style={{ fontSize: front.small }}>
                  {sense}
                </Text>
              ))}
              {defenses.resistances.length > 0 ? (
                <Text style={{ fontSize: front.small }}>Resist: {defenses.resistances.join(', ')}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Middle: everything used on your turn. */}
        <View style={{ width: '39%' }}>
          <View style={[styles.row, { gap: 4 }]}>
            <StatBox label="Armour Class" value={defenses.ac} big hint={defenses.acBreakdown} />
            <StatBox label="Initiative" value={signed(defenses.initiative)} />
            <StatBox label="Speed" value={`${defenses.speed}`} hint="feet" />
          </View>

          <View style={{ marginTop: 5 }}>
            <SectionHeader>Hit Points</SectionHeader>
            <View style={[styles.row, { gap: 4, alignItems: 'flex-end' }]}>
              <StatBox label="Max" value={defenses.hpMax} />
              <View style={{ flexGrow: 1 }}>
                <Label>Current</Label>
                <View style={styles.writeBox} />
              </View>
              <View style={{ flexGrow: 1 }}>
                <Label>Temporary</Label>
                <View style={styles.writeBox} />
              </View>
            </View>

            <View style={[styles.row, { gap: 4, marginTop: 4, alignItems: 'center' }]}>
              <Text style={{ fontSize: front.small }}>
                Hit Dice {defenses.hitDice.count}d{defenses.hitDice.die}
              </Text>
              <Pips count={Math.min(defenses.hitDice.count, 20)} />
            </View>

            <View style={[styles.row, { gap: 8, marginTop: 3, alignItems: 'center' }]}>
              <Text style={styles.label}>Death Saves</Text>
              <Text style={{ fontSize: front.label }}>Success</Text>
              <Pips count={3} />
              <Text style={{ fontSize: front.label }}>Failure</Text>
              <Pips count={3} />
            </View>
          </View>

          <View style={{ marginTop: 6 }}>
            <SectionHeader icon="section-attacks">
              {sheet.attacksPerAction > 1 ? `Attacks — ${sheet.attacksPerAction} per action` : 'Attacks'}
            </SectionHeader>
            <Table
              columns={[
                { header: 'Name', width: 30 },
                { header: 'Atk / DC', width: 15 },
                { header: 'Damage', width: 27 },
                { header: 'Notes', width: 28 },
              ]}
              minRows={9}
              rows={sheet.attacks.map((attack) => [
                attack.name,
                attack.attackBonus !== undefined
                  ? signed(attack.attackBonus)
                  : attack.save
                    ? `DC ${attack.save.dc} ${attack.save.ability.toUpperCase()}`
                    : '—',
                attack.versatile ? `${attack.damage} (${attack.versatile})` : attack.damage,
                [attack.mastery?.name, attack.range, attack.notes].filter(Boolean).join(' · '),
              ])}
            />
          </View>

          {spellcasting ? (
            <View style={{ marginTop: 6 }}>
              <SectionHeader icon="section-spells">Spellcasting</SectionHeader>
              <View style={[styles.row, { gap: 4 }]}>
                <Field label="Ability" value={spellcasting.ability.toUpperCase()} />
                <Field label="Save DC" value={String(spellcasting.saveDc)} />
                <Field label="Attack" value={signed(spellcasting.attackBonus)} />
                <Field label="Prepared" value={String(spellcasting.preparedMax)} />
              </View>
              <View style={{ marginTop: 3 }}>
                <Label>Slots</Label>
                <SlotRow sheet={sheet} />
              </View>
            </View>
          ) : null}
        </View>

        {/* Right: the skill list, alphabetical, one glance. */}
        <View style={{ width: '34%' }}>
          <SectionHeader icon="section-skills">Skills</SectionHeader>
          {sheet.skills.map((skill) => (
            <View key={skill.id} style={[styles.row, { alignItems: 'center', paddingVertical: 0.6 }]}>
              <ProficiencyDot proficient={skill.proficient} expertise={skill.expertise} />
              <Text style={{ flexGrow: 1, fontSize: front.small }}>
                {skill.name}
                {skill.id === 'stealth' && defenses.stealthDisadvantage ? ' *' : ''}
              </Text>
              <Text style={{ fontSize: front.label, color: colors.muted, marginRight: 4 }}>
                {skill.ability.toUpperCase()}
              </Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: front.small }}>{signed(skill.mod)}</Text>
            </View>
          ))}
          {defenses.stealthDisadvantage ? (
            <Text style={{ fontSize: front.label, color: colors.muted, marginTop: 2 }}>
              * Disadvantage from worn armour
            </Text>
          ) : null}

          {sheet.masteries.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              <SectionHeader>Weapon Mastery</SectionHeader>
              {sheet.masteries.map((mastery) => (
                <View key={mastery.weaponName} style={[styles.row, { alignItems: 'center', gap: 3 }]}>
                  <Icon name={iconFor('mastery', mastery.masteryName.toLowerCase())} size={7} />
                  <Text style={{ fontSize: front.small }}>
                    {mastery.weaponName} — {mastery.masteryName}
                  </Text>
                </View>
              ))}
              <Text style={{ fontSize: front.label, color: colors.muted, marginTop: 1 }}>
                Full text overleaf
              </Text>
            </View>
          ) : null}

          {/* Names only - a memory jog mid-combat, not a rules reference. */}
          {show.conditions && conditions.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              <SectionHeader>Conditions</SectionHeader>
              <Text style={{ fontSize: front.label, color: colors.muted }}>
                {conditions.join(' · ')}
              </Text>
            </View>
          ) : null}

          {show.notes ? (
            <View style={{ marginTop: 6 }}>
              <SectionHeader>Notes</SectionHeader>
              <RuledLines count={6} />
            </View>
          ) : null}
        </View>
      </View>

      {/*
        Who the character is, on the front where it gets read and added to during play. The back page
        is a rules reference; roleplay notes were the one thing on it nobody turns the page for.
      */}
      {show.character ? (
        <View style={{ marginTop: 8 }}>
          <SectionHeader icon="ability-cha">Character</SectionHeader>
          <View style={[styles.row, { gap: 10 }]}>
            <View style={{ width: '50%' }}>
              <DetailBlock label="Personality Trait" value={sheet.details.personalityTrait} />
              <DetailBlock label="Ideal" value={sheet.details.ideal} />
              <DetailBlock label="Bond" value={sheet.details.bond} />
              <DetailBlock label="Flaw" value={sheet.details.flaw} />
            </View>
            <View style={{ width: '50%' }}>
              <DetailBlock label="Appearance" value={sheet.details.appearance} lines={2} />
              <DetailBlock label="Backstory" value={sheet.details.backstory} lines={5} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Header({ sheet }: { sheet: CharacterSheet }) {
  const { identity } = sheet;
  return (
    <View style={[styles.row, { gap: 6, alignItems: 'flex-start' }]}>
      {identity.portraitDataUrl ? (
        <Image
          src={identity.portraitDataUrl}
          style={{ width: 56, height: 56, borderWidth: 0.75, borderColor: colors.rule, objectFit: 'cover' }}
        />
      ) : null}

      <View style={{ flexGrow: 1 }}>
        <View style={[styles.row, { alignItems: 'center', gap: 4 }]}>
          <Icon name={iconFor('class', identity.className.toLowerCase())} size={14} />
          <Text style={{ fontFamily: fonts.displayBold, fontSize: sizes.giant }}>
            {identity.name || 'Unnamed'}
          </Text>
        </View>
        <View style={[styles.row, { gap: 5, marginTop: 3 }]}>
          <Field
            label="Class & Level"
            value={`${identity.className} ${identity.level}${identity.subclassName ? ` (${identity.subclassName})` : ''}`}
          />
          <Field label="Species" value={identity.lineageName ? `${identity.speciesName} — ${identity.lineageName}` : identity.speciesName} />
          <Field label="Background" value={identity.backgroundName} />
          <Field label="Alignment" value={identity.alignment ?? ''} />
          <Field label="Player" value={identity.playerName ?? ''} />
        </View>
      </View>

      <View style={[styles.box, { alignItems: 'center', width: 52, paddingVertical: 3 }]}>
        <Label>Prof</Label>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: sizes.giant }}>
          {signed(sheet.proficiencyBonus)}
        </Text>
      </View>
    </View>
  );
}

function PassiveRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={[styles.row, { paddingVertical: 0.75 }]}>
      <Text style={{ flexGrow: 1, fontSize: front.small }}>{label}</Text>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: front.small }}>{value}</Text>
    </View>
  );
}

/** Slot pips the player ticks off as they cast. Pact Magic is called out separately. */
function SlotRow({ sheet }: { sheet: CharacterSheet }) {
  const spellcasting = sheet.spellcasting;
  if (!spellcasting) return null;

  if (spellcasting.pact) {
    return (
      <View style={[styles.row, { gap: 4, alignItems: 'center' }]}>
        <Text style={{ fontSize: front.small }}>Pact Magic — level {spellcasting.pact.level}</Text>
        <Pips count={spellcasting.pact.count} />
        <Text style={{ fontSize: front.label, color: colors.muted }}>short rest</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>
      {spellcasting.slots.map((count, index) =>
        count > 0 ? (
          <View key={index} style={[styles.row, { alignItems: 'center', gap: 2 }]}>
            <Text style={{ fontSize: front.label }}>L{index + 1}</Text>
            <Pips count={count} />
          </View>
        ) : null,
      )}
    </View>
  );
}
