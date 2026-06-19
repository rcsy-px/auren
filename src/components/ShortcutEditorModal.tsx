import { Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { supportedIconSlugs } from "../lib/simpleIcons";
import { normalizeShortcutUrl } from "../lib/url";
import type { Shortcut } from "../types/dashboard";

type FormState = Omit<Shortcut, "id" | "order">;

const blankShortcut: FormState = {
  name: "",
  url: "",
  icon: "",
  iconSlug: "",
  color: "#60a5fa",
  category: "Egyéb",
  openInNewTab: true,
};

type Props = {
  shortcut?: Shortcut | null;
  onClose: () => void;
  onSave: (shortcut: FormState, id?: string) => void;
  onDelete?: (id: string) => void;
};

export function ShortcutEditorModal({ shortcut, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FormState>(shortcut ? { ...shortcut } : blankShortcut);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setForm(shortcut ? { ...shortcut } : blankShortcut);
  }, [shortcut]);

  function closeAfterAnimation(action: () => void) {
    if (closing) return;
    setClosing(true);
    window.setTimeout(action, 180);
  }

  function requestClose() {
    closeAfterAnimation(onClose);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;

    const nextShortcut = {
      ...form,
      name: form.name.trim(),
      url: normalizeShortcutUrl(form.url),
      icon: form.icon.trim() || form.name.slice(0, 2).toUpperCase(),
      iconSlug: form.iconSlug?.trim(),
      category: form.category.trim() || "Egyéb",
    };

    closeAfterAnimation(() => onSave(nextShortcut, shortcut?.id));
  }

  function handleDelete() {
    if (!shortcut) return;
    closeAfterAnimation(() => onDelete?.(shortcut.id));
  }

  return (
    <div className={`modal-backdrop ${closing ? "is-closing" : ""}`} onMouseDown={requestClose}>
      <form className={`modal-panel ${closing ? "is-closing" : ""}`} onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
        <h2 className="text-xl font-medium">{shortcut ? "Shortcut szerkesztése" : "Új shortcut"}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input className="field" placeholder="Név" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="field" placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <input className="field" placeholder="Simple Icons slug, pl. github" value={form.iconSlug ?? ""} onChange={(e) => setForm({ ...form, iconSlug: e.target.value })} />
          <input className="field" placeholder="Fallback ikon vagy rövidítés" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <input className="field" placeholder="Kategória" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <label className="field flex items-center gap-3">
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            Szín
          </label>
          <label className="field flex items-center gap-3">
            <input type="checkbox" checked={form.openInNewTab} onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })} />
            Új lapon nyitás
          </label>
        </div>
        <p className="mt-3 text-sm text-slate-300/62">
          Támogatott brand ikonok: {supportedIconSlugs.join(", ")}. Ismeretlen slug esetén favicon, majd fallback jelenik meg.
        </p>
        <div className="mt-5 flex justify-between gap-3">
          {shortcut && onDelete && (
            <button className="danger-button" type="button" onClick={handleDelete}>
              <Trash2 size={18} /> Törlés
            </button>
          )}
          <div className="ml-auto flex gap-3">
            <button className="ghost-button" type="button" onClick={requestClose}>Mégse</button>
            <button className="primary-button" type="submit">Mentés</button>
          </div>
        </div>
      </form>
    </div>
  );
}
