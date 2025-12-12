
# Learn.ai Backend Specification & MVP Architecture

## 1. Executive Summary
To build a "World Class" product that is investor-ready while maintaining a low burn rate (generous free tier), we will utilize a **Serverless Architecture**.

**Core Stack:**
*   **Backend-as-a-Service (BaaS):** **Supabase** (PostgreSQL Database, Auth, Storage).
    *   *Why:* Incredible free tier (500MB database, auth, storage, realtime), PostgreSQL power, and seamless integration.
*   **Serverless Logic:** **Cloudflare Workers**.
    *   *Why:* Zero cold starts, global low latency, and cheaper than Vercel/AWS Lambda at scale.
*   **Framework:** **Hono**.
    *   *Why:* Ultra-fast, lightweight web standard framework specifically designed for Cloudflare Workers.
*   **Payments:** **Dodo Payments**.
*   **Hosting:** **Vercel** (Frontend) + **Cloudflare** (Backend).

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

4.  **`transactions`**
    *   `id` (UUID, PK)
    *   `user_id` (UUID, FK)
    *   `amount` (Integer) - Stored in cents.
    *   `currency` (String) - e.g., 'USD'.
    *   `status` (Enum: 'pending', 'succeeded', 'failed')
    *   `payment_provider_id` (String) - The Transaction ID from Dodo.
    *   `created_at` (Timestamp)

5.  **`analytics_logs`**
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
    *   **The Problem:** We cannot expose the Gemini API Key in the frontend code.
    *   **The Solution:** We create a **Proxy API** on Cloudflare.
    *   The frontend calls `POST https://api.learn.ai/chat`.
    *   The Worker validates the user's Supabase JWT.
    *   The Worker retrieves the secret Gemini API Key from `wrangler` secrets.
    *   The Worker calls Google and streams the response back.

---

## 4. Analytics Implementation

We need to track metrics for investors without slowing down the app.

1.  **User Metrics:**
    *   **DAU/MAU:** Tracked via `auth.last_sign_in_at`.
    *   **Retention:** calculated via login frequency logs.
2.  **Usage Metrics:**
    *   **Total Talk Time:** The frontend calculates the time between `session_start` and `session_end` and pushes it to the `sessions` table.
    *   **Question Count:** Every time the user speaks (mic input detected > silence), increment a local counter and push to DB on save.
    *   **Cost per User:** Track token usage in the Proxy Worker to calculate our Gemini bill vs. User Revenue.

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
2.  **Webhook:** Dodo sends a `payment.succeeded` webhook to our Cloudflare Worker (`/api/webhooks/dodo`).
3.  **Provisioning:** The Worker verifies the signature, records the transaction in the `transactions` table, finds the user, and updates `users.subscription_status` to `pro`.
4.  **Frontend:** The UI listens for the change and unlocks features immediately using Supabase Realtime.

---

## 6. Infrastructure & Deployment Steps

1.  **Setup Supabase Project:**
    *   Enable Auth (Google).
    *   Run SQL Schema.
    *   Get `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
2.  **Setup Cloudflare Worker:**
    *   Install Wrangler: `npm install -g wrangler`
    *   Initialize Hono app: `npm create hono@latest backend`
    *   Set Secrets: `wrangler secret put GEMINI_API_KEY`, `wrangler secret put SUPABASE_KEY`.
3.  **Deploy:**
    *   Run `npm run deploy` inside the backend folder.
    *   Update Frontend to point to the new Cloudflare Worker URL.

This architecture ensures <10ms latency for API logic via Cloudflare's global network.
