export type VersionInfo = {
  version: string;
  latestVersion?: string;
  latestUrl?: string;
  updateAvailable: boolean;
  checkedAt?: string;
  error?: string;
};

export async function fetchVersionInfo(signal?: AbortSignal) {
  const response = await fetch("/api/version", { signal });
  if (!response.ok) throw new Error("Version request failed");
  return (await response.json()) as VersionInfo;
}
