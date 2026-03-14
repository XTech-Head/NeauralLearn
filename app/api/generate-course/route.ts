/**
 * POST /api/generate-course
 * Body: { topic: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import {
  usersTable,
  coursesTable,
  chaptersTable,
  quizzesTable,
} from "@/config/schema";
import {
  generateCourseOutline,
  generateLessonContent,
  generateQuizQuestions,
  generateFlashcards,
} from "@/app/ai/ai";
import { eq, sql } from "drizzle-orm";

/**
 * Drop-in replacement for fetchYouTubeVideo in /api/generate-course/route.ts
 *
 * PROBLEM: The old version called /api/youtube via HTTP (self-calling),
 * which silently fails during background generation because:
 *   - NEXT_PUBLIC_APP_URL may not be set
 *   - VERCEL_URL changes per deployment
 *   - Internal HTTP calls time out silently, catch returns null
 *
 * FIX: Call the YouTube Data API directly — no HTTP round-trip.
 */

async function fetchYouTubeVideo(query: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[YouTube] YOUTUBE_API_KEY is not set — skipping video fetch");
    return null;
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("videoDuration", "medium"); // 4–20 min tutorials
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());

    if (!res.ok) {
      const errText = await res.text();
      console.error("[YouTube] API error:", res.status, errText);
      return null;
    }

    const data = await res.json();
    const item = data.items?.[0];

    if (!item) {
      console.warn("[YouTube] No results for query:", query);
      return null;
    }

    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url ||
        "",
    };
  } catch (err) {
    console.error("[YouTube] Fetch failed for query:", query, err);
    return null;
  }
}

async function fetchArticles(query: string) {
  try {
    if (!process.env.SERPER_API_KEY) return [];
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.SERPER_API_KEY,
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
  } catch {
    return [];
  }
}

async function getOrCreateDbUser(clerkId: string, email: string, name: string) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db
    .insert(usersTable)
    .values({ name, email, credits: 100 })
    .returning();
  return created;
}

async function enrichCourseInBackground(
  courseId: number,
  courseTitle: string,
  chapterIds: { id: number; title: string; description: string; youtubeSearchQuery: string }[]
) {
  for (const chapter of chapterIds) {
    try {
      const [lessonResult, videoResult, articlesResult] = await Promise.allSettled([
        generateLessonContent(courseTitle, chapter.title, chapter.description),
        fetchYouTubeVideo(chapter.youtubeSearchQuery),
        fetchArticles(`${chapter.title} ${courseTitle}`),
      ]);

      const content = lessonResult.status === "fulfilled" ? lessonResult.value : "";
      const video = videoResult.status === "fulfilled" ? videoResult.value : null;
      const articles = articlesResult.status === "fulfilled" ? articlesResult.value : [];

      // Generate quiz + flashcards from lesson content
      let questions: any[] = [];
      let flashcards: any[] = [];

      if (content) {
        const [quizResult, flashResult] = await Promise.allSettled([
          generateQuizQuestions(chapter.title, content),
          generateFlashcards(chapter.title, content),
        ]);
        if (quizResult.status === "fulfilled") questions = quizResult.value;
        if (flashResult.status === "fulfilled") flashcards = flashResult.value;
      }

      await db
        .update(chaptersTable)
        .set({
          lessonContent: content,
          youtubeVideo: video,
          articles: articles as any,
          flashcards: flashcards as any,
        })
        .where(eq(chaptersTable.id, chapter.id));

      if (questions.length > 0) {
        await db
          .insert(quizzesTable)
          .values({ chapterId: chapter.id, questions })
          .onConflictDoNothing();
      }
    } catch (err) {
      console.error(`Failed to enrich chapter ${chapter.id}:`, err);
    }
  }

  await db
    .update(coursesTable)
    .set({ status: "ready" })
    .where(eq(coursesTable.id, courseId));
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topic } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return NextResponse.json({ error: "Topic is too short" }, { status: 400 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${clerkId}@unknown.com`;
    const name = `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() || "User";

    const dbUser = await getOrCreateDbUser(clerkId, email, name);

    if (dbUser.credits <= 0) {
      return NextResponse.json({ error: "No credits remaining." }, { status: 402 });
    }

    await db
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} - 1` })
      .where(eq(usersTable.id, dbUser.id));

    const outline = await generateCourseOutline(topic.trim());

    const [course] = await db
      .insert(coursesTable)
      .values({
        userId: dbUser.id,
        topic: topic.trim(),
        title: outline.title,
        description: outline.description,
        level: outline.level,
        estimatedHours: outline.estimatedHours,
        status: "generating",
      })
      .returning();

    const insertedChapters = await db
      .insert(chaptersTable)
      .values(
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
      )
      .returning();

    const chapterMeta = insertedChapters.map((c, i) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      youtubeSearchQuery: outline.chapters[i].youtubeSearchQuery,
    }));

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