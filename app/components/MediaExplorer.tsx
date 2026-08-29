"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PlayCircle,
  Newspaper,
  ExternalLink,
  ChevronRight,
  Search,
  X,
  Layers,
  BookOpen,
  Clock,
  Radio,
  Filter,
} from "lucide-react";
import { CourseWithChapters, Article } from "../../config/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "videos" | "articles";

type ChapterMedia = {
  chapterId: number;
  chapterTitle: string;
  chapterOrder: number;
  durationMinutes: number;
  video: {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
  } | null;
  articles: Article[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function youtubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VideoCard({
  item,
  isActive,
  onClick,
}: {
  item: ChapterMedia;
  isActive: boolean;
  onClick: () => void;
}) {
  const v = item.video!;
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-xl border transition-all duration-200 overflow-hidden ${
        isActive
          ? "border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/30"
          : "border-border bg-card hover:border-purple-500/30 hover:bg-purple-500/5"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video overflow-hidden bg-black">
        <img
          src={v.thumbnail || youtubeThumbnail(v.videoId)}
          alt={v.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Play overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
            isActive ? "bg-black/30" : "bg-black/50 group-hover:bg-black/30"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              isActive
                ? "bg-purple-500 scale-110"
                : "bg-white/20 backdrop-blur group-hover:bg-purple-500 group-hover:scale-110"
            }`}
          >
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
        </div>
        {/* Chapter badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/70 text-white/80 backdrop-blur">
            Ch. {item.chapterOrder + 1}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-xs font-semibold line-clamp-2 leading-snug">{v.title}</p>
        <p className="text-[11px] text-muted-foreground">{v.channelTitle}</p>
        <p className="text-[10px] text-purple-400/80 font-medium truncate">{item.chapterTitle}</p>
      </div>
    </button>
  );
}

function ArticleCard({ article, chapterTitle }: { article: Article; chapterTitle: string }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 p-3 rounded-xl border border-border bg-card hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200"
    >
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
        <Newspaper className="w-4 h-4 text-emerald-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold line-clamp-1 group-hover:text-emerald-400 transition-colors">
          {article.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {article.snippet}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground/60 font-medium">{article.source}</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[10px] text-purple-400/70 truncate">{chapterTitle}</span>
        </div>
      </div>

      <ExternalLink className="shrink-0 w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-emerald-400 transition-colors mt-1" />
    </a>
  );
}

function VideoPlayer({
  item,
  onClose,
}: {
  item: ChapterMedia;
  onClose: () => void;
}) {
  const v = item.video!;
  return (
    <div className="rounded-2xl border border-purple-500/30 bg-card overflow-hidden shadow-2xl shadow-purple-500/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-semibold text-purple-400">Now Playing</span>
          <span className="text-xs text-muted-foreground">· Ch. {item.chapterOrder + 1} — {item.chapterTitle}</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted/60 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Embed */}
      <div className="aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${v.videoId}?autoplay=1&modestbranding=1&rel=0`}
          title={v.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 space-y-0.5">
        <p className="text-sm font-semibold line-clamp-1">{v.title}</p>
        <p className="text-xs text-muted-foreground">{v.channelTitle}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MediaExplorer({ course }: { course: CourseWithChapters }) {
  const [tab, setTab] = useState<TabType>("videos");
  const [search, setSearch] = useState("");
  const [activeVideo, setActiveVideo] = useState<ChapterMedia | null>(null);
  const [chapterFilter, setChapterFilter] = useState<number | "all">("all");
  const playerRef = useRef<HTMLDivElement>(null);

  // Build flat media list from course chapters
  const allMedia: ChapterMedia[] = (course.chapters ?? []).map((ch, i) => {
    const video = ch.youtubeVideo as ChapterMedia["video"];
    const articles = (ch.articles ?? []) as Article[];
    return {
      chapterId: ch.id,
      chapterTitle: ch.title,
      chapterOrder: i,
      durationMinutes: ch.durationMinutes,
      video: video?.videoId ? video : null,
      articles,
    };
  });

  const chaptersWithVideos = allMedia.filter((m) => m.video);
  const chaptersWithArticles = allMedia.filter((m) => m.articles.length > 0);

  // Stats
  const totalVideos = chaptersWithVideos.length;
  const totalArticles = allMedia.reduce((acc, m) => acc + m.articles.length, 0);

  // Filter helpers
  const filterByChapter = (items: ChapterMedia[]) =>
    chapterFilter === "all" ? items : items.filter((m) => m.chapterId === chapterFilter);

  const filterBySearch = (items: ChapterMedia[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.map((m) => ({
      ...m,
      video: m.video && m.video.title.toLowerCase().includes(q) ? m.video : null,
      articles: m.articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.snippet.toLowerCase().includes(q) ||
          m.chapterTitle.toLowerCase().includes(q)
      ),
    }));
  };

  const visibleVideoItems = filterBySearch(filterByChapter(chaptersWithVideos)).filter(
    (m) => m.video
  );
  const visibleArticleItems = filterBySearch(filterByChapter(chaptersWithArticles)).filter(
    (m) => m.articles.length > 0
  );

  // Scroll to player on select
  useEffect(() => {
    if (activeVideo && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeVideo]);

  const handleVideoClick = (item: ChapterMedia) => {
    setActiveVideo((prev) =>
      prev?.chapterId === item.chapterId ? null : item
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Media Library
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            All videos and articles from <span className="text-foreground font-medium">{course.title}</span>
          </p>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 font-medium">
            <PlayCircle className="w-3.5 h-3.5" />
            {totalVideos} videos
          </div>
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-medium">
            <Newspaper className="w-3.5 h-3.5" />
            {totalArticles} articles
          </div>
        </div>
      </div>

      {/* ── Tabs + Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Tabs */}
        <div className="flex rounded-xl border border-border bg-muted/20 p-1 gap-1">
          {(["videos", "articles"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t
                  ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "videos" ? <PlayCircle className="w-3.5 h-3.5" /> : <Newspaper className="w-3.5 h-3.5" />}
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search videos or articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chapter filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={chapterFilter}
            onChange={(e) =>
              setChapterFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))
            }
            className="pl-9 pr-8 py-2 rounded-xl border border-border bg-card text-sm text-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All chapters</option>
            {allMedia.map((m) => (
              <option key={m.chapterId} value={m.chapterId}>
                Ch. {m.chapterOrder + 1} — {m.chapterTitle.slice(0, 28)}
                {m.chapterTitle.length > 28 ? "…" : ""}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground rotate-90 pointer-events-none" />
        </div>
      </div>

      {/* ── Video Player (when active) ── */}
      {tab === "videos" && activeVideo && (
        <div ref={playerRef}>
          <VideoPlayer item={activeVideo} onClose={() => setActiveVideo(null)} />
        </div>
      )}

      {/* ── Videos Tab ── */}
      {tab === "videos" && (
        <div>
          {visibleVideoItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
                <PlayCircle className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No videos found</p>
              {search && (
                <button onClick={() => setSearch("")} className="text-xs text-purple-400 hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleVideoItems.map((item) => (
                <VideoCard
                  key={item.chapterId}
                  item={item}
                  isActive={activeVideo?.chapterId === item.chapterId}
                  onClick={() => handleVideoClick(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Articles Tab ── */}
      {tab === "articles" && (
        <div>
          {visibleArticleItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
                <Newspaper className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No articles found</p>
              {search && (
                <button onClick={() => setSearch("")} className="text-xs text-purple-400 hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {visibleArticleItems.map((item) => (
                <div key={item.chapterId} className="space-y-2">
                  {/* Chapter group header */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5" />
                      Ch. {item.chapterOrder + 1} — {item.chapterTitle}
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                      <Clock className="w-3 h-3" />
                      {item.durationMinutes}m
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {item.articles.map((article, ai) => (
                      <ArticleCard
                        key={ai}
                        article={article}
                        chapterTitle={item.chapterTitle}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Footer summary ── */}
      <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground/60">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3" />
          {tab === "videos"
            ? `${visibleVideoItems.length} video${visibleVideoItems.length !== 1 ? "s" : ""} shown`
            : `${visibleArticleItems.reduce((a, m) => a + m.articles.length, 0)} article${
                visibleArticleItems.reduce((a, m) => a + m.articles.length, 0) !== 1 ? "s" : ""
              } shown`}
        </div>
        {(search || chapterFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setChapterFilter("all"); }}
            className="text-purple-400/70 hover:text-purple-400 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}