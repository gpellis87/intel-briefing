import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/lib/news-fetcher";
import type { NewsCategory } from "@/types";

const VALID_CATEGORIES: NewsCategory[] = [
  "general",
  "politics",
  "technology",
  "business",
  "science",
  "sports",
  "health",
  "entertainment",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") || "general") as NewsCategory;
  const country = searchParams.get("country") || "us";

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "Invalid category" },
      { status: 400 }
    );
  }

  try {
    const articles = await fetchNews(category, country);

    return NextResponse.json({
      articles,
      total: articles.length,
      category,
    });
  } catch (error) {
    console.error("News API route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
