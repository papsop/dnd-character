import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { contentPack } from '../content';
import { deriveSheet } from '../domain/derive';
import { characterBuildSchema, type CharacterBuild, type CharacterSheet } from '../domain/schema/character';
import type { Ability } from '../domain/schema/content';

/** 0 means "not assigned yet". The standard array's real floor is 8, so the two must differ. */
const emptyScores: Record<Ability, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

export function newCharacter(): CharacterBuild {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name: '',
    level: 1,
    classId: '',
    speciesId: '',
    backgroundId: '',
    abilities: { method: 'standard-array', base: { ...emptyScores }, backgroundBonuses: {}, improvements: [] },
    choices: {},
    spells: { cantrips: [], prepared: [] },
    equipment: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    hp: {},
    sheetOptions: { detail: 'condensed' },
    details: {},
  };
}

type CharacterStore = {
  build: CharacterBuild;
  /** The only way to change the build. Derived state is never stored - see `useSheet`. */
  update: (mutate: (draft: CharacterBuild) => CharacterBuild) => void;
  setChoice: (choiceId: string, values: string[]) => void;
  toggleChoice: (choiceId: string, value: string, max: number) => void;
  reset: () => void;
  load: (build: CharacterBuild) => void;
};

export const STORAGE_KEY = 'dnd-character/v1';

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      build: newCharacter(),

      update: (mutate) => set((state) => ({ build: mutate(state.build) })),

      setChoice: (choiceId, values) =>
        set((state) => ({
          build: { ...state.build, choices: { ...state.build.choices, [choiceId]: values } },
        })),

      toggleChoice: (choiceId, value, max) =>
        set((state) => {
          const current = state.build.choices[choiceId] ?? [];
          const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : // Dropping the oldest pick beats refusing the click - the player is changing their
              // mind, not making a mistake.
              [...current, value].slice(Math.max(0, current.length + 1 - max));
          return {
            build: { ...state.build, choices: { ...state.build.choices, [choiceId]: next } },
          };
        }),

      reset: () => set({ build: newCharacter() }),
      load: (build) => set({ build }),
    }),
    {
      name: STORAGE_KEY,
      // Only the build is persisted - the derived sheet is recomputed, never stored.
      partialize: (state) => ({ build: state.build }),
      /**
       * Stored JSON is untrusted: it may come from an older version of the app, a hand-edited
       * localStorage, or a half-written save. Parsing it through the schema fills in defaults and
       * rejects anything malformed, because the alternative is the engine reading an undefined
       * field and white-screening the whole app on load.
       */
      merge: (persisted, current) => {
        const stored = (persisted as { build?: unknown } | undefined)?.build;
        const parsed = characterBuildSchema.safeParse(stored);
        if (parsed.success) return { ...current, build: parsed.data };
        if (stored !== undefined) {
          console.warn('Discarding an unreadable saved character', parsed.error.issues);
        }
        return current;
      },
    },
  ),
);

/** The derived sheet. Recomputed on every change; deliberately never stored. */
export function useSheet(): CharacterSheet {
  const build = useCharacterStore((state) => state.build);
  return deriveSheet(build, contentPack);
}

export const useBuild = () => useCharacterStore((state) => state.build);
