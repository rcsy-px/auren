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
import { Layers3, Plus } from "lucide-react";
import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeShortcutUrl } from "../lib/url";
import { useDashboardStore } from "../store/dashboardStore";
import type { Shortcut } from "../types/dashboard";
import { ShortcutEditorModal } from "./ShortcutEditorModal";
import { ShortcutIcon } from "./ShortcutIcon";

type FormState = Omit<Shortcut, "id" | "order">;

export function ShortcutGrid() {
  const shortcuts = useDashboardStore((state) => state.shortcuts);
  const settings = useDashboardStore((state) => state.settings);
  const addShortcut = useDashboardStore((state) => state.addShortcut);
  const updateShortcut = useDashboardStore((state) => state.updateShortcut);
  const deleteShortcut = useDashboardStore((state) => state.deleteShortcut);
  const reorderShortcuts = useDashboardStore((state) => state.reorderShortcuts);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shortcut | null>(null);
  const [activeCategory, setActiveCategory] = useState("Összes");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const sorted = useMemo(() => [...shortcuts].sort((a, b) => a.order - b.order), [shortcuts]);
  const categories = useMemo(() => {
    const unique = [...new Set(sorted.map((shortcut) => shortcut.category?.trim() || "Egyéb"))].sort((a, b) => a.localeCompare(b, "hu"));
    return ["Összes", ...unique];
  }, [sorted]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>([["Összes", sorted.length]]);
    for (const shortcut of sorted) {
      const key = shortcut.category?.trim() || "Egyéb";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [sorted]);
  const visibleShortcuts = useMemo(
    () => activeCategory === "Összes" ? sorted : sorted.filter((shortcut) => (shortcut.category?.trim() || "Egyéb") === activeCategory),
    [activeCategory, sorted],
  );

  useEffect(() => {
    if (!categories.includes(activeCategory)) setActiveCategory("Összes");
  }, [activeCategory, categories]);

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = sorted.findIndex((item) => item.id === event.active.id);
    const newIndex = sorted.findIndex((item) => item.id === event.over?.id);
    reorderShortcuts(arrayMove(sorted, oldIndex, newIndex).map((item) => item.id));
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

  function removeShortcut(id: string) {
    deleteShortcut(id);
    closeForm();
  }

  return (
    <>
      {settings.shortcuts.showCategoriesOnDashboard ? (
        <div id="shortcuts-section" className="shortcut-category-panel">
          <div className="shortcut-category-dock glass">
            <div className="shortcut-category-current">
              <span className="shortcut-category-icon"><Layers3 size={17} /></span>
              <span>
                <strong>{activeCategory}</strong>
                <small>{categoryCounts.get(activeCategory) ?? 0} shortcut</small>
              </span>
            </div>
            <div className="shortcut-category-tabs" aria-label="Shortcut kategóriák">
              {categories.map((category) => (
                <button
                  key={category}
                  className={activeCategory === category ? "is-active" : ""}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  <span>{category}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => openForm()} className="shortcut-category-add-button" title="Shortcut hozzáadása">
              <Plus size={18} />
            </button>
          </div>
          <div className="shortcut-grid shortcut-category-grid" style={{ "--shortcut-columns": settings.columns } as CSSProperties}>
            {visibleShortcuts.map((shortcut) => (
              <StaticShortcut key={shortcut.id} shortcut={shortcut} onEdit={openForm} />
            ))}
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((item) => item.id)} strategy={rectSortingStrategy}>
            <div id="shortcuts-section" className="shortcut-grid" style={{ "--shortcut-columns": settings.columns } as CSSProperties}>
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
      )}

      {formOpen && (
        <ShortcutEditorModal
          shortcut={editing}
          onClose={closeForm}
          onSave={saveShortcut}
          onDelete={removeShortcut}
        />
      )}
    </>
  );
}

function StaticShortcut({ shortcut, onEdit }: { shortcut: Shortcut; onEdit: (shortcut: Shortcut) => void }) {
  const iconSize = useDashboardStore((state) => state.settings.iconSize);

  function openShortcut() {
    const url = normalizeShortcutUrl(shortcut.url);
    if (shortcut.openInNewTab) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  }

  return (
    <button
      className="shortcut-card group h-full w-full"
      type="button"
      onClick={openShortcut}
      onContextMenu={(event) => event.preventDefault()}
      onDoubleClick={(event) => { event.preventDefault(); onEdit(shortcut); }}
    >
      <ShortcutIcon shortcut={shortcut} size={iconSize} />
      <span className="max-w-full truncate text-sm">{shortcut.name}</span>
      <span className="absolute right-2 top-2 hidden rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/70 group-hover:block">
        szerkesztés
      </span>
    </button>
  );
}

function SortableShortcut({ shortcut, onEdit }: { shortcut: Shortcut; onEdit: (shortcut: Shortcut) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: shortcut.id });
  const iconSize = useDashboardStore((state) => state.settings.iconSize);
  const longPressTimer = useRef<number | null>(null);
  const longPressOpened = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });

  function clearLongPressTimer() {
    if (!longPressTimer.current) return;
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    longPressOpened.current = false;
    clearLongPressTimer();
    longPressTimer.current = window.setTimeout(() => {
      longPressOpened.current = true;
      onEdit(shortcut);
    }, 550);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const moved = Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y);
    if (moved > 8) clearLongPressTimer();
  }

  function handlePointerUp() {
    clearLongPressTimer();
  }

  function openShortcut() {
    if (longPressOpened.current) {
      longPressOpened.current = false;
      return;
    }

    const url = normalizeShortcutUrl(shortcut.url);
    if (shortcut.openInNewTab) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="shortcut-card group h-full w-full"
        type="button"
        onClick={openShortcut}
        {...attributes}
        {...listeners}
        onPointerDown={(event) => {
          (listeners?.onPointerDown as ((event: PointerEvent<HTMLButtonElement>) => void) | undefined)?.(event);
          handlePointerDown(event);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(event) => event.preventDefault()}
        onDoubleClick={(event) => { event.preventDefault(); onEdit(shortcut); }}
      >
        <ShortcutIcon shortcut={shortcut} size={iconSize} />
        <span className="max-w-full truncate text-sm">{shortcut.name}</span>
        <span className="absolute right-2 top-2 hidden rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/70 group-hover:block">
          szerkesztés
        </span>
      </button>
    </div>
  );
}
