"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "intel-read-articles";
const MAX_TRACKED = 500;

export function useReadTracker() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setReadIds(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const arr = [...readIds];
      const trimmed = arr.length > MAX_TRACKED ? arr.slice(-MAX_TRACKED) : arr;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }, [readIds, mounted]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const markAllRead = useCallback((ids: string[]) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const readCount = readIds.size;

  return { isRead, markRead, markAllRead, readCount, mounted };
}
