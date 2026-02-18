# cf_ai_log-copilot

An AI-powered log investigation copilot built on **Cloudflare Workers + Durable Objects**.

This application analyzes recent logs, computes evidence-based metrics (error rate, top endpoints, latency percentiles), and uses a Large Language Model (LLM) to generate a ranked root-cause report with recommended next actions.

---

## Live Demo

https://cf-ai-log-copilot.li-xinle.workers.dev

> Note: The deployed version requires an LLM API key configured as a Cloudflare secret.  
> If the key is missing or quota is exceeded, the UI will display a readable error message.

---

## Features

- **Chat UI** (single-page HTML)
- **Durable Objects state management** (session-based memory)
- **Log analytics engine**
  - Total requests
  - 5xx error rate
  - Top endpoints
  - Top regions
  - Latency p50 / p95
- **LLM integration (external)** via OpenAI Chat Completions API
- **Structured JSON output parsing** with safe fallback handling
- **Production-ready secret management**

---

## Architecture

High-level flow:

1. Browser sends `{ sessionId, message }` to `POST /api/chat`
2. Worker routes the request to a Durable Object instance keyed by `sessionId`
3. Session Durable Object:
   - Loads and updates conversation history
   - Computes log statistics
   - Calls the LLM using stats + conversation context
   - Returns structured report + stats

### Architecture Diagram

Browser
│ POST /api/chat
▼
Worker (src/worker.ts)
│ Routes by sessionId
▼
Durable Object (src/session-do.ts)
│ state.storage (memory)
│ analyzeLogs()
│ LLM API call
▼
Structured JSON response

---

## Repository Structure

cf_ai_log-copilot/
│
├── src/
│ ├── worker.ts # HTTP routing + UI + Durable Object stub
│ ├── session-do.ts # Stateful session logic + LLM integration
│ ├── log_analyzer.ts # Log statistics computation engine
│ ├── sample_logs.ts # Demo log dataset
│ └── prompts.ts # LLM prompt builder
│
├── public/ index.html
├── data/ sample-logs.jsonl
│
├── output.png # Example output screenshot
│
├── PROMPTS.md # Prompt documentation (required by assignment)
├── README.md
├── wrangler.toml # Cloudflare Worker configuration
├── tsconfig.json
├── package.json
├── package-lock.json
│
├── .gitignore
└── .dev.vars # Local development secrets (NOT committed)

---

## LLM Design

The prompt includes:

- User question
- Conversation history (last N messages)
- Structured log statistics (JSON)
- Strict output schema requirement:
  - `summary`
  - `root_causes` (ranked with evidence)
  - `next_actions`
  - `follow_ups`

The application attempts to parse structured JSON from the model and falls back safely if parsing fails.

---

## Local Development

### Prerequisites

- Node.js 20+
- Cloudflare Wrangler

### Install dependencies

```bash
npm install

### Create environment file

Create a file named .dev.vars in the project root:
OPENAI_API_KEY=your_openai_api_key_here
Make sure .dev.vars is listed in .gitignore.

### Run locally

```bash
npx wrangler dev

Open the local URL shown in the terminal.

Deploy to Cloudflare
    1. Set production secret
    npx wrangler secret put OPENAI_API_KEY
    Paste your API key when prompted.
    2. Deploy
    npx wrangler deploy

Demo Prompts

Try asking:
    why are 5xx increasing?
    show top endpoints
    what should I check next?
    is this a latency issue or application error?

```bash
