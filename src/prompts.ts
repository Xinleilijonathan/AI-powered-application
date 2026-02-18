export function buildIncidentPrompt(userMessage: string, stats: any, history: string[]) {
  return `
You are an incident log investigation assistant.

User question:
${userMessage}

Conversation context (most recent last):
${history.slice(-10).join("\n")}

Computed log stats (JSON):
${JSON.stringify(stats, null, 2)}

Task:
1) Provide a short incident summary (1-2 sentences).
2) Give 2-3 likely root causes, ranked, each with evidence referencing the stats.
3) Provide 3 concrete next actions (debug steps).
4) Ask up to 2 follow-up questions if needed.

Output in this exact JSON format:
{
  "summary": "...",
  "root_causes": [{"cause":"...","evidence":["...","..."]}],
  "next_actions": ["...","...","..."],
  "follow_ups": ["...","..."]
}
`;
}
