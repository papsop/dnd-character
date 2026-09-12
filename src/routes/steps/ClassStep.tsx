import { contentPack } from '../../content';
import { Icon } from '../../components/Icon';
import { ChoiceCard, Field, Hint, IssueList, SectionHeading, inputClass } from '../../components/ui';
import { iconFor } from '../../icons/paths';
import { useBuild, useCharacterStore, useSheet } from '../../store/characterStore';

const ABILITY_NAMES: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export function ClassStep() {
  const build = useBuild();
  const sheet = useSheet();
  const update = useCharacterStore((s) => s.update);

  return (
    <section className="space-y-4">
      <SectionHeading>Choose a class</SectionHeading>
      <Hint>
        Your class is what you do in a fight and how you solve problems. Everything else is built
        around it, which is why the 2024 rules ask for it first.
      </Hint>

      <IssueList issues={sheet.issues.filter((i) => i.step === 'class')} />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {contentPack.classes.map((charClass) => (
          <ChoiceCard
            key={charClass.id}
            selected={build.classId === charClass.id}
            onClick={() =>
              update((draft) => ({
                ...draft,
                classId: charClass.id,
                // A subclass and class picks belong to the old class - drop them.
                subclassId: undefined,
                choices: {},
                spells: { cantrips: [], prepared: [] },
              }))
            }
          >
            <div className="flex items-start gap-2">
              <Icon name={iconFor('class', charClass.id)} size={28} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-base">{charClass.name}</p>
                <p className="text-ink-500 text-xs">
                  d{charClass.hitDie} · {charClass.primaryAbility.map((a) => ABILITY_NAMES[a]).join(' or ')}
                </p>
                <p className="text-ink-500 text-xs">
                  Saves: {charClass.savingThrows.map((a) => a.toUpperCase()).join(', ')}
                  {charClass.spellcasting ? ' · Spellcaster' : ''}
                </p>
              </div>
            </div>
          </ChoiceCard>
        ))}
      </div>

      <div className="max-w-[10rem]">
        <Field label="Level">
          <select
            className={inputClass}
            value={build.level}
            onChange={(event) =>
              update((draft) => ({ ...draft, level: Number(event.target.value) }))
            }
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => (
              <option key={level} value={level}>
                Level {level}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </section>
  );
}
