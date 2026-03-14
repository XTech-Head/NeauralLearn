/**
 * GET /api/articles?q=<query>
 * Returns top 4 articles for a chapter topic using Serper API (free tier: 2,500/month)
 * Get your key at https://serper.dev
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ articles: [] });

  if (!process.env.SERPER_API_KEY) {
    return NextResponse.json({ articles: [] });
  }

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.SERPER_API_KEY,
      },
      body: JSON.stringify({ q: `${q} tutorial guide`, num: 6 }),
    });

    const data = await res.json();

    const articles = (data.organic ?? [])
      .filter((r: any) => r.title && r.link && r.snippet)
      .slice(0, 4)
      .map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
        source: new URL(r.link).hostname.replace("www.", ""),
      }));

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("Articles fetch error:", err);
    return NextResponse.json({ articles: [] });
  }
}