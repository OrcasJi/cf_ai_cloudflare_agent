
# Cloudflare AI Chat Agent

An AI-powered, stateful chat agent built on **Cloudflare Workers**.

This project demonstrates how to combine **Workers AI (Llama 3)** with
**Durable Objects** to build a scalable agent with persistent conversation memory.

## Features
- 💬 Chat-based user interaction
- 🧠 Conversation memory via Durable Objects
- 🤖 LLM responses using Workers AI (Llama 3)
- ⚡ Deployed globally on Cloudflare Workers

## Architecture
User → Worker → Durable Object (memory) → Workers AI → Response

Durable Objects are used to maintain per-session state, allowing the Worker itself
to remain stateless and horizontally scalable.

## Endpoints
- `GET /` – Simple chat UI
- `POST /chat` – Chat API

Example request:

{
  "sessionId": "test",
  "message": "Hello"
}

## Local Development
npm install
npx wrangler dev

## Tech Stack
- Cloudflare Workers (Edge Runtime)
- Workers AI (Llama 3)
- Durable Objects
- HTML / CSS / JavaScript frontend

## Features
- Stateful conversation memory
- Session-based chat
- Typing indicator UI
- Dark-mode interface

## Notes
Workers AI requires remote preview or deployment and cannot run in local-only mode.
