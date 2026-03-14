"use client";
import React from "react";
import Header from "./components/Header";
import CourseGenerator from "./components/CourseGenerator";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 sm:space-y-24">

        {/* Hero Section with Course Generator */}
        <section className="pt-6 sm:pt-12">
          <CourseGenerator />
        </section>

        {/* Features Section */}
        <section>
          <Features />
        </section>

        {/* How It Works Section */}
        <section>
          <HowItWorks />
        </section>

        {/* CTA Section */}
        <section className="py-8 sm:py-12">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-base sm:text-lg opacity-90">
              Join thousands of learners creating personalized courses with AI
            </p>
            <button
              onClick={() => window.location.href = '/sign-up'}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-base sm:text-lg w-full sm:w-auto"
            >
              Get Started Free
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          © 2026 NeuralLearn From xammytech. All rights reserved.
        </div>
      </footer>
    </div>
  );
}