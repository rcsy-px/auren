import { CalendarDays } from "lucide-react";
import { WidgetCard } from "./WidgetCard";

const events = [
  { time: "11:00", title: "Csapatmegbeszélés" },
  { time: "13:30", title: "Projekt státusz" },
];

export function CalendarWidget() {
  return (
    <WidgetCard title="Naptár" icon={<CalendarDays size={18} />}>
      <div className="space-y-4 text-sm">
        {events.map((event) => (
          <div key={event.time} className="grid grid-cols-[54px_1fr] gap-2">
            <span className="text-white">{event.time}</span>
            <span className="text-slate-100/88">{event.title}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
