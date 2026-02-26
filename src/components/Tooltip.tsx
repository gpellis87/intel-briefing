"use client";

import { useState, useRef, type ReactNode } from "react";

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleEnter = () => {
    timeout.current = setTimeout(() => setShow(true), 500);
  };

  const handleLeave = () => {
    clearTimeout(timeout.current);
    setShow(false);
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border-secondary text-[11px] text-text-primary font-medium whitespace-nowrap shadow-lg z-50 animate-fade-in pointer-events-none">
          {text}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-elevated border-l border-t border-border-secondary rotate-45" />
        </div>
      )}
    </div>
  );
}
