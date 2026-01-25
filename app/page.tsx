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
      
      <main className="container px-4 md:px-8 py-12 space-y-24">
        {/* Hero Section with Course Generator */}
        <section className="pt-12">
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
        <section className="py-12">
          <div className="max-w-4xl mx-auto text-center space-y-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg opacity-90">
              Join thousands of learners creating personalized courses with AI
            </p>
            <button 
              onClick={() => window.location.href = '/sign-up'}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              Get Started Free
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container px-4 md:px-8 text-center text-muted-foreground text-sm">
          © 2026 NeuralLearn From xammytech. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
