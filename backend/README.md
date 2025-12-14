# Backend Documentation

This document provides a detailed overview of the backend services, API endpoints, and setup instructions.

## Overview

This backend is a Cloudflare Worker built with the [Hono](https://hono.dev/) web framework. It provides AI chat functionality through Google's Gemini API and handles payment webhooks from Dodo Payments. User data and authentication are managed using [Supabase](https://supabase.com/).

## Features

- **AI Chat:** Securely proxies requests to the Gemini API.
- **User Authentication:** Middleware verifies user identity using Supabase Auth.
- **Payment Processing:** Handles `payment.succeeded` webhooks from Dodo Payments to provision user subscriptions.

## API Endpoints

### Chat API

This endpoint proxies requests to the Gemini API, allowing the frontend to communicate with the AI model without exposing the API key.

- **Endpoint:** `POST /api/chat`
- **Authentication:** Required. The request must include an `Authorization` header with a Supabase JWT.
  - **Header:** `Authorization: Bearer <SUPABASE_JWT>`
- **Request Body:** A JSON object with a `prompt` property.
  ```json
  {
    "prompt": "Hello, world!"
  }
  ```
- **Response:** The response from the Gemini API is forwarded directly to the client.

### Chat Streaming API

This endpoint provides a streaming connection to the Gemini API, allowing for real-time chat experiences.

- **Endpoint:** `POST /api/chat/stream`
- **Authentication:** Required. The request must include an `Authorization` header with a Supabase JWT.
  - **Header:** `Authorization: Bearer <SUPABASE_JWT>`
- **Request Body:** A JSON object with a `prompt` property.
  ```json
  {
    "prompt": "Hello, world!"
  }
  ```
- **Response:** A stream of Server-Sent Events (SSE). The frontend can connect to this endpoint to receive the AI's response in chunks as it is generated.

### Webhooks

This endpoint is used to receive webhooks from Dodo Payments.

- **Endpoint:** `POST /api/webhooks/dodo`
- **Authentication:** The endpoint expects a `X-Dodo-Signature` header for signature verification (currently commented out in the code).
- **Request Body:** A JSON payload from Dodo Payments. The backend specifically handles the `payment.succeeded` event.
- **Response:**
  - `200 OK`: `{"received": true}`

## Environment Variables

The following environment variables are required to run the backend.

- `GEMINI_API_KEY`: Your API key for the Gemini API.
- `SUPABASE_URL`: The URL of your Supabase project.
- `SUPABASE_ANON_KEY`: The anon key for your Supabase project.
- `DODO_PAYMENTS_WEBHOOK_KEY`: The webhook secret key from Dodo Payments.

## Setup and Deployment

### Local Development

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.dev.vars` file** in the `backend` directory with the following content:
    ```
    GEMINI_API_KEY="your_gemini_api_key"
    SUPABASE_URL="your_supabase_url"
    SUPABASE_ANON_KEY="your_supabase_anon_key"
    DODO_PAYMENTS_WEBHOOK_KEY="your_dodo_payments_webhook_key"
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```

### Deployment to Cloudflare Workers

1.  **Configure `wrangler.toml`:** Create a `wrangler.toml` file in the `backend` directory and add your configuration.
2.  **Add secrets:** Use the `wrangler secret put` command to add the environment variables to your Cloudflare Worker.
    ```bash
    wrangler secret put GEMINI_API_KEY
    wrangler secret put SUPABASE_URL
    wrangler secret put SUPABASE_ANON_KEY
    wrangler secret put DODO_PAYMENTS_WEBHOOK_KEY
    ```
3.  **Deploy:**
    ```bash
    npm run deploy
    ```
