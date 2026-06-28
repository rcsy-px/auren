import { Eye, FileText, PenLine } from "lucide-react";
import { useMemo, useState } from "react";
import { useDashboardStore } from "../store/dashboardStore";
import { TodoWidget } from "./TodoWidget";

export function NotesWorkspaceView() {
  const note = useDashboardStore((state) => state.note);
  const setNote = useDashboardStore((state) => state.setNote);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const preview = useMemo(() => renderMarkdown(note), [note]);

  return (
    <div className="notes-workspace">
      <section className="notes-editor glass">
        <header className="notes-toolbar">
          <div>
            <div className="settings-kicker">Quick note</div>
            <p>{note.length} karakter</p>
          </div>
          <div className="library-view-toggle" aria-label="Jegyzet mód">
            <button className={mode === "edit" ? "is-active" : ""} type="button" onClick={() => setMode("edit")} title="Szerkesztés">
              <PenLine size={18} />
            </button>
            <button className={mode === "preview" ? "is-active" : ""} type="button" onClick={() => setMode("preview")} title="Előnézet">
              <Eye size={18} />
            </button>
          </div>
        </header>

        {mode === "edit" ? (
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Új jegyzet"
            className="notes-editor-textarea"
          />
        ) : (
          <div className="notes-preview" dangerouslySetInnerHTML={{ __html: preview }} />
        )}
      </section>

      <aside className="notes-side">
        <div className="notes-tip glass">
          <FileText size={18} />
          <div>
            <h3>Markdown előnézet</h3>
            <p>Támogatott: címsorok, listák, idézetek, félkövér, dőlt, inline kód és linkek.</p>
          </div>
        </div>
        <TodoWidget />
      </aside>
    </div>
  );
}

function renderMarkdown(markdown: string) {
  const lines = escapeHtml(markdown).split(/\r?\n/);
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${formatInline(trimmed.slice(2))}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

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
  return value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
