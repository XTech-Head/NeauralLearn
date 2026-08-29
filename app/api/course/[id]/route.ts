/**
 * GET /api/course/[id]
 * Returns a single course with chapters and quizzes for the authenticated user.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { coursesTable, chaptersTable, quizzesTable } from "@/config/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { getAuthedDbUser } from "@/lib/server-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: dbUser, error, status } = await getAuthedDbUser();
    if (!dbUser || error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    // Get course
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Ownership check
    if (course.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get chapters
    const chapters = await db
      .select()
      .from(chaptersTable)
      .where(eq(chaptersTable.courseId, courseId))
      .orderBy(asc(chaptersTable.order));

    // Get quizzes for all chapters
    const chapterIds = chapters.map((c) => c.id);
    const quizzes =
      chapterIds.length > 0
        ? await db
            .select()
            .from(quizzesTable)
            .where(inArray(quizzesTable.chapterId, chapterIds))
        : [];

    // Merge quizzes into chapters (articles + flashcards already on chapter rows)
    const chaptersWithQuizzes = chapters.map((ch) => ({
      ...ch,
      quiz: quizzes.find((q) => q.chapterId === ch.id) ?? null,
      articles: (ch as any).articles ?? [],
      flashcards: (ch as any).flashcards ?? [],
    }));

    const readyCount = chaptersWithQuizzes.filter((c) => c.lessonContent && c.lessonContent.length > 10).length;

    return NextResponse.json(
      {
        ...course,
        chapters: chaptersWithQuizzes,
        readyCount,
        totalCount: chapters.length,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Get course error:", err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: dbUser, error, status } = await getAuthedDbUser();
    if (!dbUser || error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
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

    await db.delete(coursesTable).where(eq(coursesTable.id, courseId));

    return NextResponse.json({ success: true, deletedCourseId: courseId });
  } catch (err) {
    console.error("Delete course error:", err);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}