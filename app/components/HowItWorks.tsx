"use client";
import React from "react";

const steps = [
  {
    number: "01",
    title: "Enter Your Topic",
    description: "Simply type in what you want to learn - from programming to cooking"
  },
  {
    number: "02",
    title: "AI Generates Course",
    description: "Our AI analyzes and creates a structured curriculum with video lessons"
  },
  {
    number: "03",
    title: "Start Learning",
    description: "Access your personalized course immediately and learn at your own pace"
  }
];

function HowItWorks() {
  return (
    <div id="how-it-works" className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
        <p className="text-muted-foreground text-lg">
          Three simple steps to your personalized course
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 opacity-20" />
            )}
            
            <div className="relative text-center space-y-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white text-3xl font-bold">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HowItWorks;