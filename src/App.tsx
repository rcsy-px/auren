import type { CSSProperties } from "react";
import { useState } from "react";
import { ClockWeather } from "./components/ClockWeather";
import { DashboardWidgets } from "./components/DashboardWidgets";
import { FreeDashboard } from "./components/FreeDashboard";
import { SearchBar } from "./components/SearchBar";
import { SettingsModal } from "./components/SettingsModal";
import { ShortcutGrid } from "./components/ShortcutGrid";
import { Sidebar } from "./components/Sidebar";
import { defaultLayout, useDashboardStore } from "./store/dashboardStore";

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settings = useDashboardStore((state) => state.settings);
  const layout = useDashboardStore((state) => state.layout ?? defaultLayout);

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
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />

      {layout.mode === "free" ? (
        <FreeDashboard />
      ) : (
        <>
          <ClockWeather />
          <section className="dashboard-shell">
            <header className="dashboard-hero">
              <h1 className="hero-title">{settings.greeting}</h1>
              <p className="hero-subtitle">Fókuszálj a fontos dolgokra.</p>
            </header>

            <SearchBar />
            <ShortcutGrid />
            <DashboardWidgets />

            <p className="dashboard-quote">
              „A figyelem a legértékesebb valuta.” - James Clear
            </p>
          </section>
        </>
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
