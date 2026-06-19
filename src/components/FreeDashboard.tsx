import { Grip, MoveDiagonal2 } from "lucide-react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { defaultLayout, useDashboardStore } from "../store/dashboardStore";
import type { FreeItemPosition, Shortcut, WidgetKey } from "../types/dashboard";
import { normalizeShortcutUrl } from "../lib/url";
import { CalendarWidget } from "./CalendarWidget";
import { ClockWeather } from "./ClockWeather";
import { NotesWidget } from "./NotesWidget";
import { SearchBar } from "./SearchBar";
import { ShortcutEditorModal } from "./ShortcutEditorModal";
import { ShortcutIcon } from "./ShortcutIcon";
import { TodoWidget } from "./TodoWidget";

const widgetComponents: Record<WidgetKey, ReactNode> = {
  calendar: <CalendarWidget />,
  todos: <TodoWidget />,
  notes: <NotesWidget />,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const GRID_COLUMNS = 24;
const GRID_ROWS = 24;
const SNAP_X = 100 / GRID_COLUMNS;
const SNAP_Y = 100 / GRID_ROWS;

const snap = (value: number, unit: number) => Math.round(value / unit) * unit;
const roundCoord = (value: number) => Number(value.toFixed(4));
type ShortcutFormState = Omit<Shortcut, "id" | "order">;

export function FreeDashboard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const storedShortcuts = useDashboardStore((state) => state.shortcuts);
  const settings = useDashboardStore((state) => state.settings);
  const layout = useDashboardStore((state) => state.layout ?? defaultLayout);
  const addShortcut = useDashboardStore((state) => state.addShortcut);
  const updateShortcut = useDashboardStore((state) => state.updateShortcut);
  const deleteShortcut = useDashboardStore((state) => state.deleteShortcut);
  const updateFreeItemPosition = useDashboardStore((state) => state.updateFreeItemPosition);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const shortcuts = useMemo(
    () => [...storedShortcuts].sort((a, b) => a.order - b.order),
    [storedShortcuts],
  );
  const visibleWidgets = useMemo(
    () => (layout.widgetOrder ?? defaultLayout.widgetOrder).filter((key) => settings.widgets[key]),
    [layout.widgetOrder, settings.widgets],
  );

  const systemDefaults = [
    {
      id: "system:hero",
      position: gridPosition(8, 2, 8, 3),
      content: (
        <header className="dashboard-hero free-hero">
          <h1 className="hero-title">{settings.greeting}</h1>
          <p className="hero-subtitle">Fókuszálj a fontos dolgokra.</p>
        </header>
      ),
    },
    {
      id: "system:search",
      position: gridPosition(7, 6, 10, 1.5),
      content: <SearchBar />,
    },
    {
      id: "system:clock",
      position: gridPosition(19, 1, 4, 3),
      content: <ClockWeather inline />,
    },
    {
      id: "system:quote",
      position: gridPosition(8, 21, 8, 1),
      content: <p className="dashboard-quote free-quote">„A figyelem a legértékesebb valuta.” - James Clear</p>,
    },
  ];
  const shortcutDefaults = shortcuts.map((shortcut, index) => ({
    id: `shortcut:${shortcut.id}`,
    position: defaultShortcutPosition(index),
    content: <FreeShortcut shortcut={shortcut} onEdit={setEditingShortcut} />,
  }));
  const widgetDefaults = visibleWidgets.map((key, index) => ({
    id: `widget:${key}`,
    position: defaultWidgetPosition(index),
    content: widgetComponents[key],
  }));

  return (
    <>
      <div ref={boardRef} className="free-board">
        {[...systemDefaults, ...shortcutDefaults, ...widgetDefaults].map((item) => (
          <FreeItem
            key={item.id}
            boardRef={boardRef}
            compact={item.id.startsWith("shortcut:")}
            stretch={item.id.startsWith("widget:")}
            resizable={item.id.startsWith("widget:")}
            position={(layout.freeItems ?? defaultLayout.freeItems)[item.id] ?? item.position}
            onMove={(position) => updateFreeItemPosition(item.id, position)}
          >
            {item.content}
          </FreeItem>
        ))}
      </div>
      {editingShortcut && (
        <ShortcutEditorModal
          shortcut={editingShortcut}
          onClose={() => setEditingShortcut(null)}
          onSave={(shortcut: ShortcutFormState, id?: string) => {
            if (id) updateShortcut(id, shortcut);
            else addShortcut(shortcut);
            setEditingShortcut(null);
          }}
          onDelete={(id) => {
            deleteShortcut(id);
            setEditingShortcut(null);
          }}
        />
      )}
    </>
  );
}

function FreeShortcut({ shortcut, onEdit }: { shortcut: Shortcut; onEdit: (shortcut: Shortcut) => void }) {
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
    <button
      type="button"
      className="shortcut-card free-shortcut-card"
      onClick={openShortcut}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(event) => event.preventDefault()}
      onDoubleClick={(event) => { event.preventDefault(); onEdit(shortcut); }}
    >
      <ShortcutIcon shortcut={shortcut} size={iconSize} />
      <span className="max-w-full truncate text-sm">{shortcut.name}</span>
    </button>
  );
}

function FreeItem({
  boardRef,
  position,
  onMove,
  children,
  compact = false,
  resizable = true,
  stretch = false,
}: {
  boardRef: React.RefObject<HTMLDivElement | null>;
  position: FreeItemPosition;
  onMove: (position: FreeItemPosition) => void;
  children: ReactNode;
  compact?: boolean;
  resizable?: boolean;
  stretch?: boolean;
}) {
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const itemRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number; mode: "move" | "resize" } | null>(null);
  const isMoving = startRef.current?.mode === "move";
  const isResizing = startRef.current?.mode === "resize";

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, mode: "move" | "resize") {
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = { x: event.clientX, y: event.clientY, mode };
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!startRef.current) return;
    setDelta({ x: event.clientX - startRef.current.x, y: event.clientY - startRef.current.y });
  }

  function handlePointerUp() {
    const rect = boardRef.current?.getBoundingClientRect();
    if (rect && startRef.current) {
      const itemRect = itemRef.current?.getBoundingClientRect();
      const compactWidth = itemRect ? (itemRect.width / rect.width) * 100 : position.w;
      const compactHeight = itemRect ? (itemRect.height / rect.height) * 100 : position.h;
      const maxX = 100 - (compact ? compactWidth : position.w);
      const maxY = 100 - (compact ? compactHeight : position.h);
      const dx = (delta.x / rect.width) * 100;
      const dy = (delta.y / rect.height) * 100;
      const next =
        startRef.current.mode === "resize"
          ? {
              ...position,
              w: roundCoord(clamp(snap(position.w + dx, SNAP_X), SNAP_X * 3, 100 - position.x)),
              h: roundCoord(clamp(snap(position.h + dy, SNAP_Y), SNAP_Y * 3, 100 - position.y)),
            }
          : {
              ...position,
              x: roundCoord(clamp(snap(position.x + dx, SNAP_X), 0, maxX)),
              y: roundCoord(clamp(snap(position.y + dy, SNAP_Y), 0, maxY)),
            };
      onMove(next);
    }
    startRef.current = null;
    setDelta({ x: 0, y: 0 });
  }

  return (
    <div
      ref={itemRef}
      className={`free-item ${compact ? "free-item-compact" : ""} ${stretch ? "free-item-stretch" : ""}`}
      style={
        {
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: compact ? undefined : `calc(${position.w}% + ${isResizing ? Math.max(0, delta.x) : 0}px)`,
          height: compact ? undefined : `calc(${position.h}% + ${isResizing ? Math.max(0, delta.y) : 0}px)`,
          transform: isMoving ? `translate(${delta.x}px, ${delta.y}px)` : undefined,
        } as CSSProperties
      }
    >
      <button
        className="free-drag-handle"
        type="button"
        title="Mozgatás"
        onPointerDown={(event) => handlePointerDown(event, "move")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <Grip size={14} />
      </button>
      {children}
      {resizable && (
        <button
          className="free-resize-handle"
          type="button"
          title="Átméretezés"
          onPointerDown={(event) => handlePointerDown(event, "resize")}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <MoveDiagonal2 size={14} />
        </button>
      )}
    </div>
  );
}

function defaultShortcutPosition(index: number): FreeItemPosition {
  const firstRowCount = 6;
  const isFirstRow = index < firstRowCount;
  const rowIndex = isFirstRow ? index : index - firstRowCount;
  const rowCount = isFirstRow ? firstRowCount : 6;
  const startCol = Math.floor((GRID_COLUMNS - rowCount * 2) / 2);
  return gridPosition(startCol + rowIndex * 2, isFirstRow ? 9 : 12, 2, 2.5);
}

function defaultWidgetPosition(index: number): FreeItemPosition {
  return gridPosition(4 + index * 6, 16, 5.5, 4.8);
}

function gridPosition(col: number, row: number, width: number, height: number): FreeItemPosition {
  return {
    x: col * SNAP_X,
    y: row * SNAP_Y,
    w: width * SNAP_X,
    h: height * SNAP_Y,
  };
}
