"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "intel-keyword-alerts";
const MAX_KEYWORDS = 20;

export function useKeywordAlerts() {
  const [keywords, setKeywordsState] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setKeywordsState(JSON.parse(stored));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  const save = useCallback((kws: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kws));
  }, []);

  const addKeyword = useCallback((keyword: string) => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized || normalized.length < 2) return;
    setKeywordsState((prev) => {
      if (prev.includes(normalized) || prev.length >= MAX_KEYWORDS) return prev;
      const next = [...prev, normalized];
      save(next);
      return next;
    });
  }, [save]);

  const removeKeyword = useCallback((keyword: string) => {
    setKeywordsState((prev) => {
      const next = prev.filter((k) => k !== keyword);
      save(next);
      return next;
    });
  }, [save]);

  const matchesAlert = useCallback(
    (title: string): string | null => {
      if (keywords.length === 0) return null;
      const lower = title.toLowerCase();
      return keywords.find((kw) => lower.includes(kw)) || null;
    },
    [keywords]
  );

  const getMatchCount = useCallback(
    (articles: { title: string }[]): number => {
      if (keywords.length === 0) return 0;
      return articles.filter((a) => matchesAlert(a.title) !== null).length;
    },
    [keywords, matchesAlert]
  );

  return {
    keywords,
    addKeyword,
    removeKeyword,
    matchesAlert,
    getMatchCount,
    count: keywords.length,
    mounted,
  };
}
