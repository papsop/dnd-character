import type { z } from 'zod';
import type { itemSchema, masterySchema, namedTextSchema, skillSchema } from '../../src/domain/schema/content';
import { paragraphs, parseDice, toAbility, toGp, toId, type Raw } from '../lib/raw';

type Skill = z.infer<typeof skillSchema>;
type NamedText = z.infer<typeof namedTextSchema>;
type Mastery = z.infer<typeof masterySchema>;
type Item = z.infer<typeof itemSchema>;

export function mapSkills(raw: Raw[]): Skill[] {
  return raw.map((r) => ({
    id: toId(r.index),
    name: String(r.name),
    ability: toAbility(r.ability_score.index),
  }));
}

export function mapNamedText(raw: Raw[]): NamedText[] {
  return raw.map((r) => ({
    id: toId(r.index),
    name: String(r.name),
    text: paragraphs(r.description ?? r.desc),
  }));
}

export function mapMasteries(raw: Raw[]): Mastery[] {
  return mapNamedText(raw);
}

const categories = (r: Raw): string[] => (r.equipment_categories ?? []).map((c: Raw) => String(c.index));

function armorType(cats: string[]): 'light' | 'medium' | 'heavy' | 'shield' | null {
  if (cats.includes('shields')) return 'shield';
  if (cats.includes('light-armor')) return 'light';
  if (cats.includes('medium-armor')) return 'medium';
  if (cats.includes('heavy-armor')) return 'heavy';
  return null;
}

/**
 * The source tags every item with several overlapping categories. We pick one `kind`, in priority
 * order - weapon, armor, pack, gear - because the sheet treats them completely differently.
 */
export function mapItems(raw: Raw[]): Item[] {
  return raw.map((r): Item => {
    const cats = categories(r);
    const id = toId(r.index);
    const base = { id, name: String(r.name), cost: toGp(r.cost), weight: Number(r.weight ?? 0) };

    if (cats.includes('weapons')) {
      const versatile = parseDice(r.two_handed_damage?.damage_dice);
      const normal = Number(r.range?.normal ?? 0);
      const long = Number(r.range?.long ?? 0);
      return {
        ...base,
        kind: 'weapon',
        category: cats.includes('martial-weapons') ? 'martial' : 'simple',
        rangeType: cats.includes('ranged-weapons') ? 'ranged' : 'melee',
        damage: parseDice(r.damage?.damage_dice),
        damageType: String(r.damage?.damage_type?.name ?? '—'),
        ...(versatile ? { versatileDamage: versatile } : {}),
        ...(long > 0 ? { range: [normal, long] as [number, number] } : {}),
        properties: (r.properties ?? []).map((p: Raw) => String(p.name)),
        ...(r.mastery ? { mastery: toId(r.mastery.index) } : {}),
      };
    }

    const armor = armorType(cats);
    if (armor) {
      const dexBonus = Boolean(r.armor_class?.dex_bonus);
      const maxBonus = r.armor_class?.max_bonus;
      const str = Number(r.str_minimum ?? 0);
      return {
        ...base,
        kind: 'armor',
        armorType: armor,
        baseAc: Number(r.armor_class?.base ?? 0),
        // No dex_bonus means heavy armor (cap 0). A max_bonus means medium armor (cap 2).
        ...(dexBonus ? (typeof maxBonus === 'number' ? { dexCap: maxBonus } : {}) : { dexCap: 0 }),
        ...(str > 0 ? { strengthRequirement: str } : {}),
        stealthDisadvantage: Boolean(r.stealth_disadvantage),
      };
    }

    if (Array.isArray(r.contents) && r.contents.length > 0) {
      return {
        ...base,
        kind: 'pack',
        contents: r.contents.map((c: Raw) => ({
          itemId: toId(c.item.index),
          quantity: Number(c.quantity),
        })),
      };
    }

    return { ...base, kind: 'gear', text: paragraphs(r.description) };
  });
}
