"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  BarChart2,
  Loader2,
  Sparkles,
  ChevronRight,
  Zap,
  GraduationCap,
  AlertCircle,
} from "lucide-react";

type CourseItem = {
  id: number;
  topic: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  createdAt: string;
  status: "generating" | "ready" | "failed";
  chapterCount: number;
};

const levelStyles = {
  beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  advanced: "text-rose-400 bg-rose-500/10 border-rose-500/25",
};

const statusDot = {
  generating: "bg-yellow-400 animate-pulse",
  ready: "bg-emerald-400",
  failed: "bg-red-400",
};

const statusLabel = {
  generating: "Generating…",
  ready: "Ready",
  failed: "Failed",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MyCourses() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => {
        setCourses(d.courses ?? []);
        setCredits(d.credits ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Poll while any course is still generating
  useEffect(() => {
    const hasGenerating = courses.some((c) => c.status === "generating");
    if (!hasGenerating) return;
    const t = setInterval(() => {
      fetch("/api/courses")
        .then((r) => r.json())
        .then((d) => setCourses(d.courses ?? []));
    }, 5000);
    return () => clearInterval(t);
  }, [courses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold">My Courses</h2>
          {courses.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {courses.length}
            </span>
          )}
        </div>

        {credits !== null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>
              <span className="font-semibold text-foreground">{credits}</span> credits
            </span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border flex flex-col items-center justify-center py-16 gap-3 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No courses yet</p>
          <p className="text-sm text-muted-foreground/60">
            Generate your first course above to get started.
          </p>
        </div>
      )}

      {/* Course grid */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, i) => (
            <Link
              key={course.id}
              href={`/course/${course.id}`}
              className="group relative rounded-2xl border border-border bg-card hover:border-purple-500/40 hover:bg-purple-500/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/5 flex flex-col overflow-hidden"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Top accent bar */}
              <div
                className={`h-0.5 w-full ${
                  course.status === "ready"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : course.status === "generating"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-400 animate-pulse"
                    : "bg-red-500/50"
                }`}
              />

              <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Status + level */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${
                      levelStyles[course.level] ?? "text-muted-foreground bg-muted border-border"
                    }`}
                  >
                    {course.level}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[course.status]}`} />
                    <span className="text-xs text-muted-foreground">
                      {statusLabel[course.status]}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {course.chapterCount} ch
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.estimatedHours}h
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/60">
                    {timeAgo(course.createdAt)}
                  </span>
                </div>
              </div>

              {/* Hover arrow */}
              <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </div>

              {/* Generating overlay shimmer */}
              {course.status === "generating" && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}