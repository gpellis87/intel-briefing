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
  const barWidth = size === "sm" ? "w-12" : "w-20";
  const barHeight = size === "sm" ? "h-1" : "h-1.5";
  const iconSize = size === "sm" ? 10 : 14;

  return (
    <div className="flex items-center gap-1.5">
      <Shield size={iconSize} className={getReliabilityColor(score)} />
      <div className={`${barWidth} ${barHeight} bg-navy-700 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all ${getReliabilityBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-[10px] ${getReliabilityColor(score)} font-medium`}>
          {getReliabilityLabel(score)}
        </span>
      )}
      <span className="text-[10px] text-gray-500 tabular-nums">{score}</span>
    </div>
  );
}
