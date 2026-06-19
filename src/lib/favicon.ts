import { getUrlOrigin } from "./url";

type FaviconCacheStatus = "success" | "failed";

const FAVICON_CACHE_KEY = "auren-favicon-cache";

export function getFaviconUrl(url: string) {
  const origin = getUrlOrigin(url);
  return origin ? `${origin}/favicon.ico` : "";
}

export function getFaviconCacheKey(url: string) {
  return getUrlOrigin(url);
}

export function getCachedFaviconStatus(cacheKey: string): FaviconCacheStatus | undefined {
  if (!cacheKey || typeof window === "undefined") return undefined;

  try {
    const cache = readFaviconCache();
    return cache[cacheKey];
  } catch {
    return undefined;
  }
}

export function setCachedFaviconStatus(cacheKey: string, status: FaviconCacheStatus) {
  if (!cacheKey || typeof window === "undefined") return;

  try {
    const cache = readFaviconCache();
    window.localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify({ ...cache, [cacheKey]: status }));
  } catch {
    // LocalStorage can be unavailable in private or restricted browsing modes.
  }
}

function readFaviconCache(): Record<string, FaviconCacheStatus> {
  const raw = window.localStorage.getItem(FAVICON_CACHE_KEY);
  if (!raw) return {};

  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : {};
}
