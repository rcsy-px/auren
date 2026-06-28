import { Bookmark, CalendarDays, Grid3X3, Settings, StickyNote } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchVersionInfo } from "../lib/version";
import { useDashboardStore } from "../store/dashboardStore";
import type { Profile } from "../types/dashboard";

type Props = {
  activeTarget: SidebarTarget;
  onNavigate: (target: SidebarTarget) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
};

export type SidebarTarget = "dashboard" | "shortcuts" | "calendar" | "notes";

const navItems = [
  { icon: Grid3X3, label: "Dashboard", target: "dashboard" },
  { icon: Bookmark, label: "Shortcutok", target: "shortcuts" },
  { icon: CalendarDays, label: "Naptár", target: "calendar" },
  { icon: StickyNote, label: "Jegyzetek", target: "notes" },
] satisfies { icon: typeof Grid3X3; label: string; target: SidebarTarget }[];

export function Sidebar({ activeTarget, onNavigate, onOpenSettings, onOpenProfile }: Props) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const activeProfile = useDashboardStore((state) =>
    state.profiles.find((profile) => profile.id === state.activeProfileId),
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchVersionInfo(controller.signal)
      .then((info) => setUpdateAvailable(info.updateAvailable))
      .catch(() => setUpdateAvailable(false));
    return () => controller.abort();
  }, []);

  return (
    <aside className="sidebar-shell">
      <button
        className="sidebar-brand"
        type="button"
        title="Auren"
        onClick={onOpenSettings}
      >
        <img src="/aurenlogo_withoutName.png" alt="" />
      </button>
      <nav className="sidebar-nav mt-28 flex flex-1 flex-col items-center gap-5">
        {navItems.map(({ icon: Icon, label, target }) => (
          <button
            key={label}
            className={`icon-button ${activeTarget === target ? "active" : ""}`}
            title={label}
            type="button"
            onClick={() => onNavigate(target)}
          >
            <Icon size={22} />
          </button>
        ))}
        <button className="icon-button" title={updateAvailable ? "Beállítások - új verzió elérhető" : "Beállítások"} type="button" onClick={onOpenSettings}>
          <Settings size={22} />
          {updateAvailable && <span className="update-dot" aria-hidden="true" />}
        </button>
      </nav>
      <button className="sidebar-avatar mb-8" title={`Aktív profil: ${activeProfile?.name ?? "Alap profil"}`} type="button" onClick={onOpenProfile}>
        <ProfileAvatar profile={activeProfile} />
      </button>
    </aside>
  );
}

function ProfileAvatar({ profile }: { profile?: Profile }) {
  const [failed, setFailed] = useState(false);
  const initial = profile?.name.trim().slice(0, 1).toUpperCase() || "A";

  useEffect(() => {
    setFailed(false);
  }, [profile?.avatarUrl]);

  if (profile?.avatarUrl && !failed) {
    return <img src={profile.avatarUrl} alt="" onError={() => setFailed(true)} />;
  }

  return <span>{initial}</span>;
}
