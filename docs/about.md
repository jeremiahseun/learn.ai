# About Learn.ai

> **"The moment it finally clicks."**

**Learn.ai** is a next-generation educational platform that bridges the gap between passive video tutorials and expensive private tutors. It uses multimodal AI to create a **real-time, collaborative, and visual** learning experience that feels like sitting next to a world-class teacher.

---

## 1. The Mission
We believe great education shouldn't be a luxury. Traditional learning resources often fail because they are:
*   **Static:** You can't ask a YouTube video "Why?"
*   **Expensive:** Private tutors cost $60+/hr.
*   **Judgmental:** Students are afraid to ask "stupid" questions.

**Learn.ai solves this by providing an AI tutor that:**
1.  **Listens** to your voice in real-time.
2.  **Draws** diagrams, equations, and mind maps on a shared whiteboard while explaining.
3.  **Adapts** to your specific confusion, offering infinite patience without judgment.

---

## 2. Core Experience: The "Board Brain"

Unlike standard chatbots that output text, Learn.ai is built on a **Spatial & Visual Engine**.

*   **Voice-First Interface:** Powered by **Gemini Live**, users talk naturally. Interruptions, tangents, and "aha!" moments are handled instantly (<500ms latency).
*   **Semantic Whiteboard:** The AI doesn't just "generate images." It understands the **semantics** of the board. It knows that *Box A* is connected to *Box B* via a *Cause-and-Effect* arrow.
*   **Deep Thinking Mode:** For complex STEM problems (Calculus, Physics, Logic), the system switches to a "Thinking Model" (Gemini 2.5/3.0 Pro) to reason through steps before drawing.
*   **Vision Context:** The AI "sees" what is on the board. If a user sketches a rough triangle, the AI can recognize it and calculate the hypotenuse.

---

## 3. Brand Identity & Design System

The Learn.ai brand blends **Futuristic Precision** with **Human Warmth**.

### A. Color Palette
We use a dark, high-contrast theme to reduce eye strain and make colored diagrams pop.

| Role | Color Name | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | Slate 950 | `#020617` | Deep space background. |
| **Primary** | Cyan 400 | `#22d3ee` | Call-to-actions, primary highlights, "The AI". |
| **Secondary** | Purple 500 | `#8b5cf6` | Deep thinking, creative modes. |
| **Success** | Green 400 | `#4ade80` | Correct answers, user strokes. |
| **Accent** | Pink 400 | `#f472b6` | Connectors, relationships. |
| **Text** | Slate 100 | `#f1f5f9` | Primary readability. |

### B. Typography
*   **UI Font:** `Inter` (Clean, modern, highly legible).
*   **Handwriting Font:** `Kalam` (Used on the whiteboard to simulate a human teacher's handwriting).

### C. Visual Style: "Holo-Glass"
*   **Glassmorphism:** Panels use `backdrop-filter: blur(12px)` with thin, translucent borders (`border-white/10`).
*   **Glow Effects:** Buttons and active elements have subtle outer glows (`shadow-[0_0_20px_rgba(34,211,238,0.3)]`) to simulate neon or holographic projections.
*   **Motion:** Elements **float**, **pulse**, and **spin** slowly to create a living, breathing interface.

---

## 4. Feature Set

### 🎓 For the Student
*   **Infinite Whiteboard:** A canvas that grows with the lesson.
*   **PDF Context:** Upload a textbook chapter or homework sheet; the AI reads it instantly and references it during the lesson.
*   **Snapshot Export:** Download high-res images of the board state to study later.

### 🧠 The AI Persona ("OmniTutor")
*   **Storyteller:** Uses analogies (e.g., explaining voltage as "water pressure").
*   **Socratic:** Asks guiding questions rather than just giving answers.
*   **Visual Thinker:** "Let me draw that out for you" is its catchphrase.

---

## 5. Technical Architecture

*   **Frontend:** React 19, Tailwind CSS, HTML5 Canvas.
*   **Backend:** Cloudflare Workers (Hono), Supabase (PostgreSQL, Auth).
*   **AI Engine:** Google GenAI SDK (Gemini 2.5 Flash for Live Audio, Gemini 3 Pro for Reasoning).
*   **Protocol:** WebTransport / WebSocket for low-latency audio streaming.

---

*Built for the future of education.*
