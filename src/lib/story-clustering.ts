import type { EnrichedArticle } from "@/types";

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","it","its","as","are","was","were","be","been","has","have","had",
  "do","does","did","will","would","could","should","may","might","can","this",
  "that","these","those","he","she","they","we","you","i","my","his","her","our",
  "their","your","who","what","which","when","where","how","why","not","no","so",
  "if","than","then","just","also","about","up","out","more","some","only","other",
  "new","over","after","into","all","says","said","get","got","back","now","one",
  "two","first","last","year","years","day","time","most","being","make","like",
  "before","between","each","under","here","own","through","during","both","same",
  "off","way","still","many","even","because","against","while","per","via",
  "report","reports","says","said","show","shows","according","latest","need",
]);

function extractKeywords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface StoryClusterData {
  id: string;
  lead: EnrichedArticle;
  articles: EnrichedArticle[];
  keywords: string[];
}

const SIMILARITY_THRESHOLD = 0.25;

export function clusterArticles(articles: EnrichedArticle[]): StoryClusterData[] {
  if (articles.length === 0) return [];

  const keywordSets = articles.map((a) => extractKeywords(a.title));
  const assigned = new Set<number>();
  const clusters: StoryClusterData[] = [];

  for (let i = 0; i < articles.length; i++) {
    if (assigned.has(i)) continue;

    const cluster: number[] = [i];
    assigned.add(i);

    for (let j = i + 1; j < articles.length; j++) {
      if (assigned.has(j)) continue;
      const sim = jaccardSimilarity(keywordSets[i], keywordSets[j]);
      if (sim >= SIMILARITY_THRESHOLD) {
        cluster.push(j);
        assigned.add(j);
      }
    }

    const clusterArticles = cluster.map((idx) => articles[idx]);

    const lead =
      clusterArticles.reduce((best, a) =>
        (a.reliability || 0) > (best.reliability || 0) ? a : best
      );

    const allKeywords = new Set<string>();
    for (const idx of cluster) {
      for (const kw of keywordSets[idx]) allKeywords.add(kw);
    }

    clusters.push({
      id: `cluster-${i}`,
      lead,
      articles: clusterArticles,
      keywords: [...allKeywords].slice(0, 5),
    });
  }

  return clusters.sort((a, b) => b.articles.length - a.articles.length);
}
