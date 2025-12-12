
# Dewon: Liquid Clarity for Education

## Project Subtitle
A voice-first, generative whiteboard engine powered by Gemini 1.5 Flash & Gemini 3 Pro.

## Project Description (248 words)

**The Problem:** Education is currently passive and isolated. Students watch static videos or read dense textbooks. They cannot ask a video "Why?", and they cannot ask a textbook to "draw it differently." 

**The Solution:** Dewon is a **Liquid Intelligence Engine**. It transforms the learning experience from a monologue into a visual dialogue. It is an AI tutor that listens to your voice and *draws* explanations in real-time on an infinite canvas.

**How it Works:**
Dewon uses a dual-model architecture to achieve "Liquid Clarity":

1.  **The Flow State (Gemini 2.5 Flash via Live API):** 
    We utilize the new Gemini Live API to stream raw PCM audio (16kHz). This allows for sub-300ms latency. We use **Function Calling** not to query data, but to control a custom **Generative Graphics Engine**. When the AI explains a concept, it fires `draw_graph`, `draw_shape`, or `connect_elements` commands, rendering vector graphics synchronously with its speech.

2.  **Deep Synthesis (Gemini 3 Pro):**
    For complex STEM questions requiring multi-step reasoning, we integrate **Gemini 3 Pro**. This powers our "Deep Synthesis" mode, allowing the system to pause, think, and generate high-fidelity mathematical proofs or code structures that are injected back into the session context.

**Impact:**
Dewon democratizes high-level, personalized tutoring. It recreates the experience of sitting next to a world-class professor with a blank sheet of paper—infinite patience, infinite knowledge, and visual clarity.

## Track
Education / Gemini 3 Pro Capabilities

## Tech Stack
*   **Frontend:** React, Canvas API, Web Audio API
*   **Real-time Intelligence:** Gemini 2.5 Flash (Live API / WebSockets)
*   **Reasoning Engine:** Gemini 3 Pro (Thinking Model)
*   **Audio Processing:** 16kHz PCM Downsampling/Upsampling
