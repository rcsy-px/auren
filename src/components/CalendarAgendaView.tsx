import { CalendarDays, MapPin, RefreshCw, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { fetchCalendar, type CalendarEvent, type CalendarPayload } from "../lib/calendar";
import { useDashboardStore } from "../store/dashboardStore";

type Props = { onOpenSettings: () => void };

type TFn = (key: string, params?: Record<string, string | number>) => string;

export function CalendarAgendaView({ onOpenSettings }: Props) {
  const calendarSettings = useDashboardStore((state) => state.settings.calendar);
  const activeProfileId = useDashboardStore((state) => state.activeProfileId);
  const { t, dateLocale } = useI18n();
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
        const data = await fetchCalendar({ daysAhead: calendarSettings.daysAhead, maxEvents: calendarSettings.maxEvents, scope: calendarSettings.sourceScope, profileId: activeProfileId, signal: controller.signal });
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

  const groups = useMemo(() => groupEventsByDay(calendar?.events ?? [], dateLocale), [calendar?.events, dateLocale]);

  return (
    <div className="agenda-shell glass">
      <header className="agenda-toolbar">
        <div>
          <div className="settings-kicker">{t("calendar.sync")}</div>
          <p>{calendar ? `${t("calendar.events", { count: calendar.events.length })} · ${calendar.provider}${calendar.cached ? " · cache" : ""}` : loading ? t("calendar.loading") : t("calendar.noActive")}</p>
          {calendar?.updatedAt && <span>{t("calendar.updatedAt", { value: formatDateTime(calendar.updatedAt, dateLocale) })}</span>}
        </div>
        <div className="agenda-actions">
          <button className="ghost-button" type="button" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}><RefreshCw size={17} /> {t("common.refresh")}</button>
          <button className="ghost-button" type="button" onClick={onOpenSettings}><Settings2 size={17} /> {t("common.settings")}</button>
        </div>
      </header>

      {loading && <p className="empty-state">{t("calendar.loadingDots")}</p>}
      {!loading && error && <p className="empty-state is-error">{t("calendar.readErrorLong")}</p>}
      {!loading && !error && !calendar && <p className="empty-state">{t("calendar.noSource")}</p>}
      {!loading && !error && calendar && calendar.events.length === 0 && <p className="empty-state">{t("calendar.noEventsInWindow")}</p>}

      <div className="agenda-list">
        {groups.map((group) => (
          <section key={group.key} className="agenda-day">
            <header><CalendarDays size={17} /><span>{group.label}</span></header>
            <div className="agenda-events">
              {group.events.map((event) => (
                <article key={event.id} className="agenda-event">
                  <time>{formatEventTime(event, dateLocale, t)}</time>
                  <div className="min-w-0">
                    <h3>{event.title}</h3>
                    {(calendarSettings.showLocation && event.location) || (calendarSettings.showSource && event.source) ? <p>{calendarSettings.showLocation && event.location && <><MapPin size={12} /> {event.location}</>}{calendarSettings.showSource && event.source && <span>{event.source}</span>}</p> : null}
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

function groupEventsByDay(events: CalendarEvent[], locale: string) {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = new Date(event.startsAt).toISOString().slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()].map(([key, items]) => ({ key, label: formatEventDay(items[0].startsAt, locale), events: items }));
}

function formatEventDay(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" }).format(new Date(value));
}

function formatEventTime(event: CalendarEvent, locale: string, t: TFn) {
  if (event.allDay) return t("calendar.allDay");
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(event.startsAt));
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
