"use client";

import { useEffect } from "react";
import { X, Clock, ExternalLink, History } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface HistoryEntry {
  id: string;
  readAt: string;
  title?: string;
  url?: string;
  source?: string;
}

interface ReadingHistoryProps {
  open: boolean;
  onClose: () => void;
  history: HistoryEntry[];
}

export function ReadingHistory({ open, onClose, history }: ReadingHistoryProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-secondary border-l border-border-primary shadow-2xl overflow-hidden flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <History size={16} className="text-accent-cyan" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-[var(--font-family-mono)]">
              Reading History
            </h3>
            <span className="text-[10px] text-text-muted">({history.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <History size={32} className="mb-3 text-surface-elevated" />
              <p className="text-sm">No reading history yet</p>
              <p className="text-xs mt-1">Articles you open will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border-primary/50">
              {history.map((entry) => (
                <div key={`${entry.id}-${entry.readAt}`} className="px-6 py-3 hover:bg-surface-hover transition-colors">
                  {entry.url ? (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block space-y-1"
                    >
                      <h4 className="text-sm text-text-primary font-medium line-clamp-2 hover:text-accent-cyan transition-colors">
                        {entry.title || "Untitled Article"}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-text-muted">
                        {entry.source && (
                          <span className="font-semibold uppercase tracking-wider">
                            {entry.source}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock size={9} />
                          <span>{timeAgo(entry.readAt)}</span>
                        </div>
                        <ExternalLink size={9} />
                      </div>
                    </a>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-text-secondary">
                        {entry.title || `Article ${entry.id}`}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-text-muted">
                        <Clock size={9} />
                        <span>{timeAgo(entry.readAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
