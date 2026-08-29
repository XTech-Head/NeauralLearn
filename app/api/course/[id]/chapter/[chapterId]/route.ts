/**
 * POST /api/course/[id]/chapter/[chapterId]
 * Generates a single chapter on demand when a user opens it.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { coursesTable, chaptersTable, quizzesTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { generateLessonContent, generateQuizQuestions, generateFlashcards } from "@/app/ai/ai";
import { getAuthedDbUser } from "@/lib/server-auth";

async function fetchYouTubeVideo(query: string) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null;

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
    if (!res.ok) {
      console.error("YouTube API error:", await res.text());
      return null;
    }

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

async function fetchArticles(query: string) {
  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return [];

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { user: dbUser, error, status } = await getAuthedDbUser();
    if (!dbUser || error) {
      return NextResponse.json({ error }, { status });
    }

    const { id, chapterId } = await params;
    const courseId = Number(id);
    const chapterDatabaseId = Number(chapterId);

    if (Number.isNaN(courseId) || Number.isNaN(chapterDatabaseId)) {
      return NextResponse.json({ error: "Invalid course or chapter ID" }, { status: 400 });
    }

    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [chapter] = await db
      .select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, chapterDatabaseId))
      .limit(1);

    if (!chapter || chapter.courseId !== courseId) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    if (chapter.lessonContent && chapter.lessonContent.length > 10) {
      return NextResponse.json({ success: true, alreadyGenerated: true, chapterId: chapter.id });
    }

    const content = await generateLessonContent(course.title, chapter.title, chapter.description);
    const video = await fetchYouTubeVideo(`${chapter.title} ${course.title} tutorial`);
    const articles = await fetchArticles(`${chapter.title} ${course.title}`);

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

    return NextResponse.json({ success: true, chapterId: chapter.id, generated: true });
  } catch (err) {
    console.error("Generate chapter error:", err);
    return NextResponse.json({ error: "Failed to generate chapter" }, { status: 500 });
  }
}
