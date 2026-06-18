import { getSimpleIcon } from "../lib/simpleIcons";
import type { Shortcut } from "../types/dashboard";

type Props = {
  shortcut: Shortcut;
  size: number;
};

export function ShortcutIcon({ shortcut, size }: Props) {
  const simpleIcon = getSimpleIcon(shortcut.iconSlug);

  if (simpleIcon) {
    return (
      <span
        className="mb-3 grid place-items-center rounded-2xl font-semibold shadow-lg shadow-black/20"
        style={{ width: size, height: size }}
        title={simpleIcon.title}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-[58%] w-[58%]"
          fill={shortcut.color || `#${simpleIcon.hex}`}
        >
          <path d={simpleIcon.path} />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="mb-3 grid place-items-center rounded-2xl font-semibold shadow-lg shadow-black/20"
      style={{ width: size, height: size, color: shortcut.color, fontSize: Math.max(18, size / 2.2) }}
    >
      {shortcut.icon}
    </span>
  );
}
