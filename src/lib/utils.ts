import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BiasRating, BiasDirection } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBiasDirection(bias: BiasRating): BiasDirection {
  if (bias === "far-left" || bias === "left" || bias === "center-left")
    return "left";
  if (bias === "far-right" || bias === "right" || bias === "center-right")
    return "right";
  return "center";
}

export function getBiasColor(bias: BiasRating): string {
  const map: Record<BiasRating, string> = {
    "far-left": "bg-blue-800 text-blue-100",
    left: "bg-blue-600 text-blue-50",
    "center-left": "bg-blue-400/80 text-blue-950",
    center: "bg-gray-500 text-gray-50",
    "center-right": "bg-red-400/80 text-red-950",
    right: "bg-red-600 text-red-50",
    "far-right": "bg-red-800 text-red-100",
  };
  return map[bias];
}

export function getBiasBorderColor(bias: BiasRating | null): string {
  if (!bias) return "border-navy-700";
  const map: Record<BiasRating, string> = {
    "far-left": "border-blue-700/50",
    left: "border-blue-500/40",
    "center-left": "border-blue-400/30",
    center: "border-gray-500/30",
    "center-right": "border-red-400/30",
    right: "border-red-500/40",
    "far-right": "border-red-700/50",
  };
  return map[bias];
}

export function getBiasGlow(bias: BiasRating | null): string {
  if (!bias) return "";
  const dir = getBiasDirection(bias);
  if (dir === "left") return "glow-blue";
  if (dir === "right") return "glow-red";
  return "";
}

export function getBiasLabel(bias: BiasRating): string {
  const map: Record<BiasRating, string> = {
    "far-left": "Far Left",
    left: "Left",
    "center-left": "Center-Left",
    center: "Center",
    "center-right": "Center-Right",
    right: "Right",
    "far-right": "Far Right",
  };
  return map[bias];
}

export function getReliabilityColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 25) return "text-orange-400";
  return "text-red-400";
}

export function getReliabilityBarColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export function getReliabilityLabel(score: number): string {
  if (score >= 80) return "Very High";
  if (score >= 60) return "High";
  if (score >= 40) return "Mixed";
  if (score >= 20) return "Low";
  return "Very Low";
}

export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) return "just now";
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "yesterday";
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatPublishTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `Today at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type RecencyBadge = "breaking" | "just-in" | null;

export function getRecencyBadge(publishedAt: string): RecencyBadge {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  if (isNaN(ageMs) || ageMs < 0) return null;
  if (ageMs < 60 * 60 * 1000) return "breaking";
  if (ageMs < 3 * 60 * 60 * 1000) return "just-in";
  return null;
}

export function generateArticleId(article: {
  title: string;
  url: string;
}): string {
  const str = `${article.title}-${article.url}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
