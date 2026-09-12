import { iconPaths, type IconName } from '../icons/paths';

type IconProps = {
  name: IconName | undefined;
  size?: number;
  className?: string;
  /** Give a title only when the icon carries meaning on its own. Beside a label, leave it off. */
  title?: string;
};

/**
 * DOM renderer for the shared icon set. The PDF has its own wrapper over the same path data.
 *
 * An unknown name renders a visible placeholder box rather than nothing, so a missing icon is
 * obvious during development instead of silently leaving a hole in the layout.
 */
export function Icon({ name, size = 20, className, title }: IconProps) {
  const path = name ? iconPaths[name] : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {path ? (
        <path d={path} />
      ) : (
        <path d="M3 3h18v18H3zm2 2v14h14V5z" opacity={0.4} />
      )}
    </svg>
  );
}
