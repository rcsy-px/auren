export type CalendarSourceType = "ical" | "caldav";

export type CalendarSourceStatus = {
  configured: boolean;
  scope?: CalendarSourceScope;
  type?: CalendarSourceType;
  name?: string;
  url?: string;
  username?: string;
  hasPassword?: boolean;
};

export type CalendarSourceScope = "global" | "profile";

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location?: string;
  source?: string;
};

export type CalendarPayload = {
  provider: "iCal" | "CalDAV";
  updatedAt: string;
  cached?: boolean;
  range: {
    start: string;
    end: string;
  };
  events: CalendarEvent[];
};

type CalendarScopeOptions = {
  scope?: CalendarSourceScope;
  profileId?: string;
};

function appendScopeParams(params: URLSearchParams, options?: CalendarScopeOptions) {
  if (options?.scope) params.set("scope", options.scope);
  if (options?.profileId) params.set("profileId", options.profileId);
}

export async function fetchCalendar(options?: { daysAhead?: number; maxEvents?: number; signal?: AbortSignal } & CalendarScopeOptions) {
  const params = new URLSearchParams();
  if (options?.daysAhead) params.set("days", String(options.daysAhead));
  if (options?.maxEvents) params.set("limit", String(options.maxEvents));
  appendScopeParams(params, options);
  const query = params.toString();
  const response = await fetch(`/api/calendar${query ? `?${query}` : ""}`, { signal: options?.signal });
  if (response.status === 204) return null;
  if (!response.ok) throw new Error("Calendar request failed");
  return (await response.json()) as CalendarPayload;
}

export async function fetchCalendarSourceStatus(options?: CalendarScopeOptions & { signal?: AbortSignal }) {
  const params = new URLSearchParams();
  appendScopeParams(params, options);
  const query = params.toString();
  const response = await fetch(`/api/calendar/source${query ? `?${query}` : ""}`, { signal: options?.signal });
  if (!response.ok) throw new Error("Calendar source status request failed");
  return (await response.json()) as CalendarSourceStatus;
}

export async function saveCalendarSource(source: {
  type: CalendarSourceType;
  name: string;
  url: string;
  username?: string;
  password?: string;
}, options?: CalendarScopeOptions) {
  const params = new URLSearchParams();
  appendScopeParams(params, options);
  const query = params.toString();
  const response = await fetch(`/api/calendar/source${query ? `?${query}` : ""}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(source),
  });
  if (!response.ok) throw new Error("Calendar source save failed");
  return (await response.json()) as CalendarSourceStatus;
}
