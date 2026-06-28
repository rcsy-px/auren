import { CalendarDays, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCalendar, type CalendarPayload } from "../lib/calendar";
import { useDashboardStore } from "../store/dashboardStore";
import { WidgetCard } from "./WidgetCard";

export function CalendarWidget() {
  const calendarSettings = useDashboardStore((state) => state.settings.calendar);
  const activeProfileId = useDashboardStore((state) => state.activeProfileId);
  const [calendar, setCalendar] = useState<CalendarPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCalendar() {
      try {
        setLoading(true);
        setError(false);
        const data = await fetchCalendar({
          daysAhead: calendarSettings.daysAhead,
          maxEvents: calendarSettings.maxEvents,
          scope: calendarSettings.sourceScope,
          profileId: activeProfileId,
          signal: controller.signal,
        });
        setCalendar(data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCalendar();
    return () => controller.abort();
  }, [activeProfileId, calendarSettings.daysAhead, calendarSettings.maxEvents, calendarSettings.sourceScope]);

  const events = calendar?.events ?? [];

  return (
    <WidgetCard title="Naptár" icon={<CalendarDays size={18} />}>
      <div className="space-y-4 text-sm">
        {loading && <p className="text-slate-300/62">Naptár betöltése...</p>}
        {!loading && error && <p className="text-rose-200/78">A naptár nem olvasható.</p>}
        {!loading && !error && !calendar && <p className="text-slate-300/62">Nincs naptár beállítva.</p>}
        {!loading && !error && calendar && events.length === 0 && <p className="text-slate-300/62">Nincs közelgő esemény.</p>}
        {events.map((event) => (
          <div key={event.id} className="grid grid-cols-[76px_1fr] gap-3">
            <span className="min-w-0">
              <span className="block text-white">{formatEventDate(event.startsAt)}</span>
              <span className="mt-0.5 block truncate text-xs text-slate-300/58">{formatEventTime(event.startsAt, event.allDay)}</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-slate-100/88">{event.title}</span>
              {calendarSettings.showLocation && event.location && (
                <span className="mt-1 flex min-w-0 items-center gap-1 text-xs text-slate-300/55">
                  <MapPin size={12} />
                  <span className="truncate">{event.location}</span>
                </span>
              )}
              {calendarSettings.showSource && event.source && (
                <span className="mt-1 block truncate text-xs text-slate-300/45">{event.source}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function formatEventDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) return "Ma";
  if (isSameDay(date, tomorrow)) return "Holnap";

  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatEventTime(value: string, allDay: boolean) {
  if (allDay) return "Egész nap";
  return new Intl.DateTimeFormat("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}
