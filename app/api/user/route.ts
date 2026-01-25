import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  const clerkUser = await currentUser();

  if (!clerkUser || !clerkUser.primaryEmailAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = clerkUser.primaryEmailAddress.emailAddress;

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existingUser.length > 0) {
    return NextResponse.json(existingUser[0]);
  }

  // Create new user
  const newUser = await db
    .insert(usersTable)
    .values({
      name: clerkUser.fullName ?? "User",
      email,
    })
    .returning();

  return NextResponse.json(newUser[0]);
}
