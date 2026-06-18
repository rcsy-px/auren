import { CloudSun } from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboardStore } from "../store/dashboardStore";

export function ClockWeather({ inline = false }: { inline?: boolean }) {
  const [now, setNow] = useState(new Date());
  const settings = useDashboardStore((state) => state.settings);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
      <div className="mt-4 flex items-center justify-end gap-2 text-slate-100/85">
        <CloudSun size={18} />
        <span>18°C</span>
      </div>
    </div>
  );
}
