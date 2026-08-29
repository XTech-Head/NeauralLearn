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

type ProviderError = {
  status: number;
  message: string;
  retryAfterMs?: number;
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getRetryAfterMs(res: Response): number | undefined {
  const retryAfter = res.headers.get("retry-after");

  if (!retryAfter) return undefined;

  const seconds = Number(retryAfter);

  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }

  const date = Date.parse(retryAfter);

  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return undefined;
}

function isRetryable(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  provider: string,
  model: string,
  maxRetries = 2
): Promise<Response> {
  let lastError: ProviderError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.ok) {
      return res;
    }

    const errorText = await res.text();

    lastError = {
      status: res.status,
      message: errorText,
      retryAfterMs: getRetryAfterMs(res),
    };

    // Permanent authentication / permission / bad-request errors.
    // Do NOT waste retries on these.
    if (!isRetryable(res.status)) {
      throw lastError;
    }

    if (attempt === maxRetries) {
      throw lastError;
    }

    const exponentialDelay = 1500 * Math.pow(2, attempt);

    const delay = Math.min(
      lastError.retryAfterMs ?? exponentialDelay,
      30000
    );

    console.warn(
      `[AI] ${provider}/${model} returned ${res.status}. ` +
      `Retrying in ${Math.round(delay / 1000)}s...`
    );

    await sleep(delay);
  }

  throw lastError ?? {
    status: 500,
    message: `${provider}/${model} failed without a response.`,
  };
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const modelCandidates = Array.from(
    new Set(
      [
        process.env.GROQ_MODEL,
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
      ].filter(Boolean)
    )
  ) as string[];

  let lastError: string | null = null;

  for (const model of modelCandidates) {
    try {
      const res = await fetchWithRetry(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.7,

            // Don't automatically request 4096 tokens
            // for every tiny quiz/flashcard operation.
            max_tokens: 2500,

            response_format: {
              type: "json_object",
            },

            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
          }),
        },
        "Groq",
        model,
        2
      );

      const data = await res.json();

      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error(
          `Groq ${model} returned an empty response.`
        );
      }

      return content;
    } catch (error) {
      const providerError = error as ProviderError;

      lastError =
        providerError?.message ??
        (error instanceof Error
          ? error.message
          : String(error));

      console.warn(
        `[AI] Groq/${model} unavailable (${providerError?.status ?? "unknown"}).`
      );

      // Don't try another model for authentication errors.
      if (
        providerError?.status === 401 ||
        providerError?.status === 403
      ) {
        break;
      }

      // Continue to next model.
    }
  }

  throw new Error(
    lastError ?? "Groq failed without a response."
  );
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const modelCandidates = Array.from(
    new Set(
      [
        process.env.GEMINI_MODEL,
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
      ].filter(Boolean)
    )
  ) as string[];

  let lastError: string | null = null;

  for (const model of modelCandidates) {
    try {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

      const res = await fetchWithRetry(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },

            contents: [
              {
                role: "user",
                parts: [{ text: userPrompt }],
              },
            ],

            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500,
              responseMimeType: "application/json",
            },
          }),
        },
        "Gemini",
        model,
        2
      );

      const data = await res.json();

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error(
          `Gemini ${model} returned an empty response.`
        );
      }

      return text;
    } catch (error) {
      const providerError = error as ProviderError;

      lastError =
        providerError?.message ??
        (error instanceof Error
          ? error.message
          : String(error));

      console.warn(
        `[AI] Gemini/${model} unavailable (${providerError?.status ?? "unknown"}).`
      );

      // Don't keep hammering a denied project/model.
      if (
        providerError?.status === 401 ||
        providerError?.status === 403
      ) {
        continue;
      }
    }
  }

  throw new Error(
    lastError ?? "Gemini failed without a response."
  );
}

// ─── Provider Orchestration ───────────────────────────────────────────────────

async function callAI(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const errors: string[] = [];

  // Primary: Groq
  if (process.env.GROQ_API_KEY) {
    try {
      return await callGroq(systemPrompt, userPrompt);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      errors.push(`Groq: ${message}`);

      console.warn(
        "[AI] Groq unavailable. Falling back to Gemini."
      );
    }
  }

  // Secondary: Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(systemPrompt, userPrompt);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      errors.push(`Gemini: ${message}`);

      console.warn(
        "[AI] Gemini unavailable."
      );
    }
  }

  throw new Error(
    `All AI providers failed.\n${errors.join("\n")}`
  );
}

// ─── JSON Parsing ─────────────────────────────────────────────────────────────

function safeParseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `AI returned invalid JSON: ${cleaned.slice(0, 500)}`
    );
  }
}

// ─── Course Outline ───────────────────────────────────────────────────────────

export async function generateCourseOutline(
  topic: string
): Promise<CourseOutline> {
  const system = `
You are an expert curriculum designer.

Always respond with valid JSON only.
Do not include markdown fences.
`;

  const user = `
Create a comprehensive course outline for: "${topic}"

Return ONLY a JSON object:

{
  "title": "Full course title",
  "description": "2-3 sentence course overview",
  "level": "beginner",
  "estimatedHours": 10,
  "chapters": [
    {
      "order": 1,
      "title": "Chapter title",
      "description": "What this chapter covers in 1-2 sentences",
      "durationMinutes": 20,
      "youtubeSearchQuery": "specific search query"
    }
  ]
}

Requirements:
- 6 to 8 chapters
- Progress logically from fundamentals to advanced concepts
- Each chapter must have a useful description
- youtubeSearchQuery must be specific
`;

  const raw = await callAI(system, user);

  return safeParseJSON<CourseOutline>(raw);
}

// ─── Lesson Content ───────────────────────────────────────────────────────────

export async function generateLessonContent(
  courseTitle: string,
  chapterTitle: string,
  chapterDescription: string
): Promise<string> {
  const system = `
You are an expert educator writing clear, engaging lesson content.

Always respond with valid JSON only.

Do NOT use triple backtick code fences inside JSON strings.
For code examples, use indentation and label them with "Example:".
`;

  const user = `
Write lesson content for:

Course: "${courseTitle}"
Chapter: "${chapterTitle}"
Description: "${chapterDescription}"

Return ONLY:

{
  "content": "Full lesson in plain markdown."
}

Include:
- Introduction
- Key concepts
- Practical examples
- Key takeaways

Target length: 400-600 words.
`;

  const raw = await callAI(system, user);

  const parsed = safeParseJSON<{ content: string }>(raw);

  return parsed.content;
}

// ─── Quiz Questions ───────────────────────────────────────────────────────────

export async function generateQuizQuestions(
  chapterTitle: string,
  lessonContent: string
): Promise<QuizQuestion[]> {
  const system = `
You are an expert educational assessment designer.

Always respond with valid JSON only.
`;

  const user = `
Create quiz questions for:

"${chapterTitle}"

Based on:

${lessonContent.slice(0, 1500)}

Return ONLY:

{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why this is correct."
    }
  ]
}

Requirements:
- Exactly 4 questions
- Exactly 4 options per question
- correctIndex must be 0, 1, 2, or 3
- Questions must test understanding, not trivial wording
`;

  const raw = await callAI(system, user);

  const parsed =
    safeParseJSON<{ questions: QuizQuestion[] }>(raw);

  return parsed.questions;
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

export async function generateFlashcards(
  chapterTitle: string,
  lessonContent: string
): Promise<Flashcard[]> {
  const system = `
You are an expert at creating educational flashcards.

Always respond with valid JSON only.
`;

  const user = `
Create flashcards for:

"${chapterTitle}"

Based on:

${lessonContent.slice(0, 1500)}

Return ONLY:

{
  "flashcards": [
    {
      "front": "Term or question",
      "back": "Definition or answer"
    }
  ]
}

Requirements:
- Exactly 6 flashcards
- Cover the most important concepts
- Keep fronts short
- Keep answers to 1-2 sentences
`;

  const raw = await callAI(system, user);

  const parsed =
    safeParseJSON<{ flashcards: Flashcard[] }>(raw);

  return parsed.flashcards;
}