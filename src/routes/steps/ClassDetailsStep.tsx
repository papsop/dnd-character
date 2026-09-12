import { contentPack } from '../../content';
import { ChoiceCard, Counter, Hint, IssueList, SectionHeading } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { iconFor } from '../../icons/paths';
import { choicesFor, subclassOf } from '../../domain/progression';
import type { Choice } from '../../domain/schema/content';
import { useBuild, useCharacterStore, useSheet } from '../../store/characterStore';

type Option = { id: string; name: string; hint?: string; icon?: ReturnType<typeof iconFor> };

/**
 * Resolves a choice's options to something renderable. The wizard knows nothing about what any
 * particular choice means - adding a new kind of class decision needs no UI change, only content.
 */
function optionsFor(choice: Choice): Option[] {
  if (choice.from.kind === 'inline') {
    return choice.from.options.map((option) => ({ id: option.id, name: option.name }));
  }

  const allowed = choice.from.ids ? new Set(choice.from.ids) : undefined;
  const keep = (id: string) => !allowed || allowed.has(id);

  switch (choice.from.ref) {
    case 'skills':
      return contentPack.skills
        .filter((s) => keep(s.id))
        .map((s) => ({ id: s.id, name: s.name, hint: s.ability.toUpperCase() }));

    case 'weapons':
      return contentPack.items
        .filter((i) => i.kind === 'weapon' && i.mastery !== undefined && keep(i.id))
        .map((item) => {
          const mastery =
            item.kind === 'weapon' && item.mastery
              ? contentPack.masteries.find((m) => m.id === item.mastery)
              : undefined;
          return {
            id: item.id,
            name: item.name,
            ...(mastery ? { hint: mastery.name, icon: iconFor('mastery', mastery.id) } : {}),
          };
        });

    case 'feats':
      return contentPack.feats.filter((f) => keep(f.id)).map((f) => {
        const summary = f.text[0];
        return { id: f.id, name: f.name, ...(summary ? { hint: summary.slice(0, 90) } : {}) };
      });

    case 'spells':
      return contentPack.spells.filter((s) => keep(s.id)).map((s) => ({ id: s.id, name: s.name }));

    case 'tools':
    case 'languages':
      return (choice.from.ids ?? []).map((id) => ({ id, name: id }));

    default:
      return [];
  }
}

export function ClassDetailsStep() {
  const build = useBuild();
  const sheet = useSheet();
  const toggleChoice = useCharacterStore((s) => s.toggleChoice);
  const update = useCharacterStore((s) => s.update);

  const charClass = contentPack.classes.find((c) => c.id === build.classId);
  const choices = choicesFor(build, contentPack);
  const subclasses = contentPack.subclasses.filter((s) => s.classId === build.classId);
  const subclass = subclassOf(build, contentPack);

  if (!charClass) {
    return <Hint>Choose a class first.</Hint>;
  }

  return (
    <section className="space-y-6">
      <SectionHeading>{charClass.name} choices</SectionHeading>
      <IssueList issues={sheet.issues.filter((i) => i.step === 'class-details')} />

      {build.level >= charClass.subclassLevel ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg">Subclass</h3>
            <Counter chosen={subclass ? 1 : 0} max={1} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {subclasses.map((option) => (
              <ChoiceCard
                key={option.id}
                selected={build.subclassId === option.id}
                onClick={() => update((draft) => ({ ...draft, subclassId: option.id }))}
              >
                <p className="font-display text-base">{option.name}</p>
                <p className="text-ink-500 line-clamp-3 text-xs">{option.text[0]}</p>
              </ChoiceCard>
            ))}
          </div>
        </div>
      ) : null}

      {choices.map((choice) => {
        const selected = build.choices[choice.id] ?? [];
        const options = optionsFor(choice);

        return (
          <div key={choice.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg">{choice.prompt}</h3>
              <Counter chosen={selected.length} max={choice.count} />
              {choice.level > 1 ? (
                <span className="text-ink-500 text-xs">at level {choice.level}</span>
              ) : null}
            </div>

            {options.length === 0 ? (
              <Hint>No options available.</Hint>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {options.map((option) => (
                  <ChoiceCard
                    key={option.id}
                    selected={selected.includes(option.id)}
                    onClick={() => toggleChoice(choice.id, option.id, choice.count)}
                  >
                    <span className="flex items-center gap-1.5">
                      {option.icon ? <Icon name={option.icon} size={16} /> : null}
                      <span className="text-sm font-semibold">{option.name}</span>
                    </span>
                    {option.hint ? <p className="text-ink-500 text-xs">{option.hint}</p> : null}
                  </ChoiceCard>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
