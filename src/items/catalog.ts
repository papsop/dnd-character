import { z } from 'zod';
import { contentPack, itemsById } from '../content';
import type { Item as Equipment } from '../domain/schema/content';

export const ITEM_TYPES = ['Weapon', 'Armor', 'Shield', 'Potion', 'Ring', 'Adventuring gear', 'Tools', 'Spellcasting', 'Instrument'] as const;
export type ItemType = typeof ITEM_TYPES[number];
export const RARITIES = ['Common', 'Uncommon', 'Rare', 'Very rare', 'Legendary'] as const;
export const BACKGROUNDS = ['By rarity', 'Parchment', 'Forest', 'Arcane blue', 'Amethyst', 'Golden'] as const;

export const artwork: { id: string; name: string; type: ItemType }[] = [
  // Keep the first six positions stable for existing saved cards.
  { id: 'longsword', name: 'Silver longsword', type: 'Weapon' },
  { id: 'shortsword', name: 'Golden short sword', type: 'Weapon' },
  { id: 'red-potion', name: 'Ruby potion', type: 'Potion' },
  { id: 'green-potion', name: 'Emerald potion', type: 'Potion' },
  { id: 'sapphire-ring', name: 'Sapphire ring', type: 'Ring' },
  { id: 'ruby-ring', name: 'Ruby ring', type: 'Ring' },
  { id: 'dagger', name: 'Dagger', type: 'Weapon' },
  { id: 'handaxe', name: 'Handaxe', type: 'Weapon' },
  { id: 'greataxe', name: 'Greataxe', type: 'Weapon' },
  { id: 'mace', name: 'Mace', type: 'Weapon' },
  { id: 'quarterstaff', name: 'Quarterstaff', type: 'Weapon' },
  { id: 'spear', name: 'Spear', type: 'Weapon' },
  { id: 'bow', name: 'Longbow', type: 'Weapon' },
  { id: 'crossbow', name: 'Light crossbow', type: 'Weapon' },
  { id: 'leather', name: 'Leather armor', type: 'Armor' },
  { id: 'chain-mail', name: 'Chain mail', type: 'Armor' },
  { id: 'scale-mail', name: 'Scale mail', type: 'Armor' },
  { id: 'shield', name: 'Wooden shield', type: 'Shield' },
  { id: 'thieves-tools', name: 'Thieves’ tools', type: 'Tools' },
  { id: 'backpack', name: 'Explorer’s backpack', type: 'Adventuring gear' },
  { id: 'spellbook', name: 'Spellbook', type: 'Spellcasting' },
  { id: 'wand', name: 'Arcane wand', type: 'Spellcasting' },
  { id: 'lute', name: 'Lute', type: 'Instrument' },
  { id: 'holy-symbol', name: 'Holy symbol', type: 'Spellcasting' },
  { id: 'herbalism-kit', name: 'Herbalism kit', type: 'Tools' },
  { id: 'scimitar', name: 'Scimitar', type: 'Weapon' },
  { id: 'greatsword', name: 'Greatsword', type: 'Weapon' },
  { id: 'sickle', name: 'Sickle', type: 'Weapon' },
  { id: 'flail', name: 'Flail', type: 'Weapon' },
  { id: 'crystal', name: 'Arcane crystal', type: 'Spellcasting' },
  { id: 'orb', name: 'Arcane orb', type: 'Spellcasting' },
  { id: 'robe', name: 'Traveling robe', type: 'Adventuring gear' },
  { id: 'quiver', name: 'Quiver and arrows', type: 'Adventuring gear' },
  { id: 'mistletoe', name: 'Sprig of mistletoe', type: 'Spellcasting' },
];

export const itemSchema = z.object({
  id: z.string(), name: z.string().max(70), type: z.enum(ITEM_TYPES),
  rarity: z.enum(RARITIES), art: z.number().int().min(0).max(artwork.length - 1),
  text: z.string().max(420), attunement: z.boolean(), quantity: z.number().int().min(0).max(18),
  background: z.enum(BACKGROUNDS).default('By rarity'), source: z.enum(['homebrew', 'srd']).default('homebrew'),
});
export type ForgeItem = z.infer<typeof itemSchema>;
export const STORAGE_KEY = 'dnd-toolkit/items-prototype/v1';
export const samples: [ForgeItem, ...ForgeItem[]] = [
  { id: 'sword', name: 'Emberwake', type: 'Weapon', rarity: 'Rare', art: 0, text: 'A warm ember sleeps inside this blade.\n\nOnce per dawn, speak its name to kindle the edge. Your next hit deals an extra 1d6 fire damage.', attunement: true, quantity: 1, background: 'By rarity', source: 'homebrew' },
  { id: 'potion', name: 'A little second chance', type: 'Potion', rarity: 'Uncommon', art: 2, text: 'Sweet as wild cherries, with a spark of summer lightning.\n\nDrink this potion to regain 2d4 + 2 hit points. The empty bottle smells faintly of cinnamon.', attunement: false, quantity: 2, background: 'By rarity', source: 'homebrew' },
  { id: 'ring', name: 'Ring of the quiet tide', type: 'Ring', rarity: 'Rare', art: 4, text: 'Hold it to your ear and hear a distant sea.\n\nYou can breathe underwater for up to 1 hour per day. A tiny pearl of light marks each minute remaining.', attunement: true, quantity: 1, background: 'By rarity', source: 'homebrew' },
];
export function loadItems(): ForgeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return samples;
    const parsed = z.array(itemSchema).min(1).max(100).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : samples;
  } catch { return samples; }
}
export function defaultArtwork(type: ItemType): number {
  return Math.max(0, artwork.findIndex(a => a.type === type));
}
export function cardPalette(item: Pick<ForgeItem, 'rarity' | 'background'>): string {
  const palettes = { Common: 'parchment', Uncommon: 'forest', Rare: 'blue', 'Very rare': 'violet', Legendary: 'gold' };
  const overrides = { Parchment: 'parchment', Forest: 'forest', 'Arcane blue': 'blue', Amethyst: 'violet', Golden: 'gold' };
  return item.background === 'By rarity' ? palettes[item.rarity] : overrides[item.background];
}

// Several related equipment entries deliberately share a representative illustration.
const equipmentArt: Record<string, string> = {
  longsword: 'longsword', shortsword: 'shortsword', dagger: 'dagger', handaxe: 'handaxe', greataxe: 'greataxe',
  mace: 'mace', quarterstaff: 'quarterstaff', spear: 'spear', javelin: 'spear', longbow: 'bow', shortbow: 'bow',
  'light-crossbow': 'crossbow', 'leather-armor': 'leather', 'studded-leather-armor': 'leather',
  'chain-mail': 'chain-mail', 'chain-shirt': 'chain-mail', 'scale-mail': 'scale-mail', shield: 'shield',
  'thieves-tools': 'thieves-tools', 'herbalism-kit': 'herbalism-kit', backpack: 'backpack',
  spellbook: 'spellbook', book: 'spellbook', wand: 'wand', lute: 'lute', amulet: 'holy-symbol',
  scimitar: 'scimitar', greatsword: 'greatsword', sickle: 'sickle', flail: 'flail',
  crystal: 'crystal', orb: 'orb', robe: 'robe', arrows: 'quiver', quiver: 'quiver', 'sprig-of-mistletoe': 'mistletoe',
};
function equipmentDescription(entry: Equipment): string {
  const lines: string[] = [];
  if (entry.kind === 'weapon') {
    if (entry.damage) lines.push(`Damage: ${entry.damage.count}d${entry.damage.die} ${entry.damageType.toLowerCase()}.`);
    if (entry.versatileDamage) lines.push(`Two-handed: ${entry.versatileDamage.count}d${entry.versatileDamage.die}.`);
    if (entry.properties.length) lines.push(`Properties: ${entry.properties.join(', ')}.`);
    if (entry.range) lines.push(`Range: ${entry.range.join('/')} ft.`);
    if (entry.thrownRange) lines.push(`Thrown range: ${entry.thrownRange.join('/')} ft.`);
    if (entry.mastery) lines.push(`Mastery: ${contentPack.masteries.find(m => m.id === entry.mastery)?.name ?? entry.mastery} (requires the feature).`);
  } else if (entry.kind === 'armor') {
    if (entry.armorType === 'shield') lines.push(`Armor Class: +${entry.baseAc}.`);
    else lines.push(`Armor Class: ${entry.baseAc}${entry.dexCap === 0 ? '' : entry.dexCap === undefined ? ' + Dex modifier' : ` + Dex modifier (max ${entry.dexCap})`}.`);
    if (entry.strengthRequirement) lines.push(`Strength requirement: ${entry.strengthRequirement}.`);
    if (entry.stealthDisadvantage) lines.push('Disadvantage on Stealth checks.');
  } else if (entry.kind === 'pack') {
    lines.push('Includes: ' + entry.contents.map(c => `${c.quantity} × ${itemsById.get(c.itemId)?.name ?? c.itemId}`).join(', ') + '.');
  } else {
    // Gear descriptions can run to multiple pages. Start with a compact reference rather than silently truncating rules.
    lines.push('Add your own description or table notes.');
  }
  lines.push(`Weight: ${entry.weight} lb. · Value: ${entry.cost} GP.`);
  return lines.join('\n\n');
}
export const equipmentTemplates = contentPack.items.flatMap(entry => {
  const artId = equipmentArt[entry.id] ?? (entry.kind === 'pack' ? 'backpack' : undefined);
  if (!artId) return [];
  const art = artwork.findIndex(a => a.id === artId);
  const artEntry = artwork[art];
  if (!artEntry) return [];
  const item: ForgeItem = {
    id: entry.id, name: entry.name, type: entry.kind === 'pack' ? 'Adventuring gear' : artEntry.type,
    rarity: 'Common', art, text: equipmentDescription(entry), attunement: false,
    quantity: 1, background: 'By rarity', source: 'srd',
  };
  return [item];
});
export const classEquipment = contentPack.classes.map(c => ({
  id: c.id, name: c.name,
  ids: new Set(c.startingEquipment.flatMap(kit => kit.items.map(i => i.itemId))),
  choices: c.startingEquipment.flatMap(kit => kit.pendingChoices.map(choice => choice.prompt)),
}));
