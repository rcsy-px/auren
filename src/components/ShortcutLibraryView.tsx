import { Edit3, ExternalLink, Grid3X3, List, Plus, RotateCcw, Search, Tags, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { normalizeShortcutUrl } from "../lib/url";
import { useDashboardStore } from "../store/dashboardStore";
import type { Shortcut } from "../types/dashboard";
import { ShortcutCategoryManagerModal } from "./ShortcutCategoryManagerModal";
import { ShortcutEditorModal } from "./ShortcutEditorModal";
import { ShortcutIcon } from "./ShortcutIcon";

type FormState = Omit<Shortcut, "id" | "order">;
type ViewMode = "grid" | "list";

export function ShortcutLibraryView() {
  const shortcuts = useDashboardStore((state) => state.shortcuts);
  const shortcutCategories = useDashboardStore((state) => state.shortcutCategories);
  const settings = useDashboardStore((state) => state.settings);
  const updateSettings = useDashboardStore((state) => state.updateSettings);
  const addShortcut = useDashboardStore((state) => state.addShortcut);
  const updateShortcut = useDashboardStore((state) => state.updateShortcut);
  const deleteShortcut = useDashboardStore((state) => state.deleteShortcut);
  const { t } = useI18n();
  const allCategory = t("common.all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allCategory);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editing, setEditing] = useState<Shortcut | null>(null);

  const sortedShortcuts = useMemo(() => [...shortcuts].sort((a, b) => a.order - b.order), [shortcuts]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const shortcut of shortcuts) {
      const name = shortcut.category || t("common.fallbackCategory");
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    counts.set(allCategory, shortcuts.length);
    return counts;
  }, [allCategory, shortcuts, t]);

  const categories = useMemo(() => {
    const managed = shortcutCategories.map((item) => item.name);
    const shortcutOnly = shortcuts
      .map((shortcut) => shortcut.category || t("common.fallbackCategory"))
      .filter((name) => !managed.some((item) => item.toLowerCase() === name.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "hu"));
    const unique = [...new Set([...managed, ...shortcutOnly])];
    return [allCategory, ...unique];
  }, [allCategory, shortcutCategories, shortcuts, t]);
  const categoryColors = useMemo(() => new Map(shortcutCategories.map((item) => [item.name, item.color])), [shortcutCategories]);

  useEffect(() => {
    if (!categories.includes(category)) setCategory(allCategory);
  }, [allCategory, categories, category]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return sortedShortcuts
      .filter((shortcut) => category === allCategory || shortcut.category === category)
      .filter((shortcut) => {
        if (!search) return true;
        return [shortcut.name, shortcut.url, shortcut.category].some((value) => value.toLowerCase().includes(search));
      });
  }, [allCategory, category, query, sortedShortcuts]);

  const hasFilters = query.trim() !== "" || category !== allCategory;
  const resultLabel = hasFilters
    ? t("shortcuts.filteredResults", { count: filtered.length, total: shortcuts.length })
    : t("shortcuts.totalResults", { count: shortcuts.length });

  function resetFilters() {
    setQuery("");
    setCategory(allCategory);
  }

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
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("shortcuts.searchPlaceholder")} />
        </label>
        <div className="library-view-toggle" aria-label={t("shortcuts.view")}>
          <button className={viewMode === "grid" ? "is-active" : ""} type="button" onClick={() => setViewMode("grid")} title={t("common.grid")}>
            <Grid3X3 size={18} />
          </button>
          <button className={viewMode === "list" ? "is-active" : ""} type="button" onClick={() => setViewMode("list")} title={t("common.list")}>
            <List size={18} />
          </button>
        </div>
        <button className="primary-button" type="button" onClick={() => openForm()}>
          <Plus size={18} /> {t("shortcuts.new")}
        </button>
        <button className="ghost-button" type="button" onClick={() => setCategoryManagerOpen(true)}>
          <Tags size={18} /> {t("shortcuts.categories")}
        </button>
      </div>

      <div className="library-results-row">
        <span>{resultLabel}</span>
        {hasFilters && <button type="button" onClick={resetFilters}><RotateCcw size={15} /> {t("shortcuts.resetFilters")}</button>}
      </div>

      <div className="category-strip">
        {categories.map((item) => (
          <button key={item} className={category === item ? "is-active" : ""} type="button" onClick={() => setCategory(item)}>
            {item !== allCategory && <span className="category-color-dot" style={{ backgroundColor: categoryColors.get(item) ?? "#60a5fa" }} />}
            <span>{item}</span>
            <small>{categoryCounts.get(item) ?? 0}</small>
          </button>
        ))}
      </div>

      <label className="library-dashboard-toggle glass">
        <span>
          <strong>{t("shortcuts.showCategoriesTitle")}</strong>
          <small>{t("shortcuts.showCategoriesDescription")}</small>
        </span>
        <input
          type="checkbox"
          checked={settings.shortcuts.showCategoriesOnDashboard}
          onChange={(event) => updateSettings({ shortcuts: { ...settings.shortcuts, showCategoriesOnDashboard: event.target.checked } })}
        />
      </label>

      {filtered.length > 0 && viewMode === "grid" && (
        <div className="shortcut-grid library-shortcut-grid" style={{ "--shortcut-columns": settings.columns } as CSSProperties}>
          {filtered.map((shortcut) => (
            <div key={shortcut.id} className="shortcut-card group">
              <button type="button" className="library-card-main" onClick={() => openShortcut(shortcut)}>
                <ShortcutIcon shortcut={shortcut} size={settings.iconSize} />
                <span className="max-w-full truncate text-sm">{shortcut.name}</span>
                <span className="mt-1 max-w-full truncate text-xs text-slate-300/48">{shortcut.category}</span>
              </button>
              <span className="library-card-actions">
                <button type="button" title={t("common.open")} onClick={() => openShortcut(shortcut)}><ExternalLink size={14} /></button>
                <button type="button" title={t("common.edit")} onClick={() => openForm(shortcut)}><Edit3 size={14} /></button>
                <button type="button" title={t("common.delete")} onClick={() => deleteShortcut(shortcut.id)}><Trash2 size={14} /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && viewMode === "list" && (
        <div className="library-list">
          {filtered.map((shortcut) => (
            <div key={shortcut.id} className="library-list-row glass">
              <ShortcutIcon shortcut={shortcut} size={42} />
              <div className="library-list-main">
                <div className="truncate text-sm font-medium text-white">{shortcut.name}</div>
                <div className="truncate text-xs text-slate-300/56">{normalizeShortcutUrl(shortcut.url)}</div>
              </div>
              <span className="library-category-pill">{shortcut.category}</span>
              <span className="library-open-mode">{shortcut.openInNewTab ? t("shortcuts.openModeNewTab") : t("shortcuts.openModeCurrentTab")}</span>
              <div className="library-list-actions">
                <button className="icon-button" type="button" title={t("common.open")} onClick={() => openShortcut(shortcut)}><ExternalLink size={17} /></button>
                <button className="icon-button" type="button" title={t("common.edit")} onClick={() => openForm(shortcut)}><Edit3 size={17} /></button>
                <button className="icon-button danger" type="button" title={t("common.delete")} onClick={() => deleteShortcut(shortcut.id)}><Trash2 size={17} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state library-empty-state">
          <strong>{shortcuts.length === 0 ? t("shortcuts.noShortcuts") : t("shortcuts.noFilteredResults")}</strong>
          <span>{hasFilters ? t("shortcuts.noFilteredHint") : t("shortcuts.noShortcutsHint")}</span>
          {hasFilters ? <button className="ghost-button" type="button" onClick={resetFilters}><RotateCcw size={16} /> {t("shortcuts.resetFilters")}</button> : <button className="primary-button" type="button" onClick={() => openForm()}><Plus size={16} /> {t("shortcuts.new")}</button>}
        </div>
      )}

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

      {categoryManagerOpen && <ShortcutCategoryManagerModal onClose={() => setCategoryManagerOpen(false)} />}
    </>
  );
}
