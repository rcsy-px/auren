import { CalendarDays, RefreshCw, Settings2, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchCalendar, type CalendarPayload, type CalendarEvent } from "../lib/calendar";
import { useDashboardStore } from "../store/dashboardStore";

type Props = {
  onOpenSettings: () => void;
};

export function CalendarAgendaView({ onOpenSettings }: Props) {
  const calendarSettings = useDashboardStore((state) => state.settings.calendar);
  const activeProfileId = useDashboardStore((state) => state.activeProfileId);
  const [calendar, setCalendar] = useState<CalendarPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [activeProfileId, calendarSettings.daysAhead, calendarSettings.maxEvents, calendarSettings.sourceScope, refreshKey]);

  const groups = useMemo(() => groupEventsByDay(calendar?.events ?? []), [calendar?.events]);

  return (
    <div className="agenda-shell glass">
      <header className="agenda-toolbar">
        <div>
          <div className="settings-kicker">Calendar sync</div>
          <p>
            {calendar
              ? `${calendar.events.length} esemény · ${calendar.provider}${calendar.cached ? " · cache" : ""}`
              : loading
                ? "Naptár betöltése"
                : "Nincs aktív naptár"}
          </p>
          {calendar?.updatedAt && <span>Utoljára frissítve: {formatDateTime(calendar.updatedAt)}</span>}
        </div>
        <div className="agenda-actions">
          <button className="ghost-button" type="button" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>
            <RefreshCw size={17} /> Frissítés
          </button>
          <button className="ghost-button" type="button" onClick={onOpenSettings}>
            <Settings2 size={17} /> Beállítások
          </button>
        </div>
      </header>

      {loading && <p className="empty-state">Naptár betöltése...</p>}
      {!loading && error && <p className="empty-state is-error">A naptár nem olvasható. Ellenőrizd a forrást és a jogosultságot.</p>}
      {!loading && !error && !calendar && <p className="empty-state">Nincs naptárforrás beállítva.</p>}
      {!loading && !error && calendar && calendar.events.length === 0 && <p className="empty-state">Nincs esemény a kiválasztott időablakban.</p>}

      <div className="agenda-list">
        {groups.map((group) => (
          <section key={group.key} className="agenda-day">
            <header>
              <CalendarDays size={17} />
              <span>{group.label}</span>
            </header>
            <div className="agenda-events">
              {group.events.map((event) => (
                <article key={event.id} className="agenda-event">
                  <time>{formatEventTime(event)}</time>
                  <div className="min-w-0">
                    <h3>{event.title}</h3>
                    {(calendarSettings.showLocation && event.location) || (calendarSettings.showSource && event.source) ? (
                      <p>
                        {calendarSettings.showLocation && event.location && <><MapPin size={12} /> {event.location}</>}
                        {calendarSettings.showSource && event.source && <span>{event.source}</span>}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function groupEventsByDay(events: CalendarEvent[]) {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = new Date(event.startsAt).toISOString().slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    label: formatEventDay(items[0].startsAt),
    events: items,
  }));
}

function formatEventDay(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function formatEventTime(event: CalendarEvent) {
  if (event.allDay) return "Egész nap";
  return new Intl.DateTimeFormat("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(event.startsAt));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
