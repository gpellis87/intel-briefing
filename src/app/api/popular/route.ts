import { NextResponse } from "next/server";

const clickCounts = new Map<string, Map<string, number>>();
const categoryCounts = new Map<string, Map<string, number>>();

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
let kv: any = null;
let kvChecked = false;

async function getKV(): Promise<any> {
  if (kvChecked) return kv;
  kvChecked = true;
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const mod = await (Function('return import("@vercel/kv")')() as Promise<any>);
      kv = mod.kv;
      return kv;
    }
  } catch { /* not available */ }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET() {
  const dateKey = getDateKey();
  const kvClient = await getKV();

  if (kvClient) {
    try {
      const topArticles = await kvClient.zrevrange(`clicks:${dateKey}`, 0, 19, { withScores: true });
      const categoryStats = await kvClient.hgetall(`stats:${dateKey}`);

      const popular: { articleId: string; clicks: number }[] = [];
      for (let i = 0; i < topArticles.length; i += 2) {
        popular.push({
          articleId: topArticles[i],
          clicks: parseInt(topArticles[i + 1] || "0", 10),
        });
      }

      return NextResponse.json({ popular, categories: categoryStats || {} });
    } catch (err) {
      console.error("Popular KV error:", err);
    }
  }

  // Fallback to in-memory
  const map = clickCounts.get(dateKey) || new Map();
  const popular = [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([articleId, clicks]) => ({ articleId, clicks }));

  const catMap = categoryCounts.get(dateKey) || new Map();
  const categories = Object.fromEntries(catMap);

  return NextResponse.json({ popular, categories });
}
