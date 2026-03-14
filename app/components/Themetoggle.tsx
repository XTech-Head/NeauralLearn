"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
      {/* Light */}
      <button
        onClick={() => setTheme("light")}
        className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-all ${
          theme === "light"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Light mode"
        title="Light"
      >
        ☀️
      </button>

      {/* System */}
      <button
        onClick={() => setTheme("system")}
        className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-all ${
          theme === "system"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="System mode"
        title="System"
      >
        💻
      </button>

      {/* Dark */}
      <button
        onClick={() => setTheme("dark")}
        className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-all ${
          theme === "dark"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Dark mode"
        title="Dark"
      >
        🌙
      </button>
    </div>
  );
}