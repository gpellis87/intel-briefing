"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface BookmarkContextValue {
  bookmarks: Set<string>;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  count: number;
}

const BookmarkContext = createContext<BookmarkContextValue>({
  bookmarks: new Set(),
  toggleBookmark: () => {},
  isBookmarked: () => false,
  count: 0,
});

const STORAGE_KEY = "intel-bookmarks";

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setBookmarks(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarks]));
    }
  }, [bookmarks, mounted]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: string) => bookmarks.has(id), [bookmarks]);

  if (!mounted) return null;

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked, count: bookmarks.size }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export const useBookmarks = () => useContext(BookmarkContext);
