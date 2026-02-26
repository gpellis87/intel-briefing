"use client";

import {
  getReliabilityBarColor,
  getReliabilityLabel,
  getReliabilityColor,
} from "@/lib/utils";
import { Shield } from "lucide-react";

interface ReliabilityMeterProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ReliabilityMeter({
  score,
  showLabel = false,
  size = "sm",
}: ReliabilityMeterProps) {
  const barWidth = size === "sm" ? "w-14" : "w-24";
  const barHeight = size === "sm" ? "h-1.5" : "h-2";
  const iconSize = size === "sm" ? 11 : 14;

  return (
    <div className="flex items-center gap-2">
      <Shield size={iconSize} className={getReliabilityColor(score)} />
      <div
        className={`${barWidth} ${barHeight} bg-surface-tertiary rounded-full overflow-hidden`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${getReliabilityBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={`text-[10px] ${getReliabilityColor(score)} font-medium`}
        >
          {getReliabilityLabel(score)}
        </span>
      )}
      <span className="text-[10px] text-text-muted tabular-nums">{score}</span>
    </div>
  );
}
