export type WeatherPayload = {
  provider: "WeatherAPI.com";
  place: {
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  };
  updatedAt: string;
  cached?: boolean;
  current: {
    temperature?: number;
    apparentTemperature?: number;
    condition?: string;
    windSpeed?: number;
    windGusts?: number;
    isDay?: boolean;
  };
  daily: {
    temperatureMax?: number;
    temperatureMin?: number;
    precipitationProbability?: number;
  };
};

export async function fetchWeather(location: string, signal?: AbortSignal) {
  const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`, { signal });
  if (response.status === 204) return null;
  if (!response.ok) throw new Error("Weather request failed");
  return (await response.json()) as WeatherPayload;
}

export type WeatherKeyStatus = {
  configured: boolean;
  source: "environment" | "settings";
};

export async function fetchWeatherKeyStatus(signal?: AbortSignal) {
  const response = await fetch("/api/weather/key", { signal });
  if (!response.ok) throw new Error("Weather key status request failed");
  return (await response.json()) as WeatherKeyStatus;
}

export async function saveWeatherApiKey(key: string) {
  const response = await fetch("/api/weather/key", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!response.ok) throw new Error("Weather key save failed");
  return (await response.json()) as Pick<WeatherKeyStatus, "configured">;
}
