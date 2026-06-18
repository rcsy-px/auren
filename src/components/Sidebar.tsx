import { Bookmark, CalendarDays, Clock3, Grid3X3, Moon, Settings, StickyNote } from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore";

type Props = {
  onOpenSettings: () => void;
};

const navItems = [
  { icon: Grid3X3, label: "Dashboard", active: true },
  { icon: Bookmark, label: "Könyvjelzők" },
  { icon: Clock3, label: "Idő" },
  { icon: StickyNote, label: "Jegyzetek" },
];

export function Sidebar({ onOpenSettings }: Props) {
  const activeProfile = useDashboardStore((state) =>
    state.profiles.find((profile) => profile.id === state.activeProfileId),
  );
  const initial = activeProfile?.name.trim().slice(0, 1).toUpperCase() || "A";

  return (
    <aside className="sidebar-shell">
      <button
        className="mt-9 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-xl font-semibold text-white"
        type="button"
        title={`Aktív profil: ${activeProfile?.name ?? "Alap profil"}`}
        onClick={onOpenSettings}
      >
        {initial}
      </button>
      <nav className="mt-28 flex flex-1 flex-col items-center gap-5">
        {navItems.map(({ icon: Icon, label, active }) => (
          <button key={label} className={`icon-button ${active ? "active" : ""}`} title={label} type="button">
            <Icon size={22} />
          </button>
        ))}
        <button className="icon-button" title="Beállítások" type="button" onClick={onOpenSettings}>
          <Settings size={22} />
        </button>
      </nav>
      <button className="icon-button mb-8" title="Téma" type="button">
        <Moon size={22} />
      </button>
    </aside>
  );
}
