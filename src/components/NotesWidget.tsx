import { FileText } from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore";
import { WidgetCard } from "./WidgetCard";

export function NotesWidget() {
  const note = useDashboardStore((state) => state.note);
  const setNote = useDashboardStore((state) => state.setNote);

  return (
    <WidgetCard title="Jegyzet" icon={<FileText size={18} />}>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Új jegyzet"
        className="h-28 w-full resize-none bg-transparent text-sm leading-6 text-slate-100/90 outline-none placeholder:text-slate-300/45"
      />
    </WidgetCard>
  );
}
