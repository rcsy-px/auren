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

  function handleSidebarNavigate(target: SidebarTarget) {
    setActiveSidebarTarget(target);
    setSettingsOpen(false);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main
      className={`min-h-screen overflow-x-hidden text-white ${settings.background === "image" ? "bg-dashboard" : "bg-auren-gradient"}`}
      style={
        {
          "--glass-blur": `${settings.blur}px`,
          "--glass-opacity": settings.glassOpacity,
        } as CSSProperties
      }
    >
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.10),transparent_34%),linear-gradient(180deg,rgba(8,13,22,0.30),rgba(5,9,15,0.86))]" />
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

function DashboardHome({ greeting }: { greeting: string }) {
  return (
    <section className="dashboard-shell">
      <header className="dashboard-hero">
        <h1 className="hero-title">{greeting}</h1>
        <p className="hero-subtitle">Fókuszálj a fontos dolgokra.</p>
      </header>

      <SearchBar />
      <ShortcutGrid />
      <DashboardWidgets />

      <p className="dashboard-quote">
        „A figyelem a legértékesebb valuta.” - James Clear
      </p>
    </section>
  );
}

function ShortcutsView() {
  return (
    <section className="focus-shell">
      <FocusHeader icon={<Grid3X3 size={22} />} title="Shortcutok" subtitle="Gyorsindítók rendezése, megnyitása és szerkesztése." />
      <SearchBar />
      <ShortcutLibraryView />
    </section>
  );
}

function CalendarView({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <section className="focus-shell">
      <FocusHeader icon={<CalendarDays size={22} />} title="Naptár" subtitle="Közelgő események az iCal vagy CalDAV forrásból." action={<button className="ghost-button" type="button" onClick={onOpenSettings}>Naptár beállítások</button>} />
      <CalendarAgendaView onOpenSettings={onOpenSettings} />
    </section>
  );
}

function NotesView() {
  return (
    <section className="focus-shell">
      <FocusHeader icon={<StickyNote size={22} />} title="Jegyzetek" subtitle="Gyors jegyzet és teendők egy nyugodtabb munkafelületen." />
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
