import { Brush, CheckCircle2, Clock3, CloudSun, Grid3X3, Image, KeyRound, LayoutDashboard, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { fetchWeatherKeyStatus, saveWeatherApiKey, type WeatherKeyStatus } from "../lib/weather";
import { defaultLayout, useDashboardStore } from "../store/dashboardStore";
import type { LayoutMode, SearchProvider } from "../types/dashboard";
import { ProfileManager } from "./ProfileManager";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, onClose }: Props) {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const [weatherKey, setWeatherKey] = useState("");
  const [weatherKeyStatus, setWeatherKeyStatus] = useState<WeatherKeyStatus | null>(null);
  const [weatherKeyMessage, setWeatherKeyMessage] = useState("");
  const settings = useDashboardStore((state) => state.settings);
  const layout = useDashboardStore((state) => state.layout ?? defaultLayout);
  const updateSettings = useDashboardStore((state) => state.updateSettings);
  const setLayoutMode = useDashboardStore((state) => state.setLayoutMode);
  const resetFreeLayout = useDashboardStore((state) => state.resetFreeLayout);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }

    if (!rendered) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();

    async function loadWeatherKeyStatus() {
      try {
        const status = await fetchWeatherKeyStatus(controller.signal);
        setWeatherKeyStatus(status);
        setWeatherKeyMessage(status.configured ? "WeatherAPI kulcs beállítva." : "Nincs WeatherAPI kulcs megadva.");
      } catch {
        setWeatherKeyMessage("A kulcs állapota nem olvasható.");
      }
    }

    void loadWeatherKeyStatus();
    return () => controller.abort();
  }, [open]);

  async function handleWeatherKeySave() {
    try {
      const result = await saveWeatherApiKey(weatherKey);
      setWeatherKey("");
      setWeatherKeyStatus({ configured: result.configured, source: "settings" });
      setWeatherKeyMessage(result.configured ? "WeatherAPI kulcs mentve." : "WeatherAPI kulcs törölve.");
    } catch {
      setWeatherKeyMessage("A WeatherAPI kulcs mentése nem sikerült.");
    }
  }

  if (!rendered) return null;

  return (
    <div className={`modal-backdrop ${closing ? "is-closing" : ""}`} onMouseDown={onClose}>
      <section className={`modal-panel settings-modal ${closing ? "is-closing" : ""}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="settings-header">
          <div>
            <p className="settings-kicker">Auren Dashboard</p>
            <h2 className="settings-title">Beállítások</h2>
          </div>
          <button className="icon-button h-10 w-10" type="button" onClick={onClose} title="Bezárás">
            <X size={20} />
          </button>
        </header>

        <div className="settings-content">
          <ProfileManager />

          <SettingsSection icon={<SlidersHorizontal size={18} />} title="Általános">
            <label className="settings-control settings-control-wide">
              <span className="settings-control-label"><Sparkles size={16} /> Üdvözlő szöveg</span>
              <input className="field" value={settings.greeting} onChange={(e) => updateSettings({ greeting: e.target.value })} />
            </label>
            <label className="settings-control">
              <span className="settings-control-label"><Search size={16} /> Kereső</span>
              <select className="field" value={settings.searchProvider} onChange={(e) => updateSettings({ searchProvider: e.target.value as SearchProvider })}>
                <option value="google">Google</option>
                <option value="duckduckgo">DuckDuckGo</option>
                <option value="brave">Brave</option>
                <option value="bing">Bing</option>
              </select>
            </label>
            <label className="settings-control">
              <span className="settings-control-label"><Clock3 size={16} /> Időformátum</span>
              <select className="field" value={settings.timeFormat} onChange={(e) => updateSettings({ timeFormat: e.target.value as "12" | "24" })}>
                <option value="24">24 órás</option>
                <option value="12">12 órás</option>
              </select>
            </label>
            <label className="settings-control settings-control-wide">
              <span className="settings-control-label"><CloudSun size={16} /> Időjárás helyszín</span>
              <input className="field" value={settings.weatherLocation} onChange={(e) => updateSettings({ weatherLocation: e.target.value })} placeholder="Budapest" />
            </label>
            <div className="settings-control settings-control-wide">
              <span className="settings-control-label"><CloudSun size={16} /> WeatherAPI kulcs</span>
              <div className={`settings-status-badge ${weatherKeyStatus?.configured ? "is-success" : ""}`}>
                {weatherKeyStatus?.configured ? <CheckCircle2 size={15} /> : <KeyRound size={15} />}
                <span>
                  {weatherKeyStatus?.configured
                    ? weatherKeyStatus.source === "environment"
                      ? "Aktív env kulcs"
                      : "Aktív kulcs"
                    : "Nincs beállítva"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  className="field"
                  type="password"
                  value={weatherKey}
                  disabled={weatherKeyStatus?.source === "environment"}
                  onChange={(e) => setWeatherKey(e.target.value)}
                  placeholder={weatherKeyStatus?.configured ? "Új kulcs vagy üresen törlés" : "WeatherAPI.com API key"}
                />
                <button
                  className="ghost-button"
                  type="button"
                  disabled={weatherKeyStatus?.source === "environment"}
                  onClick={handleWeatherKeySave}
                >
                  Mentés
                </button>
              </div>
              <span className="text-xs text-slate-300/62">
                {weatherKeyStatus?.source === "environment" ? "A kulcs környezeti változóból jön, itt nem módosítható." : weatherKeyMessage}
              </span>
            </div>
          </SettingsSection>

          <SettingsSection icon={<Brush size={18} />} title="Megjelenés">
            <label className="settings-control">
              <span className="settings-control-label"><Image size={16} /> Háttér</span>
              <select className="field" value={settings.background} onChange={(e) => updateSettings({ background: e.target.value as "image" | "gradient" })}>
                <option value="image">Hegyes kép</option>
                <option value="gradient">Gradient</option>
              </select>
            </label>
            <Slider label="Blur" value={settings.blur} min={6} max={30} onChange={(blur) => updateSettings({ blur })} />
            <Slider label="Glass átlátszóság" value={settings.glassOpacity} min={0.06} max={0.26} step={0.01} onChange={(glassOpacity) => updateSettings({ glassOpacity })} />
            <Slider label="Ikonméret" value={settings.iconSize} min={42} max={74} onChange={(iconSize) => updateSettings({ iconSize })} />
          </SettingsSection>

          <SettingsSection icon={<LayoutDashboard size={18} />} title="Elrendezés">
            <label className="settings-control">
              <span className="settings-control-label"><Grid3X3 size={16} /> Nézet</span>
              <select className="field" value={layout.mode} onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}>
                <option value="grid">Rácsos, automatikus</option>
                <option value="free">Szabad vászon</option>
              </select>
            </label>
            <Slider label="Rács oszlopok" value={settings.columns} min={3} max={7} step={1} onChange={(columns) => updateSettings({ columns })} />
            <div className="settings-control">
              <span className="settings-control-label"><RotateCcw size={16} /> Szabad vászon</span>
              <button className="ghost-button w-full" type="button" onClick={resetFreeLayout}>
                Alapértelmezett visszaállítása
              </button>
            </div>
          </SettingsSection>

          <SettingsSection icon={<Grid3X3 size={18} />} title="Widgetek">
            <div className="settings-widget-list">
              {(["calendar", "todos", "notes"] as const).map((key) => (
                <label key={key} className="settings-toggle">
                  <span>{key === "calendar" ? "Naptár" : key === "todos" ? "Teendők" : "Jegyzet"}</span>
                  <input
                    type="checkbox"
                    checked={settings.widgets[key]}
                    onChange={(e) => updateSettings({ widgets: { ...settings.widgets, [key]: e.target.checked } })}
                  />
                </label>
              ))}
            </div>
          </SettingsSection>
        </div>
      </section>
    </div>
  );
}

function SettingsSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <header className="settings-section-header">
        <span className="settings-section-icon">{icon}</span>
        <h3>{title}</h3>
      </header>
      <div className="settings-section-grid">{children}</div>
    </section>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="settings-control">
      <span className="settings-range-head"><span>{label}</span><span>{value}</span></span>
      <input className="settings-range" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
