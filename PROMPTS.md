# AI Prompts Used

This project was developed with the assistance of AI tools to support
architecture design, UI/UX refinement, and iterative problem-solving.

All final code, structure, and design decisions were reviewed, modified,
and implemented by me. No code was copied from other submissions.

---

## 1. System Architecture Design

**Prompt:**
> Design an AI-powered chat application on Cloudflare that supports
> stateful conversations using Durable Objects for memory.

**Purpose:**
Used to explore best practices for combining Cloudflare Workers,
Workers AI (Llama 3), and Durable Objects to build a scalable,
stateful chat agent at the edge.

---

## 2. Conversation Memory Strategy

**Prompt:**
> How can conversation history be persisted per user session
> in a serverless edge environment?

**Purpose:**
Helped evaluate approaches for session-based memory management
and informed the decision to use Durable Objects keyed by session ID.

---

## 3. UI / UX Refinement

**Prompt:**
> Improve the UI of a simple chat interface so that it feels
> closer to a production application rather than a demo.

**Purpose:**
Used to refine visual hierarchy, message bubble layout,
typing indicators, and overall interaction flow.

---

## 4. Error Handling and Robustness

**Prompt:**
> What are common failure modes when using Workers AI in a chat
> application, and how should errors be handled gracefully?

**Purpose:**
Guided the implementation of basic error handling, loading states,
and user feedback when network or AI errors occur.

---

All final implementations are original and written by me.
AI tools were used strictly as an assistant for ideation and refinement.
