/**
 * POST /api/progress
 * Body: { chapterId: number, completed: boolean, quizPassed?: boolean }
 * Saves/updates chapter completion for the current user.
 *
 * GET /api/progress?courseId=<id>
 * Returns all progress records for a course.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import {
  userProgressTable,
  usersTable,
  chaptersTable,
  coursesTable,
} from "@/config/schema";
import { eq, and, inArray } from "drizzle-orm";

async function getDbUser(email: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  return user ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await getDbUser(email);
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { chapterId, completed, quizPassed } = await req.json();
    if (!chapterId) return NextResponse.json({ error: "chapterId required" }, { status: 400 });

    // Upsert progress
    const existing = await db
      .select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.userId, dbUser.id),
          eq(userProgressTable.chapterId, chapterId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userProgressTable)
        .set({
          completed: completed ?? existing[0].completed,
          quizPassed: quizPassed ?? existing[0].quizPassed,
          completedAt: completed ? new Date() : existing[0].completedAt,
        })
        .where(eq(userProgressTable.id, existing[0].id));
    } else {
      await db.insert(userProgressTable).values({
        userId: dbUser.id,
        chapterId,
        completed: completed ?? false,
        quizPassed: quizPassed ?? false,
        completedAt: completed ? new Date() : null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Progress update error:", err);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) return NextResponse.json({ progress: [] });

    const dbUser = await getDbUser(email);
    if (!dbUser) return NextResponse.json({ progress: [] });

    const courseId = req.nextUrl.searchParams.get("courseId");
    if (!courseId) return NextResponse.json({ progress: [] });

    // Get all chapter IDs for this course
    const chapters = await db
      .select({ id: chaptersTable.id })
      .from(chaptersTable)
      .where(eq(chaptersTable.courseId, parseInt(courseId)));

    const chapterIds = chapters.map((c) => c.id);
    if (chapterIds.length === 0) return NextResponse.json({ progress: [] });

    const progress = await db
      .select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.userId, dbUser.id),
          inArray(userProgressTable.chapterId, chapterIds)
        )
      );

    return NextResponse.json({ progress });
  } catch (err) {
    console.error("Progress fetch error:", err);
    return NextResponse.json({ progress: [] });
  }
}