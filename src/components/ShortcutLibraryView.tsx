import { Edit3, ExternalLink, Grid3X3, List, Plus, Search, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { normalizeShortcutUrl } from "../lib/url";
import { useDashboardStore } from "../store/dashboardStore";
import type { Shortcut } from "../types/dashboard";
import { ShortcutEditorModal } from "./ShortcutEditorModal";
import { ShortcutIcon } from "./ShortcutIcon";

type FormState = Omit<Shortcut, "id" | "order">;
type ViewMode = "grid" | "list";

export function ShortcutLibraryView() {
  const shortcuts = useDashboardStore((state) => state.shortcuts);
  const settings = useDashboardStore((state) => state.settings);
  const updateSettings = useDashboardStore((state) => state.updateSettings);
  const addShortcut = useDashboardStore((state) => state.addShortcut);
  const updateShortcut = useDashboardStore((state) => state.updateShortcut);
  const deleteShortcut = useDashboardStore((state) => state.deleteShortcut);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Összes");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shortcut | null>(null);

  const categories = useMemo(() => {
    const unique = [...new Set(shortcuts.map((shortcut) => shortcut.category || "Egyéb"))].sort((a, b) => a.localeCompare(b, "hu"));
    return ["Összes", ...unique];
  }, [shortcuts]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...shortcuts]
      .sort((a, b) => a.order - b.order)
      .filter((shortcut) => category === "Összes" || shortcut.category === category)
      .filter((shortcut) => {
        if (!search) return true;
        return [shortcut.name, shortcut.url, shortcut.category].some((value) => value.toLowerCase().includes(search));
      });
  }, [category, query, shortcuts]);

  function openForm(shortcut?: Shortcut) {
    setEditing(shortcut ?? null);
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setFormOpen(false);
  }

  function saveShortcut(shortcut: FormState, id?: string) {
    if (id) updateShortcut(id, shortcut);
    else addShortcut(shortcut);
    closeForm();
  }

  function openShortcut(shortcut: Shortcut) {
    const url = normalizeShortcutUrl(shortcut.url);
    if (shortcut.openInNewTab) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  }

  return (
    <>
      <div className="library-toolbar glass">
        <label className="library-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Shortcut keresése" />
        </label>
        <div className="library-view-toggle" aria-label="Nézet">
          <button className={viewMode === "grid" ? "is-active" : ""} type="button" onClick={() => setViewMode("grid")} title="Rács">
            <Grid3X3 size={18} />
          </button>
          <button className={viewMode === "list" ? "is-active" : ""} type="button" onClick={() => setViewMode("list")} title="Lista">
            <List size={18} />
          </button>
        </div>
        <button className="primary-button" type="button" onClick={() => openForm()}>
          <Plus size={18} /> Új shortcut
        </button>
      </div>

      <div className="category-strip">
        {categories.map((item) => (
          <button key={item} className={category === item ? "is-active" : ""} type="button" onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>

      <label className="library-dashboard-toggle glass">
        <span>
          <strong>Kategóriák a dashboardon</strong>
          <small>Szebb, csoportosított shortcut szekciók a kezdőlapon.</small>
        </span>
        <input
          type="checkbox"
          checked={settings.shortcuts.showCategoriesOnDashboard}
          onChange={(event) => updateSettings({ shortcuts: { ...settings.shortcuts, showCategoriesOnDashboard: event.target.checked } })}
        />
      </label>

      {viewMode === "grid" ? (
        <div className="shortcut-grid library-shortcut-grid" style={{ "--shortcut-columns": settings.columns } as CSSProperties}>
          {filtered.map((shortcut) => (
            <div key={shortcut.id} className="shortcut-card group">
              <button type="button" className="library-card-main" onClick={() => openShortcut(shortcut)}>
                <ShortcutIcon shortcut={shortcut} size={settings.iconSize} />
                <span className="max-w-full truncate text-sm">{shortcut.name}</span>
                <span className="mt-1 max-w-full truncate text-xs text-slate-300/48">{shortcut.category}</span>
              </button>
              <span className="library-card-actions">
                <button type="button" title="Szerkesztés" onClick={() => openForm(shortcut)}><Edit3 size={14} /></button>
                <button type="button" title="Törlés" onClick={() => deleteShortcut(shortcut.id)}><Trash2 size={14} /></button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="library-list">
          {filtered.map((shortcut) => (
            <div key={shortcut.id} className="library-list-row glass">
              <ShortcutIcon shortcut={shortcut} size={42} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{shortcut.name}</div>
                <div className="truncate text-xs text-slate-300/56">{shortcut.url}</div>
              </div>
              <span className="library-category-pill">{shortcut.category}</span>
              <button className="icon-button" type="button" title="Megnyitás" onClick={() => openShortcut(shortcut)}><ExternalLink size={17} /></button>
              <button className="icon-button" type="button" title="Szerkesztés" onClick={() => openForm(shortcut)}><Edit3 size={17} /></button>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && <p className="empty-state">Nincs találat erre a szűrésre.</p>}

      {formOpen && (
        <ShortcutEditorModal
          shortcut={editing}
          onClose={closeForm}
          onSave={saveShortcut}
          onDelete={(id) => {
            deleteShortcut(id);
            closeForm();
          }}
        />
      )}
    </>
  );
}
