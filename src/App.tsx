import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { CalendarDays, Grid3X3, StickyNote } from "lucide-react";
import { CalendarAgendaView } from "./components/CalendarAgendaView";
import { ClockWeather } from "./components/ClockWeather";
import { DashboardWidgets } from "./components/DashboardWidgets";
import { FreeDashboard } from "./components/FreeDashboard";
import { NotesWorkspaceView } from "./components/NotesWorkspaceView";
import { ProfileModal } from "./components/ProfileModal";
import { SearchBar } from "./components/SearchBar";
import { SettingsModal, type SettingsTab } from "./components/SettingsModal";
import { ShortcutGrid } from "./components/ShortcutGrid";
import { ShortcutLibraryView } from "./components/ShortcutLibraryView";
import { Sidebar, type SidebarTarget } from "./components/Sidebar";
import { useI18n } from "./i18n";
import { startDashboardSync } from "./lib/dashboardSync";
import { defaultLayout, useDashboardStore } from "./store/dashboardStore";

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>("general");
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeSidebarTarget, setActiveSidebarTarget] = useState<SidebarTarget>("dashboard");
  const settings = useDashboardStore((state) => state.settings);
  const layout = useDashboardStore((state) => state.layout ?? defaultLayout);

  useEffect(() => startDashboardSync(), []);

  const backgroundStyle = getBackgroundStyle(settings);

  function handleSidebarNavigate(target: SidebarTarget) {
    setActiveSidebarTarget(target);
    setSettingsOpen(false);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main
      className={`min-h-screen overflow-x-hidden text-white ${settings.background === "gradient" ? "bg-auren-gradient" : "bg-dashboard"}`}
      style={
        {
          "--glass-blur": `${settings.blur}px`,
          "--glass-opacity": settings.glassOpacity,
          "--background-dim": settings.backgroundDim ?? 0,
          ...backgroundStyle,
        } as CSSProperties
      }
    >
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.10),transparent_34%),linear-gradient(180deg,rgba(8,13,22,0.30),rgba(5,9,15,0.86))]" />
      {(settings.backgroundDim ?? 0) > 0 && (
        <div className="pointer-events-none fixed inset-0 bg-black opacity-[var(--background-dim)]" />
      )}
      <Sidebar
        activeTarget={activeSidebarTarget}
        onNavigate={handleSidebarNavigate}
        onOpenSettings={() => {
          setSettingsInitialTab("general");
          setSettingsOpen(true);
        }}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {activeSidebarTarget === "dashboard" && layout.mode === "free" ? (
        <FreeDashboard />
      ) : (
        <section key={activeSidebarTarget} className="view-stage">
          <ClockWeather />
          {activeSidebarTarget === "dashboard" && (
            <DashboardHome greeting={settings.greeting} />
          )}
          {activeSidebarTarget === "shortcuts" && <ShortcutsView />}
          {activeSidebarTarget === "calendar" && (
            <CalendarView
              onOpenSettings={() => {
                setSettingsInitialTab("calendar");
                setSettingsOpen(true);
              }}
            />
          )}
          {activeSidebarTarget === "notes" && <NotesView />}
        </section>
      )}

      <SettingsModal open={settingsOpen} initialTab={settingsInitialTab} onClose={() => setSettingsOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </main>
  );
}

function getBackgroundStyle(settings: ReturnType<typeof useDashboardStore.getState>["settings"]): CSSProperties {
  if (settings.background !== "custom" || !settings.backgroundImageUrl) return {};

  const fit = settings.backgroundFit ?? "cover";
  const base: CSSProperties = {
    backgroundImage: `url("${settings.backgroundImageUrl}")`,
    backgroundAttachment: "fixed",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  };

  if (fit === "contain") return { ...base, backgroundSize: "contain" };
  if (fit === "fill") return { ...base, backgroundSize: "100% 100%" };
  if (fit === "center") return { ...base, backgroundSize: "auto" };
  if (fit === "repeat") return { ...base, backgroundSize: "auto", backgroundRepeat: "repeat" };
  return base;
}

function DashboardHome({ greeting }: { greeting: string }) {
  const { t } = useI18n();
  return (
    <section className="dashboard-shell">
      <header className="dashboard-hero">
        <h1 className="hero-title">{greeting}</h1>
        <p className="hero-subtitle">{t("app.heroSubtitle")}</p>
      </header>

      <SearchBar />
      <ShortcutGrid />
      <DashboardWidgets />

      <p className="dashboard-quote">
        {t("app.quote")}
      </p>
    </section>
  );
}

function ShortcutsView() {
  const { t } = useI18n();
  return (
    <section className="focus-shell">
      <FocusHeader icon={<Grid3X3 size={22} />} title={t("shortcuts.title")} subtitle={t("shortcuts.subtitle")} />
      <SearchBar />
      <ShortcutLibraryView />
    </section>
  );
}

function CalendarView({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { t } = useI18n();
  return (
    <section className="focus-shell">
      <FocusHeader icon={<CalendarDays size={22} />} title={t("calendar.title")} subtitle={t("calendar.subtitle")} action={<button className="ghost-button" type="button" onClick={onOpenSettings}>{t("calendar.settings")}</button>} />
      <CalendarAgendaView onOpenSettings={onOpenSettings} />
    </section>
  );
}

function NotesView() {
  const { t } = useI18n();
  return (
    <section className="focus-shell">
      <FocusHeader icon={<StickyNote size={22} />} title={t("notes.title")} subtitle={t("notes.subtitle")} />
      <NotesWorkspaceView />
    </section>
  );
}

function FocusHeader({ icon, title, subtitle, action }: { icon: ReactNode; title: string; subtitle: string; action?: ReactNode }) {
  return (
    <header className="focus-header">
      <span className="focus-header-icon">{icon}</span>
      <div className="min-w-0">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && <div className="focus-header-action">{action}</div>}
    </header>
  );
}
