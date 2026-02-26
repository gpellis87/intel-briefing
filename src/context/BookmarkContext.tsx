"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { EnrichedArticle } from "@/types";

interface BookmarkContextValue {
  toggleBookmark: (article: EnrichedArticle) => void;
  isBookmarked: (id: string) => boolean;
  getSavedArticles: () => EnrichedArticle[];
  count: number;
}

const BookmarkContext = createContext<BookmarkContextValue>({
  toggleBookmark: () => {},
  isBookmarked: () => false,
  getSavedArticles: () => [],
  count: 0,
});

const STORAGE_KEY = "intel-bookmarks-v2";
const MAX_SAVED = 200;

interface StoredBookmark {
  article: EnrichedArticle;
  savedAt: string;
}

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Map<string, StoredBookmark>>(new Map());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: [string, StoredBookmark][] = JSON.parse(stored);
        setBookmarks(new Map(parsed));
      }
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const entries = [...bookmarks.entries()];
      const trimmed = entries.length > MAX_SAVED ? entries.slice(-MAX_SAVED) : entries;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }, [bookmarks, mounted]);

  const toggleBookmark = useCallback((article: EnrichedArticle) => {
    setBookmarks((prev) => {
      const next = new Map(prev);
      if (next.has(article.id)) {
        next.delete(article.id);
      } else {
        next.set(article.id, {
          article,
          savedAt: new Date().toISOString(),
        });
      }
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: string) => bookmarks.has(id), [bookmarks]);

  const getSavedArticles = useCallback(() => {
    return [...bookmarks.values()]
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .map((b) => b.article);
  }, [bookmarks]);

  if (!mounted) return null;

  return (
    <BookmarkContext.Provider
      value={{ toggleBookmark, isBookmarked, getSavedArticles, count: bookmarks.size }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export const useBookmarks = () => useContext(BookmarkContext);
