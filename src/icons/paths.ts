/**
 * Original icon set, authored for this project.
 *
 * Stored as raw path data rather than components because the same string has to render in two
 * engines: the DOM (`<path d>`) and @react-pdf/renderer (`<Path d>`). One source, two thin wrappers.
 *
 * Authoring rules - these are load-bearing, not stylistic. react-pdf supports a narrow SVG subset
 * and silently renders anything else wrong:
 *   - 24x24 viewBox
 *   - exactly one path per icon (subpaths are fine; holes rely on the even-odd fill rule)
 *   - filled shapes only, never strokes - hairlines vanish when printed
 *   - no `fill` attribute here; colour comes from the wrapper
 *   - legible at 10px in pure black and white
 */
export const iconPaths = {
  // --- Classes ---------------------------------------------------------------
  'class-barbarian':
    'M11 2h2v20h-2zM13 3.5c3.8.2 6.6 2.2 7.8 5.2-3.2 1.1-6 .6-7.8-1.4zM11 3.5C7.2 3.7 4.4 5.7 3.2 8.7c3.2 1.1 6 .6 7.8-1.4z',
  'class-bard': 'M10 11a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM13.6 12.2l5.2-8.6 2.1 1.3-5.2 8.6z',
  'class-cleric':
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8-1.4 1.4zM15.6 17l1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4l2.8-2.8 1.4 1.4-2.8 2.8zM15.6 7l2.8-2.8 1.4 1.4L17 8.4z',
  'class-druid':
    'M20 3C9 3 4 9 4 16c0 2 .7 3.7 1.8 5l1.6-1.6C6.5 18.5 6 17.3 6 16c0-4 3-8 9-9-4 2-6.5 5-7.5 9.5l2.3 2.3C17 17 20 11 20 3z',
  'class-fighter': 'M12 1l3 5v6h2v2h-2v2h-2v6h-2v-6H9v-2H7v-2h2V6z',
  'class-monk':
    'M7 9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v7a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4zM17 10h1.5a1.5 1.5 0 0 1 0 3H17zM9 4h2v3H9zM13 4h2v3h-2z',
  'class-paladin':
    'M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5zm-1 4h2v3h3v2h-3v4h-2v-4H8V9h3z',
  'class-ranger':
    'M6 2c0 8 3 15 9 20l1.6-1.4C11.2 16 8.4 9.6 8.4 2zM4 20.6 18.6 6l1.4 1.4L5.4 22zM16 3h5v5h-2V5h-3z',
  'class-rogue': 'M12 1l2 4v8l-2 3-2-3V5zM8 15h8v2H8zM11.2 17h1.6v6h-1.6z',
  'class-sorcerer':
    'M12 1.5c-2.2 3.4-6 5.6-6 10.5a6 6 0 0 0 12 0c0-2.4-1.2-4.2-2.6-5.8.2 2.4-.8 3.8-2 3.8-1.3 0-2.2-1-2.2-2.6 0-2 .8-3.6.8-5.9z',
  'class-warlock':
    'M12 5C6.5 5 2.5 9 1 12c1.5 3 5.5 7 11 7s9.5-4 11-7c-1.5-3-5.5-7-11-7zm0 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 1.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  'class-wizard': 'M12 2l5 12H7zM4 15h16a1 1 0 0 1 0 4H4a1 1 0 0 1 0-4z',

  // --- Abilities -------------------------------------------------------------
  'ability-str': 'M2 10h2v4H2zM5 8h3v8H5zM8 11h8v2H8zM16 8h3v8h-3zM20 10h2v4h-2z',
  'ability-dex': 'M21 3 14 21l-3-7-7-3z',
  'ability-con': 'M12 21S3 14.5 3 8.8A5 5 0 0 1 12 6a5 5 0 0 1 9 2.8C21 14.5 12 21 12 21z',
  'ability-int': 'M3 4h8v16H3zM13 4h8v16h-8z',
  'ability-wis':
    'M12 5C6.5 5 2.5 9 1 12c1.5 3 5.5 7 11 7s9.5-4 11-7c-1.5-3-5.5-7-11-7zm0 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
  'ability-cha':
    'M4 3h16v8c0 5-3.6 9-8 9s-8-4-8-9zm4 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM8.5 15h7c-.8 1.6-2 2.5-3.5 2.5s-2.7-.9-3.5-2.5z',

  // --- Spell schools ---------------------------------------------------------
  'school-abjuration': 'M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5z',
  'school-conjuration':
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  'school-divination':
    'M12 5C6.5 5 2.5 9 1 12c1.5 3 5.5 7 11 7s9.5-4 11-7c-1.5-3-5.5-7-11-7zm0 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
  'school-enchantment':
    'M12 21S3 14.5 3 8.8A5 5 0 0 1 12 6a5 5 0 0 1 9 2.8C21 14.5 12 21 12 21zM11 8h2v3h3v2h-3v3h-2v-3H8v-2h3z',
  'school-evocation': 'M13 1 4 13h6l-1 10 9-12h-6z',
  'school-illusion':
    'M12 2a7 7 0 0 0-7 7v13l2.5-2 2.5 2 2-2 2 2 2.5-2 2.5 2V9a7 7 0 0 0-7-7zm-2.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
  'school-necromancy':
    'M12 2a8 8 0 0 0-8 8c0 3 1.6 5 4 6v5h8v-5c2.4-1 4-3 4-6a8 8 0 0 0-8-8zM9 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  'school-transmutation': 'M12 2l10 10-10 10L2 12zm0 4.5L6.5 12 12 17.5 17.5 12z',

  // --- Damage types ----------------------------------------------------------
  'damage-acid': 'M12 2c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z',
  'damage-bludgeoning': 'M4 5h10v6H4zM14 7h6v2h-6zM8 11h2v11H8z',
  'damage-cold':
    'M11 1h2v22h-2zM2.6 6.1l1-1.7 18 10.4-1 1.7zM21.4 6.1l1 1.7-18 10.4-1-1.7z',
  'damage-fire':
    'M12 1.5c-2.2 3.4-6 5.6-6 10.5a6 6 0 0 0 12 0c0-2.4-1.2-4.2-2.6-5.8.2 2.4-.8 3.8-2 3.8-1.3 0-2.2-1-2.2-2.6 0-2 .8-3.6.8-5.9z',
  'damage-force': 'M12 1l2.8 7.4L22 9.5l-5.6 5 1.7 7.5L12 18l-6.1 4 1.7-7.5-5.6-5 7.2-1.1z',
  'damage-lightning': 'M13 1 4 13h6l-1 10 9-12h-6z',
  'damage-necrotic':
    'M12 2a8 8 0 0 0-8 8c0 3 1.6 5 4 6v5h8v-5c2.4-1 4-3 4-6a8 8 0 0 0-8-8zM9 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  'damage-piercing': 'M12 1l3 9-3 4-3-4zM11 15h2v8h-2z',
  'damage-poison':
    'M12 2c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11zm-1.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm3 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  'damage-psychic':
    'M12 2a7 7 0 0 0-7 7c0 2 .8 3.5 2 4.8V20h10v-6.2c1.2-1.3 2-2.8 2-4.8a7 7 0 0 0-7-7zm-3 4h6v2h-2v6h-2V8H9z',
  'damage-radiant':
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8-1.4 1.4zM15.6 17l1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4l2.8-2.8 1.4 1.4-2.8 2.8zM15.6 7l2.8-2.8 1.4 1.4L17 8.4z',
  'damage-slashing': 'M19 2 22 5 7 20l-4 1 1-4zM3 21l18-3v3z',
  'damage-thunder':
    'M6 13a5 5 0 0 1 .6-9.9A6 6 0 0 1 18 5.5 4.2 4.2 0 0 1 17.6 14H6zM13 15l-4 9h3l-1 5 5-8h-3z',

  // --- Weapon masteries ------------------------------------------------------
  'mastery-cleave': 'M3 4l8 8-8 8 3-8zM13 4l8 8-8 8 3-8z',
  'mastery-graze': 'M2 15 18 2l4 4L6 19zM2 19h8v3H2z',
  'mastery-nick': 'M9 2l2 5v7l-2 3-2-3V7zM17 6l2 4v5l-2 2-2-2v-5z',
  'mastery-push': 'M2 10h11V6l9 6-9 6v-4H2z',
  'mastery-sap': 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM7 11h10v2H7z',
  'mastery-slow': 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 4v6.4l4 2.4-1 1.7-5-3V6z',
  'mastery-topple': 'M4 2h4v14h10v4H4zM14 3l6 6-4 4-6-6z',
  'mastery-vex': 'M12 3l2.5 6H21l-5.2 4 2 6.5L12 16l-5.8 3.5 2-6.5L3 9h6.5z',

  // --- Sheet sections --------------------------------------------------------
  'section-attacks': 'M3 2l7 10-2 2L2 6zM21 2l-7 10 2 2 6-8zM9 15l3 3 3-3 2 2-5 5-5-5z',
  'section-defenses': 'M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5z',
  'section-equipment': 'M8 6V5a4 4 0 0 1 8 0v1h3l1 16H4L5 6zm2 0h4V5a2 2 0 0 0-4 0z',
  'section-features': 'M6 2h12a2 2 0 0 1 2 2v18l-4-2-4 2-4-2-4 2V4a2 2 0 0 1 2-2zm2 5h8v2H8zm0 4h8v2H8z',
  'section-skills': 'M3 5h4v4H3zM9 6h12v2H9zM3 11h4v4H3zM9 12h12v2H9zM3 17h4v4H3zM9 18h12v2H9z',
  'section-spells': 'M12 1l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM4 14l.8 2.4L7 17l-2.2.8L4 20l-.8-2.2L1 17l2.2-.6z',

  // --- Weapon properties -----------------------------------------------------
  'property-finesse': 'M20 2 8 14l2 2L22 4zM7 15l2 2-4 5-3-3z',
  'property-thrown': 'M3 21 14 10l-2-2 9-5-5 9-2-2L3 21z',
  'property-versatile': 'M9 1l2 4v14l-2 3-2-3V5zM17 5l2 3v9l-2 2-2-2V8z',
  'property-two-handed': 'M12 1l3 5v8h2v2h-2v2h-2v5h-2v-5H9v-2H7v-2h2V6zM4 16h3v2H4zM17 16h3v2h-3z',
  'property-ammunition': 'M12 1l3 7-3 3-3-3zM11 12h2v11h-2zM7 19h2v4H7zM15 19h2v4h-2z',
  'property-reach': 'M2 11h14V7l6 5-6 5v-4H2z',
  'property-heavy': 'M5 3h14l2 18H3zM9 7h6v2H9z',
  'property-light': 'M11 2h2v4h-2zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM11 18h2v4h-2z',
} as const;

export type IconName = keyof typeof iconPaths;

export const ICON_NAMES = Object.keys(iconPaths) as IconName[];

export const isIconName = (value: string): value is IconName => value in iconPaths;

/**
 * Resolves a content id to an icon, falling back to a category default and finally to undefined,
 * which renders a visible placeholder rather than a blank space.
 */
export function iconFor(prefix: string, id: string): IconName | undefined {
  const name = `${prefix}-${id}`;
  return isIconName(name) ? name : undefined;
}
