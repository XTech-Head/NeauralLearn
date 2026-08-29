/**
 * POST /api/generate-course
 * Body: { topic: string }
 * 
 * KEY FIX: YouTube and articles logic is called directly here
 * instead of fetching /api/youtube and /api/articles internally.
 * Internal fetch() calls between serverless functions on Vercel
 * are unreliable and cause silent failures.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import {
  usersTable, coursesTable, chaptersTable, quizzesTable,
} from "@/config/schema";
import {
  generateCourseOutline, generateLessonContent,
  generateQuizQuestions, generateFlashcards,
} from "@/app/ai/ai";
import { eq, sql } from "drizzle-orm";
import { getAuthedDbUser } from "@/lib/server-auth";

// ─── YouTube (direct, no internal fetch) ─────────────────────────────────────

async function fetchYouTubeVideo(query: string) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) { console.warn("No YOUTUBE_API_KEY set"); return null; }

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("videoDuration", "medium");
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) { console.error("YouTube API error:", await res.text()); return null; }

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
    };
  } catch (err) {
    console.error("YouTube fetch failed:", err);
    return null;
  }
}

// ─── Articles (direct, no internal fetch) ────────────────────────────────────

async function fetchArticles(query: string) {
  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) { console.warn("No SERPER_API_KEY set"); return []; }

    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: `${query} tutorial guide`, num: 6 }),
    });

    const data = await res.json();
    return (data.organic ?? [])
      .filter((r: any) => r.title && r.link && r.snippet)
      .slice(0, 4)
      .map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
        source: new URL(r.link).hostname.replace("www.", ""),
      }));
  } catch (err) {
    console.error("Articles fetch failed:", err);
    return [];
  }
}

// ─── DB user ──────────────────────────────────────────────────────────────────

async function getOrCreateDbUser(email: string, name: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(usersTable).values({ name, email, credits: 100 }).returning();
  return created;
}

// ─── Background enrichment: chapter-by-chapter generation ───────────────────

async function enrichCourseInBackground(
  courseId: number,
  courseTitle: string,
  chapters: { id: number; title: string; description: string; youtubeSearchQuery: string }[]
) {
  for (const chapter of chapters) {
    try {
      console.log(`Generating chapter ${chapter.title}...`);

      const content = await generateLessonContent(courseTitle, chapter.title, chapter.description);
      const video = await fetchYouTubeVideo(chapter.youtubeSearchQuery);
      const articles = await fetchArticles(`${chapter.title} ${courseTitle}`);

      console.log(`Chapter "${chapter.title}" — video: ${video?.videoId ?? "none"}, articles: ${articles.length}`);

      let questions: any[] = [];
      let flashcards: any[] = [];

      if (content) {
        questions = await generateQuizQuestions(chapter.title, content).catch(() => []);
        flashcards = await generateFlashcards(chapter.title, content).catch(() => []);
      }

      await db.update(chaptersTable)
        .set({
          lessonContent: content,
          youtubeVideo: video,
          articles: articles as any,
          flashcards: flashcards as any,
        })
        .where(eq(chaptersTable.id, chapter.id));

      if (questions.length > 0) {
        await db.insert(quizzesTable)
          .values({ chapterId: chapter.id, questions })
          .onConflictDoNothing();
      }

      console.log(`Chapter ${chapter.id} generated successfully`);
    } catch (err) {
      console.error(`Failed to generate chapter ${chapter.id}:`, err);
    }
  }

  await db.update(coursesTable).set({ status: "ready" }).where(eq(coursesTable.id, courseId));
  console.log(`Course ${courseId} marked as ready`);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { user: dbUser, error, status } = await getAuthedDbUser();
    if (!dbUser || error) {
      return NextResponse.json({ error }, { status });
    }

    const { topic } = await req.json();
    const normalizedTopic = typeof topic === "string" ? topic.replace(/[\u0000-\u001F\u007F]/g, " ").trim() : "";

    if (!normalizedTopic || normalizedTopic.length < 3 || normalizedTopic.length > 160) {
      return NextResponse.json({ error: "Topic must be between 3 and 160 characters." }, { status: 400 });
    }

    const clerkUser = await currentUser();
    const name = `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() || "User";

    if (dbUser.credits <= 0) {
      return NextResponse.json({ error: "No credits remaining." }, { status: 402 });
    }

    await db.update(usersTable)
      .set({ credits: sql`${usersTable.credits} - 1` })
      .where(eq(usersTable.id, dbUser.id));

    const outline = await generateCourseOutline(normalizedTopic);

    const [course] = await db.insert(coursesTable).values({
      userId: dbUser.id,
      topic: normalizedTopic,
      title: outline.title,
      description: outline.description,
      level: outline.level,
      estimatedHours: outline.estimatedHours,
      status: "generating",
    }).returning();

    const insertedChapters = await db.insert(chaptersTable).values(
      outline.chapters.map((ch) => ({
        courseId: course.id,
        order: ch.order,
        title: ch.title,
        description: ch.description,
        durationMinutes: ch.durationMinutes,
        lessonContent: "",
        youtubeVideo: null,
        articles: [],
        flashcards: [],
      }))
    ).returning();

    const chapterMeta = insertedChapters.map((c, i) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      youtubeSearchQuery: outline.chapters[i].youtubeSearchQuery,
    }));

    // Fire enrichment without awaiting — returns response immediately
    enrichCourseInBackground(course.id, course.title, chapterMeta).catch((err) => {
      console.error("Background enrichment error:", err);
      db.update(coursesTable)
        .set({ status: "failed" })
        .where(eq(coursesTable.id, course.id))
        .catch(console.error);
    });

    return NextResponse.json({
      courseId: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      chaptersCount: insertedChapters.length,
    });

  } catch (err) {
    console.error("Course generation error:", err);
    return NextResponse.json({ error: "Failed to generate course. Please try again." }, { status: 500 });
  }
}