import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { resizeImageFile } from "../lib/image";
import { useDashboardStore } from "../store/dashboardStore";

export function ProfileManager() {
  const profiles = useDashboardStore((state) => state.profiles);
  const activeProfileId = useDashboardStore((state) => state.activeProfileId);
  const createProfile = useDashboardStore((state) => state.createProfile);
  const switchProfile = useDashboardStore((state) => state.switchProfile);
  const renameProfile = useDashboardStore((state) => state.renameProfile);
  const updateProfileAvatar = useDashboardStore((state) => state.updateProfileAvatar);
  const deleteProfile = useDashboardStore((state) => state.deleteProfile);
  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0],
    [activeProfileId, profiles],
  );
  const [newProfileName, setNewProfileName] = useState("");
  const [renameValue, setRenameValue] = useState(activeProfile?.name ?? "");
  const [avatarValue, setAvatarValue] = useState(activeProfile?.avatarUrl ?? "");
  const [avatarPreviewFailed, setAvatarPreviewFailed] = useState(false);
  const initial = activeProfile?.name.trim().slice(0, 1).toUpperCase() || "A";

  useEffect(() => {
    setRenameValue(activeProfile?.name ?? "");
    setAvatarValue(activeProfile?.avatarUrl ?? "");
    setAvatarPreviewFailed(false);
  }, [activeProfile?.avatarUrl, activeProfile?.id, activeProfile?.name]);

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    createProfile(newProfileName);
    setNewProfileName("");
  }

  function handleRename(event: FormEvent) {
    event.preventDefault();
    if (!activeProfile) return;
    renameProfile(activeProfile.id, renameValue);
    updateProfileAvatar(activeProfile.id, avatarValue);
  }

  async function handleAvatarBrowse(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const dataUrl = await resizeImageFile(file);
      setAvatarValue(dataUrl);
      setAvatarPreviewFailed(false);
      if (activeProfile) updateProfileAvatar(activeProfile.id, dataUrl);
    } catch (error) {
      console.warn("Avatar image resize failed", error);
    }
  }

  return (
    <section className="profile-panel">
      <header className="flex items-center gap-3">
        <span className="profile-preview">
          {avatarValue && !avatarPreviewFailed ? (
            <img src={avatarValue} alt="" onError={() => setAvatarPreviewFailed(true)} />
          ) : (
            <span>{initial}</span>
          )}
        </span>
        <div>
          <h3 className="text-base font-medium text-white">Profilok</h3>
          <p className="text-sm text-slate-300/70">Az aktív munkamenet: {activeProfile?.name || initial}</p>
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
            setAvatarValue(selected?.avatarUrl ?? "");
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

      <div className="mt-3 grid gap-3">
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleRename}>
          <input
            className="field min-w-0 flex-1"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Profil neve"
          />
          <input
            className="field min-w-0 flex-1"
            value={avatarValue}
            onChange={(event) => setAvatarValue(event.target.value)}
            placeholder="Profilkép URL"
          />
          <button className="ghost-button" type="submit">Mentés</button>
        </form>
        <div className="profile-avatar-actions">
          <label className="ghost-button cursor-pointer">
            <ImagePlus size={17} /> Tallózás
            <input className="sr-only" type="file" accept="image/*" onChange={handleAvatarBrowse} />
          </label>
          <button
            className="ghost-button"
            type="button"
            disabled={!avatarValue}
            onClick={() => {
              setAvatarValue("");
              if (activeProfile) updateProfileAvatar(activeProfile.id, "");
            }}
          >
            Kép törlése
          </button>
        </div>
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
