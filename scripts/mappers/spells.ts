import type { Spell } from '../../src/domain/schema/content';
import { SPELL_TEXT } from '../data/patches';
import { paragraphs, toAbility, toId, type Raw } from '../lib/raw';

/** Patch keys actually applied, so a patch upstream has since fixed fails the build. */
export const usedSpellPatchKeys = new Set<string>();

function spellText(id: string, desc: unknown): string[] {
  const text = paragraphs(desc);
  const patch = SPELL_TEXT[id];
  if (!patch) return text;
  if (text.length > 0) throw new Error(`Spell ${id} now has text upstream - drop the patch`);
  usedSpellPatchKeys.add(id);
  return patch;
}

/** casting_options carry both cantrip growth (player_level_N) and upcasting (slot_level_N). */
function scaling(r: Raw): Spell['scaling'] {
  const entries: Spell['scaling'] = [];
  for (const option of r.casting_options ?? []) {
    const match = /^(player|slot)_level_(\d+)$/.exec(String(option.type));
    if (!match) continue;
    const damageRoll = option.damage_roll ? String(option.damage_roll) : undefined;
    const targetCount = option.target_count ? Number(option.target_count) : undefined;
    if (!damageRoll && !targetCount) continue;
    entries.push({
      kind: match[1] === 'player' ? 'character-level' : 'slot-level',
      at: Number(match[2]),
      ...(damageRoll ? { damageRoll } : {}),
      ...(targetCount ? { targetCount } : {}),
    });
  }
  return entries.sort((a, b) => a.at - b.at);
}

function components(r: Raw): Spell['components'] {
  const material = r.material ? String(r.material_specified ?? '').trim() : '';
  return {
    v: Boolean(r.verbal),
    s: Boolean(r.somatic),
    ...(material ? { m: material } : {}),
  };
}

/** Casting time reads better with its trigger attached: "Reaction, which you take when...". */
function castingTime(r: Raw): string {
  const base = String(r.casting_time ?? 'action');
  const trigger = r.reaction_condition ? String(r.reaction_condition) : '';
  return trigger ? `${base}, ${trigger}` : base;
}

export function mapSpells(raw: Raw[]): Spell[] {
  return raw.map((r): Spell => {
    const save = r.saving_throw_ability ? toAbility(r.saving_throw_ability) : undefined;
    const higher = String(r.higher_level ?? '').trim();
    const damage = String(r.damage_roll ?? '').trim();

    return {
      id: toId(r.key),
      name: String(r.name),
      level: Number(r.level),
      school: String(r.school?.name ?? 'Unknown'),
      castingTime: castingTime(r),
      ...(r.reaction_condition ? { reactionCondition: String(r.reaction_condition) } : {}),
      range: String(r.range_text ?? 'Self'),
      components: components(r),
      duration: String(r.duration ?? 'Instantaneous'),
      concentration: Boolean(r.concentration),
      ritual: Boolean(r.ritual),
      text: spellText(toId(r.key), r.desc),
      ...(higher ? { atHigherLevels: higher } : {}),
      ...(damage ? { damageRoll: damage } : {}),
      damageTypes: (r.damage_types ?? []).map((d: Raw) => String(typeof d === 'string' ? d : d.name)),
      ...(save ? { save } : {}),
      attackRoll: Boolean(r.attack_roll),
      scaling: scaling(r),
      classes: (r.classes ?? []).map((c: Raw) => toId(c.key ?? c.name)),
    };
  });
}
