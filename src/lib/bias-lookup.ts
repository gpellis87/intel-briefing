import mediaBiasData from "@/data/media-bias.json";
import type { SourceBiasData, BiasRating } from "@/types";
import { extractDomain } from "./utils";

const biasMap = new Map<string, SourceBiasData>();

for (const entry of mediaBiasData) {
  biasMap.set(entry.domain, entry as SourceBiasData);
}

export function lookupBias(
  sourceUrl: string,
  sourceName?: string
): SourceBiasData | null {
  const domain = extractDomain(sourceUrl);

  const direct = biasMap.get(domain);
  if (direct) return direct;

  for (const [key, data] of biasMap) {
    if (domain.includes(key) || key.includes(domain)) return data;
  }

  if (sourceName) {
    const lowerName = sourceName.toLowerCase();
    for (const [, data] of biasMap) {
      if (data.name.toLowerCase() === lowerName) return data;
    }
  }

  return null;
}

export function getAllSources(): SourceBiasData[] {
  return mediaBiasData as SourceBiasData[];
}

export function getSourcesByBias(bias: BiasRating): SourceBiasData[] {
  return mediaBiasData.filter(
    (s) => s.bias === bias
  ) as SourceBiasData[];
}
