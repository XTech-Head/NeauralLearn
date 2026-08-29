"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  ChevronDown, ChevronUp, PlayCircle, BookText, Loader2, AlertCircle,
  Trophy, Clock, BarChart2, ArrowLeft, CheckCircle2, Circle,
  ExternalLink, Newspaper, Layers, RotateCw, CheckCheck, Download,
  Share2, Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { CourseWithChapters, QuizQuestion, Flashcard, Article } from "../../config/schema";

type QuizState = { selected: (number | null)[]; submitted: boolean; score: number };
type ProgressMap = Record<number, { completed: boolean; quizPassed: boolean }>;

function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="rounded-xl overflow-hidden aspect-video bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen className="w-full h-full"
      />
    </div>
  );
}

function QuizWidget({ questions, chapterId, onPass }: { questions: QuizQuestion[]; chapterId: number; onPass: () => void }) {
  const [state, setState] = useState<QuizState>({ selected: questions.map(() => null), submitted: false, score: 0 });

  const handleSelect = (qi: number, oi: number) => {
    if (state.submitted) return;
    setState(s => { const selected = [...s.selected]; selected[qi] = oi; return { ...s, selected }; });
  };

  const handleSubmit = () => {
    const score = questions.reduce((acc, q, i) => acc + (state.selected[i] === q.correctIndex ? 1 : 0), 0);
    setState(s => ({ ...s, submitted: true, score }));
    if (score >= Math.ceil(questions.length / 2)) onPass();
  };

  const handleReset = () => setState({ selected: questions.map(() => null), submitted: false, score: 0 });
  const allAnswered = state.selected.every(s => s !== null);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-base">Chapter Quiz</h3>
      </div>
      {state.submitted && (
        <div className={`rounded-xl p-4 border text-center space-y-1 ${
          state.score === questions.length ? "border-green-500/30 bg-green-500/10 text-green-400"
          : state.score >= Math.ceil(questions.length / 2) ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
          : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          <p className="text-2xl font-bold">{state.score}/{questions.length}</p>
          <p className="text-sm">{state.score === questions.length ? "Perfect score! 🎉" : state.score >= Math.ceil(questions.length / 2) ? "Passed! Review explanations below." : "Keep studying — you've got this!"}</p>
          <button onClick={handleReset} className="mt-2 text-xs underline underline-offset-2 opacity-70 hover:opacity-100">Retake quiz</button>
        </div>
      )}
      {questions.map((q, qi) => {
        const sel = state.selected[qi];
        const isCorrect = sel === q.correctIndex;
        return (
          <div key={qi} className="space-y-2">
            <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt, oi) => {
                let cls = "px-3 py-2 rounded-lg border text-sm text-left transition-colors cursor-pointer ";
                if (!state.submitted) cls += sel === oi ? "border-purple-500 bg-purple-500/20 text-purple-300" : "border-border hover:border-muted-foreground bg-card";
                else if (oi === q.correctIndex) cls += "border-green-500 bg-green-500/20 text-green-300";
                else if (sel === oi && !isCorrect) cls += "border-red-500 bg-red-500/20 text-red-300";
                else cls += "border-border bg-card opacity-50";
                return <button key={oi} className={cls} onClick={() => handleSelect(qi, oi)} disabled={state.submitted}>{opt}</button>;
              })}
            </div>
            {state.submitted && <p className="text-xs text-muted-foreground px-1">💡 {q.explanation}</p>}
          </div>
        );
      })}
      {!state.submitted && (
        <button onClick={handleSubmit} disabled={!allAnswered}
          className="w-full py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed">
          Submit Answers
        </button>
      )}
    </div>
  );
}

function FlashcardWidget({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const goNext = () => { setFlipped(false); setTimeout(() => setIndex(i => (i + 1) % cards.length), 150); };
  const goPrev = () => { setFlipped(false); setTimeout(() => setIndex(i => (i - 1 + cards.length) % cards.length), 150); };
  const card = cards[index];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-indigo-400" />
        <h3 className="font-semibold text-sm">Flashcards</h3>
        <span className="text-xs text-muted-foreground ml-auto">{index + 1} / {cards.length}</span>
      </div>
      <div onClick={() => setFlipped(f => !f)}
        className="cursor-pointer rounded-xl border border-border bg-linear-to-br from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10 transition-all p-6 min-h-30 flex flex-col items-center justify-center text-center select-none gap-2">
        <p className="text-xs text-muted-foreground mb-1">{flipped ? "Answer" : "Question — tap to reveal"}</p>
        <p className="text-sm font-medium leading-relaxed">{flipped ? card.back : card.front}</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button onClick={goPrev} className="flex-1 py-2 rounded-lg border border-border text-xs hover:bg-muted/40 transition">← Prev</button>
        <button onClick={() => setFlipped(f => !f)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs hover:bg-indigo-500/20 transition">
          <RotateCw className="w-3 h-3" /> Flip
        </button>
        <button onClick={goNext} className="flex-1 py-2 rounded-lg border border-border text-xs hover:bg-muted/40 transition">Next →</button>
      </div>
    </div>
  );
}

function ArticlesWidget({ articles }: { articles: Article[] }) {
  if (!articles?.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Newspaper className="w-4 h-4 text-emerald-400" />
        Further Reading
      </div>
      <div className="grid grid-cols-1 gap-2">
        {articles.map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl border border-border bg-card hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1 group-hover:text-emerald-400 transition-colors">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{a.snippet}</p>
              <p className="text-xs text-muted-foreground/50 mt-1">{a.source}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-emerald-400 shrink-0 mt-0.5 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}

function LessonContent({ markdown }: { markdown: string }) {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const safeMarkdown = escapeHtml(markdown || "");
  const html = safeMarkdown
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-6 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs font-mono">$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono my-2"><code>$1</code></pre>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '<p class="mt-3">')
    .replace(/\n/g, "<br/>");

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function ChapterCard({ chapter, index, isOpen, onToggle, progress, onMarkComplete, onQuizPass }: {
  chapter: CourseWithChapters["chapters"][0]; index: number; isOpen: boolean; onToggle: () => void;
  progress: { completed: boolean; quizPassed: boolean } | undefined;
  onMarkComplete: (id: number) => void; onQuizPass: (id: number) => void;
}) {
  const isReady = !!(chapter.lessonContent && chapter.lessonContent.length > 10);
  const video = chapter.youtubeVideo as { videoId: string; title: string; channelTitle: string } | null;
  const quizQuestions = (chapter.quiz?.questions ?? []) as QuizQuestion[];
  const flashcards = (chapter.flashcards ?? []) as Flashcard[];
  const articles = (chapter.articles ?? []) as Article[];
  const isCompleted = progress?.completed ?? false;
  const quizPassed = progress?.quizPassed ?? false;

  return (
    <div className={`overflow-hidden rounded-2xl border transition-all duration-200 ${isCompleted ? "border-green-500/30 bg-green-500/3" : "border-border bg-card/70 hover:border-purple-500/30"}`}>
      <button onClick={onToggle} className="w-full p-4 text-left transition-colors hover:bg-muted/20">
        <div className="flex items-center gap-4">
          <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold transition-all ${isCompleted ? "bg-green-500" : "bg-linear-to-br from-purple-600 to-pink-600"}`}>
            {isCompleted ? <CheckCheck className="w-4 h-4" /> : index + 1}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm md:text-base truncate">{chapter.title}</p>
              {!isReady && <span className="text-[10px] uppercase tracking-wide text-amber-400">Queued</span>}
              {isReady && <span className="text-[10px] uppercase tracking-wide text-emerald-400">Ready</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{chapter.description}</p>
          </div>

          <div className="hidden sm:flex items-center gap-3 shrink-0 ml-2 text-xs text-muted-foreground">
            {quizPassed && <span className="inline-flex items-center gap-1 text-yellow-400"><Trophy className="w-3 h-3" /> Passed</span>}
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{chapter.durationMinutes}m</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isReady && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border bg-linear-to-b from-muted/12 to-transparent p-4 md:p-5 space-y-6">
          {!isReady ? (
            <div className="flex items-center gap-3 py-10 justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Generating this chapter’s lesson…</span>
            </div>
          ) : (
            <>
              {video?.videoId && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <PlayCircle className="w-4 h-4 text-red-500" /> Video Lesson
                  </div>
                  <YouTubeEmbed videoId={video.videoId} title={video.title} />
                  <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookText className="w-4 h-4 text-blue-400" /> Lesson Notes
                </div>
                <div className="prose prose-sm prose-invert max-w-none rounded-2xl border border-border bg-background/60 p-4 text-sm leading-relaxed">
                  <LessonContent markdown={chapter.lessonContent} />
                </div>
              </div>

              {articles.length > 0 && <ArticlesWidget articles={articles} />}

              {flashcards.length > 0 && (
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <FlashcardWidget cards={flashcards} />
                </div>
              )}

              {quizQuestions.length > 0 && (
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <QuizWidget questions={quizQuestions} chapterId={chapter.id} onPass={() => onQuizPass(chapter.id)} />
                </div>
              )}

              <div className="pt-2 border-t border-border/50">
                <button onClick={() => onMarkComplete(chapter.id)}
                  className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all ${
                    isCompleted ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                    : "border-border hover:border-purple-500/40 hover:bg-purple-500/5 text-muted-foreground hover:text-foreground"}`}>
                  {isCompleted ? <><CheckCircle2 className="w-4 h-4" /> Completed</> : <><Circle className="w-4 h-4" /> Mark as complete</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CourseView({ courseId }: { courseId: number }) {
  const [course, setCourse] = useState<CourseWithChapters | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openChapter, setOpenChapter] = useState<number | null>(0);
  const [progress, setProgress] = useState<ProgressMap>({});
  const router = useRouter();

  const stripMarkdown = (value: string) =>
    (value || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#+\s*/gm, "")
      .replace(/^-\s+/gm, "• ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const exportToDocx = async () => {
    if (!course) return;

    const sections = [
      new Paragraph({
        text: course.title,
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        text: course.description,
      }),
      new Paragraph({
        text: `Level: ${course.level} | Estimated Hours: ${course.estimatedHours}`,
      }),
    ];

    for (const chapter of course.chapters ?? []) {
      sections.push(
        new Paragraph({
          text: `${chapter.order}. ${chapter.title}`,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: chapter.description,
        }),
        new Paragraph({
          text: stripMarkdown(chapter.lessonContent || "No lesson content generated yet."),
        })
      );
    }

    const doc = new Document({ sections: [{ children: sections }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course"}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCourse = async (format: "pdf" | "docx") => {
    if (!course) return;

    if (format === "docx") {
      await exportToDocx();
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 52;
    const margin = 52;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const title = course.title;
    const titleLines = doc.splitTextToSize(title, contentWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const description = doc.splitTextToSize(course.description || "", contentWidth);
    doc.text(description, margin, y);
    y += description.length * 16 + 18;

    for (const chapter of course.chapters ?? []) {
      if (y > 740) {
        doc.addPage();
        y = 52;
      }

      const chapterTitle = `${chapter.order}. ${chapter.title}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const chapterLines = doc.splitTextToSize(chapterTitle, contentWidth);
      doc.text(chapterLines, margin, y);
      y += chapterLines.length * 16 + 8;

      const lessonText = stripMarkdown(chapter.lessonContent || "No lesson content generated yet.");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const blocks = doc.splitTextToSize(lessonText, contentWidth);
      doc.text(blocks, margin, y, { maxWidth: contentWidth });
      y += blocks.length * 12 + 18;
    }

    const filename = `${course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course"}.pdf`;
    doc.save(filename);
  };

  const handleShareCourse = async () => {
    if (!course) return;

    const shareText = `${course.title} — ${course.description}\n\nView it in NeuralLearn: ${window.location.origin}/course/${course.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: course.title,
          text: shareText,
          url: `${window.location.origin}/course/${course.id}`,
        });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      alert("Course details copied to clipboard.");
    } catch (err) {
      console.warn("Share failed:", err);
      alert("Share is unavailable right now. You can still export the course as a JSON file.");
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;

    const confirmed = window.confirm(`Delete "${course.title}" from your account and database?`);
    if (!confirmed) return;

    const res = await fetch(`/api/course/${courseId}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete this course.");
      return;
    }

    router.push("/");
  };

  // ── Fetch course ────────────────────────────────────────────────────────────
  const fetchCourse = useCallback(async (): Promise<string> => {
    try {
      const res = await fetch(`/api/course/${courseId}`);

      // Clerk redirected to sign-in page — returns HTML not JSON
      if (res.redirected || res.headers.get("content-type")?.includes("text/html")) {
        console.warn("Got HTML from /api/course — auth timing issue, retrying…");
        return "generating";
      }

      // Session not ready yet — retry silently
      if (res.status === 401) {
        console.warn("401 on /api/course — session not ready, retrying…");
        return "generating";
      }

      if (!res.ok) {
        const text = await res.text();
        console.error(`/api/course/${courseId} error ${res.status}:`, text);
        throw new Error(`Failed to load course (${res.status})`);
      }

      // Read as text first — guard against HTML slipping through
      const text = await res.text();
      if (text.trim().startsWith("<")) {
        console.warn("Response looks like HTML, retrying…");
        return "generating";
      }

      const data: CourseWithChapters = JSON.parse(text);
      setCourse(data);
      return data.status;

    } catch (err: any) {
      if (err.message?.includes("Failed to load course")) {
        setError(err.message);
        return "failed";
      }
      // Transient error — keep polling
      console.warn("Transient fetch error, retrying:", err.message);
      return "generating";
    }
  }, [courseId]);

  // ── Polling ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const status = await fetchCourse();
      if (status === "generating") {
        timer = setTimeout(poll, 4000);
      } else if (status === "ready") {
        // Keep refreshing while on the page so new chapters appear
        timer = setTimeout(fetchCourse, 8000);
      }
      // "failed" → stop polling
    };

    // 800ms delay on mount — gives Clerk session cookie time to attach
    timer = setTimeout(poll, 800);

    return () => clearTimeout(timer);
  }, [fetchCourse]);

  // ── Progress ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/progress?courseId=${courseId}`)
      .then(r => r.json())
      .then(d => {
        const map: ProgressMap = {};
        for (const p of d.progress ?? []) map[p.chapterId] = { completed: p.completed, quizPassed: p.quizPassed };
        setProgress(map);
      }).catch(() => {});
  }, [courseId]);

  const handleMarkComplete = async (chapterId: number) => {
    const current = progress[chapterId]?.completed ?? false;
    setProgress(p => ({ ...p, [chapterId]: { ...p[chapterId], completed: !current } }));
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId, completed: !current }),
    }).catch(() => {});
  };

  const handleQuizPass = async (chapterId: number) => {
    setProgress(p => ({ ...p, [chapterId]: { ...p[chapterId], quizPassed: true } }));
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId, quizPassed: true }),
    }).catch(() => {});
  };

  const handleOpenChapter = async (chapter: CourseWithChapters["chapters"][0], index: number) => {
    const isOpening = openChapter !== index;
    setOpenChapter(isOpening ? index : null);

    if (!isOpening || (chapter.lessonContent && chapter.lessonContent.length > 10)) return;

    try {
      const response = await fetch(`/api/course/${courseId}/chapter/${chapter.id}`, {
        method: "POST",
      });

      if (!response.ok) {
        console.warn("Failed to generate chapter on demand:", await response.text());
        return;
      }

      await fetchCourse();
    } catch (err) {
      console.warn("Chapter generation request failed:", err);
    }
  };

  // ── Error state ───────────────────────────────────────────────────────────────
  if (error) return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
      <p className="text-lg font-semibold">Failed to load course</p>
      <p className="text-muted-foreground text-sm">{error}</p>
      <Link href="/" className="text-purple-400 hover:underline text-sm">← Back to home</Link>
    </div>
  );

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (!course) return (
    <div className="max-w-2xl mx-auto py-32 text-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" />
      <p className="text-muted-foreground text-sm">Loading your course…</p>
    </div>
  );

  // ── Derived state ─────────────────────────────────────────────────────────────
  const chapters = course.chapters ?? [];
  const readyChapters = chapters.filter(c => c.lessonContent && c.lessonContent.length > 10).length;
  const total = chapters.length;
  const generationPct = total > 0 ? (readyChapters / total) * 100 : 0;
  const completedCount = Object.values(progress).filter(p => p.completed).length;
  const completionPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const lazyGenerationNote = total > 0 && readyChapters < total
    ? `Open a chapter to generate its lesson content only when needed.`
    : "All chapters are ready.";

  const levelColor = {
    beginner: "text-green-400 bg-green-500/10 border-green-500/30",
    intermediate: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    advanced: "text-red-400 bg-red-500/10 border-red-500/30",
  }[course.level] ?? "text-muted-foreground bg-muted border-border";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleShareCourse}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-1.5 py-1">
            <button
              onClick={() => void handleExportCourse("pdf")}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={() => void handleExportCourse("docx")}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Word
            </button>
          </div>
          <button
            onClick={handleDeleteCourse}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Course header */}
      <div className="rounded-3xl border border-border bg-linear-to-br from-purple-500/8 via-background to-background p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${levelColor}`}>{course.level}</span>
          <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {course.estimatedHours}h estimated
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground flex items-center gap-1">
            <BarChart2 className="w-3 h-3" /> {total} chapters
          </span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{course.title}</h1>
            <p className="max-w-2xl text-sm md:text-base text-muted-foreground">{course.description}</p>
          </div>

          <div className="rounded-2xl border border-border bg-background/70 px-3 py-2 text-right min-w-42.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
            <p className="mt-1 text-xl font-semibold">{completionPct}%</p>
          </div>
        </div>

        {/* Generation progress bar */}
        {course.status === "generating" && (
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />Generating lessons…
              </span>
              <span>{readyChapters}/{total} chapters ready</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${generationPct}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground">{lazyGenerationNote}</p>
          </div>
        )}

        {/* User progress bar */}
        {course.status === "ready" && total > 0 && (
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-400" />Your progress
              </span>
              <span>{completedCount}/{total} completed ({completionPct}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-linear-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Chapter list */}
      <div className="space-y-3">
        {chapters.map((ch, i) => (
          <ChapterCard
            key={ch.id}
            chapter={ch}
            index={i}
            isOpen={openChapter === i}
            onToggle={() => handleOpenChapter(ch, i)}
            progress={progress[ch.id]}
            onMarkComplete={handleMarkComplete}
            onQuizPass={handleQuizPass}
          />
        ))}
      </div>
    </div>
  );
}