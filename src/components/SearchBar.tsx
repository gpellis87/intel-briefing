"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded && inputRef.current) inputRef.current.focus();
  }, [expanded]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !expanded && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setExpanded(true);
      }
      if (e.key === "Escape" && expanded) {
        setExpanded(false);
        onChange("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded, onChange]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary transition-all border border-border-primary"
        aria-label="Search articles"
      >
        <Search size={13} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-surface-tertiary text-text-muted rounded border border-border-primary ml-1">
          /
        </kbd>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-surface-secondary border border-border-secondary rounded-lg px-3 py-1.5 animate-fade-in min-w-[200px] sm:min-w-[280px]">
      <Search size={14} className="text-text-muted flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search headlines..."
        className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-full"
      />
      <button
        onClick={() => {
          onChange("");
          setExpanded(false);
        }}
        className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
