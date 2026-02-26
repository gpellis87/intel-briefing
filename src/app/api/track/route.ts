import { NextRequest, NextResponse } from "next/server";

// In-memory fallback when Vercel KV is not configured
const clickCounts = new Map<string, Map<string, number>>();
const saveCounts = new Map<string, Map<string, number>>();
const categoryCounts = new Map<string, Map<string, number>>();

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getOrCreateMap(store: Map<string, Map<string, number>>, key: string): Map<string, number> {
  let map = store.get(key);
  if (!map) {
    map = new Map();
    store.set(key, map);
  }
  return map;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, action, category } = body;

    if (!articleId || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const dateKey = getDateKey();
    const kvClient = await getKV();

    if (kvClient) {
      const setKey = action === "save" ? `saves:${dateKey}` : `clicks:${dateKey}`;
      await kvClient.zincrby(setKey, 1, articleId);
      await kvClient.expire(setKey, 7 * 24 * 60 * 60);

      if (category) {
        await kvClient.hincrby(`stats:${dateKey}`, category, 1);
        await kvClient.expire(`stats:${dateKey}`, 7 * 24 * 60 * 60);
      }
    } else {
      const store = action === "save" ? saveCounts : clickCounts;
      const map = getOrCreateMap(store, dateKey);
      map.set(articleId, (map.get(articleId) || 0) + 1);

      if (category) {
        const catMap = getOrCreateMap(categoryCounts, dateKey);
        catMap.set(category, (catMap.get(category) || 0) + 1);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Track error:", err);
    return NextResponse.json({ error: "Track failed" }, { status: 500 });
  }
}
