import { Plus, Trash2, UserRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "../store/dashboardStore";

export function ProfileManager() {
  const profiles = useDashboardStore((state) => state.profiles);
  const activeProfileId = useDashboardStore((state) => state.activeProfileId);
  const createProfile = useDashboardStore((state) => state.createProfile);
  const switchProfile = useDashboardStore((state) => state.switchProfile);
  const renameProfile = useDashboardStore((state) => state.renameProfile);
  const deleteProfile = useDashboardStore((state) => state.deleteProfile);
  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0],
    [activeProfileId, profiles],
  );
  const [newProfileName, setNewProfileName] = useState("");
  const [renameValue, setRenameValue] = useState(activeProfile?.name ?? "");

  useEffect(() => {
    setRenameValue(activeProfile?.name ?? "");
  }, [activeProfile?.id, activeProfile?.name]);

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    createProfile(newProfileName);
    setNewProfileName("");
  }

  function handleRename(event: FormEvent) {
    event.preventDefault();
    if (!activeProfile) return;
    renameProfile(activeProfile.id, renameValue);
  }

  return (
    <section className="profile-panel">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/8 text-sky-100">
          <UserRound size={20} />
        </span>
        <div>
          <h3 className="text-base font-medium text-white">Profilok</h3>
          <p className="text-sm text-slate-300/70">Az aktív munkamenet: {activeProfile?.name}</p>
        </div>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          className="field"
          value={activeProfileId}
          onChange={(event) => {
            const selected = profiles.find((profile) => profile.id === event.target.value);
            switchProfile(event.target.value);
            setRenameValue(selected?.name ?? "");
          }}
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
        <button
          className="danger-button"
          type="button"
          disabled={profiles.length <= 1}
          onClick={() => activeProfile && deleteProfile(activeProfile.id)}
          title="Aktív profil törlése"
        >
          <Trash2 size={17} /> Törlés
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <form className="flex gap-2" onSubmit={handleRename}>
          <input
            className="field min-w-0 flex-1"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Profil neve"
          />
          <button className="ghost-button" type="submit">Átnevezés</button>
        </form>
        <form className="flex gap-2" onSubmit={handleCreate}>
          <input
            className="field min-w-0 flex-1"
            value={newProfileName}
            onChange={(event) => setNewProfileName(event.target.value)}
            placeholder="Új profil neve"
          />
          <button className="primary-button" type="submit" title="Új profil">
            <Plus size={17} /> Új
          </button>
        </form>
      </div>
    </section>
  );
}
