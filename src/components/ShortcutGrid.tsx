import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { FormEvent, useMemo, useState } from "react";
import { supportedIconSlugs } from "../lib/simpleIcons";
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

export function ShortcutGrid() {
  const shortcuts = useDashboardStore((state) => state.shortcuts);
  const settings = useDashboardStore((state) => state.settings);
  const addShortcut = useDashboardStore((state) => state.addShortcut);
  const updateShortcut = useDashboardStore((state) => state.updateShortcut);
  const deleteShortcut = useDashboardStore((state) => state.deleteShortcut);
  const reorderShortcuts = useDashboardStore((state) => state.reorderShortcuts);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shortcut | null>(null);
  const [form, setForm] = useState<FormState>(blankShortcut);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const sorted = useMemo(() => [...shortcuts].sort((a, b) => a.order - b.order), [shortcuts]);

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = sorted.findIndex((item) => item.id === event.active.id);
    const newIndex = sorted.findIndex((item) => item.id === event.over?.id);
    reorderShortcuts(arrayMove(sorted, oldIndex, newIndex).map((item) => item.id));
  }

  function openForm(shortcut?: Shortcut) {
    setEditing(shortcut ?? null);
    setForm(shortcut ? { ...shortcut } : blankShortcut);
    setFormOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    if (editing) updateShortcut(editing.id, form);
    else addShortcut({ ...form, icon: form.icon || form.name.slice(0, 2).toUpperCase() });
    setEditing(null);
    setForm(blankShortcut);
    setFormOpen(false);
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div className="shortcut-grid" style={{ "--shortcut-columns": settings.columns } as CSSProperties}>
            {sorted.map((shortcut) => (
              <SortableShortcut key={shortcut.id} shortcut={shortcut} onEdit={openForm} />
            ))}
            <button type="button" onClick={() => openForm()} className="shortcut-card" title="Shortcut hozzáadása">
              <Plus size={34} className="mb-3 text-slate-200/85" />
              <span>Hozzáadás</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {formOpen && (
        <div className="modal-backdrop" onMouseDown={() => { setFormOpen(false); setForm(blankShortcut); }}>
          <form className="modal-panel" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-xl font-medium">{editing ? "Shortcut szerkesztése" : "Új shortcut"}</h2>
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
              Támogatott brand ikonok: {supportedIconSlugs.join(", ")}. Ismeretlen slug esetén a fallback jelenik meg.
            </p>
            <div className="mt-5 flex justify-between gap-3">
              {editing && (
                <button className="danger-button" type="button" onClick={() => { deleteShortcut(editing.id); setEditing(null); setForm(blankShortcut); setFormOpen(false); }}>
                  <Trash2 size={18} /> Törlés
                </button>
              )}
              <div className="ml-auto flex gap-3">
                <button className="ghost-button" type="button" onClick={() => { setEditing(null); setForm(blankShortcut); setFormOpen(false); }}>Mégse</button>
                <button className="primary-button" type="submit">Mentés</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function SortableShortcut({ shortcut, onEdit }: { shortcut: Shortcut; onEdit: (shortcut: Shortcut) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: shortcut.id });
  const iconSize = useDashboardStore((state) => state.settings.iconSize);

  function openShortcut() {
    if (shortcut.openInNewTab) window.open(shortcut.url, "_blank", "noopener,noreferrer");
    else window.location.href = shortcut.url;
  }

  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="shortcut-card group"
      type="button"
      onClick={openShortcut}
      onDoubleClick={(event) => { event.preventDefault(); onEdit(shortcut); }}
      {...attributes}
      {...listeners}
    >
      <ShortcutIcon shortcut={shortcut} size={iconSize} />
      <span className="max-w-full truncate text-sm">{shortcut.name}</span>
      <span className="absolute right-2 top-2 hidden rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/70 group-hover:block">
        dupla katt
      </span>
    </button>
  );
}
