import { X } from "lucide-react";
import { defaultLayout, useDashboardStore } from "../store/dashboardStore";
import type { LayoutMode, SearchProvider } from "../types/dashboard";
import { ProfileManager } from "./ProfileManager";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, onClose }: Props) {
  const settings = useDashboardStore((state) => state.settings);
  const layout = useDashboardStore((state) => state.layout ?? defaultLayout);
  const updateSettings = useDashboardStore((state) => state.updateSettings);
  const setLayoutMode = useDashboardStore((state) => state.setLayoutMode);
  const resetFreeLayout = useDashboardStore((state) => state.resetFreeLayout);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal-panel max-w-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Beállítások</h2>
          <button className="icon-button h-10 w-10" type="button" onClick={onClose} title="Bezárás">
            <X size={20} />
          </button>
        </header>

        <ProfileManager />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="settings-field">
            Üdvözlő szöveg
            <input className="field mt-2" value={settings.greeting} onChange={(e) => updateSettings({ greeting: e.target.value })} />
          </label>
          <label className="settings-field">
            Kereső
            <select className="field mt-2" value={settings.searchProvider} onChange={(e) => updateSettings({ searchProvider: e.target.value as SearchProvider })}>
              <option value="google">Google</option>
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="brave">Brave</option>
              <option value="bing">Bing</option>
            </select>
          </label>
          <label className="settings-field">
            Háttér
            <select className="field mt-2" value={settings.background} onChange={(e) => updateSettings({ background: e.target.value as "image" | "gradient" })}>
              <option value="image">Hegyes kép</option>
              <option value="gradient">Gradient</option>
            </select>
          </label>
          <label className="settings-field">
            Időformátum
            <select className="field mt-2" value={settings.timeFormat} onChange={(e) => updateSettings({ timeFormat: e.target.value as "12" | "24" })}>
              <option value="24">24 órás</option>
              <option value="12">12 órás</option>
            </select>
          </label>
          <label className="settings-field">
            Elrendezés
            <select className="field mt-2" value={layout.mode} onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}>
              <option value="grid">Rácsos, automatikus</option>
              <option value="free">Szabad vászon</option>
            </select>
          </label>
          <div className="settings-field">
            Szabad vászon
            <button className="ghost-button mt-2 w-full" type="button" onClick={resetFreeLayout}>
              Alapértelmezett visszaállítása
            </button>
          </div>
          <Slider label="Blur" value={settings.blur} min={6} max={30} onChange={(blur) => updateSettings({ blur })} />
          <Slider label="Glass átlátszóság" value={settings.glassOpacity} min={0.06} max={0.26} step={0.01} onChange={(glassOpacity) => updateSettings({ glassOpacity })} />
          <Slider label="Ikonméret" value={settings.iconSize} min={42} max={74} onChange={(iconSize) => updateSettings({ iconSize })} />
          <Slider label="Rács oszlopok" value={settings.columns} min={3} max={7} step={1} onChange={(columns) => updateSettings({ columns })} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(["calendar", "todos", "notes"] as const).map((key) => (
            <label key={key} className="field flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.widgets[key]}
                onChange={(e) => updateSettings({ widgets: { ...settings.widgets, [key]: e.target.checked } })}
              />
              {key === "calendar" ? "Naptár" : key === "todos" ? "Teendők" : "Jegyzet"}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="settings-field">
      <span className="flex justify-between"><span>{label}</span><span>{value}</span></span>
      <input className="mt-3 w-full accent-sky-300" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
