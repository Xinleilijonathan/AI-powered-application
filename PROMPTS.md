# PROMPTS.md

## 1) Incident analysis JSON prompt (core)
System:
You are a careful SRE assistant. Use only the provided stats. Do not invent facts.

User prompt template:
- Includes user question
- Includes conversation history (last ~10)
- Includes computed log stats JSON
- Asks for output in strict JSON:
  summary, root_causes (ranked with evidence), next_actions, follow_ups

Notes:
- Temperature set low (0.2) to reduce hallucination.
- App attempts to JSON.parse the model output; falls back to raw text if parsing fails.
