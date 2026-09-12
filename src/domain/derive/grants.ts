import type { ContentPack, Grant } from '../schema/content';
import type { CharacterBuild } from '../schema/character';
import { activeFeatures, choicesFor } from '../progression';

/**
 * Every machine-readable effect the character has, from every source: class, subclass, species,
 * lineage, background feat, taken feats, and the inline options of any choice they made.
 *
 * This is the only path by which rules reach the derive layer. Nothing downstream reads rules text.
 */
export function collectGrants(build: CharacterBuild, content: ContentPack): Grant[] {
  const grants: Grant[] = activeFeatures(build, content).flatMap((f) => f.grants);

  for (const choice of choicesFor(build, content)) {
    if (choice.from.kind !== 'inline') continue;
    const selected = build.choices[choice.id] ?? [];
    for (const option of choice.from.options) {
      if (selected.includes(option.id)) grants.push(...option.grants);
    }
  }

  return grants;
}

export function grantsOf<K extends Grant['kind']>(
  grants: Grant[],
  kind: K,
): Extract<Grant, { kind: K }>[] {
  return grants.filter((g): g is Extract<Grant, { kind: K }> => g.kind === kind);
}
