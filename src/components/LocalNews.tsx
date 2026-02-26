"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, Settings, Loader2, AlertCircle } from "lucide-react";

interface LocationData {
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

const STORAGE_KEY = "intel-location";

export function useLocalLocation() {
  const [location, setLocationState] = useState<LocationData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLocationState(JSON.parse(stored));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  const setLocation = useCallback((loc: LocationData | null) => {
    setLocationState(loc);
    if (loc) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return { location, setLocation, mounted };
}

interface LocalNewsPromptProps {
  onLocationSet: (loc: LocationData) => void;
}

export function LocalNewsPrompt({ onLocationSet }: LocalNewsPromptProps) {
  const [mode, setMode] = useState<"prompt" | "zip" | "detecting">("prompt");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const detectLocation = async () => {
    setMode("detecting");
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setMode("zip");
      return;
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false,
        });
      });

      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        { headers: { "User-Agent": "IntelBriefing/1.0" } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || "";
      const state = addr.state || "";

      if (city && state) {
        onLocationSet({ city, state, lat: latitude, lng: longitude });
      } else {
        setError("Could not determine your city. Please enter a zip code.");
        setMode("zip");
      }
    } catch {
      setError("Location access denied or unavailable. Please enter a zip code.");
      setMode("zip");
    }
  };

  const lookupZip = async () => {
    if (!zip.match(/^\d{5}$/)) {
      setError("Please enter a valid 5-digit zip code");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&addressdetails=1&limit=1`,
        { headers: { "User-Agent": "IntelBriefing/1.0" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const addr = data[0].address || {};
        const city =
          addr.city || addr.town || addr.village || addr.county || data[0].display_name?.split(",")[0] || "";
        const state = addr.state || "";
        if (city) {
          onLocationSet({
            city,
            state,
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        } else {
          setError("Could not find that zip code. Try a nearby one.");
        }
      } else {
        setError("Zip code not found. Please try another.");
      }
    } catch {
      setError("Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="bg-surface-secondary border border-border-primary rounded-2xl p-8 max-w-md w-full mx-4 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-cyan/10 flex items-center justify-center">
            <MapPin size={28} className="text-accent-cyan" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">Local News</h3>
          <p className="text-sm text-text-secondary">
            Get news from your area. We&apos;ll use your location or zip code to find local stories.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {mode === "prompt" && (
          <div className="space-y-3">
            <button
              onClick={detectLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-cyan text-surface-primary font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Navigation size={16} />
              Use My Location
            </button>
            <button
              onClick={() => setMode("zip")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border-secondary text-text-secondary font-medium text-sm hover:bg-surface-tertiary transition-colors"
            >
              Enter Zip Code Instead
            </button>
          </div>
        )}

        {mode === "detecting" && !error && (
          <div className="flex items-center justify-center gap-2 py-4 text-text-muted text-sm">
            <Loader2 size={16} className="animate-spin" />
            <span>Detecting your location...</span>
          </div>
        )}

        {mode === "zip" && (
          <div className="space-y-3">
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="Enter zip code (e.g., 78701)"
              className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-border-primary text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent-cyan transition-colors"
              onKeyDown={(e) => e.key === "Enter" && lookupZip()}
              autoFocus
            />
            <button
              onClick={lookupZip}
              disabled={loading || zip.length !== 5}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-cyan text-surface-primary font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <MapPin size={16} />
              )}
              Find Local News
            </button>
            <button
              onClick={() => { setMode("prompt"); setError(""); }}
              className="w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Back to location detection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface LocationBadgeProps {
  city: string;
  state: string;
  onEdit: () => void;
}

export function LocationBadge({ city, state, onEdit }: LocationBadgeProps) {
  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20">
        <MapPin size={11} className="text-accent-cyan" />
        <span className="text-[11px] font-semibold text-accent-cyan">
          {city}, {state}
        </span>
      </div>
      <button
        onClick={onEdit}
        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
        title="Change location"
      >
        <Settings size={12} />
      </button>
    </div>
  );
}
