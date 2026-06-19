import { useEffect, useState } from "react";
import {
  getCachedFaviconStatus,
  getFaviconCacheKey,
  getFaviconUrl,
  setCachedFaviconStatus,
} from "../lib/favicon";
import { getSimpleIcon } from "../lib/simpleIcons";
import type { Shortcut } from "../types/dashboard";

type Props = {
  shortcut: Shortcut;
  size: number;
};

export function ShortcutIcon({ shortcut, size }: Props) {
  const simpleIcon = getSimpleIcon(shortcut.iconSlug);
  const faviconUrl = getFaviconUrl(shortcut.url);
  const faviconCacheKey = getFaviconCacheKey(shortcut.url);
  const fallbackIcon = shortcut.icon || shortcut.name.slice(0, 2).toUpperCase();
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [faviconLoaded, setFaviconLoaded] = useState(false);

  useEffect(() => {
    setFaviconFailed(getCachedFaviconStatus(faviconCacheKey) === "failed");
    setFaviconLoaded(false);
  }, [faviconCacheKey]);

  if (simpleIcon) {
    return (
      <span
        className="shortcut-icon-shell mb-3 grid place-items-center rounded-2xl font-semibold shadow-lg shadow-black/20"
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

  if (faviconUrl && !faviconFailed) {
    return (
      <span
        className="shortcut-icon-shell relative mb-3 grid place-items-center overflow-hidden rounded-2xl font-semibold shadow-lg shadow-black/20"
        style={{ width: size, height: size, backgroundColor: `${shortcut.color}24`, color: shortcut.color, fontSize: Math.max(18, size / 2.2) }}
      >
        <span className={`shortcut-fallback-layer transition-opacity duration-200 ${faviconLoaded ? "opacity-0" : "opacity-100"}`}>
          {fallbackIcon}
        </span>
        <img
          alt=""
          className={`shortcut-favicon-layer absolute inset-0 h-full w-full bg-white/92 object-contain p-2 transition-opacity duration-200 ${faviconLoaded ? "is-loaded opacity-100" : "opacity-0"}`}
          src={faviconUrl}
          onLoad={() => {
            setCachedFaviconStatus(faviconCacheKey, "success");
            setFaviconLoaded(true);
          }}
          onError={() => {
            setCachedFaviconStatus(faviconCacheKey, "failed");
            setFaviconFailed(true);
          }}
        />
      </span>
    );
  }

  return (
    <span
      className="shortcut-icon-shell mb-3 grid place-items-center rounded-2xl font-semibold shadow-lg shadow-black/20"
      style={{ width: size, height: size, color: shortcut.color, fontSize: Math.max(18, size / 2.2) }}
    >
      {fallbackIcon}
    </span>
  );
}
