import { BadgeInfo, Brush, CalendarDays, CheckCircle2, Clock3, CloudSun, ExternalLink, Grid3X3, Image, KeyRound, LayoutDashboard, ListTodo, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { fetchCalendarSourceStatus, saveCalendarSource, type CalendarSourceStatus, type CalendarSourceType } from "../lib/calendar";
import { fetchVersionInfo, type VersionInfo } from "../lib/version";
import { fetchWeatherKeyStatus, saveWeatherApiKey, type WeatherKeyStatus } from "../lib/weather";
import { defaultLayout, useDashboardStore } from "../store/dashboardStore";
import type { LayoutMode, SearchProvider } from "../types/dashboard";

type Props = {
  open: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
};

export type SettingsTab = "general" | "appearance" | "layout" | "weather" | "calendar" | "widgets" | "system";

const settingsTabs: { id: SettingsTab; title: string; description: string; icon: ReactNode }[] = [
  { id: "general", title: "Általános", description: "Keresés és idő", icon: <SlidersHorizontal size={18} /> },
  { id: "appearance", title: "Megjelenés", description: "Háttér és üveg", icon: <Brush size={18} /> },
  { id: "layout", title: "Elrendezés", description: "Rács és vászon", icon: <LayoutDashboard size={18} /> },
  { id: "weather", title: "Időjárás", description: "Helyszín és API", icon: <CloudSun size={18} /> },
  { id: "calendar", title: "Naptár", description: "Esemény widget", icon: <CalendarDays size={18} /> },
  { id: "widgets", title: "Widgetek", description: "Láthatóság", icon: <ListTodo size={18} /> },
  { id: "system", title: "Rendszer", description: "Verzió és frissítés", icon: <BadgeInfo size={18} /> },
];

export function SettingsModal({ open, initialTab = "general", onClose }: Props) {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [weatherKey, setWeatherKey] = useState("");
  const [weatherKeyStatus, setWeatherKeyStatus] = useState<WeatherKeyStatus | null>(null);
  const [weatherKeyMessage, setWeatherKeyMessage] = useState("");
  const [calendarSource, setCalendarSource] = useState({
    type: "ical" as CalendarSourceType,
    name: "",
    url: "",
    username: "",
    password: "",
  });
  const [calendarSourceStatus, setCalendarSourceStatus] = useState<CalendarSourceStatus | null>(null);
  const [calendarMessage, setCalendarMessage] = useState("");
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [versionMessage, setVersionMessage] = useState("");
  const settings = useDashboardStore((state) => state.settings);
  const layout = useDashboardStore((state) => state.layout ?? defaultLayout);
  const activeProfileId = useDashboardStore((state) => state.activeProfileId);
  const updateSettings = useDashboardStore((state) => state.updateSettings);
  const setLayoutMode = useDashboardStore((state) => state.setLayoutMode);
  const resetFreeLayout = useDashboardStore((state) => state.resetFreeLayout);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      setActiveTab(initialTab);
      return;
    }

    if (!rendered) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [initialTab, open, rendered]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();

    async function loadExternalStatuses() {
      try {
        const info = await fetchVersionInfo(controller.signal);
        setVersionInfo(info);
        setVersionMessage(info.error ? "A frissítéskeresés most nem elérhető." : "");
      } catch {
        setVersionMessage("A verzióinformáció nem olvasható.");
      }

      try {
        const status = await fetchWeatherKeyStatus(controller.signal);
        setWeatherKeyStatus(status);
        setWeatherKeyMessage(status.configured ? "WeatherAPI kulcs beállítva." : "Nincs WeatherAPI kulcs megadva.");
      } catch {
        setWeatherKeyMessage("A kulcs állapota nem olvasható.");
      }

      try {
        const status = await fetchCalendarSourceStatus({
          scope: settings.calendar.sourceScope,
          profileId: activeProfileId,
          signal: controller.signal,
        });
        setCalendarSourceStatus(status);
        if (status.configured) {
          setCalendarSource({
            type: status.type ?? "ical",
            name: status.name ?? "",
            url: status.url ?? "",
            username: status.username ?? "",
            password: "",
          });
          setCalendarMessage(status.type === "caldav" ? "CalDAV kapcsolat beállítva." : "iCal feed beállítva.");
        } else {
          setCalendarMessage("Nincs naptárforrás beállítva.");
        }
      } catch {
        setCalendarMessage("A naptárforrás állapota nem olvasható.");
      }
    }

    void loadExternalStatuses();
    return () => controller.abort();
  }, [activeProfileId, open, settings.calendar.sourceScope]);

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

  async function handleCalendarSourceSave() {
    try {
      const result = await saveCalendarSource(calendarSource, {
        scope: settings.calendar.sourceScope,
        profileId: activeProfileId,
      });
      setCalendarSourceStatus(result);
      setCalendarSource((current) => ({ ...current, password: "" }));
      setCalendarMessage(result.configured ? "Naptárforrás mentve." : "Naptárforrás törölve.");
    } catch {
      setCalendarMessage("A naptárforrás mentése nem sikerült.");
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

        <div className="settings-layout">
          <nav className="settings-nav" aria-label="Beállítás kategóriák">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? "is-active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="settings-nav-icon">{tab.icon}</span>
                <span className="settings-nav-copy">
                  <span>{tab.title}</span>
                  <small>{tab.description}</small>
                </span>
              </button>
            ))}
          </nav>

          <div className="settings-content">
            {activeTab === "general" && (
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
              </SettingsSection>
            )}

            {activeTab === "appearance" && (
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
            )}

            {activeTab === "layout" && (
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
            )}

            {activeTab === "weather" && (
              <SettingsSection icon={<CloudSun size={18} />} title="Időjárás">
                <label className="settings-control settings-control-wide">
                  <span className="settings-control-label"><CloudSun size={16} /> Helyszín</span>
                  <input className="field" value={settings.weatherLocation} onChange={(e) => updateSettings({ weatherLocation: e.target.value })} placeholder="Budapest" />
                  <span className="text-xs text-slate-300/62">Profilhoz mentett beállítás.</span>
                </label>
                <div className="settings-control settings-control-wide">
                  <span className="settings-control-label"><KeyRound size={16} /> WeatherAPI kulcs</span>
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
                    {weatherKeyStatus?.source === "environment"
                      ? "Globális kulcs környezeti változóból, itt nem módosítható."
                      : `${weatherKeyMessage} Ez globális, minden profil ezt használja.`}
                  </span>
                </div>
              </SettingsSection>
            )}

            {activeTab === "calendar" && (
              <SettingsSection icon={<CalendarDays size={18} />} title="Naptár">
                <label className="settings-toggle settings-control-wide">
                  <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> Naptár widget</span>
                  <input
                    type="checkbox"
                    checked={settings.widgets.calendar}
                    onChange={(e) => updateSettings({ widgets: { ...settings.widgets, calendar: e.target.checked } })}
                  />
                </label>
                <label className="settings-toggle settings-control-wide">
                  <span>
                    Profil saját naptárforrása
                    <small className="mt-1 block text-xs text-slate-300/55">
                      Kikapcsolva közös családi/globális naptárat használ.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.calendar.sourceScope === "profile"}
                    onChange={(e) => updateSettings({
                      calendar: {
                        ...settings.calendar,
                        sourceScope: e.target.checked ? "profile" : "global",
                      },
                    })}
                  />
                </label>
                <Slider
                  label="Előretekintés napokban"
                  value={settings.calendar.daysAhead}
                  min={1}
                  max={90}
                  step={1}
                  onChange={(daysAhead) => updateSettings({ calendar: { ...settings.calendar, daysAhead } })}
                />
                <Slider
                  label="Maximum esemény"
                  value={settings.calendar.maxEvents}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(maxEvents) => updateSettings({ calendar: { ...settings.calendar, maxEvents } })}
                />
                <label className="settings-toggle">
                  <span>Helyszín mutatása</span>
                  <input
                    type="checkbox"
                    checked={settings.calendar.showLocation}
                    onChange={(e) => updateSettings({ calendar: { ...settings.calendar, showLocation: e.target.checked } })}
                  />
                </label>
                <label className="settings-toggle">
                  <span>Forrás neve</span>
                  <input
                    type="checkbox"
                    checked={settings.calendar.showSource}
                    onChange={(e) => updateSettings({ calendar: { ...settings.calendar, showSource: e.target.checked } })}
                  />
                </label>
                <div className="settings-control settings-control-wide">
                  <span className="settings-control-label"><KeyRound size={16} /> Naptárforrás</span>
                  <div className={`settings-status-badge ${calendarSourceStatus?.configured ? "is-success" : ""}`}>
                    {calendarSourceStatus?.configured ? <CheckCircle2 size={15} /> : <CalendarDays size={15} />}
                    <span>
                      {calendarSourceStatus?.configured
                        ? calendarSourceStatus.type === "caldav"
                          ? "CalDAV aktív"
                          : "iCal aktív"
                        : "Nincs beállítva"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-300/62">
                    {settings.calendar.sourceScope === "profile"
                      ? "Ez a naptárforrás csak az aktív profilhoz tartozik."
                      : "Ez a naptárforrás globális, minden globális módú profil ezt használja."}
                  </span>
                  <div className="settings-calendar-form">
                    <label className="settings-mini-field">
                      <span>Típus</span>
                      <select
                        className="field"
                        value={calendarSource.type}
                        onChange={(e) => setCalendarSource({ ...calendarSource, type: e.target.value as CalendarSourceType })}
                      >
                        <option value="ical">iCal feed</option>
                        <option value="caldav">CalDAV</option>
                      </select>
                    </label>
                    <label className="settings-mini-field">
                      <span>Név</span>
                      <input
                        className="field"
                        value={calendarSource.name}
                        onChange={(e) => setCalendarSource({ ...calendarSource, name: e.target.value })}
                        placeholder="Személyes naptár"
                      />
                    </label>
                    <label className="settings-mini-field settings-control-wide">
                      <span>{calendarSource.type === "caldav" ? "CalDAV naptár URL" : "iCal URL"}</span>
                      <input
                        className="field"
                        value={calendarSource.url}
                        onChange={(e) => setCalendarSource({ ...calendarSource, url: e.target.value })}
                        placeholder={calendarSource.type === "caldav" ? "https://dav.example.hu/cal.php/calendars/user/default/" : "https://calendar.example.hu/private.ics"}
                      />
                    </label>
                    {calendarSource.type === "caldav" && (
                      <>
                        <label className="settings-mini-field">
                          <span>Felhasználó</span>
                          <input
                            className="field"
                            value={calendarSource.username}
                            onChange={(e) => setCalendarSource({ ...calendarSource, username: e.target.value })}
                            placeholder="felhasznalonev"
                          />
                        </label>
                        <label className="settings-mini-field">
                          <span>Jelszó / app password</span>
                          <input
                            className="field"
                            type="password"
                            value={calendarSource.password}
                            onChange={(e) => setCalendarSource({ ...calendarSource, password: e.target.value })}
                            placeholder={calendarSourceStatus?.hasPassword ? "Mentett jelszó cseréje" : "CalDAV jelszó"}
                          />
                        </label>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="ghost-button" type="button" onClick={handleCalendarSourceSave}>Mentés</button>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={async () => {
                        const result = await saveCalendarSource(
                          { ...calendarSource, url: "" },
                          { scope: settings.calendar.sourceScope, profileId: activeProfileId },
                        );
                        setCalendarSourceStatus(result);
                        setCalendarSource({ type: "ical", name: "", url: "", username: "", password: "" });
                        setCalendarMessage("Naptárforrás törölve.");
                      }}
                    >
                      Törlés
                    </button>
                  </div>
                  <span className="text-xs text-slate-300/62">{calendarMessage}</span>
                </div>
              </SettingsSection>
            )}

            {activeTab === "widgets" && (
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
            )}

            {activeTab === "system" && (
              <SettingsSection icon={<BadgeInfo size={18} />} title="Rendszer">
                <div className="settings-control settings-control-wide">
                  <span className="settings-control-label"><BadgeInfo size={16} /> Verzió</span>
                  <div className={`settings-status-badge ${versionInfo?.updateAvailable ? "is-success" : ""}`}>
                    {versionInfo?.updateAvailable ? <CheckCircle2 size={15} /> : <BadgeInfo size={15} />}
                    <span>
                      {versionInfo?.updateAvailable
                        ? `Új verzió elérhető: ${versionInfo.latestVersion}`
                        : "Naprakész vagy nincs ellenőrizhető release"}
                    </span>
                  </div>
                  <div className="version-grid">
                    <span>Telepített verzió</span>
                    <strong>{versionInfo?.version ?? "..."}</strong>
                    <span>Legfrissebb verzió</span>
                    <strong>{versionInfo?.latestVersion ?? "-"}</strong>
                    <span>Utolsó ellenőrzés</span>
                    <strong>{versionInfo?.checkedAt ? formatDateTime(versionInfo.checkedAt) : "-"}</strong>
                  </div>
                  {versionInfo?.updateAvailable && (
                    <div className="version-update-box">
                      <span>Docker frissítés</span>
                      <code>docker compose pull && docker compose up -d</code>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={async () => {
                        try {
                          const info = await fetchVersionInfo();
                          setVersionInfo(info);
                          setVersionMessage(info.error ? "A frissítéskeresés most nem elérhető." : "Verzió ellenőrizve.");
                        } catch {
                          setVersionMessage("A verzióinformáció nem olvasható.");
                        }
                      }}
                    >
                      Ellenőrzés
                    </button>
                    {versionInfo?.latestUrl && (
                      <a className="ghost-button" href={versionInfo.latestUrl} target="_blank" rel="noreferrer">
                        <ExternalLink size={16} /> Release
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-slate-300/62">
                    {versionMessage || "A verzióellenőrzés a GitHub release/tag alapján történik. Kikapcsolható: AUREN_UPDATE_CHECK=false."}
                  </span>
                </div>
              </SettingsSection>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
