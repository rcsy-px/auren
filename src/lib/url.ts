export function normalizeShortcutUrl(url: string) {
  const value = url.trim();
  if (!value) return "";
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function getUrlOrigin(url: string) {
  try {
    return new URL(normalizeShortcutUrl(url)).origin;
  } catch {
    return "";
  }
}
