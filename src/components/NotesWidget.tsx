import { FileText } from "lucide-react";
import { useI18n } from "../i18n";
import { useDashboardStore } from "../store/dashboardStore";
import { WidgetCard } from "./WidgetCard";

export function NotesWidget() {
  const note = useDashboardStore((state) => state.note);
  const setNote = useDashboardStore((state) => state.setNote);
  const { t } = useI18n();

  return (
    <WidgetCard title={t("notes.widgetTitle")} icon={<FileText size={18} />}>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("notes.placeholder")} className="h-28 w-full resize-none bg-transparent text-sm leading-6 text-slate-100/90 outline-none placeholder:text-slate-300/45" />
    </WidgetCard>
  );
}
