"use client";

import { useState, useRef, useEffect } from "react";
import { Radar, X, Plus } from "lucide-react";

interface KeywordAlertsProps {
  open: boolean;
  onClose: () => void;
  keywords: string[];
  onAdd: (keyword: string) => void;
  onRemove: (keyword: string) => void;
}

export function KeywordAlerts({
  open, onClose, keywords, onAdd, onRemove,
}: KeywordAlertsProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input);
      setInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-secondary border border-border-primary rounded-2xl shadow-2xl overflow-hidden animate-fade-up mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <Radar size={16} className="text-accent-cyan" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-[var(--font-family-mono)]">
              Keyword Alerts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-xs text-text-secondary">
            Add keywords to watch. Articles matching these words will be highlighted in your feed.
          </p>

          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g., Tesla, Supreme Court, tariffs..."
              className="flex-1 px-3 py-2 rounded-lg bg-surface-tertiary border border-border-primary text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-cyan transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim() || keywords.length >= 20}
              className="px-3 py-2 rounded-lg bg-accent-cyan text-surface-primary font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>

          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-cyan/10 text-accent-cyan text-xs font-medium border border-accent-cyan/20"
                >
                  {kw}
                  <button
                    onClick={() => onRemove(kw)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-4">
              No keywords set. Add up to 20 keywords to monitor.
            </p>
          )}

          <p className="text-[10px] text-text-muted">
            {keywords.length}/20 keywords used
          </p>
        </div>
      </div>
    </div>
  );
}
