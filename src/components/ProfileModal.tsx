import { Images, Layers3, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { useDashboardStore } from "../store/dashboardStore";
import { ProfileManager } from "./ProfileManager";

type Props = { open: boolean; onClose: () => void };

export function ProfileModal({ open, onClose }: Props) {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const profiles = useDashboardStore((state) => state.profiles);
  const activeProfileId = useDashboardStore((state) => state.activeProfileId);
  const shortcuts = useDashboardStore((state) => state.shortcuts);
  const todos = useDashboardStore((state) => state.todos);
  const { t } = useI18n();
  const activeProfile = useMemo(() => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0], [activeProfileId, profiles]);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const initial = activeProfile?.name.trim().slice(0, 1).toUpperCase() || "A";

  useEffect(() => {
    if (open) { setRendered(true); setClosing(false); return; }
    if (!rendered) return;
    setClosing(true);
    const timer = window.setTimeout(() => { setRendered(false); setClosing(false); }, 180);
    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => setAvatarFailed(false), [activeProfile?.avatarUrl]);

  if (!rendered) return null;

  return (
    <div className={`modal-backdrop ${closing ? "is-closing" : ""}`} onMouseDown={onClose}>
      <section className={`modal-panel profile-modal ${closing ? "is-closing" : ""}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="profile-modal-header">
          <div><p className="settings-kicker">{t("app.name")}</p><h2 className="settings-title">{t("profile.settings")}</h2></div>
          <button className="icon-button h-10 w-10" type="button" onClick={onClose} title={t("common.close")}><X size={20} /></button>
        </header>
        <div className="profile-modal-content">
          <aside className="profile-hero-panel">
            <div className="profile-hero-avatar">{activeProfile?.avatarUrl && !avatarFailed ? <img src={activeProfile.avatarUrl} alt="" onError={() => setAvatarFailed(true)} /> : <span>{initial}</span>}</div>
            <div className="min-w-0 text-center"><h3 className="truncate text-xl font-semibold text-white">{activeProfile?.name ?? t("sidebar.defaultProfile")}</h3><p className="mt-1 text-sm text-slate-300/66">{t("profile.activeSession")}</p></div>
            <div className="profile-stat-grid"><ProfileStat icon={<UserRound size={16} />} label={t("profile.profile")} value={String(profiles.length)} /><ProfileStat icon={<Layers3 size={16} />} label={t("profile.shortcut")} value={String(shortcuts.length)} /><ProfileStat icon={<Images size={16} />} label={t("todos.todo")} value={String(todos.length)} /></div>
          </aside>
          <ProfileManager compact />
        </div>
      </section>
    </div>
  );
}

function ProfileStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="profile-stat"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>;
}
