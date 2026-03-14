/**
 * GET /api/courses
 * Returns all courses for the authenticated user, newest first.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { coursesTable, chaptersTable, usersTable } from "@/config/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ courses: [], credits: 0 });
    }

    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ courses: [], credits: 0 });
    }

    const courses = await db
      .select({
        id: coursesTable.id,
        topic: coursesTable.topic,
        title: coursesTable.title,
        description: coursesTable.description,
        level: coursesTable.level,
        estimatedHours: coursesTable.estimatedHours,
        createdAt: coursesTable.createdAt,
        status: coursesTable.status,
        chapterCount: sql<number>`cast(count(${chaptersTable.id}) as int)`,
      })
      .from(coursesTable)
      .leftJoin(chaptersTable, eq(chaptersTable.courseId, coursesTable.id))
      .where(eq(coursesTable.userId, dbUser.id))
      .groupBy(coursesTable.id)
      .orderBy(desc(coursesTable.createdAt));

    return NextResponse.json({ courses, credits: dbUser.credits });
  } catch (err) {
    console.error("List courses error:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}