"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","it","its","as","are","was","were","be","been","has","have","had",
  "do","does","did","will","would","could","should","may","might","can","this",
  "that","these","those","he","she","they","we","you","i","my","his","her","our",
  "their","your","me","him","us","them","who","what","which","when","where","how",
  "why","not","no","so","if","than","then","just","also","about","up","out","more",
  "some","only","other","new","over","after","into","all","says","said","get","got",
  "back","now","one","two","first","last","year","years","day","time","most","very",
  "being","make","like","before","between","each","under","here","own","through",
  "during","both","same","off","way","still","many","even","because","against",
  "while","per","via","around","every","top","big","high","show","shows","video",
  "watch","look","must","report","reports","according","amid","set","see","take",
  "latest","need","know","much","part","could","called","well","going","come",
  "down","right","left","think","good","long","great","old","three","four","five",
]);

function extractTopics(titles: string[], maxTopics: number = 10): string[] {
  const freq = new Map<string, number>();

  for (const title of titles) {
    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

    const seen = new Set<string>();
    for (const word of words) {
      if (!seen.has(word)) {
        seen.add(word);
        freq.set(word, (freq.get(word) || 0) + 1);
      }
    }

    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!seen.has(bigram)) {
        seen.add(bigram);
        freq.set(bigram, (freq.get(bigram) || 0) + 1);
      }
    }
  }

  return [...freq.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => {
      const bigramBonus = (s: string) => (s.includes(" ") ? 1.5 : 1);
      return b[1] * bigramBonus(b[0]) - a[1] * bigramBonus(a[0]);
    })
    .slice(0, maxTopics)
    .map(([word]) => word);
}

interface TrendingTopicsProps {
  titles: string[];
  onTopicClick: (topic: string) => void;
  activeSearch: string;
}

export function TrendingTopics({ titles, onTopicClick, activeSearch }: TrendingTopicsProps) {
  const topics = useMemo(() => extractTopics(titles), [titles]);

  if (topics.length === 0) return null;

  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 animate-fade-in">
      <div className="flex items-center gap-1.5 flex-shrink-0 text-text-muted">
        <TrendingUp size={13} />
        <span className="text-[11px] font-semibold uppercase tracking-wider">Trending</span>
      </div>
      <div className="flex items-center gap-2">
        {topics.map((topic) => {
          const isActive = activeSearch.toLowerCase() === topic.toLowerCase();
          return (
            <button
              key={topic}
              onClick={() => onTopicClick(isActive ? "" : topic)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25"
                  : "bg-surface-tertiary text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent"
              }`}
            >
              {topic}
            </button>
          );
        })}
      </div>
    </div>
  );
}
