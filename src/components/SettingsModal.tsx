import { BadgeInfo, Brush, CalendarDays, CheckCircle2, Clock3, CloudSun, Coffee, ExternalLink, Github, Grid3X3, Image, ImagePlus, KeyRound, Languages, LayoutDashboard, ListTodo, RotateCcw, Search, SlidersHorizontal, Sparkles, Trash2, X } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { availableLocales } from "../i18n/registry";
import { useI18n } from "../i18n";
import { fetchCalendarSourceStatus, saveCalendarSource, type CalendarSourceStatus, type CalendarSourceType } from "../lib/calendar";
import { resizeImageFile } from "../lib/image";
import { fetchVersionInfo, type VersionInfo } from "../lib/version";
import { fetchWeatherKeyStatus, saveWeatherApiKey, type WeatherKeyStatus } from "../lib/weather";
import { defaultLayout, useDashboardStore } from "../store/dashboardStore";
import type { BackgroundFit, LayoutMode, Locale, SearchProvider } from "../types/dashboard";

type Props = {
  open: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
};

export type SettingsTab = "general" | "appearance" | "layout" | "weather" | "calendar" | "widgets" | "system";

const settingsTabs: { id: SettingsTab; icon: ReactNode }[] = [
  { id: "general", icon: <SlidersHorizontal size={18} /> },
  { id: "appearance", icon: <Brush size={18} /> },
  { id: "layout", icon: <LayoutDashboard size={18} /> },
  { id: "weather", icon: <CloudSun size={18} /> },
  { id: "calendar", icon: <CalendarDays size={18} /> },
  { id: "widgets", icon: <ListTodo size={18} /> },
  { id: "system", icon: <BadgeInfo size={18} /> },
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
  const [activePreviewSlider, setActivePreviewSlider] = useState<string | null>(null);
  const settings = useDashboardStore((state) => state.settings);
  const layout = useDashboardStore((state) => state.layout ?? defaultLayout);
  const activeProfileId = useDashboardStore((state) => state.activeProfileId);
  const updateSettings = useDashboardStore((state) => state.updateSettings);
  const setLayoutMode = useDashboardStore((state) => state.setLayoutMode);
  const resetFreeLayout = useDashboardStore((state) => state.resetFreeLayout);
  const { t, dateLocale } = useI18n();

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
        setVersionMessage(info.error ? t("settings.weatherUpdateUnavailable") : "");
      } catch {
        setVersionMessage(t("settings.versionUnreadable"));
      }

      try {
        const status = await fetchWeatherKeyStatus(controller.signal);
        setWeatherKeyStatus(status);
        setWeatherKeyMessage(status.configured ? t("settings.weatherKeyConfigured") : t("settings.weatherKeyMissing"));
      } catch {
        setWeatherKeyMessage(t("settings.weatherKeyUnreadable"));
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
          setCalendarMessage(status.type === "caldav" ? t("settings.calendarSourceConfiguredCaldav") : t("settings.calendarSourceConfiguredIcal"));
        } else {
          setCalendarMessage(t("settings.calendarSourceMissing"));
        }
      } catch {
        setCalendarMessage(t("settings.calendarSourceUnreadable"));
      }
    }

    void loadExternalStatuses();
    return () => controller.abort();
  }, [activeProfileId, open, settings.calendar.sourceScope, t]);

  useEffect(() => {
    if (!activePreviewSlider) return;

    const stopPreview = () => setActivePreviewSlider(null);
    window.addEventListener("pointerup", stopPreview);
    window.addEventListener("pointercancel", stopPreview);
    window.addEventListener("blur", stopPreview);

    return () => {
      window.removeEventListener("pointerup", stopPreview);
      window.removeEventListener("pointercancel", stopPreview);
      window.removeEventListener("blur", stopPreview);
    };
  }, [activePreviewSlider]);

  async function handleWeatherKeySave() {
    try {
      const result = await saveWeatherApiKey(weatherKey);
      setWeatherKey("");
      setWeatherKeyStatus({ configured: result.configured, source: "settings" });
      setWeatherKeyMessage(result.configured ? t("settings.weatherKeySaved") : t("settings.weatherKeyDeleted"));
    } catch {
      setWeatherKeyMessage(t("settings.weatherKeySaveFailed"));
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
      setCalendarMessage(result.configured ? t("settings.calendarSourceSaved") : t("settings.calendarSourceDeleted"));
    } catch {
      setCalendarMessage(t("settings.calendarSourceSaveFailed"));
    }
  }

  async function handleCalendarSourceDelete() {
    const result = await saveCalendarSource(
      { ...calendarSource, url: "" },
      { scope: settings.calendar.sourceScope, profileId: activeProfileId },
    );
    setCalendarSourceStatus(result);
    setCalendarSource({ type: "ical", name: "", url: "", username: "", password: "" });
    setCalendarMessage(t("settings.calendarSourceDeleted"));
  }

  async function handleBackgroundBrowse(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const dataUrl = await resizeImageFile(file, 1920, 0.82);
      updateSettings({
        background: "custom",
        backgroundImageUrl: dataUrl,
        backgroundFit: settings.backgroundFit ?? "cover",
      });
    } catch (error) {
      console.warn("Background image resize failed", error);
    }
  }

  if (!rendered) return null;

  return (
    <div className={`modal-backdrop ${closing ? "is-closing" : ""} ${activePreviewSlider ? "is-previewing" : ""}`} onMouseDown={onClose}>
      <section className={`modal-panel settings-modal ${closing ? "is-closing" : ""} ${activePreviewSlider ? "is-previewing" : ""}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="settings-header">
          <div>
            <p className="settings-kicker">{t("app.name")}</p>
            <h2 className="settings-title">{t("settings.title")}</h2>
          </div>
          <button className="icon-button h-10 w-10" type="button" onClick={onClose} title={t("common.close")}>
            <X size={20} />
          </button>
        </header>

        <div className="settings-layout">
          <nav className="settings-nav" aria-label={t("settings.categories")}>
            {settingsTabs.map((tab) => {
              const hasUpdateBadge = tab.id === "system" && versionInfo?.updateAvailable;
              return (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeTab === tab.id ? "is-active" : ""} ${hasUpdateBadge ? "has-update" : ""}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="settings-nav-icon">{tab.icon}</span>
                  <span className="settings-nav-copy">
                    <span>{t(`settings.tabs.${tab.id}.title`)}</span>
                    <small>{hasUpdateBadge ? t("settings.updateAvailable") : t(`settings.tabs.${tab.id}.description`)}</small>
                  </span>
                  {hasUpdateBadge && <span className="settings-nav-badge">{t("settings.updateBadge")}</span>}
                </button>
              );
            })}
            <div className="settings-branding" aria-label={t("settings.brandingLabel")}>
              <span className="settings-branding-kicker">{t("settings.brandingKicker")}</span>
              <a className="settings-branding-link" href="https://github.com/rcsy-px" target="_blank" rel="noreferrer">
                <Github size={16} />
                <span>GitHub</span>
                <ExternalLink size={13} />
              </a>
              <a className="settings-branding-link" href="https://ko-fi.com/rycsypx" target="_blank" rel="noreferrer">
                <Coffee size={16} />
                <span>Ko-fi</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </nav>

          <div className="settings-content">
            {activeTab === "general" && (
              <SettingsSection icon={<SlidersHorizontal size={18} />} title={t("settings.tabs.general.title")}>
                <label className="settings-control settings-control-wide">
                  <span className="settings-control-label"><Languages size={16} /> {t("settings.language")}</span>
                  <select className="field" value={settings.locale} onChange={(e) => updateSettings({ locale: e.target.value as Locale })}>
                    {availableLocales.map((locale) => (
                      <option key={locale.code} value={locale.code}>{locale.nativeName} - {locale.name}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-300/62">{t("settings.languageDescription")}</span>
                </label>
                <label className="settings-control settings-control-wide">
                  <span className="settings-control-label"><Sparkles size={16} /> {t("settings.greeting")}</span>
                  <input className="field" value={settings.greeting} onChange={(e) => updateSettings({ greeting: e.target.value })} />
                </label>
                <label className="settings-control">
                  <span className="settings-control-label"><Search size={16} /> {t("settings.searchProvider")}</span>
                  <select className="field" value={settings.searchProvider} onChange={(e) => updateSettings({ searchProvider: e.target.value as SearchProvider })}>
                    <option value="google">Google</option>
                    <option value="duckduckgo">DuckDuckGo</option>
                    <option value="brave">Brave</option>
                    <option value="bing">Bing</option>
                  </select>
                </label>
                <label className="settings-control">
                  <span className="settings-control-label"><Clock3 size={16} /> {t("settings.timeFormat")}</span>
                  <select className="field" value={settings.timeFormat} onChange={(e) => updateSettings({ timeFormat: e.target.value as "12" | "24" })}>
                    <option value="24">{t("settings.hour24")}</option>
                    <option value="12">{t("settings.hour12")}</option>
                  </select>
                </label>
              </SettingsSection>
            )}

            {activeTab === "appearance" && (
              <SettingsSection icon={<Brush size={18} />} title={t("settings.tabs.appearance.title")}>
                <label className="settings-control">
                  <span className="settings-control-label"><Image size={16} /> {t("settings.background")}</span>
                  <select className="field" value={settings.background} onChange={(e) => updateSettings({ background: e.target.value as "image" | "gradient" | "custom" })}>
                    <option value="image">{t("settings.defaultImage")}</option>
                    <option value="custom">{t("settings.customImage")}</option>
                    <option value="gradient">{t("settings.gradient")}</option>
                  </select>
                </label>
                <label className="settings-control">
                  <span className="settings-control-label"><Image size={16} /> {t("settings.fit")}</span>
                  <select className="field" value={settings.backgroundFit ?? "cover"} disabled={settings.background === "gradient"} onChange={(e) => updateSettings({ backgroundFit: e.target.value as BackgroundFit })}>
                    <option value="cover">{t("settings.cover")}</option>
                    <option value="contain">{t("settings.contain")}</option>
                    <option value="fill">{t("settings.fill")}</option>
                    <option value="center">{t("settings.center")}</option>
                    <option value="repeat">{t("settings.repeat")}</option>
                  </select>
                </label>
                <div className="settings-control settings-control-wide">
                  <span className="settings-control-label"><ImagePlus size={16} /> {t("settings.customBackground")}</span>
                  <div className={`background-preview ${settings.backgroundImageUrl ? "has-image" : ""}`} style={settings.backgroundImageUrl ? { backgroundImage: `url("${settings.backgroundImageUrl}")` } : undefined}>
                    {!settings.backgroundImageUrl && <span>{t("settings.noCustomImage")}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="ghost-button cursor-pointer">
                      <ImagePlus size={17} /> {t("profile.browse")}
                      <input className="sr-only" type="file" accept="image/*" onChange={handleBackgroundBrowse} />
                    </label>
                    <button className="ghost-button" type="button" disabled={!settings.backgroundImageUrl} onClick={() => updateSettings({ backgroundImageUrl: "", background: "image" })}>
                      <Trash2 size={16} /> {t("common.delete")}
                    </button>
                  </div>
                  <span className="text-xs text-slate-300/62">{t("settings.profileSavedSetting")}</span>
                </div>
                <Slider label={t("settings.dim")} value={settings.backgroundDim ?? 0} min={0} max={0.75} step={0.01} previewId="backgroundDim" activePreviewId={activePreviewSlider} onPreviewStart={setActivePreviewSlider} onChange={(backgroundDim) => updateSettings({ backgroundDim })} />
                <Slider label={t("settings.blur")} value={settings.blur} min={6} max={30} previewId="blur" activePreviewId={activePreviewSlider} onPreviewStart={setActivePreviewSlider} onChange={(blur) => updateSettings({ blur })} />
                <Slider label={t("settings.glassOpacity")} value={settings.glassOpacity} min={0.06} max={0.26} step={0.01} previewId="glassOpacity" activePreviewId={activePreviewSlider} onPreviewStart={setActivePreviewSlider} onChange={(glassOpacity) => updateSettings({ glassOpacity })} />
                <Slider label={t("settings.iconSize")} value={settings.iconSize} min={42} max={74} previewId="iconSize" activePreviewId={activePreviewSlider} onPreviewStart={setActivePreviewSlider} onChange={(iconSize) => updateSettings({ iconSize })} />
              </SettingsSection>
            )}

            {activeTab === "layout" && (
              <SettingsSection icon={<LayoutDashboard size={18} />} title={t("settings.tabs.layout.title")}>
                <label className="settings-control">
                  <span className="settings-control-label"><Grid3X3 size={16} /> {t("settings.view")}</span>
                  <select className="field" value={layout.mode} onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}>
                    <option value="grid">{t("settings.autoGrid")}</option>
                    <option value="free">{t("settings.freeCanvas")}</option>
                  </select>
                </label>
                <Slider label={t("settings.gridColumns")} value={settings.columns} min={3} max={7} step={1} onChange={(columns) => updateSettings({ columns })} />
                <div className="settings-control">
                  <span className="settings-control-label"><RotateCcw size={16} /> {t("settings.freeCanvasReset")}</span>
                  <button className="ghost-button w-full" type="button" onClick={resetFreeLayout}>{t("settings.resetDefault")}</button>
                </div>
              </SettingsSection>
            )}

            {activeTab === "weather" && (
              <SettingsSection icon={<CloudSun size={18} />} title={t("settings.tabs.weather.title")}>
                <label className="settings-control settings-control-wide">
                  <span className="settings-control-label"><CloudSun size={16} /> {t("settings.location")}</span>
                  <input className="field" value={settings.weatherLocation} onChange={(e) => updateSettings({ weatherLocation: e.target.value })} placeholder="Budapest" />
                  <span className="text-xs text-slate-300/62">{t("settings.profileSavedSetting")}</span>
                </label>
                <div className="settings-control settings-control-wide">
                  <span className="settings-control-label"><KeyRound size={16} /> {t("settings.weatherKey")}</span>
                  <div className={`settings-status-badge ${weatherKeyStatus?.configured ? "is-success" : ""}`}>
                    {weatherKeyStatus?.configured ? <CheckCircle2 size={15} /> : <KeyRound size={15} />}
                    <span>{weatherKeyStatus?.configured ? weatherKeyStatus.source === "environment" ? t("settings.activeEnvKey") : t("settings.activeKey") : t("settings.notConfigured")}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input className="field" type="password" value={weatherKey} disabled={weatherKeyStatus?.source === "environment"} onChange={(e) => setWeatherKey(e.target.value)} placeholder={weatherKeyStatus?.configured ? t("settings.newKeyOrDelete") : "WeatherAPI.com API key"} />
                    <button className="ghost-button" type="button" disabled={weatherKeyStatus?.source === "environment"} onClick={handleWeatherKeySave}>{t("common.save")}</button>
                  </div>
                  <span className="text-xs text-slate-300/62">{weatherKeyStatus?.source === "environment" ? t("settings.envKeyReadonly") : t("settings.globalWeatherKey", { message: weatherKeyMessage })}</span>
                </div>
              </SettingsSection>
            )}

            {activeTab === "calendar" && (
              <SettingsSection icon={<CalendarDays size={18} />} title={t("settings.tabs.calendar.title")}>
                <label className="settings-toggle settings-control-wide">
                  <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {t("settings.calendarWidget")}</span>
                  <input type="checkbox" checked={settings.widgets.calendar} onChange={(e) => updateSettings({ widgets: { ...settings.widgets, calendar: e.target.checked } })} />
                </label>
                <label className="settings-toggle settings-control-wide">
                  <span>{t("settings.profileCalendarSource")}<small className="mt-1 block text-xs text-slate-300/55">{t("settings.globalCalendarHint")}</small></span>
                  <input type="checkbox" checked={settings.calendar.sourceScope === "profile"} onChange={(e) => updateSettings({ calendar: { ...settings.calendar, sourceScope: e.target.checked ? "profile" : "global" } })} />
                </label>
                <Slider label={t("settings.daysAhead")} value={settings.calendar.daysAhead} min={1} max={90} step={1} onChange={(daysAhead) => updateSettings({ calendar: { ...settings.calendar, daysAhead } })} />
                <Slider label={t("settings.maxEvents")} value={settings.calendar.maxEvents} min={1} max={20} step={1} onChange={(maxEvents) => updateSettings({ calendar: { ...settings.calendar, maxEvents } })} />
                <label className="settings-toggle"><span>{t("settings.showLocation")}</span><input type="checkbox" checked={settings.calendar.showLocation} onChange={(e) => updateSettings({ calendar: { ...settings.calendar, showLocation: e.target.checked } })} /></label>
                <label className="settings-toggle"><span>{t("settings.showSource")}</span><input type="checkbox" checked={settings.calendar.showSource} onChange={(e) => updateSettings({ calendar: { ...settings.calendar, showSource: e.target.checked } })} /></label>
                <div className="settings-control settings-control-wide">
                  <span className="settings-control-label"><KeyRound size={16} /> {t("settings.calendarSource")}</span>
                  <div className={`settings-status-badge ${calendarSourceStatus?.configured ? "is-success" : ""}`}>
                    {calendarSourceStatus?.configured ? <CheckCircle2 size={15} /> : <CalendarDays size={15} />}
                    <span>{calendarSourceStatus?.configured ? calendarSourceStatus.type === "caldav" ? t("settings.caldavActive") : t("settings.icalActive") : t("settings.notConfigured")}</span>
                  </div>
                  <span className="text-xs text-slate-300/62">{settings.calendar.sourceScope === "profile" ? t("settings.profileCalendarHint") : t("settings.globalCalendarSourceHint")}</span>
                  <div className="settings-calendar-form">
                    <label className="settings-mini-field"><span>{t("settings.type")}</span><select className="field" value={calendarSource.type} onChange={(e) => setCalendarSource({ ...calendarSource, type: e.target.value as CalendarSourceType })}><option value="ical">iCal feed</option><option value="caldav">CalDAV</option></select></label>
                    <label className="settings-mini-field"><span>{t("settings.name")}</span><input className="field" value={calendarSource.name} onChange={(e) => setCalendarSource({ ...calendarSource, name: e.target.value })} placeholder={t("settings.personalCalendar")} /></label>
                    <label className="settings-mini-field settings-control-wide"><span>{calendarSource.type === "caldav" ? t("settings.caldavUrl") : t("settings.icalUrl")}</span><input className="field" value={calendarSource.url} onChange={(e) => setCalendarSource({ ...calendarSource, url: e.target.value })} placeholder={calendarSource.type === "caldav" ? "https://dav.example.com/cal.php/calendars/user/default/" : "https://calendar.example.com/private.ics"} /></label>
                    {calendarSource.type === "caldav" && <><label className="settings-mini-field"><span>{t("settings.username")}</span><input className="field" value={calendarSource.username} onChange={(e) => setCalendarSource({ ...calendarSource, username: e.target.value })} placeholder={t("settings.usernamePlaceholder")} /></label><label className="settings-mini-field"><span>{t("settings.password")}</span><input className="field" type="password" value={calendarSource.password} onChange={(e) => setCalendarSource({ ...calendarSource, password: e.target.value })} placeholder={calendarSourceStatus?.hasPassword ? t("settings.savedPasswordReplace") : t("settings.caldavPassword")} /></label></>}
                  </div>
                  <div className="flex flex-wrap gap-3"><button className="ghost-button" type="button" onClick={handleCalendarSourceSave}>{t("common.save")}</button><button className="danger-button" type="button" onClick={handleCalendarSourceDelete}>{t("common.delete")}</button></div>
                  <span className="text-xs text-slate-300/62">{calendarMessage}</span>
                </div>
              </SettingsSection>
            )}

            {activeTab === "widgets" && (
              <SettingsSection icon={<Grid3X3 size={18} />} title={t("settings.tabs.widgets.title")}>
                <div className="settings-widget-list">
                  {(["calendar", "todos", "notes"] as const).map((key) => (
                    <label key={key} className="settings-toggle"><span>{key === "calendar" ? t("calendar.title") : key === "todos" ? t("todos.title") : t("notes.widgetTitle")}</span><input type="checkbox" checked={settings.widgets[key]} onChange={(e) => updateSettings({ widgets: { ...settings.widgets, [key]: e.target.checked } })} /></label>
                  ))}
                </div>
              </SettingsSection>
            )}

            {activeTab === "system" && (
              <SettingsSection icon={<BadgeInfo size={18} />} title={t("settings.tabs.system.title")}>
                <div className="settings-control settings-control-wide">
                  <span className="settings-control-label"><BadgeInfo size={16} /> {t("settings.latestVersion")}</span>
                  <div className={`settings-status-badge ${versionInfo?.updateAvailable ? "is-success" : ""}`}>
                    {versionInfo?.updateAvailable ? <CheckCircle2 size={15} /> : <BadgeInfo size={15} />}
                    <span>{versionInfo?.updateAvailable ? t("settings.latestAvailable", { version: versionInfo.latestVersion ?? "" }) : t("settings.upToDate")}</span>
                  </div>
                  <div className="version-grid"><span>{t("settings.installedVersion")}</span><strong>{versionInfo?.version ?? "..."}</strong><span>{t("settings.latestVersion")}</span><strong>{versionInfo?.latestVersion ?? "-"}</strong><span>{t("settings.lastCheck")}</span><strong>{versionInfo?.checkedAt ? formatDateTime(versionInfo.checkedAt, dateLocale) : "-"}</strong></div>
                  {versionInfo?.updateAvailable && <div className="version-update-box"><span>{t("settings.dockerUpdate")}</span><code>docker compose pull && docker compose up -d</code></div>}
                  <div className="flex flex-wrap gap-3"><button className="ghost-button" type="button" onClick={async () => { try { const info = await fetchVersionInfo(); setVersionInfo(info); setVersionMessage(info.error ? t("settings.weatherUpdateUnavailable") : t("settings.versionChecked")); } catch { setVersionMessage(t("settings.versionUnreadable")); } }}>{t("common.check")}</button>{versionInfo?.latestUrl && <a className="ghost-button" href={versionInfo.latestUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {t("common.release")}</a>}</div>
                  <span className="text-xs text-slate-300/62">{versionMessage || t("settings.versionDefaultHelp")}</span>
                </div>
              </SettingsSection>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
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

function Slider({ label, value, min, max, step = 1, previewId, activePreviewId, onPreviewStart, onChange }: { label: string; value: number; min: number; max: number; step?: number; previewId?: string; activePreviewId?: string | null; onPreviewStart?: (id: string) => void; onChange: (value: number) => void }) {
  const isPreviewing = Boolean(previewId && activePreviewId === previewId);
  const displayValue = max <= 1 ? `${Math.round(value * 100)}%` : step < 1 ? value.toFixed(2) : value;

  return (
    <label className={`settings-control ${isPreviewing ? "is-preview-control" : ""}`}>
      <span className="settings-range-head"><span>{label}</span><span>{displayValue}</span></span>
      <input className="settings-range" type="range" min={min} max={max} step={step} value={value} onPointerDown={() => previewId && onPreviewStart?.(previewId)} onInput={(e) => onChange(Number(e.currentTarget.value))} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
