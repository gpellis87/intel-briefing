import { NextResponse } from "next/server";
import { getApiStatus } from "@/lib/news-fetcher";

export async function GET() {
  return NextResponse.json(getApiStatus());
}
