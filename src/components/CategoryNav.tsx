"use client";

import { categories } from "@/lib/categories";
import type { NewsCategory } from "@/types";
import {
  Newspaper,
  Landmark,
  Cpu,
  TrendingUp,
  FlaskConical,
  HeartPulse,
  Trophy,
  Film,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Newspaper,
  Landmark,
  Cpu,
  TrendingUp,
  FlaskConical,
  HeartPulse,
  Trophy,
  Film,
};

interface CategoryNavProps {
  activeCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
}

export function CategoryNav({
  activeCategory,
  onCategoryChange,
}: CategoryNavProps) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon];
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              isActive
                ? "bg-accent-blue/20 text-accent-cyan border border-accent-blue/30"
                : "text-gray-400 hover:text-gray-200 hover:bg-navy-800/50 border border-transparent"
            }`}
          >
            {Icon && <Icon size={14} />}
            <span>{cat.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
