import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useDashboardStore } from "../store/dashboardStore";
import type { WidgetKey } from "../types/dashboard";
import { CalendarWidget } from "./CalendarWidget";
import { NotesWidget } from "./NotesWidget";
import { TodoWidget } from "./TodoWidget";

const widgets: Record<WidgetKey, ReactNode> = {
  calendar: <CalendarWidget />,
  todos: <TodoWidget />,
  notes: <NotesWidget />,
};

export function DashboardWidgets() {
  const layout = useDashboardStore((state) => state.layout);
  const visible = useDashboardStore((state) => state.settings.widgets);
  const reorderWidgets = useDashboardStore((state) => state.reorderWidgets);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const ordered = useMemo(
    () => layout.widgetOrder.filter((key) => visible[key]),
    [layout.widgetOrder, visible],
  );

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = ordered.findIndex((key) => key === event.active.id);
    const newIndex = ordered.findIndex((key) => key === event.over?.id);
    const visibleOrder = arrayMove(ordered, oldIndex, newIndex);
    const hiddenOrder = layout.widgetOrder.filter((key) => !visibleOrder.includes(key));
    reorderWidgets([...visibleOrder, ...hiddenOrder]);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ordered} strategy={rectSortingStrategy}>
        <div className="widget-grid">
          {ordered.map((key) => (
            <SortableWidget key={key} id={key}>
              {widgets[key]}
            </SortableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableWidget({ id, children }: { id: WidgetKey; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="widget-sortable"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
