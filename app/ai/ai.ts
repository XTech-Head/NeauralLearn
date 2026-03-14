/**
 * AI abstraction: Groq (primary, llama-3.3-70b) → Gemini (fallback, gemini-2.0-flash)
 */

import { QuizQuestion } from "../../config/schema";

export type CourseOutline = {
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  chapters: {
    order: number;
    title: string;
    description: string;
    durationMinutes: number;
    youtubeSearchQuery: string;
  }[];
};

export type Flashcard = {
  front: string;
  back: string;
};

// ─── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (process.env.GROQ_API_KEY) {
    try {
      return await callGroq(systemPrompt, userPrompt);
    } catch (e) {
      console.warn("Groq failed, falling back to Gemini:", e);
    }
  }
  if (process.env.GEMINI_API_KEY) {
    return await callGemini(systemPrompt, userPrompt);
  }
  throw new Error("No AI API keys configured.");
}

function safeParseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(cleaned) as T;
}

// ─── Course Outline ───────────────────────────────────────────────────────────

export async function generateCourseOutline(topic: string): Promise<CourseOutline> {
  const system = `You are an expert curriculum designer. Always respond with valid JSON only.`;

  const user = `Create a comprehensive course outline for: "${topic}"

Return ONLY a JSON object:
{
  "title": "Full course title",
  "description": "2-3 sentence course overview",
  "level": "beginner" | "intermediate" | "advanced",
  "estimatedHours": <number>,
  "chapters": [
    {
      "order": 1,
      "title": "Chapter title",
      "description": "What this chapter covers in 1-2 sentences",
      "durationMinutes": 20,
      "youtubeSearchQuery": "specific search query to find a tutorial video"
    }
  ]
}

Requirements:
- 6 to 8 chapters, progressing logically
- youtubeSearchQuery should be specific (e.g. "Python list comprehension tutorial beginner")`;

  const raw = await callAI(system, user);
  return safeParseJSON<CourseOutline>(raw);
}

// ─── Lesson Content ───────────────────────────────────────────────────────────

export async function generateLessonContent(
  courseTitle: string,
  chapterTitle: string,
  chapterDescription: string
): Promise<string> {
  const system = `You are an expert educator writing clear, engaging lesson content.
Always respond with valid JSON only.
CRITICAL: Do NOT use triple backtick code fences inside the JSON string value.
Show code examples using plain indentation labeled with "Example:" prefix.`;

  const user = `Write lesson content for:
Course: "${courseTitle}"
Chapter: "${chapterTitle}"
Description: "${chapterDescription}"

Return ONLY:
{
  "content": "Your full lesson in plain markdown. Include: introduction, key concepts, practical examples (NO triple backticks), key takeaways. 400-600 words."
}`;

  const raw = await callAI(system, user);
  const parsed = safeParseJSON<{ content: string }>(raw);
  return parsed.content;
}

// ─── Quiz Questions ───────────────────────────────────────────────────────────

export async function generateQuizQuestions(
  chapterTitle: string,
  lessonContent: string
): Promise<QuizQuestion[]> {
  const system = `You are an expert at creating educational quiz questions. Always respond with valid JSON only.`;

  const user = `Create quiz questions for: "${chapterTitle}"

Based on:
${lessonContent.slice(0, 1500)}

Return ONLY:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why this is correct, 1-2 sentences"
    }
  ]
}

Exactly 4 questions, each with exactly 4 options, correctIndex 0-3.`;

  const raw = await callAI(system, user);
  const parsed = safeParseJSON<{ questions: QuizQuestion[] }>(raw);
  return parsed.questions;
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

export async function generateFlashcards(
  chapterTitle: string,
  lessonContent: string
): Promise<Flashcard[]> {
  const system = `You are an expert at creating educational flashcards. Always respond with valid JSON only.`;

  const user = `Create flashcards for: "${chapterTitle}"

Based on:
${lessonContent.slice(0, 1500)}

Return ONLY:
{
  "flashcards": [
    {
      "front": "Term or question (keep it short)",
      "back": "Definition or answer (1-2 sentences max)"
    }
  ]
}

Create exactly 6 flashcards covering the most important concepts.`;

  const raw = await callAI(system, user);
  const parsed = safeParseJSON<{ flashcards: Flashcard[] }>(raw);
  return parsed.flashcards;
}