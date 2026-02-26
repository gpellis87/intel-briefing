"use client";

import { useState, useEffect, useCallback } from "react";
import type { EnrichedArticle } from "@/types";

interface UseKeyboardNavOptions {
  articles: EnrichedArticle[];
  onOpenArticle: (article: EnrichedArticle) => void;
  onToggleBookmark: (id: string) => void;
  onShowHelp: () => void;
  enabled: boolean;
}

export function useKeyboardNav({
  articles,
  onOpenArticle,
  onToggleBookmark,
  onShowHelp,
  enabled,
}: UseKeyboardNavOptions) {
  const [focusIndex, setFocusIndex] = useState(-1);

  useEffect(() => {
    setFocusIndex(-1);
  }, [articles]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "j": {
          e.preventDefault();
          setFocusIndex((prev) => Math.min(prev + 1, articles.length - 1));
          break;
        }
        case "k": {
          e.preventDefault();
          setFocusIndex((prev) => Math.max(prev - 1, -1));
          break;
        }
        case "o":
        case "Enter": {
          if (focusIndex >= 0 && focusIndex < articles.length) {
            e.preventDefault();
            onOpenArticle(articles[focusIndex]);
          }
          break;
        }
        case "s": {
          if (focusIndex >= 0 && focusIndex < articles.length) {
            e.preventDefault();
            onToggleBookmark(articles[focusIndex].id);
          }
          break;
        }
        case "?": {
          e.preventDefault();
          onShowHelp();
          break;
        }
      }
    },
    [enabled, articles, focusIndex, onOpenArticle, onToggleBookmark, onShowHelp]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (focusIndex >= 0) {
      const el = document.querySelector(`[data-article-index="${focusIndex}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusIndex]);

  return { focusIndex, setFocusIndex };
}
