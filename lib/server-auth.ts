import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";

export async function getAuthedDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { user: null, error: "Unauthorized" as const, status: 401 };
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) {
    return { user: null, error: "Unauthorized" as const, status: 401 };
  }

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!dbUser) {
    return { user: null, error: "User not found" as const, status: 404 };
  }

  return { user: dbUser, error: null, status: 200 };
}
