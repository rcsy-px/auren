import { CloudSun, Droplets, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchWeather, type WeatherPayload } from "../lib/weather";
import { useDashboardStore } from "../store/dashboardStore";

export function ClockWeather({ inline = false }: { inline?: boolean }) {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const settings = useDashboardStore((state) => state.settings);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      try {
        setWeatherError(false);
        const data = await fetchWeather(settings.weatherLocation, controller.signal);
        setWeather(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("Weather load failed", error);
        setWeatherError(true);
      }
    }

    void loadWeather();
    const timer = window.setInterval(loadWeather, 10 * 60 * 1000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [settings.weatherLocation]);

  const temperature = weather?.current.temperature;
  const weatherLabel = weather?.current.condition ?? "Időjárás";
  const place = weather?.place.name ?? settings.weatherLocation;

  return (
    <div className={`clock-weather ${inline ? "clock-weather-inline" : ""}`}>
      <div className="clock-time">
        {now.toLocaleTimeString("hu-HU", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: settings.timeFormat === "12",
        })}
      </div>
      <div className="mt-2 text-sm text-slate-100/80 md:text-base">
        {now.toLocaleDateString("hu-HU", { month: "long", day: "numeric", weekday: "long" })}
      </div>
      {weather && !weatherError && (
        <div className="weather-chip mt-4" title={`${weather.provider} - ${place}`}>
          <div className="flex items-center justify-end gap-2 text-slate-100/90">
            <CloudSun size={18} />
            <span>{temperature === undefined ? "..." : `${Math.round(temperature)}°C`}</span>
          </div>
          <div className="weather-detail mt-1 text-xs text-slate-200/62">{weatherLabel} · {place}</div>
          <div className="weather-detail mt-2 flex items-center justify-end gap-3 text-xs text-slate-200/60">
            <span>{Math.round(weather.daily.temperatureMin ?? temperature ?? 0)}° / {Math.round(weather.daily.temperatureMax ?? temperature ?? 0)}°</span>
            {weather.daily.precipitationProbability !== undefined && (
              <span className="inline-flex items-center gap-1"><Droplets size={12} />{weather.daily.precipitationProbability}%</span>
            )}
            {weather.current.windSpeed !== undefined && (
              <span className="inline-flex items-center gap-1"><Wind size={12} />{Math.round(weather.current.windSpeed)} km/h</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
