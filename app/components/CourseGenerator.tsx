"use client";
import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

function CourseGenerator() {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    if (!isSignedIn) {
      router.push('/sign-up');
      return;
    }
    
    setIsGenerating(true);
    try {
      // TODO: Add your course generation API call here
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Generating course for:", topic);
      // After generation, you can store the course in your database
    } catch (error) {
      console.error("Failed to generate course:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isGenerating) {
      handleGenerate();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Title Section */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Generate Your AI Course
        </h1>
        <p className="text-lg text-muted-foreground">
          Enter any topic and let AI create a comprehensive video course for you
        </p>
      </div>

      {/* Input Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
        <div className="relative bg-card rounded-2xl border border-border p-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Introduction to Machine Learning..."
              className="flex-1 px-4 py-3 bg-background rounded-xl border-0 outline-none text-foreground placeholder:text-muted-foreground"
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Course
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Examples */}
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground">Try:</span>
        {["Python Basics", "Web Development", "Data Science"].map((example) => (
          <button
            key={example}
            onClick={() => setTopic(example)}
            className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            {example}
          </button>
        ))}
      </div>

      {!isSignedIn && (
        <p className="text-center text-sm text-muted-foreground">
          Sign up to start generating courses
        </p>
      )}
    </div>
  );
}

export default CourseGenerator;
