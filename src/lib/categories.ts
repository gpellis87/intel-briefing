import type { NewsCategoryConfig } from "@/types";

export const categories: NewsCategoryConfig[] = [
  {
    id: "general",
    label: "Headlines",
    icon: "Newspaper",
    newsApiCategory: "general",
  },
  {
    id: "politics",
    label: "Politics",
    icon: "Landmark",
    query: "politics OR congress OR senate OR president OR legislation",
  },
  {
    id: "technology",
    label: "Tech",
    icon: "Cpu",
    newsApiCategory: "technology",
  },
  {
    id: "business",
    label: "Business",
    icon: "TrendingUp",
    newsApiCategory: "business",
  },
  {
    id: "science",
    label: "Science",
    icon: "FlaskConical",
    newsApiCategory: "science",
  },
  {
    id: "health",
    label: "Health",
    icon: "HeartPulse",
    newsApiCategory: "health",
  },
  {
    id: "sports",
    label: "Sports",
    icon: "Trophy",
    newsApiCategory: "sports",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: "Film",
    newsApiCategory: "entertainment",
  },
  {
    id: "local",
    label: "Local",
    icon: "MapPin",
  },
];
