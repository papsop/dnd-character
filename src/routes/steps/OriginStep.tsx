import { contentPack } from '../../content';
import { ChoiceCard, Hint, IssueList, SectionHeading } from '../../components/ui';
import { useBuild, useCharacterStore, useSheet } from '../../store/characterStore';

export function OriginStep() {
  const build = useBuild();
  const sheet = useSheet();
  const update = useCharacterStore((s) => s.update);

  const species = contentPack.species.find((s) => s.id === build.speciesId);
  const skillName = (id: string) => contentPack.skills.find((s) => s.id === id)?.name ?? id;
  const featName = (id: string) => contentPack.feats.find((f) => f.id === id)?.name ?? id;

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <SectionHeading>Background</SectionHeading>
        <Hint>
          Under the 2024 rules your background carries your ability score bonuses, two skills, a tool
          and a free feat. It matters more than it used to.
        </Hint>

        <IssueList issues={sheet.issues.filter((i) => i.step === 'origin')} />

        <div className="grid gap-2 sm:grid-cols-2">
          {contentPack.backgrounds.map((background) => (
            <ChoiceCard
              key={background.id}
              selected={build.backgroundId === background.id}
              onClick={() =>
                update((draft) => ({
                  ...draft,
                  backgroundId: background.id,
                  // The old background's bonuses may not be legal for the new one.
                  abilities: { ...draft.abilities, backgroundBonuses: {} },
                }))
              }
            >
              <p className="font-display text-base">{background.name}</p>
              <p className="text-ink-500 text-xs">
                {background.abilityOptions.map((a) => a.toUpperCase()).join(' / ')}
              </p>
              <p className="text-ink-500 text-xs">
                {background.skills.map(skillName).join(', ')} · {background.toolProficiency}
              </p>
              <p className="text-ink-500 text-xs">Feat: {featName(background.originFeat)}</p>
            </ChoiceCard>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeading>Species</SectionHeading>
        <Hint>Species gives you traits, a size and a speed - but no ability bonuses in 2024.</Hint>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {contentPack.species.map((option) => (
            <ChoiceCard
              key={option.id}
              selected={build.speciesId === option.id}
              onClick={() =>
                update((draft) => ({ ...draft, speciesId: option.id, lineageId: undefined }))
              }
            >
              <p className="font-display text-base">{option.name}</p>
              <p className="text-ink-500 text-xs">
                {option.size.join(' or ')} · {option.speed} ft.
              </p>
              <p className="text-ink-500 text-xs">
                {option.traits.length + (option.lineages.length > 0 ? 1 : 0)} traits
              </p>
            </ChoiceCard>
          ))}
        </div>
      </div>

      {species && species.lineages.length > 0 ? (
        <div className="space-y-4">
          <SectionHeading>{species.name} lineage</SectionHeading>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {species.lineages.map((lineage) => (
              <ChoiceCard
                key={lineage.id}
                selected={build.lineageId === lineage.id}
                onClick={() => update((draft) => ({ ...draft, lineageId: lineage.id }))}
              >
                <p className="text-sm font-semibold">{lineage.name}</p>
                <p className="text-ink-500 text-xs">
                  {lineage.traits.map((t) => t.name).join(', ')}
                </p>
              </ChoiceCard>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
