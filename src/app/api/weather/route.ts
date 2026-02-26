import { NextRequest, NextResponse } from "next/server";

interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  high: number;
  low: number;
  description: string;
  icon: string;
  city: string;
}

const cache = new Map<string, WeatherCache>();
const CACHE_TTL = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const zip = searchParams.get("zip");

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Weather API not configured" }, { status: 503 });
  }

  let cacheKey: string;
  let url: string;

  if (lat && lon) {
    cacheKey = `${lat},${lon}`;
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
  } else if (zip) {
    cacheKey = zip;
    url = `https://api.openweathermap.org/data/2.5/weather?zip=${zip},US&units=imperial&appid=${apiKey}`;
  } else {
    return NextResponse.json({ error: "Missing lat/lon or zip" }, { status: 400 });
  }

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const data: any = await res.json();
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const weather: WeatherData = {
      temp: Math.round(data.main?.temp || 0),
      feelsLike: Math.round(data.main?.feels_like || 0),
      high: Math.round(data.main?.temp_max || 0),
      low: Math.round(data.main?.temp_min || 0),
      description: data.weather?.[0]?.description || "",
      icon: data.weather?.[0]?.icon || "01d",
      city: data.name || "",
    };

    cache.set(cacheKey, { data: weather, timestamp: Date.now() });

    return NextResponse.json(weather);
  } catch (err) {
    console.error("Weather error:", err);
    return NextResponse.json({ error: "Weather fetch failed" }, { status: 500 });
  }
}
