export const SAMPLE_LOGS = `
{"ts":"2026-02-17T10:00:01Z","status":200,"path":"/api/login","region":"SEA","latency_ms":120}
{"ts":"2026-02-17T10:00:05Z","status":502,"path":"/api/login","region":"SEA","latency_ms":950}
{"ts":"2026-02-17T10:00:09Z","status":500,"path":"/api/pay","region":"PDX","latency_ms":1100}
{"ts":"2026-02-17T10:00:13Z","status":200,"path":"/api/pay","region":"SEA","latency_ms":180}
{"ts":"2026-02-17T10:00:18Z","status":503,"path":"/api/login","region":"SEA","latency_ms":1300}
{"ts":"2026-02-17T10:00:22Z","status":200,"path":"/api/items","region":"SEA","latency_ms":90}
{"ts":"2026-02-17T10:00:28Z","status":500,"path":"/api/pay","region":"SEA","latency_ms":900}
{"ts":"2026-02-17T10:00:31Z","status":404,"path":"/api/unknown","region":"SEA","latency_ms":40}
{"ts":"2026-02-17T10:00:35Z","status":502,"path":"/api/login","region":"PDX","latency_ms":1400}
{"ts":"2026-02-17T10:00:40Z","status":200,"path":"/api/items","region":"PDX","latency_ms":110}
`.trim();
