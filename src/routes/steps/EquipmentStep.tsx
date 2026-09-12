import { contentPack } from '../../content';
import { ChoiceCard, Hint, IssueList, SectionHeading, inputClass } from '../../components/ui';
import type { EquipmentOption } from '../../domain/schema/content';
import { useBuild, useCharacterStore, useSheet } from '../../store/characterStore';
import { useState } from 'react';

/** Packs are listed by their contents so the player can see what they are actually carrying. */
function expand(option: EquipmentOption) {
  const lines: { itemId: string; quantity: number }[] = [];
  for (const entry of option.items) {
    const item = contentPack.items.find((i) => i.id === entry.itemId);
    if (item?.kind === 'pack') {
      lines.push({ itemId: item.id, quantity: entry.quantity });
      for (const content of item.contents) {
        lines.push({ itemId: content.itemId, quantity: content.quantity * entry.quantity });
      }
    } else {
      lines.push(entry);
    }
  }
  return lines;
}

export function EquipmentStep() {
  const build = useBuild();
  const sheet = useSheet();
  const update = useCharacterStore((s) => s.update);
  const [search, setSearch] = useState('');

  const charClass = contentPack.classes.find((c) => c.id === build.classId);
  const background = contentPack.backgrounds.find((b) => b.id === build.backgroundId);

  const takeKit = (option: EquipmentOption) =>
    update((draft) => ({
      ...draft,
      equipment: [
        ...draft.equipment,
        ...expand(option).map((entry) => ({ ...entry, equipped: false })),
      ],
      currency: { ...draft.currency, gp: draft.currency.gp + option.gold },
    }));

  const results = search.trim()
    ? contentPack.items
        .filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
        .slice(0, 12)
    : [];

  return (
    <section className="space-y-6">
      <SectionHeading>Equipment</SectionHeading>
      <Hint>
        Take your class kit or the gold, then the same for your background. Equip what you are
        actually wearing and holding - that is what drives your AC and your attacks.
      </Hint>

      <IssueList issues={sheet.issues.filter((i) => i.step === 'equipment')} />

      {charClass ? (
        <KitPicker title={`${charClass.name} kit`} options={charClass.startingEquipment} onTake={takeKit} />
      ) : null}
      {background ? (
        <KitPicker title={`${background.name} kit`} options={background.equipment} onTake={takeKit} />
      ) : null}

      <div className="space-y-2">
        <h3 className="font-display text-lg">Add anything else</h3>
        <input
          className={`${inputClass} max-w-sm`}
          placeholder="Search items…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search items"
        />
        {results.length > 0 ? (
          <ul className="grid gap-1 sm:grid-cols-3">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="border-parchment-200 dark:border-ink-700 hover:border-accent-400 w-full rounded border px-2 py-1 text-left text-sm"
                  onClick={() => {
                    update((draft) => ({
                      ...draft,
                      equipment: [...draft.equipment, { itemId: item.id, quantity: 1, equipped: false }],
                    }));
                    setSearch('');
                  }}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-lg">Carrying</h3>
        {sheet.equipment.length === 0 ? (
          <Hint>Nothing yet.</Hint>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-ink-500 text-left text-xs uppercase">
              <tr>
                <th className="py-1">Item</th>
                <th className="py-1 w-16">Qty</th>
                <th className="py-1 w-20">Equipped</th>
                <th className="py-1 w-16 text-right">lb</th>
                <th className="py-1 w-8" />
              </tr>
            </thead>
            <tbody>
              {sheet.equipment.map((line, index) => (
                <tr key={`${line.itemId}-${index}`} className="border-parchment-200 dark:border-ink-700 border-t">
                  <td className="py-1">{line.name}</td>
                  <td className="py-1">{line.quantity}</td>
                  <td className="py-1">
                    <input
                      type="checkbox"
                      checked={line.equipped}
                      aria-label={`Equip ${line.name}`}
                      onChange={() =>
                        update((draft) => ({
                          ...draft,
                          equipment: draft.equipment.map((entry, i) =>
                            i === index ? { ...entry, equipped: !entry.equipped } : entry,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td className="py-1 text-right">{line.weight * line.quantity}</td>
                  <td className="py-1 text-right">
                    <button
                      type="button"
                      className="text-ink-500 hover:text-accent-500"
                      aria-label={`Remove ${line.name}`}
                      onClick={() =>
                        update((draft) => ({
                          ...draft,
                          equipment: draft.equipment.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-parchment-200 dark:border-ink-700 border-t font-semibold">
                <td className="py-1" colSpan={3}>
                  Total
                </td>
                <td className="py-1 text-right">{sheet.totalWeight}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
        <p className="text-ink-500 text-sm">Gold: {build.currency.gp} GP</p>
      </div>
    </section>
  );
}

function KitPicker({
  title,
  options,
  onTake,
}: {
  title: string;
  options: EquipmentOption[];
  onTake: (option: EquipmentOption) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-display text-lg">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <ChoiceCard key={option.id} selected={false} onClick={() => onTake(option)}>
            <p className="text-sm">{option.label}</p>
            {option.pendingChoices.map((pending) => (
              <p key={pending.prompt} className="text-accent-600 dark:text-accent-400 mt-1 text-xs">
                Then pick: {pending.prompt}
              </p>
            ))}
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}
