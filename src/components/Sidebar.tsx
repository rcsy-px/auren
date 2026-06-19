import { Bookmark, Clock3, Grid3X3, Settings, StickyNote } from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboardStore } from "../store/dashboardStore";
import type { Profile } from "../types/dashboard";

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
      <button className="sidebar-avatar mb-8" title={`Aktív profil: ${activeProfile?.name ?? "Alap profil"}`} type="button" onClick={onOpenSettings}>
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
