export type BiasRating =
  | "far-left"
  | "left"
  | "center-left"
  | "center"
  | "center-right"
  | "right"
  | "far-right";

export type BiasDirection = "left" | "center" | "right";

export interface SourceBiasData {
  name: string;
  domain: string;
  bias: BiasRating;
  reliability: number;
  country: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  content: string | null;
}

export interface EnrichedArticle extends NewsArticle {
  bias: BiasRating | null;
  biasDirection: BiasDirection | null;
  reliability: number | null;
  sourceDomain: string;
}

export type NewsCategory =
  | "general"
  | "politics"
  | "technology"
  | "business"
  | "science"
  | "sports"
  | "health"
  | "entertainment"
  | "local";

export interface NewsCategoryConfig {
  id: NewsCategory;
  label: string;
  icon: string;
  newsApiCategory?: string;
  query?: string;
}
