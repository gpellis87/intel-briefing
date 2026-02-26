"use client";

import { useRef, useState, useEffect } from "react";
import { categories } from "@/lib/categories";
import type { NewsCategory } from "@/types";
import {
  Newspaper, Landmark, Cpu, TrendingUp,
  FlaskConical, HeartPulse, Trophy, Film,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Newspaper, Landmark, Cpu, TrendingUp,
  FlaskConical, HeartPulse, Trophy, Film,
};

interface CategoryNavProps {
  activeCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
}

export function CategoryNav({ activeCategory, onCategoryChange }: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <nav className="relative flex items-center gap-1 py-2">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 z-10 p-1 rounded-full bg-surface-primary/90 border border-border-primary text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth px-1"
      >
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon];
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-accent-blue/15 text-accent-cyan border border-accent-blue/25 shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-tertiary border border-transparent"
              }`}
            >
              {Icon && <Icon size={15} />}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 z-10 p-1 rounded-full bg-surface-primary/90 border border-border-primary text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </nav>
  );
}
