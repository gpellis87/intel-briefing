"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "intel-read-articles";
const MAX_TRACKED = 500;

interface ReadEntry {
  readAt: string;
  title?: string;
  url?: string;
  source?: string;
}

export function useReadTracker() {
  const [readMap, setReadMap] = useState<Map<string, ReadEntry>>(new Map());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Migrate from old Set<string> format
          const map = new Map<string, ReadEntry>();
          for (const id of parsed) {
            if (typeof id === "string") {
              map.set(id, { readAt: new Date().toISOString() });
            }
          }
          setReadMap(map);
        } else if (typeof parsed === "object") {
          setReadMap(new Map(Object.entries(parsed)));
        }
      }
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const entries = Object.fromEntries(readMap);
      const keys = Object.keys(entries);
      if (keys.length > MAX_TRACKED) {
        const sorted = keys.sort(
          (a, b) =>
            new Date(entries[a].readAt).getTime() -
            new Date(entries[b].readAt).getTime()
        );
        const trimmed: Record<string, ReadEntry> = {};
        for (const key of sorted.slice(-MAX_TRACKED)) {
          trimmed[key] = entries[key];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      }
    }
  }, [readMap, mounted]);

  const markRead = useCallback(
    (id: string, meta?: { title?: string; url?: string; source?: string }) => {
      setReadMap((prev) => {
        if (prev.has(id)) return prev;
        const next = new Map(prev);
        next.set(id, {
          readAt: new Date().toISOString(),
          ...meta,
        });
        return next;
      });
    },
    []
  );

  const isRead = useCallback((id: string) => readMap.has(id), [readMap]);

  const markAllRead = useCallback((ids: string[]) => {
    setReadMap((prev) => {
      const next = new Map(prev);
      const now = new Date().toISOString();
      for (const id of ids) {
        if (!next.has(id)) {
          next.set(id, { readAt: now });
        }
      }
      return next;
    });
  }, []);

  const getHistory = useCallback(() => {
    return [...readMap.entries()]
      .filter(([, entry]) => !!entry.title)
      .map(([id, entry]) => ({ id, ...entry }))
      .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())
      .slice(0, 100);
  }, [readMap]);

  const readCount = readMap.size;

  return { isRead, markRead, markAllRead, readCount, getHistory, mounted };
}
