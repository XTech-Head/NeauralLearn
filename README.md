# NeuralLearn 🧠

> AI-powered learning, built to turn any topic into a structured course.

**NeuralLearn** is an AI-powered learning platform that transforms a topic into a complete, structured learning experience. Instead of searching through scattered tutorials and articles, learners can generate a course, work through chapters, watch relevant videos, read supporting resources, test their knowledge, and track their progress in one place.

---

## ✨ Features

### 🤖 AI Course Generation

Enter any topic and NeuralLearn generates a structured course with:

* Course title and description
* Difficulty level
* Estimated learning time
* Logically ordered chapters
* Chapter descriptions
* Relevant YouTube search queries

### 📚 Structured Learning

Generated courses are organized into individual chapters and lessons, making large topics easier to understand and progress through.

### 📝 AI-Generated Quizzes

Each chapter can include automatically generated quizzes designed around the lesson content.

* Multiple-choice questions
* Four answer choices
* Correct-answer explanations
* Knowledge testing after learning

### 🧠 Flashcards

NeuralLearn generates flashcards from lesson material to help reinforce important concepts through active recall.

### 🎥 Learning Resources

Courses can be enriched with external learning material, including:

* YouTube tutorials
* Educational articles
* Additional resources related to the chapter

### 📈 Progress Tracking

Track learning progress as you move through generated courses and chapters.

### 🎙️ Voice Input

NeuralLearn supports microphone-based input for a more convenient learning and course-generation experience.

### 🔐 Authentication

User accounts are protected through Clerk authentication, allowing users to maintain their own courses and learning progress.

### ☕ Support Development

NeuralLearn includes a one-time donation option through Buy Me a Coffee for users who want to support continued development.

### 📱 PWA Support

NeuralLearn is designed as a Progressive Web App, allowing the platform to provide an app-like experience across supported devices.

---

## 🛠️ Tech Stack

### Frontend

* Next.js 16
* React
* TypeScript
* Tailwind CSS
* Lucide Icons

### Backend

* Next.js App Router
* Next.js API Routes
* Server-side authentication
* Drizzle ORM

### Database

* Neon PostgreSQL

### Authentication

* Clerk

### AI

NeuralLearn uses a resilient multi-provider AI architecture:

* Groq
* Google Gemini

The application uses provider and model fallbacks to improve reliability when a model is unavailable or temporarily rate-limited.

### External Learning Resources

* YouTube
* Educational article sources

### Deployment

* Vercel

---

## 🏗️ Architecture

At a high level, NeuralLearn follows this flow:

```text
User
  │
  ▼
Next.js Application
  │
  ├── Clerk Authentication
  │
  ├── Course Generation
  │       │
  │       ├── Groq
  │       └── Gemini fallback
  │
  ├── Lesson Generation
  │
  ├── Quiz Generation
  │
  ├── Flashcard Generation
  │
  ├── YouTube Resources
  │
  └── Article Resources
          │
          ▼
     Neon PostgreSQL
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

* Node.js 18+
* npm
* A PostgreSQL-compatible database
* Clerk account
* Groq API access
* Google Gemini API access

### Installation

Clone the repository:

```bash
git clone https://github.com/XTech-Head/NeauralLearn.git
```

Enter the project:

```bash
cd NeauralLearn
```

Install dependencies:

```bash
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root.

Add the environment variables required by your local configuration.

Example:

```env
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

GROQ_API_KEY=
GROQ_MODEL=

GEMINI_API_KEY=
GEMINI_MODEL=
```

Additional variables may be required depending on the enabled integrations.

> **Never commit `.env`, API keys, database credentials, or other secrets to GitHub.**

---

## ▶️ Development

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🧪 Production Build

To verify the application builds successfully:

```bash
npm run build
```

Then start the production server:

```bash
npm start
```

---

## 📁 Project Structure

```text
NeauralLearn/
│
├── app/
│   ├── ai/
│   │   └── ai.ts
│   │
│   ├── api/
│   │   ├── articles/
│   │   ├── course/
│   │   ├── courses/
│   │   ├── generate-course/
│   │   ├── progress/
│   │   ├── transcribe/
│   │   ├── user/
│   │   └── youtube/
│   │
│   ├── components/
│   ├── course/
│   ├── sign-in/
│   ├── sign-up/
│   ├── globals.css
│   └── page.tsx
│
├── config/
│   └── schema.ts
│
├── lib/
│   └── server-auth.ts
│
├── public/
│   ├── icons/
│   └── screenshots/
│
├── .github/
│   └── dependabot.yml
│
├── manifest.ts
├── next.config.ts
├── package.json
└── README.md
```

---

## 🔄 AI Reliability

AI services can experience temporary rate limits, unavailable models, or provider failures.

NeuralLearn therefore uses a provider abstraction that can:

1. Attempt the configured Groq model.
2. Try additional Groq model fallbacks when necessary.
3. Retry appropriate temporary failures.
4. Fall back to Gemini when Groq cannot complete the request.
5. Return an error when no configured provider can fulfill the request.

This helps prevent a temporary model or provider issue from taking down the entire learning workflow.

---

## 🔒 Security

NeuralLearn is designed with server-side API access in mind.

Sensitive credentials should remain on the server and must never be exposed to the client.

The project follows several important practices:

* API keys stored in environment variables
* Database credentials stored in environment variables
* Authentication handled through Clerk
* Server-side API calls for AI providers
* Protected application routes
* No secrets committed to the repository
* Dependency updates monitored through Dependabot

---

## 🗺️ Roadmap

NeuralLearn is actively evolving.

Potential future improvements include:

* [ ] Improved learning recommendations
* [ ] More personalized learning paths
* [ ] Additional AI providers
* [ ] Better spaced-repetition support
* [ ] More detailed learning analytics
* [ ] Expanded PWA capabilities
* [ ] Custom course editing
* [ ] Improved accessibility
* [ ] More external learning-resource integrations

---

## 🎯 Why NeuralLearn?

The internet already contains an enormous amount of educational material.

The problem is finding the right material, understanding where to start, and maintaining a structured learning path.

NeuralLearn aims to reduce that friction by turning a simple topic into a guided learning experience.

**Enter a topic. Generate a course. Learn. Practice. Track your progress.**

---

## 👨‍💻 Developer

Built by **XTech Devs**.

NeuralLearn is part of an ongoing collection of software projects exploring AI-powered productivity, education, and developer tools.

---

## ☕ Support

If NeuralLearn has helped you learn something or saved you time, you can support continued development through a one-time coffee donation.

No subscriptions. Just support if you want to.

---

## 📄 License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for more details.
