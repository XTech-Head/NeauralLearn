/**
 * GET /api/youtube?q=<search query>
 *
 * Uses YouTube Data API v3 (free, 10,000 units/day).
 * Set YOUTUBE_API_KEY in .env.local
 * Get key: https://console.cloud.google.com → Enable YouTube Data API v3
 */

import { NextRequest, NextResponse } from "next/server";
import { YoutubeVideo } from "@/config/schema";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing query param q" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Return a placeholder if no API key — graceful degradation
    return NextResponse.json({ video: null });
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", q);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("videoDuration", "medium"); // 4–20 min tutorials
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("YouTube API error:", await res.text());
      return NextResponse.json({ video: null });
    }

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return NextResponse.json({ video: null });

    const video: YoutubeVideo = {
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url ||
        "",
    };

    return NextResponse.json({ video });
  } catch (err) {
    console.error("YouTube search failed:", err);
    return NextResponse.json({ video: null });
  }
}