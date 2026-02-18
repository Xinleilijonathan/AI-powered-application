type LogRow = {
  ts: string;
  status: number;
  path: string;
  region: string;
  latency_ms: number;
};

function topNCount(map: Map<string, number>, n: number) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export function analyzeLogs(raw: string) {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: LogRow[] = lines.map((l) => JSON.parse(l));

  const total = rows.length;
  const errors = rows.filter((r) => r.status >= 500);
  const errorRate = total === 0 ? 0 : errors.length / total;

  const byPath = new Map<string, number>();
  const byRegion = new Map<string, number>();
  const latencies = rows.map((r) => r.latency_ms).sort((a, b) => a - b);

  for (const r of rows) {
    byPath.set(r.path, (byPath.get(r.path) ?? 0) + 1);
    byRegion.set(r.region, (byRegion.get(r.region) ?? 0) + 1);
  }

  const p = (percent: number) => {
    if (latencies.length === 0) return 0;
    const idx = Math.floor((percent / 100) * (latencies.length - 1));
    return latencies[idx];
  };

  return {
    totalRequests: total,
    errorRequests: errors.length,
    errorRate: Number((errorRate * 100).toFixed(2)), // percentage
    topPaths: topNCount(byPath, 5),
    topRegions: topNCount(byRegion, 5),
    latencyP50: p(50),
    latencyP95: p(95),
  };
}
