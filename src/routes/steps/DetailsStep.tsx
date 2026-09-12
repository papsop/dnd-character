import { useState } from 'react';
import { contentPack } from '../../content';
import { Field, Hint, IssueList, SectionHeading, inputClass } from '../../components/ui';
import { encodePortrait } from '../../pdf/portrait';
import { useBuild, useCharacterStore, useSheet } from '../../store/characterStore';

const TEXT_FIELDS = [
  ['personalityTrait', 'Personality trait'],
  ['ideal', 'Ideal'],
  ['bond', 'Bond'],
  ['flaw', 'Flaw'],
  ['appearance', 'Appearance'],
  ['backstory', 'Backstory'],
] as const;

export function DetailsStep() {
  const build = useBuild();
  const sheet = useSheet();
  const update = useCharacterStore((s) => s.update);
  const [portraitError, setPortraitError] = useState('');

  const setDetail = (key: string, value: string) =>
    update((draft) => ({ ...draft, details: { ...draft.details, [key]: value } }));

  return (
    <section className="space-y-5">
      <SectionHeading>Your character</SectionHeading>
      <IssueList issues={sheet.issues.filter((i) => i.step === 'details')} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Character name">
          <input
            className={inputClass}
            value={build.name}
            onChange={(event) => update((draft) => ({ ...draft, name: event.target.value }))}
          />
        </Field>
        <Field label="Player name">
          <input
            className={inputClass}
            value={build.details.playerName ?? ''}
            onChange={(event) => setDetail('playerName', event.target.value)}
          />
        </Field>
        <Field label="Alignment">
          <select
            className={inputClass}
            value={build.details.alignment ?? ''}
            onChange={(event) => setDetail('alignment', event.target.value)}
          >
            <option value="">—</option>
            {contentPack.alignments.map((alignment) => (
              <option key={alignment.id} value={alignment.name}>
                {alignment.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Portrait">
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={async (event) => {
              const input = event.target;
              const file = input.files?.[0];
              if (!file) return;
              try {
                setDetail('portraitDataUrl', await encodePortrait(file));
                setPortraitError('');
              } catch {
                // Browsers decode what they decode: a HEIC straight off an iPhone, or a file the
                // picker let through that is not an image at all, both land here. Saying so beats
                // a file field that looks like it worked and a sheet that prints without a face.
                setPortraitError('That image could not be read. Try a JPEG or PNG.');
              } finally {
                // Let the same file be picked again after a failure.
                input.value = '';
              }
            }}
          />
        </Field>
      </div>

      {portraitError ? (
        <p className="text-accent-500 text-sm" role="alert">
          {portraitError}
        </p>
      ) : null}

      <Hint>
        Your portrait stays in this browser and in any file you export. It is never uploaded. Make
        sure you have the right to use the image.
      </Hint>

      {build.details.portraitDataUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={build.details.portraitDataUrl}
            alt="Character portrait"
            className="border-parchment-200 dark:border-ink-700 h-24 w-24 rounded border object-cover"
          />
          <button
            type="button"
            className="text-accent-500 text-sm underline"
            onClick={() => setDetail('portraitDataUrl', '')}
          >
            Remove
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {TEXT_FIELDS.map(([key, label]) => (
          <Field key={key} label={label}>
            <textarea
              className={`${inputClass} min-h-16`}
              value={build.details[key] ?? ''}
              onChange={(event) => setDetail(key, event.target.value)}
            />
          </Field>
        ))}
      </div>
    </section>
  );
}
