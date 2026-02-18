import { analyzeLogs } from "./log_analyzer";
import { SAMPLE_LOGS } from "./sample_logs";
import { buildIncidentPrompt } from "./prompts";

interface Env {
  OPENAI_API_KEY: string;
}

export class SessionDO {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    try {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      const { message } = (await request.json()) as { message: string };

      // 1) Load + update memory (history)
      const history =
        ((await this.state.storage.get("history")) as string[]) ?? [];
      history.push(message);

      const trimmedHistory = history.slice(-20);
      await this.state.storage.put("history", trimmedHistory);

      // 2) Compute stats from demo logs
      const stats = analyzeLogs(SAMPLE_LOGS);

      // 3) LLM prompt
      const prompt = buildIncidentPrompt(message, stats, trimmedHistory);

      // 4) Call OpenAI (Chat Completions)
      if (!this.env.OPENAI_API_KEY) {
        return new Response(
          "Missing OPENAI_API_KEY. Put it in .dev.vars as OPENAI_API_KEY=...",
          { status: 500 }
        );
      }

      const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You are a careful SRE assistant. Use only the provided stats. Do not invent facts.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      const raw = await openaiResp.text();

      if (!openaiResp.ok) {
        // Show full error response (very helpful)
        return new Response(`OpenAI API error (HTTP ${openaiResp.status}):\n\n${raw}`, {
          status: 500,
        });
      }

      const json = JSON.parse(raw);

      const rawText: string =
        json?.choices?.[0]?.message?.content ??
        "OpenAI returned no message content.";

      // 5) Try to parse structured JSON report
      let report: any = null;
      try {
        report = JSON.parse(rawText);
      } catch {
        // not JSON, ok
      }

      // 6) Build a nice reply for the UI
      let reply = "";

      if (report?.summary) {
        reply += `Summary: ${report.summary}\n\n`;

        if (Array.isArray(report.root_causes) && report.root_causes.length > 0) {
          reply += `Root causes (ranked):\n`;
          for (const rc of report.root_causes) {
            reply += `- ${rc.cause}\n`;
            if (Array.isArray(rc.evidence) && rc.evidence.length > 0) {
              for (const ev of rc.evidence) reply += `  • ${ev}\n`;
            }
          }
          reply += `\n`;
        }

        if (Array.isArray(report.next_actions) && report.next_actions.length > 0) {
          reply += `Next actions:\n`;
          for (const a of report.next_actions) reply += `- ${a}\n`;
          reply += `\n`;
        }

        if (Array.isArray(report.follow_ups) && report.follow_ups.length > 0) {
          reply += `Follow-ups:\n`;
          for (const q of report.follow_ups) reply += `- ${q}\n`;
        }
      } else {
        // Fallback if model didn't return JSON
        reply =
          `AI output (raw):\n${rawText}\n\n` +
          `--- Evidence stats ---\n` +
          JSON.stringify(stats, null, 2);
      }

      return Response.json({
        reply,
        stats,
        report, // may be null
        history: trimmedHistory,
      });
    } catch (err: any) {
      console.error("SessionDO error:", err?.stack || err);

      return new Response("SessionDO error: " + (err?.message || String(err)), {
        status: 500,
      });
    }
  }
}
