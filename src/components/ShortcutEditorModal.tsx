import { ExternalLink, Link2, Palette, Save, Sparkles, Tag, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { supportedIconSlugs } from "../lib/simpleIcons";
import { normalizeShortcutUrl } from "../lib/url";
import { useDashboardStore } from "../store/dashboardStore";
import type { Shortcut } from "../types/dashboard";
import { ShortcutIcon } from "./ShortcutIcon";

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

const colorPresets = ["#60a5fa", "#38bdf8", "#34d399", "#facc15", "#fb7185", "#a78bfa", "#f97316", "#f8fafc"];

type Props = {
  shortcut?: Shortcut | null;
  onClose: () => void;
  onSave: (shortcut: FormState, id?: string) => void;
  onDelete?: (id: string) => void;
};

export function ShortcutEditorModal({ shortcut, onClose, onSave, onDelete }: Props) {
  const shortcutCategories = useDashboardStore((state) => state.shortcutCategories);
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(shortcut ? { ...shortcut } : blankShortcut);
  const [closing, setClosing] = useState(false);
  const normalizedUrl = form.url.trim() ? normalizeShortcutUrl(form.url) : "";
  const previewShortcut: Shortcut = {
    id: shortcut?.id ?? "preview",
    order: shortcut?.order ?? 0,
    ...form,
    name: form.name.trim() || t("shortcuts.previewName"),
    url: normalizedUrl,
    icon: form.icon.trim() || (form.name.trim() ? form.name.slice(0, 2).toUpperCase() : "AU"),
    color: form.color || blankShortcut.color,
  };

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
      category: form.category.trim() || blankShortcut.category,
    };

    closeAfterAnimation(() => onSave(nextShortcut, shortcut?.id));
  }

  function handleDelete() {
    if (!shortcut) return;
    closeAfterAnimation(() => onDelete?.(shortcut.id));
  }

  return (
    <div className={`modal-backdrop ${closing ? "is-closing" : ""}`} onMouseDown={requestClose}>
      <form className={`modal-panel shortcut-editor-modal ${closing ? "is-closing" : ""}`} onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
        <header className="shortcut-editor-header">
          <div>
            <p className="settings-kicker">{t("shortcuts.editorKicker")}</p>
            <h2 className="settings-title">{shortcut ? t("shortcuts.edit") : t("shortcuts.new")}</h2>
          </div>
          <button className="icon-button" type="button" onClick={requestClose} aria-label={t("common.close")}>
            <X size={19} />
          </button>
        </header>

        <div className="shortcut-editor-content">
          <aside className="shortcut-preview-panel">
            <div className="shortcut-preview-card">
              <ShortcutIcon shortcut={previewShortcut} size={70} />
              <span className="shortcut-preview-name">{previewShortcut.name}</span>
              <span className="shortcut-preview-category">{form.category.trim() || t("common.fallbackCategory")}</span>
            </div>
            <div className="shortcut-url-preview">
              <Link2 size={16} />
              <span>{normalizedUrl || "https://example.com"}</span>
            </div>
          </aside>

          <section className="shortcut-editor-fields">
            <label className="settings-control shortcut-field-wide">
              <span className="settings-control-label"><Sparkles size={16} /> {t("shortcuts.name")}</span>
              <input className="field" placeholder={t("shortcuts.namePlaceholder")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </label>

            <label className="settings-control shortcut-field-wide">
              <span className="settings-control-label"><Link2 size={16} /> URL</span>
              <input className="field" placeholder={t("shortcuts.urlPlaceholder")} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              {normalizedUrl && <span className="shortcut-field-hint">{normalizedUrl}</span>}
            </label>

            <label className="settings-control">
              <span className="settings-control-label"><Sparkles size={16} /> {t("shortcuts.brandIcon")}</span>
              <input className="field" list="shortcut-icon-slugs" placeholder="github" value={form.iconSlug ?? ""} onChange={(e) => setForm({ ...form, iconSlug: e.target.value })} />
              <datalist id="shortcut-icon-slugs">{supportedIconSlugs.map((slug) => <option key={slug} value={slug} />)}</datalist>
            </label>

            <label className="settings-control">
              <span className="settings-control-label"><Tag size={16} /> {t("shortcuts.fallbackIcon")}</span>
              <input className="field" placeholder={t("shortcuts.fallbackIconPlaceholder")} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={4} />
            </label>

            <label className="settings-control">
              <span className="settings-control-label"><Tag size={16} /> {t("shortcuts.category")}</span>
              <input className="field" list="shortcut-categories" placeholder={t("shortcuts.categoryPlaceholder")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <datalist id="shortcut-categories">{shortcutCategories.map((category) => <option key={category.id} value={category.name} />)}</datalist>
            </label>

            <div className="settings-control">
              <span className="settings-control-label"><Palette size={16} /> {t("shortcuts.color")}</span>
              <div className="shortcut-color-row">
                <input className="shortcut-color-input" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} aria-label={t("shortcuts.shortcutColor")} />
                <div className="shortcut-color-presets">
                  {colorPresets.map((color) => (
                    <button key={color} className={`shortcut-color-swatch ${form.color.toLowerCase() === color.toLowerCase() ? "is-active" : ""}`} type="button" style={{ backgroundColor: color }} onClick={() => setForm({ ...form, color })} aria-label={t("shortcuts.colorLabel", { color })} />
                  ))}
                </div>
              </div>
            </div>

            <label className="settings-toggle shortcut-field-wide">
              <span className="inline-flex items-center gap-2"><ExternalLink size={16} /> {t("shortcuts.openInNewTab")}</span>
              <input type="checkbox" checked={form.openInNewTab} onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })} />
            </label>

            <p className="shortcut-editor-note shortcut-field-wide">{t("shortcuts.editorNote")}</p>
          </section>
        </div>

        <footer className="shortcut-editor-actions">
          {shortcut && onDelete && <button className="danger-button" type="button" onClick={handleDelete}><Trash2 size={18} /> {t("common.delete")}</button>}
          <div className="shortcut-editor-action-group">
            <button className="ghost-button" type="button" onClick={requestClose}>{t("common.cancel")}</button>
            <button className="primary-button" type="submit"><Save size={18} /> {t("common.save")}</button>
          </div>
        </footer>
      </form>
    </div>
  );
}
