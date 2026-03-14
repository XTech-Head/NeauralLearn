import {
  integer,
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer().notNull().default(100),
});

export const coursesTable = pgTable("courses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  topic: varchar({ length: 500 }).notNull(),
  title: varchar({ length: 500 }).notNull(),
  description: text().notNull(),
  level: varchar({ length: 50 }).notNull().default("beginner"),
  estimatedHours: integer("estimated_hours").notNull().default(2),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: varchar({ length: 50 }).notNull().default("generating"),
});

export const chaptersTable = pgTable("chapters", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  order: integer().notNull(),
  title: varchar({ length: 500 }).notNull(),
  description: text().notNull(),
  lessonContent: text("lesson_content").notNull().default(""),
  youtubeVideo: jsonb("youtube_video"),
  durationMinutes: integer("duration_minutes").notNull().default(15),
  articles: jsonb("articles").default([]),
  flashcards: jsonb("flashcards").default([]),
});

export const quizzesTable = pgTable("quizzes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  chapterId: integer("chapter_id").notNull().references(() => chaptersTable.id, { onDelete: "cascade" }),
  questions: jsonb("questions").notNull().default([]),
});

export const userProgressTable = pgTable("user_progress", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")          // ← add "user_id" as the DB column name
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id")    // ← add "chapter_id" as the DB column name
    .notNull()
    .references(() => chaptersTable.id, { onDelete: "cascade" }),
  completed: boolean().notNull().default(false),
  quizPassed: boolean("quiz_passed").notNull().default(false),  // ← map this too
  completedAt: timestamp("completed_at"),  // ← and this
});

// ─── Types ─────────────────────────────────────────────────────────────────────

export type User = typeof usersTable.$inferSelect;
export type Course = typeof coursesTable.$inferSelect;
export type Chapter = typeof chaptersTable.$inferSelect;
export type Quiz = typeof quizzesTable.$inferSelect;
export type UserProgress = typeof userProgressTable.$inferSelect;

export type YoutubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Flashcard = {
  front: string;
  back: string;
};

export type Article = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

export type ChapterWithQuiz = Chapter & {
  quiz?: Quiz;
  progress?: UserProgress;
};

export type CourseWithChapters = Course & {
  chapters: ChapterWithQuiz[];
};