import { artwork, cardPalette, classEquipment, equipmentTemplates, itemSchema, samples } from './catalog';

it('provides valid editable templates for all fixed class starting gear', () => {
  const ids = new Set(equipmentTemplates.map(t => t.id));
  for (const c of classEquipment) {
    for (const id of c.ids) expect(ids.has(id), `${c.name}: ${id}`).toBe(true);
  }
  for (const item of equipmentTemplates) expect(itemSchema.safeParse(item).success, item.name).toBe(true);
  expect(new Set(artwork.map(a => a.id)).size).toBe(artwork.length);
});

it('migrates old cards without changing artwork or descriptions', () => {
  const old = { ...samples[1], background: undefined, source: undefined, art: 3, rarity: 'Legendary' };
  const item = itemSchema.parse(old);
  expect(item).toMatchObject({ art: 3, rarity: 'Legendary', background: 'By rarity', source: 'homebrew', text: samples[1]?.text });
});

it('uses rarity colors unless a background was explicitly selected', () => {
  expect(cardPalette({ rarity: 'Rare', background: 'By rarity' })).toBe('blue');
  expect(cardPalette({ rarity: 'Legendary', background: 'By rarity' })).toBe('gold');
  expect(cardPalette({ rarity: 'Legendary', background: 'Arcane blue' })).toBe('blue');
});
