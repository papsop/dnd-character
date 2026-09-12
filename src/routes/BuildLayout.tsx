import clsx from 'clsx';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { StepNav } from '../components/StepNav';
import { iconFor } from '../icons/paths';
import { useBuild, useSheet } from '../store/characterStore';
import { WIZARD_STEPS } from '../domain/schema/character';

const STEP_LABELS: Record<(typeof WIZARD_STEPS)[number] | 'review', string> = {
  class: 'Class',
  origin: 'Origin',
  abilities: 'Abilities',
  'class-details': 'Details',
  equipment: 'Equipment',
  spells: 'Spells',
  details: 'Character',
  review: 'Review',
};

/** The steps, in the order the 2024 rules put them, plus the review page. */
const STEPS = [...WIZARD_STEPS, 'review'] as const;

export function BuildLayout() {
  const build = useBuild();
  const sheet = useSheet();
  const location = useLocation();

  const isCaster = sheet.spellcasting !== undefined;
  const steps = STEPS.filter((step) => step !== 'spells' || isCaster);

  const issueCountFor = (step: string) => sheet.issues.filter((i) => i.step === step).length;

  // Which step we are on, and what sits either side of it. Spells drops out for non-casters, so
  // Next has to skip it rather than lead somewhere empty.
  const current = steps.find((step) => location.pathname === `/build/${step}`);
  const index = current ? steps.indexOf(current) : -1;
  const previousStep = index > 0 ? steps[index - 1] : undefined;
  const nextStep = index >= 0 && index < steps.length - 1 ? steps[index + 1] : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="min-w-0 space-y-6">
        <nav aria-label="Build steps" className="flex flex-wrap gap-1">
          {steps.map((step) => {
            const count = issueCountFor(step);
            return (
              <NavLink
                key={step}
                to={`/build/${step}`}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm',
                    isActive
                      ? 'bg-accent-500 text-parchment-50'
                      : 'text-ink-500 hover:bg-parchment-100 dark:hover:bg-ink-700/50',
                  )
                }
              >
                {STEP_LABELS[step]}
                {count > 0 ? (
                  <span className="bg-parchment-200 text-ink-700 rounded-full px-1.5 text-[0.65rem] font-semibold">
                    {count}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div key={location.pathname}>
          <Outlet />

          {current !== 'review' ? (
            <StepNav
              {...(previousStep ? { previous: { to: `/build/${previousStep}`, label: STEP_LABELS[previousStep] } } : {})}
              {...(nextStep ? { next: { to: `/build/${nextStep}`, label: STEP_LABELS[nextStep] } } : {})}
              issueCount={current ? issueCountFor(current) : 0}
            />
          ) : null}
        </div>
      </div>

      <aside className="border-parchment-200 dark:border-ink-700 h-fit space-y-3 rounded-lg border p-4 text-sm lg:sticky lg:top-4">
        <div className="flex items-center gap-2">
          <Icon name={iconFor('class', build.classId)} size={24} />
          <div className="min-w-0">
            <p className="font-display truncate text-lg">{build.name || 'Unnamed'}</p>
            <p className="text-ink-500 truncate text-xs">
              {sheet.identity.className || 'No class'} {build.level}
              {sheet.identity.speciesName ? ` · ${sheet.identity.speciesName}` : ''}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center">
          <Stat label="AC" value={sheet.defenses.ac} />
          <Stat label="HP" value={sheet.defenses.hpMax} />
          <Stat label="Prof" value={`+${sheet.proficiencyBonus}`} />
        </dl>

        <dl className="grid grid-cols-6 gap-1 text-center">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((ability) => (
            <div key={ability}>
              <dt className="text-ink-500 text-[0.6rem] uppercase">{ability}</dt>
              <dd className="font-semibold">
                {sheet.abilities[ability].mod >= 0 ? '+' : ''}
                {sheet.abilities[ability].mod}
              </dd>
            </div>
          ))}
        </dl>

        <p className="text-ink-500 text-xs">
          {sheet.issues.length === 0
            ? 'Ready to print.'
            : `${sheet.issues.length} thing${sheet.issues.length === 1 ? '' : 's'} left to sort out.`}
        </p>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-parchment-200 dark:border-ink-700 rounded border py-1">
      <dt className="text-ink-500 text-[0.6rem] uppercase">{label}</dt>
      <dd className="font-display text-lg">{value}</dd>
    </div>
  );
}
