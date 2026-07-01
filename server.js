import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 8080);
const distDir = path.join(__dirname, "dist");
const dataDir = process.env.AUREN_DATA_DIR
  ? path.resolve(process.env.AUREN_DATA_DIR)
  : path.join(__dirname, "data");
const dashboardFile = path.join(dataDir, "dashboard.json");
const packageJsonFile = path.join(__dirname, "package.json");
const weatherKeyFile = path.join(dataDir, "weather-key.json");
const calendarSourceFile = path.join(dataDir, "calendar-source.json");
const weatherCache = new Map();
const calendarCache = new Map();
let versionCache = null;
let packageVersionCache = null;
const WEATHER_CACHE_TTL = 10 * 60 * 1000;
const CALENDAR_CACHE_TTL = 10 * 60 * 1000;
const VERSION_CACHE_TTL = 60 * 60 * 1000;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (url.pathname === "/api/dashboard") {
      await handleDashboardApi(request, response);
      return;
    }

    if (url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, version: await getInstalledVersion() });
      return;
    }

    if (url.pathname === "/api/version") {
      await handleVersionApi(response);
      return;
    }

    if (url.pathname === "/api/weather") {
      await handleWeatherApi(url, response);
      return;
    }

    if (url.pathname === "/api/weather/key") {
      await handleWeatherKeyApi(request, response);
      return;
    }

    if (url.pathname === "/api/calendar") {
      await handleCalendarApi(url, response);
      return;
    }

    if (url.pathname === "/api/calendar/source") {
      await handleCalendarSourceApi(request, response);
      return;
    }

    await serveStaticFile(url.pathname, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Internal server error" });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Auren server listening on http://0.0.0.0:${port}`);
});

async function handleDashboardApi(request, response) {
  if (request.method === "GET") {
    try {
      const raw = await readFile(dashboardFile, "utf8");
      sendJson(response, 200, { available: true, snapshot: JSON.parse(raw) });
    } catch (error) {
      if (error?.code === "ENOENT") {
        sendJson(response, 200, { available: false });
        return;
      }

      throw error;
    }
    return;
  }

  if (request.method === "PUT") {
    const body = await readRequestBody(request);
    const snapshot = JSON.parse(body);
    if (!Array.isArray(snapshot?.profiles) || typeof snapshot?.activeProfileId !== "string") {
      sendJson(response, 400, { error: "Invalid dashboard snapshot" });
      return;
    }

    await mkdir(dataDir, { recursive: true });
    const tmpFile = `${dashboardFile}.tmp`;
    await writeFile(tmpFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    await rename(tmpFile, dashboardFile);
    sendJson(response, 200, { ok: true });
    return;
  }

  response.writeHead(405, { Allow: "GET, PUT" });
  response.end();
}

async function handleWeatherApi(url, response) {
  const weatherApiKey = await getWeatherApiKey();
  if (!weatherApiKey) {
    response.writeHead(204);
    response.end();
    return;
  }

  const location = (url.searchParams.get("location") ?? "Budapest").trim() || "Budapest";
  const cacheKey = location.toLowerCase();
  const cached = getCachedValue(weatherCache, cacheKey, WEATHER_CACHE_TTL);
  if (cached) {
    sendJson(response, 200, { ...cached, cached: true });
    return;
  }

  const weatherUrl = new URL("https://api.weatherapi.com/v1/forecast.json");
  weatherUrl.searchParams.set("key", weatherApiKey);
  weatherUrl.searchParams.set("q", location);
  weatherUrl.searchParams.set("days", "1");
  weatherUrl.searchParams.set("aqi", "no");
  weatherUrl.searchParams.set("alerts", "no");
  weatherUrl.searchParams.set("lang", "hu");

  const weatherResponse = await fetch(weatherUrl);
  if (!weatherResponse.ok) {
    sendJson(response, 502, { error: "Weather provider unavailable" });
    return;
  }

  const weather = await weatherResponse.json();
  const payload = normalizeWeatherApiResponse(weather);
  weatherCache.set(cacheKey, { value: payload, savedAt: Date.now() });
  sendJson(response, 200, payload);
}

async function handleWeatherKeyApi(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, {
      configured: Boolean(await getWeatherApiKey()),
      source: process.env.WEATHERAPI_KEY?.trim() ? "environment" : "settings",
    });
    return;
  }

  if (request.method === "PUT") {
    if (process.env.WEATHERAPI_KEY?.trim()) {
      sendJson(response, 409, { error: "Weather API key is managed by environment" });
      return;
    }

    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const key = String(payload.key ?? "").trim();

    if (!key) {
      await rm(weatherKeyFile, { force: true });
      weatherCache.clear();
      sendJson(response, 200, { configured: false });
      return;
    }

    await mkdir(dataDir, { recursive: true });
    const tmpFile = `${weatherKeyFile}.tmp`;
    await writeFile(tmpFile, `${JSON.stringify({ key }, null, 2)}\n`, "utf8");
    await rename(tmpFile, weatherKeyFile);
    weatherCache.clear();
    sendJson(response, 200, { configured: true });
    return;
  }

  response.writeHead(405, { Allow: "GET, PUT" });
  response.end();
}

async function handleVersionApi(response) {
  sendJson(response, 200, await getVersionInfo());
}
async function getInstalledVersion() {
  const envVersion = process.env.AUREN_VERSION?.trim();
  if (envVersion) return normalizeVersion(envVersion);

  if (packageVersionCache) return packageVersionCache;

  try {
    const packageJson = JSON.parse(await readFile(packageJsonFile, "utf8"));
    packageVersionCache = normalizeVersion(packageJson.version ?? "dev");
  } catch {
    packageVersionCache = "dev";
  }

  return packageVersionCache;
}
async function getVersionInfo() {
  const version = await getInstalledVersion();
  const baseInfo = {
    version,
    updateAvailable: false,
  };

  if (!isUpdateCheckEnabled() || isFloatingVersion(version)) return baseInfo;

  const now = Date.now();
  if (versionCache && now - versionCache.savedAt < VERSION_CACHE_TTL) {
    return versionCache.value;
  }

  try {
    const latest = await fetchLatestVersion();
    const value = {
      ...baseInfo,
      latestVersion: latest.version,
      latestUrl: latest.url,
      updateAvailable: isVersionGreater(latest.version, version),
      checkedAt: new Date().toISOString(),
    };
    versionCache = { value, savedAt: now };
    return value;
  } catch (error) {
    const value = {
      ...baseInfo,
      checkedAt: new Date().toISOString(),
      error: "Update check unavailable",
    };
    versionCache = { value, savedAt: now };
    return value;
  }
}

function isUpdateCheckEnabled() {
  return process.env.AUREN_UPDATE_CHECK !== "false";
}

function isFloatingVersion(version) {
  return ["dev", "local", "latest", "main"].includes(version);
}

async function fetchLatestVersion() {
  const repo = process.env.AUREN_RELEASE_REPO || "rcsy-px/auren";
  const releaseResponse = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "auren-dashboard",
    },
  });

  if (releaseResponse.ok) {
    const release = await releaseResponse.json();
    return {
      version: normalizeVersion(release.tag_name ?? ""),
      url: release.html_url,
    };
  }

  const tagsResponse = await fetch(`https://api.github.com/repos/${repo}/tags?per_page=20`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "auren-dashboard",
    },
  });
  if (!tagsResponse.ok) throw new Error("GitHub version lookup failed");
  const tags = await tagsResponse.json();
  const tag = tags
    .filter((item) => parseVersion(item.name))
    .sort((left, right) => compareVersions(right.name, left.name))[0];
  if (!tag) throw new Error("No version tags found");
  return {
    version: normalizeVersion(tag.name),
    url: `https://github.com/${repo}/releases/tag/${tag.name}`,
  };
}

function normalizeVersion(version) {
  return String(version || "dev").trim().replace(/^v/i, "");
}

function parseVersion(version) {
  const match = normalizeVersion(version).match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isVersionGreater(candidate, current) {
  return compareVersions(candidate, current) > 0;
}

function compareVersions(candidate, current) {
  const left = parseVersion(candidate);
  const right = parseVersion(current);
  if (!left || !right) return 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] > right[index]) return 1;
    if (left[index] < right[index]) return -1;
  }
  return 0;
}

async function handleCalendarApi(url, response) {
  const sourceRequest = getCalendarSourceRequest(url);
  const source = await getCalendarSource(sourceRequest);
  if (!source) {
    response.writeHead(204);
    response.end();
    return;
  }

  const days = clampNumber(Number(url.searchParams.get("days") ?? 14), 1, 90);
  const limit = clampNumber(Number(url.searchParams.get("limit") ?? 8), 1, 50);
  const now = new Date();
  const rangeEnd = new Date(now);
  rangeEnd.setDate(rangeEnd.getDate() + days);
  const cacheKey = `${sourceRequest.scope}:${sourceRequest.profileId ?? "global"}:${source.type}:${source.url}:${now.toISOString().slice(0, 10)}:${days}:${limit}`;
  const cached = getCachedValue(calendarCache, cacheKey, CALENDAR_CACHE_TTL);
  if (cached) {
    sendJson(response, 200, { ...cached, cached: true });
    return;
  }

  const ics = source.type === "caldav"
    ? await fetchCalDavCalendar(source, now, rangeEnd)
    : await fetchICalFeed(source.url);
  const events = parseICalendarEvents(ics, now, rangeEnd)
    .slice(0, limit)
    .map((event) => ({
      ...event,
      source: source.name || (source.type === "caldav" ? "CalDAV" : "iCal"),
    }));
  const payload = {
    provider: source.type === "caldav" ? "CalDAV" : "iCal",
    updatedAt: new Date().toISOString(),
    range: { start: now.toISOString(), end: rangeEnd.toISOString() },
    events,
  };
  calendarCache.set(cacheKey, { value: payload, savedAt: Date.now() });
  sendJson(response, 200, payload);
}

async function handleCalendarSourceApi(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const sourceRequest = getCalendarSourceRequest(url);

  if (request.method === "GET") {
    const source = await getCalendarSource(sourceRequest);
    sendJson(response, 200, source ? redactCalendarSource(source, sourceRequest.scope) : { configured: false, scope: sourceRequest.scope });
    return;
  }

  if (request.method === "PUT") {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const type = payload.type === "caldav" ? "caldav" : "ical";
    const sourceUrl = String(payload.url ?? "").trim();

    if (!sourceUrl) {
      await saveCalendarSourceForRequest(sourceRequest, null);
      calendarCache.clear();
      sendJson(response, 200, { configured: false, scope: sourceRequest.scope });
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      sendJson(response, 400, { error: "Invalid calendar URL" });
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      sendJson(response, 400, { error: "Calendar URL must use http or https" });
      return;
    }

    const existingSource = await getCalendarSource(sourceRequest);
    const source = {
      type,
      name: String(payload.name ?? "").trim(),
      url: sourceUrl,
      username: type === "caldav" ? String(payload.username ?? "").trim() : "",
      password: type === "caldav" ? String(payload.password ?? "").trim() : "",
    };
    if (type === "caldav" && !source.password && existingSource?.type === "caldav" && existingSource.url === source.url) {
      source.password = existingSource.password ?? "";
    }

    if (type === "caldav" && (!source.username || !source.password)) {
      sendJson(response, 400, { error: "CalDAV username and password are required" });
      return;
    }

    await saveCalendarSourceForRequest(sourceRequest, source);
    calendarCache.clear();
    sendJson(response, 200, redactCalendarSource(source, sourceRequest.scope));
    return;
  }

  response.writeHead(405, { Allow: "GET, PUT" });
  response.end();
}

function getCalendarSourceRequest(url) {
  const scope = url.searchParams.get("scope") === "profile" ? "profile" : "global";
  const profileId = String(url.searchParams.get("profileId") ?? "").trim();
  return {
    scope,
    profileId: scope === "profile" ? profileId : "",
  };
}

async function getCalendarSourcesConfig() {
  try {
    const raw = await readFile(calendarSourceFile, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed?.sourcesByProfileId || parsed?.global) {
      return {
        global: parsed.global?.url && parsed.global?.type ? parsed.global : null,
        sourcesByProfileId: parsed.sourcesByProfileId ?? {},
      };
    }

    if (parsed?.url && parsed?.type) {
      return { global: parsed, sourcesByProfileId: {} };
    }

    return { global: null, sourcesByProfileId: {} };
  } catch (error) {
    if (error?.code === "ENOENT") return { global: null, sourcesByProfileId: {} };
    throw error;
  }
}

async function getCalendarSource(sourceRequest) {
  const config = await getCalendarSourcesConfig();
  if (sourceRequest.scope === "profile") {
    if (!sourceRequest.profileId) return null;
    const source = config.sourcesByProfileId[sourceRequest.profileId];
    return source?.url && source?.type ? source : null;
  }

  return config.global?.url && config.global?.type ? config.global : null;
}

async function saveCalendarSourceForRequest(sourceRequest, source) {
  const config = await getCalendarSourcesConfig();
  if (sourceRequest.scope === "profile") {
    if (!sourceRequest.profileId) throw new Error("Profile calendar source requires profileId");
    if (source) config.sourcesByProfileId[sourceRequest.profileId] = source;
    else delete config.sourcesByProfileId[sourceRequest.profileId];
  } else {
    config.global = source;
  }

  await mkdir(dataDir, { recursive: true });
  const tmpFile = `${calendarSourceFile}.tmp`;
  await writeFile(tmpFile, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  await rename(tmpFile, calendarSourceFile);
}

function redactCalendarSource(source, scope) {
  return {
    configured: true,
    scope,
    type: source.type,
    name: source.name ?? "",
    url: source.url ?? "",
    username: source.type === "caldav" ? source.username ?? "" : "",
    hasPassword: Boolean(source.password),
  };
}

async function fetchICalFeed(url) {
  const calendarResponse = await fetch(url, {
    headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.8" },
  });
  if (!calendarResponse.ok) throw new Error("Calendar feed unavailable");
  return await calendarResponse.text();
}

async function fetchCalDavCalendar(source, start, end) {
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${formatCalDavDate(start)}" end="${formatCalDavDate(end)}" />
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const urls = await getCalDavCandidateUrls(source);
  let lastError = null;

  for (const url of urls) {
    try {
      const calendarResponse = await fetchCalDavUrl(source, url, {
        method: "REPORT",
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          Depth: "1",
        },
        body,
      });
      const contentType = calendarResponse.headers.get("content-type") ?? "";
      const xml = await calendarResponse.text();
      if (!calendarResponse.ok) {
        lastError = new Error(`CalDAV server unavailable: ${calendarResponse.status}`);
        continue;
      }
      if (contentType.includes("text/html")) continue;

      const calendarBlocks = extractCalendarDataBlocks(xml);
      if (calendarBlocks.length > 0) return calendarBlocks.join("\n");
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return "";
}

async function fetchCalDavUrl(source, url, options) {
  const basicResponse = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Basic ${Buffer.from(`${source.username}:${source.password}`).toString("base64")}`,
    },
  });

  const challenge = basicResponse.headers.get("www-authenticate") ?? "";
  if (basicResponse.status !== 401 || !challenge.toLowerCase().includes("digest")) return basicResponse;

  const digest = buildDigestAuthorization({
    challenge,
    method: options.method ?? "GET",
    url,
    username: source.username,
    password: source.password,
  });

  return await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: digest,
    },
  });
}

async function getCalDavCandidateUrls(source) {
  const directUrl = normalizeCollectionUrl(source.url);
  const url = new URL(source.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const calendarRootCandidates = uniqueValues([
    directUrl,
    normalizeCollectionUrl(`${baseUrl}/dav.php/calendars/${encodeURIComponent(source.username)}/`),
    normalizeCollectionUrl(`${baseUrl}/cal.php/calendars/${encodeURIComponent(source.username)}/`),
  ]);
  const discovered = [];

  for (const root of calendarRootCandidates) {
    try {
      const collections = await discoverCalDavCollections(source, root);
      discovered.push(...collections);
    } catch {
      // Try the next common Baikal/SabreDAV route.
    }
  }

  const matchingName = source.name?.trim().toLowerCase();
  const sortedDiscovered = matchingName
    ? [
      ...discovered.filter((item) => item.name.toLowerCase().includes(matchingName)),
      ...discovered.filter((item) => !item.name.toLowerCase().includes(matchingName)),
    ]
    : discovered;

  return uniqueValues([directUrl, ...sortedDiscovered.map((item) => item.url)]);
}

async function discoverCalDavCollections(source, url) {
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname />
    <d:resourcetype />
  </d:prop>
</d:propfind>`;
  const response = await fetchCalDavUrl(source, url, {
    method: "PROPFIND",
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      Depth: "1",
    },
    body,
  });
  if (!response.ok) return [];

  const xml = await response.text();
  return [...xml.matchAll(/<(?:[^:>]+:)?response[^>]*>([\s\S]*?)<\/(?:[^:>]+:)?response>/gi)]
    .map((match) => match[1])
    .filter((responseBlock) => /<(?:[^:>]+:)?calendar\b/i.test(responseBlock))
    .map((responseBlock) => {
      const href = decodeXml(responseBlock.match(/<(?:[^:>]+:)?href[^>]*>([\s\S]*?)<\/(?:[^:>]+:)?href>/i)?.[1]?.trim() ?? "");
      const name = decodeXml(responseBlock.match(/<(?:[^:>]+:)?displayname[^>]*>([\s\S]*?)<\/(?:[^:>]+:)?displayname>/i)?.[1]?.trim() ?? "");
      return {
        name,
        url: normalizeCollectionUrl(new URL(href, url).toString()),
      };
    })
    .filter((item) => item.url);
}

function extractCalendarDataBlocks(xml) {
  return [...xml.matchAll(/<(?:[^:>]+:)?calendar-data[^>]*>([\s\S]*?)<\/(?:[^:>]+:)?calendar-data>/gi)]
    .map((match) => decodeXml(match[1].replace(/^<!\[CDATA\[|\]\]>$/g, "")));
}

function buildDigestAuthorization({ challenge, method, url, username, password }) {
  const params = parseDigestChallenge(challenge);
  const parsedUrl = new URL(url);
  const uri = `${parsedUrl.pathname}${parsedUrl.search}`;
  const realm = params.realm ?? "";
  const nonce = params.nonce ?? "";
  const qop = (params.qop ?? "").split(",").map((value) => value.trim()).find((value) => value === "auth");
  const nc = "00000001";
  const cnonce = randomBytes(8).toString("hex");
  const algorithm = (params.algorithm ?? "MD5").toUpperCase();
  const ha1Base = md5(`${username}:${realm}:${password}`);
  const ha1 = algorithm === "MD5-SESS" ? md5(`${ha1Base}:${nonce}:${cnonce}`) : ha1Base;
  const ha2 = md5(`${method}:${uri}`);
  const response = qop
    ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
    : md5(`${ha1}:${nonce}:${ha2}`);
  const parts = [
    `username="${escapeDigestValue(username)}"`,
    `realm="${escapeDigestValue(realm)}"`,
    `nonce="${escapeDigestValue(nonce)}"`,
    `uri="${escapeDigestValue(uri)}"`,
    `response="${response}"`,
  ];
  if (params.opaque) parts.push(`opaque="${escapeDigestValue(params.opaque)}"`);
  if (qop) {
    parts.push(`qop=${qop}`);
    parts.push(`nc=${nc}`);
    parts.push(`cnonce="${cnonce}"`);
  }
  if (params.algorithm) parts.push(`algorithm=${params.algorithm}`);
  return `Digest ${parts.join(", ")}`;
}

function parseDigestChallenge(challenge) {
  const digest = challenge.replace(/^Digest\s+/i, "");
  const params = {};
  for (const match of digest.matchAll(/([a-z0-9_-]+)=("([^"]*)"|([^,]*))/gi)) {
    params[match[1].toLowerCase()] = match[3] ?? match[4] ?? "";
  }
  return params;
}

function md5(value) {
  return createHash("md5").update(value).digest("hex");
}

function escapeDigestValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function normalizeCollectionUrl(url) {
  return url.endsWith("/") ? url : `${url}/`;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseICalendarEvents(ics, rangeStart, rangeEnd) {
  const events = extractICalendarBlocks(ics, "VEVENT")
    .flatMap((block) => expandCalendarEvent(parseICalendarBlock(block), rangeStart, rangeEnd))
    .filter((event) => event.end > rangeStart && event.start < rangeEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return events.map((event) => ({
    id: event.id,
    title: event.title || "Névtelen esemény",
    startsAt: event.start.toISOString(),
    endsAt: event.end.toISOString(),
    allDay: event.allDay,
    location: event.location,
  }));
}

function extractICalendarBlocks(ics, component) {
  const unfolded = ics.replace(/\r?\n[ \t]/g, "");
  const pattern = new RegExp(`BEGIN:${component}([\\s\\S]*?)END:${component}`, "gi");
  return [...unfolded.matchAll(pattern)].map((match) => match[1]);
}

function parseICalendarBlock(block) {
  const fields = {};
  for (const rawLine of block.split(/\r?\n/)) {
    const splitAt = rawLine.indexOf(":");
    if (splitAt === -1) continue;
    const left = rawLine.slice(0, splitAt);
    const value = unescapeICalText(rawLine.slice(splitAt + 1));
    const [name, ...params] = left.split(";");
    const key = name.toUpperCase();
    if (!fields[key]) fields[key] = [];
    fields[key].push({ value, params });
  }
  return fields;
}

function expandCalendarEvent(fields, rangeStart, rangeEnd) {
  const startField = firstField(fields, "DTSTART");
  if (!startField) return [];

  const endField = firstField(fields, "DTEND");
  const durationField = firstField(fields, "DURATION");
  const startInfo = parseICalDate(startField);
  const endInfo = endField ? parseICalDate(endField) : null;
  const durationMs = durationField ? parseDuration(durationField.value) : null;
  const baseEnd = endInfo?.date ?? new Date(startInfo.date.getTime() + (durationMs ?? (startInfo.allDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000)));
  const duration = Math.max(1, baseEnd.getTime() - startInfo.date.getTime());
  const title = firstField(fields, "SUMMARY")?.value ?? "";
  const location = firstField(fields, "LOCATION")?.value;
  const uid = firstField(fields, "UID")?.value ?? `${title}:${startInfo.date.toISOString()}`;
  const rrule = parseRRule(firstField(fields, "RRULE")?.value);
  const exdates = new Set((fields.EXDATE ?? []).flatMap((field) => field.value.split(",").map((value) => parseICalDate({ ...field, value }).date.toISOString().slice(0, 10))));

  if (!rrule) {
    return [{
      id: uid,
      title,
      location,
      start: startInfo.date,
      end: new Date(startInfo.date.getTime() + duration),
      allDay: startInfo.allDay,
    }];
  }

  const instances = [];
  const interval = Math.max(1, Number(rrule.INTERVAL ?? 1));
  const until = rrule.UNTIL ? parseICalDate({ value: rrule.UNTIL, params: [] }).date : rangeEnd;
  const count = rrule.COUNT ? Number(rrule.COUNT) : 500;
  let cursor = new Date(startInfo.date);
  let emitted = 0;

  while (cursor <= rangeEnd && cursor <= until && emitted < count && instances.length < 200) {
    const occurrenceEnd = new Date(cursor.getTime() + duration);
    const excluded = exdates.has(cursor.toISOString().slice(0, 10));
    if (!excluded && occurrenceEnd > rangeStart && cursor < rangeEnd) {
      instances.push({
        id: `${uid}:${cursor.toISOString()}`,
        title,
        location,
        start: new Date(cursor),
        end: occurrenceEnd,
        allDay: startInfo.allDay,
      });
    }

    emitted += 1;
    cursor = addRRuleInterval(cursor, rrule.FREQ, interval);
    if (!cursor) break;
  }

  return instances;
}

function firstField(fields, name) {
  return fields[name]?.[0];
}

function parseICalDate(field) {
  const value = field.value;
  const isDateOnly = field.params?.some((param) => param.toUpperCase() === "VALUE=DATE") || /^\d{8}$/.test(value);
  if (isDateOnly) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return { date: new Date(year, month, day), allDay: true };
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!match) return { date: new Date(value), allDay: false };
  const [, year, month, day, hour, minute, second, utc] = match;
  const parts = [Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)];
  return {
    date: utc ? new Date(Date.UTC(...parts)) : new Date(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]),
    allDay: false,
  };
}

function parseRRule(value) {
  if (!value) return null;
  const rule = Object.fromEntries(value.split(";").map((part) => {
    const [key, ruleValue] = part.split("=");
    return [key?.toUpperCase(), ruleValue];
  }));
  return ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(rule.FREQ) ? rule : null;
}

function addRRuleInterval(date, freq, interval) {
  const next = new Date(date);
  if (freq === "DAILY") next.setDate(next.getDate() + interval);
  else if (freq === "WEEKLY") next.setDate(next.getDate() + (7 * interval));
  else if (freq === "MONTHLY") next.setMonth(next.getMonth() + interval);
  else if (freq === "YEARLY") next.setFullYear(next.getFullYear() + interval);
  else return null;
  return next;
}

function parseDuration(value) {
  const match = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return null;
  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match;
  return (((Number(days) * 24 + Number(hours)) * 60 + Number(minutes)) * 60 + Number(seconds)) * 1000;
}

function unescapeICalText(value) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function formatCalDavDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

async function getWeatherApiKey() {
  const envKey = process.env.WEATHERAPI_KEY?.trim();
  if (envKey) return envKey;

  try {
    const raw = await readFile(weatherKeyFile, "utf8");
    return JSON.parse(raw).key?.trim() || "";
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

function normalizeWeatherApiResponse(weather) {
  const day = weather.forecast?.forecastday?.[0]?.day ?? {};
  return {
    provider: "WeatherAPI.com",
    place: {
      name: weather.location?.name,
      country: weather.location?.country,
      latitude: weather.location?.lat,
      longitude: weather.location?.lon,
      timezone: weather.location?.tz_id,
    },
    updatedAt: new Date().toISOString(),
    current: {
      temperature: weather.current?.temp_c,
      apparentTemperature: weather.current?.feelslike_c,
      condition: weather.current?.condition?.text,
      windSpeed: weather.current?.wind_kph,
      windGusts: weather.current?.gust_kph,
      isDay: weather.current?.is_day === 1,
    },
    daily: {
      temperatureMax: day.maxtemp_c,
      temperatureMin: day.mintemp_c,
      precipitationProbability: day.daily_chance_of_rain,
    },
  };
}

function getCachedValue(cache, key, ttl) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

async function serveStaticFile(urlPath, response) {
  const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const candidate = path.join(distDir, safePath === "/" ? "index.html" : safePath);
  const filePath = await getStaticFilePath(candidate);
  const ext = path.extname(filePath);
  const content = await readFile(filePath);

  response.writeHead(200, {
    "Content-Type": mimeTypes[ext] ?? "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  response.end(content);
}

async function getStaticFilePath(candidate) {
  try {
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
  } catch {
    // Single-page app fallback below.
  }

  return path.join(distDir, "index.html");
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

