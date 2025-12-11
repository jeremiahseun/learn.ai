
# Learn.ai Backend Specification & MVP Architecture

## 1. Executive Summary
To build a "World Class" product that is investor-ready while maintaining a low burn rate (generous free tier), we will utilize a **Serverless Architecture**.

**Core Stack:**
*   **Backend-as-a-Service (BaaS):** **Supabase** (Open source Firebase alternative).
    *   *Why:* Incredible free tier (500MB database, auth, storage, realtime), PostgreSQL power, and seamless integration.
*   **Serverless Logic:** **Supabase Edge Functions** (Deno) or **Vercel Serverless Functions**.
*   **Payments:** **Dodo Payments**.
*   **Hosting:** **Vercel** (Frontend) + **Supabase** (Backend).

---

## 2. Database Schema (PostgreSQL via Supabase)

We need a relational database to handle complex user data and analytics efficiently.

### A. Tables

1.  **`users` (extends Supabase Auth)**
    *   `id` (UUID, PK)
    *   `email` (String)
    *   `full_name` (String)
    *   `avatar_url` (String)
    *   `subscription_status` (Enum: 'free', 'pro', 'enterprise')
    *   `subscription_id` (String, reference to Dodo)
    *   `created_at` (Timestamp)

2.  **`sessions`**
    *   `id` (UUID, PK)
    *   `user_id` (UUID, FK)
    *   `title` (String)
    *   `topic` (String)
    *   `duration_seconds` (Integer)
    *   `message_count` (Integer)
    *   `thumbnail_url` (String)
    *   `created_at` (Timestamp)

3.  **`boards`**
    *   `id` (UUID, PK)
    *   `session_id` (UUID, FK)
    *   `data_json` (JSONB) - Stores the stroke/command data.
    *   `preview_image_url` (String)

4.  **`analytics_logs`**
    *   `id` (UUID)
    *   `user_id` (UUID)
    *   `event_type` (Enum: 'session_start', 'tool_use', 'api_call')
    *   `metadata` (JSONB)
    *   `created_at` (Timestamp)

---

## 3. Authentication & Security

*   **Provider:** Supabase Auth.
*   **Methods:** Google OAuth (primary), Email/Magic Link.
*   **Row Level Security (RLS):** Crucial. We will write policies ensuring Users can ONLY read/write their own sessions.
*   **API Key Management:**
    *   **The Problem:** We cannot expose the Gemini API Key in the frontend code (`process.env` in React is visible to users).
    *   **The Solution:** We create a **Proxy Edge Function**.
    *   The frontend calls `POST /api/chat`.
    *   The Edge Function validates the user's Supabase Session token.
    *   The Edge Function retrieves the secret Gemini API Key from environment variables.
    *   The Edge Function calls Google, gets the response, and streams it back to the frontend.
    *   *Note:* This allows us to track usage per user and enforce limits for Free vs. Pro.

---

## 4. Analytics Implementation

We need to track metrics for investors without slowing down the app.

1.  **User Metrics:**
    *   **DAU/MAU:** Tracked via `auth.last_sign_in_at`.
    *   **Retention:** calculated via login frequency logs.
2.  **Usage Metrics:**
    *   **Total Talk Time:** The frontend calculates the time between `session_start` and `session_end` and pushes it to the `sessions` table.
    *   **Question Count:** Every time the user speaks (mic input detected > silence), increment a local counter and push to DB on save.
    *   **Cost per User:** Track token usage in the Proxy Edge Function to calculate our Gemini bill vs. User Revenue.

---

## 5. Payments (Dodo Payments Integration)

We will implement a "Freemium" model.

### Tiers
1.  **Scholar (Free)**
    *   15 minutes of AI Tutoring / day.
    *   Standard Voice (Puck).
    *   3 saved sessions max.
2.  **Genius (Pro - $19/mo)**
    *   Unlimited Tutoring.
    *   Premium Voices (Fenrir, Kore).
    *   Unlimited History.
    *   PDF Uploads & Analysis.
    *   Session Recording & Export.

### Implementation Flow
1.  **Checkout:** User clicks "Upgrade" -> Redirects to Dodo Payments Checkout Page.
2.  **Webhook:** Dodo sends a `payment.succeeded` webhook to our Supabase Edge Function.
3.  **Provisioning:** The Edge Function verifies the signature, finds the user by email/metadata, and updates `users.subscription_status` to `pro`.
4.  **Frontend:** The UI listens for the change and unlocks features immediately using Supabase Realtime.

---

## 6. Infrastructure & Deployment Steps

1.  **Setup Supabase Project:**
    *   Enable Auth (Google).
    *   Create Tables.
    *   Set Secrets (`GEMINI_API_KEY`, `DODO_PAYMENTS_KEY`).
2.  **Deploy Edge Functions:**
    *   `gemini-proxy`: Handles the AI traffic securely.
    *   `dodo-webhook`: Handles payment events.
3.  **Update Frontend:**
    *   Remove local API key logic.
    *   Point API calls to the new Edge Functions.
    *   Add "Login" and "Upgrade" screens.

This architecture costs **$0/month** to start (until you scale past Supabase's generous limits), making it perfect for an MVP.
