"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Link2, Check } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title: string;
  source: string;
  size?: "sm" | "md";
}

export function ShareButton({ url, title, source, size = "sm" }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const iconSize = size === "sm" ? 12 : 15;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      /* user cancelled */
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    } catch {
      /* clipboard blocked */
    }
  };

  const handleShareX = () => {
    const text = encodeURIComponent(`${title} — ${source}`);
    const link = encodeURIComponent(url);
    window.open(
      `https://x.com/intent/tweet?text=${text}&url=${link}`,
      "_blank",
      "noopener,noreferrer,width=550,height=420"
    );
    setOpen(false);
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canNativeShare) {
      handleNativeShare();
    } else {
      setOpen(!open);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleClick}
        className={`p-1.5 rounded-lg transition-all text-text-muted hover:text-accent-cyan hover:bg-surface-tertiary ${
          size === "md" ? "p-2" : ""
        }`}
        aria-label="Share article"
      >
        <Share2 size={iconSize} />
      </button>

      {open && !canNativeShare && (
        <div className="absolute right-0 bottom-full mb-2 w-40 bg-surface-secondary border border-border-primary rounded-xl shadow-xl overflow-hidden animate-slide-down z-50">
          <div className="p-1">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-surface-hover transition-colors"
            >
              {copied ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Link2 size={14} className="text-text-muted" />
              )}
              <span>{copied ? "Copied!" : "Copy link"}</span>
            </button>
            <button
              onClick={handleShareX}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-surface-hover transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-text-muted">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Share on X</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
