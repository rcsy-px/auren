import { ArrowDown, ArrowUp, Palette, Plus, Tag, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { useDashboardStore } from "../store/dashboardStore";

type Props = {
  onClose: () => void;
};

const colorPresets = ["#60a5fa", "#38bdf8", "#34d399", "#facc15", "#fb7185", "#a78bfa", "#f97316", "#f8fafc"];

export function ShortcutCategoryManagerModal({ onClose }: Props) {
  const shortcuts = useDashboardStore((state) => state.shortcuts);
  const categories = useDashboardStore((state) => state.shortcutCategories);
  const addCategory = useDashboardStore((state) => state.addShortcutCategory);
  const updateCategory = useDashboardStore((state) => state.updateShortcutCategory);
  const deleteCategory = useDashboardStore((state) => state.deleteShortcutCategory);
  const reorderCategories = useDashboardStore((state) => state.reorderShortcutCategories);
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [color, setColor] = useState(colorPresets[0]);
  const [closing, setClosing] = useState(false);

  const orderedCategories = useMemo(() => [...categories].sort((a, b) => a.order - b.order), [categories]);
  const counts = useMemo(() => {
    const next = new Map<string, number>();
    for (const shortcut of shortcuts) {
      const key = (shortcut.category || t("common.fallbackCategory")).trim().toLowerCase();
      next.set(key, (next.get(key) ?? 0) + 1);
    }
    return next;
  }, [shortcuts]);

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
    const nextName = name.trim();
    if (!nextName) return;
    addCategory(nextName, color);
    setName("");
  }

  function moveCategory(id: string, direction: -1 | 1) {
    const index = orderedCategories.findIndex((category) => category.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= orderedCategories.length) return;
    const next = [...orderedCategories];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    reorderCategories(next.map((category) => category.id));
  }

  return (
    <div className={`modal-backdrop ${closing ? "is-closing" : ""}`} onMouseDown={requestClose}>
      <section className={`modal-panel category-manager-modal ${closing ? "is-closing" : ""}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="shortcut-editor-header">
          <div>
            <p className="settings-kicker">{t("shortcuts.title")}</p>
            <h2 className="settings-title">{t("shortcuts.manageCategories")}</h2>
          </div>
          <button className="icon-button" type="button" onClick={requestClose} aria-label={t("common.close")}>
            <X size={19} />
          </button>
        </header>

        <div className="category-manager-content">
          <form className="category-manager-add glass" onSubmit={handleSubmit}>
            <label className="library-search">
              <Tag size={18} />
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("shortcuts.newCategoryName")} autoFocus />
            </label>
            <div className="category-manager-color">
              <Palette size={17} />
              <input type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label={t("shortcuts.categoryColor")} />
            </div>
            <button className="primary-button" type="submit"><Plus size={18} /> {t("common.add")}</button>
          </form>

          <div className="category-manager-list">
            {orderedCategories.map((category, index) => {
              const count = counts.get(category.name.toLowerCase()) ?? 0;
              const isFallback = category.name.toLowerCase() === "egyéb";
              return (
                <article key={category.id} className="category-manager-row glass">
                  <span className="category-manager-swatch" style={{ backgroundColor: category.color }} />
                  <input className="field" defaultValue={category.name} onBlur={(event) => updateCategory(category.id, { name: event.target.value })} aria-label={t("shortcuts.categoryName")} />
                  <input className="category-manager-native-color" type="color" value={category.color} onChange={(event) => updateCategory(category.id, { color: event.target.value })} aria-label={t("shortcuts.categoryColor")} />
                  <span className="library-category-pill">{t("shortcuts.shortcutCount", { count })}</span>
                  <div className="category-manager-actions">
                    <button className="icon-button" type="button" onClick={() => moveCategory(category.id, -1)} disabled={index === 0} title={t("common.up")}><ArrowUp size={17} /></button>
                    <button className="icon-button" type="button" onClick={() => moveCategory(category.id, 1)} disabled={index === orderedCategories.length - 1} title={t("common.down")}><ArrowDown size={17} /></button>
                    <button className="icon-button is-danger" type="button" onClick={() => deleteCategory(category.id)} disabled={isFallback} title={t("common.delete")}><Trash2 size={17} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

