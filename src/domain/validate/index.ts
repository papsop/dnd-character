import { ABILITIES, type ContentPack, type Item } from '../schema/content';
import type { CharacterBuild, Issue } from '../schema/character';
import { choicesFor, classOf, levelRow } from '../progression';
import {
  MAX_ABILITY_SCORE,
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
  abilityModifier,
  deriveAbilities,
  pointBuySpend,
} from '../derive/abilities';
import { collectGrants } from '../derive/grants';
import { deriveProficiencies, hasArmorProficiency } from '../derive/proficiency';

/**
 * Every way a build can be illegal or unfinished.
 *
 * `error`  - breaks a rule. The character is not legal.
 * `incomplete` - legal so far, but a required decision has not been made.
 *
 * Both block the PDF; the distinction is what the wizard tells the player.
 */
export function validateBuild(build: CharacterBuild, content: ContentPack): Issue[] {
  const issues: Issue[] = [];
  const add = (issue: Issue) => issues.push(issue);

  const charClass = classOf(build, content);
  const species = content.species.find((s) => s.id === build.speciesId);
  const background = content.backgrounds.find((b) => b.id === build.backgroundId);

  // --- Identity ---------------------------------------------------------------

  if (build.name.trim() === '') {
    add({ step: 'details', field: 'name', severity: 'incomplete', message: 'Give your character a name.' });
  }
  if (!charClass) {
    add({ step: 'class', field: 'classId', severity: 'incomplete', message: 'Choose a class.' });
  }
  if (!species) {
    add({ step: 'origin', field: 'speciesId', severity: 'incomplete', message: 'Choose a species.' });
  }
  if (!background) {
    add({ step: 'origin', field: 'backgroundId', severity: 'incomplete', message: 'Choose a background.' });
  }

  if (species && species.lineages.length > 0 && !build.lineageId) {
    add({
      step: 'origin',
      field: 'lineageId',
      severity: 'incomplete',
      message: `Choose a ${species.name} lineage.`,
    });
  }
  if (build.lineageId && species && !species.lineages.some((l) => l.id === build.lineageId)) {
    add({
      step: 'origin',
      field: 'lineageId',
      severity: 'error',
      message: 'That lineage does not belong to the chosen species.',
    });
  }

  // --- Subclass ---------------------------------------------------------------

  if (charClass) {
    const due = build.level >= charClass.subclassLevel;
    if (due && !build.subclassId) {
      add({
        step: 'class-details',
        field: 'subclassId',
        severity: 'incomplete',
        message: `Choose a subclass at level ${charClass.subclassLevel}.`,
      });
    }
    if (build.subclassId) {
      const subclass = content.subclasses.find((s) => s.id === build.subclassId);
      if (!subclass || subclass.classId !== charClass.id) {
        add({
          step: 'class-details',
          field: 'subclassId',
          severity: 'error',
          message: 'That subclass does not belong to the chosen class.',
        });
      } else if (!due) {
        add({
          step: 'class-details',
          field: 'subclassId',
          severity: 'error',
          message: `A subclass is only available from level ${charClass.subclassLevel}.`,
        });
      }
    }
  }

  // --- Ability scores ---------------------------------------------------------

  validateAbilities(build, content, add);

  // --- Choices ----------------------------------------------------------------

  for (const choice of choicesFor(build, content)) {
    const selected = build.choices[choice.id] ?? [];

    if (selected.length > choice.count) {
      add({
        step: choice.id.includes('skills') ? 'class-details' : 'class-details',
        field: choice.id,
        severity: 'error',
        message: `${choice.prompt}: ${selected.length} chosen, only ${choice.count} allowed.`,
      });
    } else if (selected.length < choice.count) {
      add({
        step: 'class-details',
        field: choice.id,
        severity: 'incomplete',
        message: `${choice.prompt}: ${choice.count - selected.length} still to choose.`,
      });
    }

    if (choice.unique && new Set(selected).size !== selected.length) {
      add({
        step: 'class-details',
        field: choice.id,
        severity: 'error',
        message: `${choice.prompt}: the same option was picked twice.`,
      });
    }

    if (choice.from.kind === 'ref' && choice.from.ids) {
      const allowed = new Set(choice.from.ids);
      for (const value of selected) {
        if (!allowed.has(value)) {
          add({
            step: 'class-details',
            field: choice.id,
            severity: 'error',
            message: `${choice.prompt}: "${value}" is not one of the options.`,
          });
        }
      }
    }
  }

  // A wasted skill pick is legal but always a mistake - surface it so the player can re-choose.
  const grants = collectGrants(build, content);
  const proficiencies = deriveProficiencies(build, content, grants);
  for (const skillId of proficiencies.duplicateSkills) {
    const name = content.skills.find((s) => s.id === skillId)?.name ?? skillId;
    add({
      step: 'class-details',
      field: 'skills',
      severity: 'incomplete',
      message: `You already have ${name} from another source - choose a different skill.`,
    });
  }

  // --- Ability Score Improvements ---------------------------------------------

  if (charClass) {
    const asiLevels = new Set(charClass.featLevels.filter((l) => l <= build.level));
    for (const improvement of build.abilities.improvements) {
      if (!asiLevels.has(improvement.level)) {
        add({
          step: 'abilities',
          field: 'improvements',
          severity: 'error',
          message: `No Ability Score Improvement is granted at level ${improvement.level}.`,
        });
      }
      const total = Object.values(improvement.increases).reduce((sum, n) => sum + n, 0);
      if (total !== 2) {
        add({
          step: 'abilities',
          field: 'improvements',
          severity: 'error',
          message: `An Ability Score Improvement adds exactly +2 in total (got ${total}).`,
        });
      }
      if (Object.keys(improvement.increases).length > 2) {
        add({
          step: 'abilities',
          field: 'improvements',
          severity: 'error',
          message: 'An Ability Score Improvement raises at most two abilities.',
        });
      }
    }
  }

  // --- Equipment --------------------------------------------------------------

  const itemById = new Map(content.items.map((i) => [i.id, i]));
  for (const entry of build.equipment) {
    if (!itemById.has(entry.itemId)) {
      add({
        step: 'equipment',
        field: 'equipment',
        severity: 'error',
        message: `Unknown item "${entry.itemId}".`,
      });
    }
  }

  const equippedArmor = build.equipment
    .filter((e) => e.equipped)
    .map((e) => itemById.get(e.itemId))
    .filter((i): i is Extract<Item, { kind: 'armor' }> => i?.kind === 'armor');

  for (const armor of equippedArmor) {
    if (!hasArmorProficiency(proficiencies, armor.armorType)) {
      add({
        step: 'equipment',
        field: 'equipment',
        severity: 'error',
        message: `You are not proficient with ${armor.name}.`,
      });
    }
  }

  if (build.level === 1 && build.equipment.length === 0) {
    add({
      step: 'equipment',
      field: 'equipment',
      severity: 'incomplete',
      message: 'Choose your starting equipment.',
    });
  }

  // --- Spells -----------------------------------------------------------------

  validateSpells(build, content, add);

  return issues;
}

function validateAbilities(
  build: CharacterBuild,
  content: ContentPack,
  add: (issue: Issue) => void,
): void {
  const { method, base, backgroundBonuses } = build.abilities;
  const scores = ABILITIES.map((a) => base[a]);

  if (method === 'point-buy') {
    for (const ability of ABILITIES) {
      const score = base[ability];
      if (score < POINT_BUY_MIN || score > POINT_BUY_MAX) {
        add({
          step: 'abilities',
          field: ability,
          severity: 'error',
          message: `Point buy allows ${POINT_BUY_MIN}-${POINT_BUY_MAX}; ${ability.toUpperCase()} is ${score}.`,
        });
      }
    }
    const spent = pointBuySpend(base);
    if (spent > POINT_BUY_BUDGET) {
      add({
        step: 'abilities',
        field: 'point-buy',
        severity: 'error',
        message: `Point buy allows ${POINT_BUY_BUDGET} points; ${spent} spent.`,
      });
    } else if (spent < POINT_BUY_BUDGET) {
      add({
        step: 'abilities',
        field: 'point-buy',
        severity: 'incomplete',
        message: `${POINT_BUY_BUDGET - spent} points still unspent.`,
      });
    }
  }

  if (method === 'standard-array') {
    const expected = [...STANDARD_ARRAY].sort((a, b) => a - b).join(',');
    const actual = [...scores].sort((a, b) => a - b).join(',');
    if (actual !== expected) {
      add({
        step: 'abilities',
        field: 'standard-array',
        severity: 'error',
        message: `The standard array is ${STANDARD_ARRAY.join(', ')}, each used once.`,
      });
    }
  }

  // Background bonuses: +3 total, as 2+1 or 1+1+1, only on the background's three abilities.
  const background = content.backgrounds.find((b) => b.id === build.backgroundId);
  const entries = Object.entries(backgroundBonuses).filter(([, value]) => value !== 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (background) {
    const allowed = new Set(background.abilityOptions);
    for (const [ability] of entries) {
      if (!allowed.has(ability as (typeof ABILITIES)[number])) {
        add({
          step: 'abilities',
          field: 'backgroundBonuses',
          severity: 'error',
          message: `${background.name} does not offer a bonus to ${ability.toUpperCase()}.`,
        });
      }
    }

    if (total === 0) {
      add({
        step: 'abilities',
        field: 'backgroundBonuses',
        severity: 'incomplete',
        message: `Apply ${background.name}'s +2/+1 or +1/+1/+1 ability bonuses.`,
      });
    } else {
      const values = entries.map(([, value]) => value).sort((a, b) => b - a);
      const isTwoOne = values.length === 2 && values[0] === 2 && values[1] === 1;
      const isOneOneOne = values.length === 3 && values.every((v) => v === 1);
      if (total !== 3 || !(isTwoOne || isOneOneOne)) {
        add({
          step: 'abilities',
          field: 'backgroundBonuses',
          severity: 'error',
          message: 'Background bonuses must be +2 and +1, or +1 to three abilities.',
        });
      }
    }
  }

  const grants = collectGrants(build, content);
  const derived = deriveAbilities(build, grants);
  for (const ability of ABILITIES) {
    const uncapped = derived[ability].base + derived[ability].bonus;
    if (uncapped > MAX_ABILITY_SCORE) {
      add({
        step: 'abilities',
        field: ability,
        severity: 'error',
        message: `${ability.toUpperCase()} would be ${uncapped}; nothing may raise a score above ${MAX_ABILITY_SCORE}.`,
      });
    }
    if (abilityModifier(derived[ability].score) < -5) {
      add({ step: 'abilities', field: ability, severity: 'error', message: 'Score out of range.' });
    }
  }
}

function validateSpells(
  build: CharacterBuild,
  content: ContentPack,
  add: (issue: Issue) => void,
): void {
  const charClass = classOf(build, content);
  if (!charClass?.spellcasting) {
    if (build.spells.cantrips.length > 0 || build.spells.prepared.length > 0) {
      add({
        step: 'spells',
        field: 'spells',
        severity: 'error',
        message: 'This class does not cast spells.',
      });
    }
    return;
  }

  const row = levelRow(charClass, build.level)?.spellcasting;
  if (!row) return;

  const spellById = new Map(content.spells.map((s) => [s.id, s]));
  const maxSlotLevel = Math.max(
    row.slots.reduce((best, count, index) => (count > 0 ? index + 1 : best), 0),
    row.pactSlotLevel ?? 0,
  );

  const checkList = (ids: string[], expectCantrip: boolean, field: string) => {
    for (const id of ids) {
      const spell = spellById.get(id);
      if (!spell) {
        add({ step: 'spells', field, severity: 'error', message: `Unknown spell "${id}".` });
        continue;
      }
      if (!spell.classes.includes(charClass.id)) {
        add({
          step: 'spells',
          field,
          severity: 'error',
          message: `${spell.name} is not on the ${charClass.name} spell list.`,
        });
      }
      if (expectCantrip && spell.level !== 0) {
        add({ step: 'spells', field, severity: 'error', message: `${spell.name} is not a cantrip.` });
      }
      if (!expectCantrip && spell.level === 0) {
        add({
          step: 'spells',
          field,
          severity: 'error',
          message: `${spell.name} is a cantrip - it belongs in the cantrip list.`,
        });
      }
      if (!expectCantrip && spell.level > maxSlotLevel) {
        add({
          step: 'spells',
          field,
          severity: 'error',
          message: `${spell.name} is level ${spell.level}; your highest slot is level ${maxSlotLevel}.`,
        });
      }
    }
  };

  checkList(build.spells.cantrips, true, 'cantrips');
  checkList(build.spells.prepared, false, 'prepared');

  const countIssue = (actual: number, max: number, field: string, label: string) => {
    if (actual > max) {
      add({
        step: 'spells',
        field,
        severity: 'error',
        message: `${actual} ${label} chosen; you may have ${max}.`,
      });
    } else if (actual < max) {
      add({
        step: 'spells',
        field,
        severity: 'incomplete',
        message: `Choose ${max - actual} more ${label}.`,
      });
    }
  };

  countIssue(new Set(build.spells.cantrips).size, row.cantripsKnown, 'cantrips', 'cantrips');
  countIssue(new Set(build.spells.prepared).size, row.preparedSpells, 'prepared', 'prepared spells');

  if (new Set(build.spells.cantrips).size !== build.spells.cantrips.length) {
    add({ step: 'spells', field: 'cantrips', severity: 'error', message: 'The same cantrip was chosen twice.' });
  }
  if (new Set(build.spells.prepared).size !== build.spells.prepared.length) {
    add({ step: 'spells', field: 'prepared', severity: 'error', message: 'The same spell was prepared twice.' });
  }
}

/** Convenience for the UI: only the issues that belong to one step. */
export const issuesForStep = (issues: Issue[], step: Issue['step']) =>
  issues.filter((issue) => issue.step === step);

export const hasBlockingIssues = (issues: Issue[]) => issues.length > 0;
