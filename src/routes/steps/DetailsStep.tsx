import { contentPack } from '../../content';
import { Field, Hint, IssueList, SectionHeading, inputClass } from '../../components/ui';
import { useBuild, useCharacterStore, useSheet } from '../../store/characterStore';

const TEXT_FIELDS = [
  ['personalityTrait', 'Personality trait'],
  ['ideal', 'Ideal'],
  ['bond', 'Bond'],
  ['flaw', 'Flaw'],
  ['appearance', 'Appearance'],
  ['backstory', 'Backstory'],
] as const;

/** Portraits are downscaled before storing - a phone photo would fill localStorage on its own. */
async function downscale(file: File, max = 512): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.8);
}

export function DetailsStep() {
  const build = useBuild();
  const sheet = useSheet();
  const update = useCharacterStore((s) => s.update);

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
              const file = event.target.files?.[0];
              if (!file) return;
              setDetail('portraitDataUrl', await downscale(file));
            }}
          />
        </Field>
      </div>

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
