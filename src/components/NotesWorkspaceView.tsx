import { Eye, FileText, PenLine, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { useDashboardStore } from "../store/dashboardStore";
import { TodoWidget } from "./TodoWidget";

export function NotesWorkspaceView() {
  const notes = useDashboardStore((state) => state.notes);
  const activeNoteId = useDashboardStore((state) => state.activeNoteId);
  const addNote = useDashboardStore((state) => state.addNote);
  const switchNote = useDashboardStore((state) => state.switchNote);
  const updateNote = useDashboardStore((state) => state.updateNote);
  const deleteNote = useDashboardStore((state) => state.deleteNote);
  const { t, dateLocale } = useI18n();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [searchQuery, setSearchQuery] = useState("");
  const orderedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() || a.order - b.order),
    [notes],
  );
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return orderedNotes;
    return orderedNotes.filter((note) => `${note.title}\n${note.content}`.toLowerCase().includes(query));
  }, [orderedNotes, searchQuery]);
  const activeNote = orderedNotes.find((note) => note.id === activeNoteId) ?? orderedNotes[0];
  const preview = useMemo(() => renderMarkdown(activeNote?.content ?? ""), [activeNote?.content]);
  const hasPreview = Boolean(activeNote?.content.trim());

  if (!activeNote) return null;

  return (
    <div className="notes-workspace">
      <aside className="notes-list glass">
        <header className="notes-list-header">
          <div>
            <div className="settings-kicker">{t("notes.library")}</div>
            <p>{t("notes.noteCount", { count: orderedNotes.length })}</p>
          </div>
          <button type="button" className="icon-button" onClick={() => addNote(t("notes.untitled"))} title={t("notes.newNote")}>
            <Plus size={18} />
          </button>
        </header>
        <label className="notes-search">
          <Search size={16} />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t("notes.searchPlaceholder")} />
        </label>
        <div className="notes-list-items">
          {filteredNotes.length ? filteredNotes.map((note) => (
            <button key={note.id} type="button" className={`notes-list-item ${note.id === activeNote.id ? "is-active" : ""}`} onClick={() => switchNote(note.id)}>
              <span>{note.title}</span>
              <small>{formatNoteDate(note.updatedAt, dateLocale)}</small>
            </button>
          )) : (
            <div className="notes-empty-state">{t("notes.noSearchResults")}</div>
          )}
        </div>
      </aside>

      <section className="notes-editor glass">
        <header className="notes-toolbar">
          <div className="notes-title-block">
            <div className="settings-kicker">{t("notes.quickNote")}</div>
            <input value={activeNote.title} onChange={(event) => updateNote(activeNote.id, { title: event.target.value })} className="notes-title-input" aria-label={t("notes.titleLabel")} />
            <p>{t("notes.characterCount", { count: activeNote.content.length })}</p>
          </div>
          <div className="notes-toolbar-actions">
            <div className="library-view-toggle" aria-label={t("notes.mode")}>
              <button className={mode === "edit" ? "is-active" : ""} type="button" onClick={() => setMode("edit")} title={t("common.edit")}><PenLine size={18} /></button>
              <button className={mode === "preview" ? "is-active" : ""} type="button" onClick={() => setMode("preview")} title={t("notes.preview")}><Eye size={18} /></button>
            </div>
            <button type="button" className="icon-button danger" onClick={() => deleteNote(activeNote.id)} disabled={orderedNotes.length <= 1} title={t("notes.deleteNote")}>
              <Trash2 size={18} />
            </button>
          </div>
        </header>
        {mode === "edit" ? (
          <textarea value={activeNote.content} onChange={(event) => updateNote(activeNote.id, { content: event.target.value })} placeholder={t("notes.placeholder")} className="notes-editor-textarea" />
        ) : hasPreview ? (
          <div className="notes-preview" dangerouslySetInnerHTML={{ __html: preview }} />
        ) : (
          <div className="notes-preview notes-preview-empty">{t("notes.emptyPreview")}</div>
        )}
      </section>

      <aside className="notes-side">
        <div className="notes-tip glass"><FileText size={18} /><div><h3>{t("notes.markdownPreview")}</h3><p>{t("notes.markdownHelp")}</p></div></div>
        <TodoWidget />
      </aside>
    </div>
  );
}

function formatNoteDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}

function renderMarkdown(markdown: string) {
  const lines = escapeHtml(markdown).split(/\r?\n/);
  const html: string[] = [];
  let inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { if (inList) { html.push("</ul>"); inList = false; } continue; }
    if (trimmed.startsWith("- ")) { if (!inList) { html.push("<ul>"); inList = true; } html.push(`<li>${formatInline(trimmed.slice(2))}</li>`); continue; }
    if (inList) { html.push("</ul>"); inList = false; }
    if (trimmed.startsWith("### ")) html.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`);
    else if (trimmed.startsWith("## ")) html.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`);
    else if (trimmed.startsWith("# ")) html.push(`<h1>${formatInline(trimmed.slice(2))}</h1>`);
    else if (trimmed.startsWith("&gt; ")) html.push(`<blockquote>${formatInline(trimmed.slice(5))}</blockquote>`);
    else html.push(`<p>${formatInline(trimmed)}</p>`);
  }
  if (inList) html.push("</ul>");
  return html.join("");
}

function formatInline(value: string) {
  return value.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
