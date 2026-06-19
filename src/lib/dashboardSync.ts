import type { DashboardSnapshot } from "../types/dashboard";
import { createDashboardSnapshot, useDashboardStore } from "../store/dashboardStore";

type DashboardApiResponse = {
  available: boolean;
  snapshot?: DashboardSnapshot;
};

let cleanupSync: (() => void) | null = null;

export function startDashboardSync() {
  if (cleanupSync) return cleanupSync;

  let saveTimer = 0;
  let stopped = false;
  let unsubscribe: (() => void) | undefined;

  async function saveSnapshot() {
    if (stopped) return;

    try {
      await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createDashboardSnapshot(useDashboardStore.getState())),
      });
    } catch (error) {
      console.warn("Auren dashboard sync save failed", error);
    }
  }

  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveSnapshot, 650);
  }

  async function boot() {
    try {
      const response = await fetch("/api/dashboard");
      if (stopped || !response.ok) return;

      const data = (await response.json()) as DashboardApiResponse;
      if (data.available && data.snapshot) {
        useDashboardStore.getState().hydrateSnapshot(data.snapshot);
      } else {
        await saveSnapshot();
      }
    } catch (error) {
      console.warn("Auren dashboard sync load failed", error);
    } finally {
      if (stopped) return;
      unsubscribe = useDashboardStore.subscribe(scheduleSave);
    }
  }

  void boot();

  cleanupSync = () => {
    stopped = true;
    window.clearTimeout(saveTimer);
    unsubscribe?.();
    cleanupSync = null;
  };

  return cleanupSync;
}
