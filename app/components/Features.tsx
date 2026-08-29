"use client";
import React from "react";
import { Zap, Video, Brain, Target } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Generation",
    description: "Advanced AI creates structured, comprehensive courses tailored to your topic",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Video,
    title: "Video Lessons",
    description: "Each course includes engaging video content with clear explanations",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Zap,
    title: "Instant Creation",
    description: "Generate complete courses in seconds, not hours or days",
    color: "from-pink-500 to-pink-600"
  },
  {
    icon: Target,
    title: "Personalized Learning",
    description: "Courses adapt to your learning style and pace",
    color: "from-orange-500 to-orange-600"
  }
];

function Features() {
  return (
    <div id="features" className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold">Why Choose Xtech?</h2>
        <p className="text-muted-foreground text-lg">
          The smartest way to learn anything, powered by AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-linear-to-br ${feature.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Features;