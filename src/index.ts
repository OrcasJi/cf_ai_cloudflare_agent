import { ChatMemory } from "./memory";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // -------------------------
    // GET /  -> Serve UI page
    // -------------------------
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>🤖 Cloudflare AI Agent</title>
  <style>
    body {
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background: radial-gradient(circle at top, #111827, #020617);
      color: #e5e7eb;
      min-height: 100vh;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .app {
      width: 100%;
      max-width: 720px;
      background: #020617;
      border: 1px solid #1f2937;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
    }

    .header {
      padding: 16px 20px;
      border-bottom: 1px solid #1f2937;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header span {
      color: #38bdf8;
    }

    #chat {
      padding: 20px;
      height: 420px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      line-height: 1.4;
      font-size: 14px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .user {
      align-self: flex-end;
      background: #1e40af;
      color: #e0f2fe;
      border-bottom-right-radius: 4px;
    }

    .ai {
      align-self: flex-start;
      background: #022c22;
      color: #d1fae5;
      border-bottom-left-radius: 4px;
    }

    .input-area {
      display: flex;
      gap: 10px;
      padding: 14px;
      border-top: 1px solid #1f2937;
    }

    input {
      flex: 1;
      background: #020617;
      border: 1px solid #1f2937;
      border-radius: 10px;
      padding: 10px 12px;
      color: #e5e7eb;
      outline: none;
    }

    input::placeholder {
      color: #64748b;
    }

    button {
      background: linear-gradient(135deg, #38bdf8, #22d3ee);
      border: none;
      border-radius: 10px;
      padding: 0 18px;
      font-weight: 600;
      cursor: pointer;
    }

    button:hover {
      opacity: 0.9;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  </style>
</head>

<body>
  <div class="app">
    <div class="header">
      🤖 <span>Cloudflare AI Agent</span>
      <small style="margin-left:auto;color:#64748b">session: demo</small>

    </div>
	<div style="padding: 3px 20px; font-size: 12px; color:#64748b;">
  Powered by Cloudflare Workers · Llama 3 · Durable Objects
</div>
    <div id="chat"></div>

    <div class="input-area">
      <input id="input" placeholder="Type a message… (press Enter to send)" />
      <button id="sendBtn" onclick="send()">Send</button>
    </div>
  </div>

  <script>
    const sessionId = "demo";

    function escapeHtml(str) {
      return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    async function send() {
      const input = document.getElementById("input");
      const chat = document.getElementById("chat");
      const sendBtn = document.getElementById("sendBtn");

      const text = input.value.trim();
      if (!text) return;

      // ① show user bubble
      chat.innerHTML += '<div class="bubble user">' + escapeHtml(text) + '</div>';
      input.value = "";

      // ② show AI typing bubble
      const loadingId = "loading-" + Date.now();
      chat.innerHTML += '<div class="bubble ai" id="' + loadingId + '">AI is typing…</div>';
      chat.scrollTop = chat.scrollHeight;

      // disable button while waiting
      sendBtn.disabled = true;

      try {
        const res = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: text })
        });

        const data = await res.json();

        if (!res.ok) {
          document.getElementById(loadingId).innerText =
            "Error: " + (data.error || "Request failed");
        } else {
          document.getElementById(loadingId).innerText = data.reply;
        }
      } catch (e) {
        document.getElementById(loadingId).innerText = "Network error. Please try again.";
      } finally {
        sendBtn.disabled = false;
        chat.scrollTop = chat.scrollHeight;
      }
    }

    // Enter to send
    document.getElementById("input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") send();
    });
  </script>
</body>
</html>
        `,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    /**
     * Chat endpoint
     * - Uses Durable Objects to persist conversation state per session
     * - Uses Workers AI (Llama 3) for response generation
     * - Designed to be stateless at the Worker level, stateful via DO
     */
    if (url.pathname === "/chat" && request.method === "POST") {
      const { sessionId, message } = await request.json<{
        sessionId: string;
        message: string;
      }>();

      if (!sessionId || !message) {
        return Response.json(
          { error: "sessionId and message are required" },
          { status: 400 }
        );
      }

      // 1) Durable Object: one session -> one memory object
      const id = env.CHAT_MEMORY.idFromName(sessionId);
      const stub = env.CHAT_MEMORY.get(id);

      // 2) write message into memory
      const memoryRes = await stub.fetch("https://memory/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const { history } = await memoryRes.json<{ history: string[] }>();

      // 3) Workers AI (remote only)
      const ai = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
        messages: history.map((m) => ({ role: "user", content: m })),
      });

      return Response.json({
        sessionId,
        history,
        reply: ai.response,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};

export { ChatMemory };
