import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare, GripVertical, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { useDashboardStore } from "../store/dashboardStore";
import type { Todo } from "../types/dashboard";
import { WidgetCard } from "./WidgetCard";

export function TodoWidget() {
  const todos = useDashboardStore((state) => state.todos);
  const addTodo = useDashboardStore((state) => state.addTodo);
  const reorderTodos = useDashboardStore((state) => state.reorderTodos);
  const { t } = useI18n();
  const [text, setText] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const sorted = useMemo(() => [...todos].sort((a, b) => a.order - b.order), [todos]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    addTodo(text.trim());
    setText("");
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = sorted.findIndex((todo) => todo.id === event.active.id);
    const newIndex = sorted.findIndex((todo) => todo.id === event.over?.id);
    reorderTodos(arrayMove(sorted, oldIndex, newIndex).map((todo) => todo.id));
  }

  return (
    <WidgetCard title={t("todos.title")} icon={<CheckSquare size={18} />}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">{sorted.map((todo) => <TodoRow key={todo.id} todo={todo} />)}</div>
        </SortableContext>
      </DndContext>
      <form onSubmit={handleSubmit} className="mt-4 border-t border-white/8 pt-4">
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder={t("todos.addPlaceholder")} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-300/45" />
      </form>
    </WidgetCard>
  );
}

function TodoRow({ todo }: { todo: Todo }) {
  const toggleTodo = useDashboardStore((state) => state.toggleTodo);
  const deleteTodo = useDashboardStore((state) => state.deleteTodo);
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: todo.id });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 text-sm">
      <button type="button" className={`h-4 w-4 rounded border ${todo.completed ? "border-sky-300 bg-sky-300" : "border-slate-300/55"}`} onClick={() => toggleTodo(todo.id)} title={t("todos.done")} />
      <span className={`min-w-0 flex-1 truncate ${todo.completed ? "text-slate-300/55 line-through" : "text-slate-100/88"}`}>{todo.text}</span>
      <button type="button" className="text-slate-300/45 hover:text-white" title={t("todos.reorder")} {...attributes} {...listeners}><GripVertical size={15} /></button>
      <button type="button" className="text-slate-300/45 hover:text-red-200" title={t("common.delete")} onClick={() => deleteTodo(todo.id)}><Trash2 size={15} /></button>
    </div>
  );
}
