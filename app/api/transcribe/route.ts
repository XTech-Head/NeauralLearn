/**
 * POST /api/transcribe
 * Receives audio blob from browser, sends to Groq Whisper, returns transcript.
 * Uses Groq's free whisper-large-v3-turbo model.
 * 
 * Place this file at: app/api/transcribe/route.ts
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as Blob | null;

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
    }

    const file = new File([audio], "recording.webm", { type: audio.type || "audio/webm" });

    const groqForm = new FormData();
    groqForm.append("file", file);
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("response_format", "json");
    groqForm.append("language", "en");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq Whisper error:", err);
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text?.trim() ?? "" });

  } catch (err) {
    console.error("Transcribe route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}