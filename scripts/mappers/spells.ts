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

function components(r: Raw): Spell['components'] {
  const material = r.material ? String(r.material_specified ?? '').trim() : '';
  return {
    v: Boolean(r.verbal),
    s: Boolean(r.somatic),
    ...(material ? { m: material } : {}),
  };
}

function attackKind(value: unknown): 'melee' | 'ranged' | undefined {
  const attack = String(value ?? '').toLowerCase();
  if (attack === 'melee' || attack === 'ranged') return attack;
  return undefined;
}

/** Casting time reads better with its trigger attached: "Reaction, which you take when...". */
function castingTime(r: Raw): string {
  const base = String(r.casting_time ?? 'action');
  const trigger = r.reaction_condition ? String(r.reaction_condition) : '';
  return trigger ? `${base}, ${trigger}` : base;
}

export function mapSpells(raw: Raw[]): Spell[] {
  return raw.map((r): Spell => {
    const attack = attackKind(r.attack_roll);
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
      ...(attack ? { attack } : {}),
      classes: (r.classes ?? []).map((c: Raw) => toId(c.key ?? c.name)),
    };
  });
}
