"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocalLocation } from "./LocalNews";
import { CloudSun, Thermometer } from "lucide-react";

interface WeatherData {
  temp: number;
  feelsLike: number;
  high: number;
  low: number;
  description: string;
  icon: string;
  city: string;
}

export function WeatherWidget() {
  const { location } = useLocalLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchWeather = useCallback(async () => {
    if (!location) return;

    try {
      const params = location.lat && location.lng
        ? `lat=${location.lat}&lon=${location.lng}`
        : `zip=00000`;

      const res = await fetch(`/api/weather?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.temp !== undefined) setWeather(data);
      }
    } catch { /* silent */ }
  }, [location]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (!weather) return null;

  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}.png`;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-text-secondary hover:bg-surface-tertiary transition-colors"
      >
        <img src={iconUrl} alt="" className="w-5 h-5" />
        <span className="font-semibold tabular-nums">{weather.temp}°F</span>
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface-secondary border border-border-primary rounded-xl shadow-xl p-4 space-y-2 animate-slide-down z-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">{weather.city}</span>
            <img src={iconUrl} alt="" className="w-8 h-8" />
          </div>
          <div className="text-2xl font-bold text-text-primary tabular-nums">
            {weather.temp}°F
          </div>
          <p className="text-xs text-text-secondary capitalize">{weather.description}</p>
          <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border-primary">
            <div className="flex items-center gap-1">
              <Thermometer size={10} />
              <span>Feels {weather.feelsLike}°</span>
            </div>
            <span>H: {weather.high}° L: {weather.low}°</span>
          </div>
        </div>
      )}
    </div>
  );
}
