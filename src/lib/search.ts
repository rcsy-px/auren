import type { SearchProvider } from "../types/dashboard";

const providers: Record<SearchProvider, string> = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  brave: "https://search.brave.com/search?q=",
  bing: "https://www.bing.com/search?q=",
};

export function resolveSearchTarget(input: string, provider: SearchProvider) {
  const value = input.trim();
  if (!value) return "";
  const hasProtocol = /^https?:\/\//i.test(value);
  const looksLikeUrl = value.includes(".") && !value.includes(" ");

  if (hasProtocol) return value;
  if (looksLikeUrl) return `https://${value}`;

  return `${providers[provider]}${encodeURIComponent(value)}`;
}
