"use client";

import { useEffect, useRef } from "react";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["j"], description: "Next article" },
  { keys: ["k"], description: "Previous article" },
  { keys: ["o"], description: "Open article" },
  { keys: ["s"], description: "Toggle bookmark" },
  { keys: ["/"], description: "Focus search" },
  { keys: ["Esc"], description: "Close search / modal" },
  { keys: ["?"], description: "Show this help" },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        ref={ref}
        className="bg-surface-secondary border border-border-primary rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-fade-up"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <div className="flex items-center gap-2.5">
            <Keyboard size={18} className="text-accent-cyan" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-[var(--font-family-mono)]">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-1">
          {shortcuts.map((s) => (
            <div
              key={s.description}
              className="flex items-center justify-between py-2 px-2 rounded-lg"
            >
              <span className="text-sm text-text-secondary">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 text-xs font-mono font-medium bg-surface-tertiary text-text-primary rounded-lg border border-border-secondary"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-border-primary">
          <p className="text-[11px] text-text-muted text-center">
            Press <kbd className="px-1 py-0.5 text-[10px] bg-surface-tertiary rounded border border-border-secondary">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
