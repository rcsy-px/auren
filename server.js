import { createServer } from "node:http";
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
const weatherKeyFile = path.join(dataDir, "weather-key.json");
const weatherCache = new Map();
const WEATHER_CACHE_TTL = 10 * 60 * 1000;

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

    if (url.pathname === "/api/weather") {
      await handleWeatherApi(url, response);
      return;
    }

    if (url.pathname === "/api/weather/key") {
      await handleWeatherKeyApi(request, response);
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
      if (body.length > 2_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}
