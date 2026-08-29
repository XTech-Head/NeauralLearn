"use client";
import React from "react";
import { PlayCircle, Clock, BookOpen } from "lucide-react";

const mockCourses = [
  {
    id: 1,
    title: "Introduction to Machine Learning",
    progress: 65,
    duration: "4h 30m",
    lessons: 24,
    thumbnail: "bg-linear-to-br from-blue-500 to-cyan-500"
  },
  {
    id: 2,
    title: "Advanced Python Programming",
    progress: 30,
    duration: "6h 15m",
    lessons: 32,
    thumbnail: "bg-linear-to-br from-green-500 to-emerald-500"
  },
  {
    id: 3,
    title: "Web Development Fundamentals",
    progress: 90,
    duration: "5h 45m",
    lessons: 28,
    thumbnail: "bg-linear-to-br from-purple-500 to-pink-500"
  }
];

function RecentCourses() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recent Courses</h2>
        <a href="#all-courses" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          View All →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCourses.map((course) => (
          <div
            key={course.id}
            className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            {/* Thumbnail */}
            <div className={`h-40 ${course.thumbnail} relative`}>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                {course.title}
              </h3>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{course.progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-purple-600 to-pink-600 transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.lessons} lessons</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentCourses;
