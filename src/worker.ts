import { SessionDO } from "./session-do";

interface Env {
  SESSION_DO: DurableObjectNamespace;
  OPENAI_API_KEY: string;
}

const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>cf_ai_log-copilot</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px auto; }
      h2 { margin-bottom: 10px; }
      .row { display: flex; gap: 8px; }
      input { flex: 1; padding: 10px; }
      button { padding: 10px 14px; cursor: pointer; }
      pre { background: #f6f6f6; padding: 12px; border: 1px solid #ddd; white-space: pre-wrap; }
      .hint { color: #666; font-size: 12px; margin-top: 8px; }
    </style>
  </head>
  <body>
    <h2>cf_ai_log-copilot</h2>

    <div class="row">
      <input id="text" placeholder="Try: show top endpoints / why 500 increasing" />
      <button id="send">Send</button>
    </div>

    <p class="hint">
      sessionId is stored in localStorage. Refreshing the page keeps memory.
    </p>

    <h3>Output</h3>
    <pre id="out">Ready.</pre>

    <script>
      const out = document.getElementById("out");
      const input = document.getElementById("text");
      const btn = document.getElementById("send");

      const sessionId = localStorage.getItem("sid") || crypto.randomUUID();
      localStorage.setItem("sid", sessionId);

      async function send() {
        const message = input.value.trim();
        if (!message) return;

        out.textContent = "Loading...";
        btn.disabled = true;

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sessionId, message })
          });

          const raw = await res.text(); // read raw first (important)

          if (!res.ok) {
            out.textContent = "HTTP " + res.status + "\\n\\n" + raw;
            return;
          }

          // parse JSON safely
          let data;
          try {
            data = JSON.parse(raw);
          } catch (e) {
            out.textContent = "Response was not JSON:\\n\\n" + raw;
            return;
          }

          const reply = data.reply ?? "(no reply)";
          const stats = data.stats ?? {};
          out.textContent = reply + "\\n\\n--- stats ---\\n" + JSON.stringify(stats, null, 2);

        } catch (e) {
          out.textContent = "Fetch error: " + e;
        } finally {
          btn.disabled = false;
        }
      }

      btn.addEventListener("click", send);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") send();
      });
    </script>
  </body>
</html>
`;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/chat" && req.method === "POST") {
      const { sessionId, message } = (await req.json()) as {
        sessionId: string;
        message: string;
      };

      // Route to a Durable Object instance by sessionId
      const id = env.SESSION_DO.idFromName(sessionId);
      const stub = env.SESSION_DO.get(id);

      // Call the DO (IMPORTANT: set content-type)
      const resp = await stub.fetch("http://do/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });

      return resp;
    }

    return new Response("Not Found", { status: 404 });
  },
};

// IMPORTANT: export the DO class so Wrangler registers it
export { SessionDO };
