# Dewon Backend: Liquid Intelligence API

The Dewon backend is a high-performance, edge-first API built to power the **Liquid Intelligence Engine**. It handles sensitive operations that should not be performed on the client, such as API key proxying, subscription management, and webhook processing.

---

## 1. Technology Stack

*   **Runtime:** [Cloudflare Workers](https://workers.cloudflare.com/) (V8-based serverless)
*   **Framework:** [Hono](https://hono.dev/) (Ultrafast web framework for the Edge)
*   **Database:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
*   **Payments:** [Dodo Payments](https://dodopayments.com/) (Subscription and webhook engine)
*   **Language:** TypeScript
*   **Deployment:** Wrangler (Cloudflare CLI)

---

## 2. API Architecture

The project follows a standard **Controller-Route-Service** pattern, optimized for the serverless environment.

### Project Structure
```bash
backend/src/
├── controllers/    # Request handling logic (Chat, Payments)
├── db/             # Database initialization (Supabase client)
├── middleware/     # Auth and validation guards
├── routes/         # Endpoint definitions
├── services/       # External API integrations
├── types.ts        # TypeScript interfaces for Environment and Data
└── index.ts        # Main application entry point
```

---

## 3. Core Endpoints

### A. Chat Proxy (`POST /api/chat`)
*   **Authentication:** Required (via `authMiddleware`).
*   **Purpose:** Proxies requests to the Gemini API (`gemini-2.5-flash`).
*   **Security:** This ensures the `GEMINI_API_KEY` is never exposed to the frontend.
*   **Future Scope:** Usage tracking and credit deduction per user.

### B. Payment Webhooks (`POST /api/webhooks/dodo`)
*   **Authentication:** Signature Verification (X-Dodo-Signature).
*   **Purpose:** Listens for `payment.succeeded` events from Dodo Payments.
*   **Logic:**
    1. Verifies the request authenticity.
    2. Identifies the user in Supabase.
    3. Provisions "Pro" access in the `users` table.
    4. Logs the transaction for auditability.

### C. Health Check (`GET /`)
*   Returns basic service status and version information.

---

## 4. Environment Configuration

To run the backend, you must configure a `.dev.vars` file (for local development) or set secrets in the Cloudflare Dashboard.

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google AI Studio API Key. |
| `SUPABASE_URL` | Your Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for Supabase (bypass RLS). |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Signature key for webhook verification. |

---

## 5. Development Workflow

### Prerequisites
*   Node.js & npm
*   Cloudflare account (Wrangler CLI)

### Running Locally
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The server will typically run on `http://localhost:8787`.*

### Deployment
Deploy to Cloudflare Workers:
```bash
npm run deploy
```

---

## 6. Design Philosophy: Edge Intelligence
By using Cloudflare Workers and Hono, the Dewon backend achieves near-zero cold starts and worldwide low latency. This is critical for the "Flow State" learning experience, ensuring that even when the AI needs a server-side proofing or database check, the delay is imperceptible to the student.
