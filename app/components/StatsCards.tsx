"use client";
import React from "react";
import { GraduationCap, Clock, Award, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: GraduationCap,
    label: "Courses Created",
    value: "12",
    change: "+3 this month",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Clock,
    label: "Learning Hours",
    value: "48h",
    change: "+12h this week",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Award,
    label: "Completed",
    value: "8",
    change: "67% completion rate",
    color: "from-green-500 to-green-600"
  },
  {
    icon: TrendingUp,
    label: "Streak",
    value: "14 days",
    change: "Keep it up!",
    color: "from-orange-500 to-orange-600"
  }
];

function StatsCards() {
  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsCards;

