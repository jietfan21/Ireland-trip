"use client";

import { useEffect, useState } from "react";
import type { Day } from "./trip";

export type Weather = { max: number; min: number; rain: number; code: number } | null;

export function weatherIcon(code: number) {
  if (code <= 1) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67 || (code >= 80 && code <= 82)) return "🌧️";
  if (code <= 77 || code === 85 || code === 86) return "🌨️";
  return "⛈️";
}

// One Open-Meteo request per shown day; shared by the day card and the crew strip.
export function useWeather(day: Day): Weather {
  const [w, setW] = useState<Weather>(null);
  useEffect(() => {
    setW(null);
    const [lat, lng] = day.sunAt;
    const q = `latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${day.date}&end_date=${day.date}`;
    const ctrl = new AbortController();
    fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.daily;
        if (!d?.time?.length || d.temperature_2m_max[0] == null) return;
        setW({ max: Math.round(d.temperature_2m_max[0]), min: Math.round(d.temperature_2m_min[0]), rain: d.precipitation_probability_max[0] ?? 0, code: d.weather_code[0] });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [day.date, day.sunAt]);
  return w;
}
