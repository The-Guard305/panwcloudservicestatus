/*
  PANW Status API Proxy (Azure Static Web Apps Functions)
  - Strict allowlist to prevent open proxy abuse
  - Timeouts + response size guard
  - Adds caching headers for resilience + cost control
*/

import type { AzureFunction, Context, HttpRequest } from "@azure/functions";

const UPSTREAM_BASE = "https://status.paloaltonetworks.com/api/v2";
const TIMEOUT_MS = 8000;
const MAX_BYTES = 1_500_000; // 1.5MB safety guard

// Mirror the strict mapping you already use in vite.config.ts
const ROUTE_MAP: Record<string, string> = {
  "summary": "/summary.json",
  "status": "/status.json",
  "components": "/components.json",
  "incidents/unresolved": "/incidents/unresolved.json",
  "incidents": "/incidents.json",
  "scheduled-maintenances/upcoming": "/scheduled-maintenances/upcoming.json",
  "scheduled-maintenances/active": "/scheduled-maintenances/active.json",
  "scheduled-maintenances": "/scheduled-maintenances.json"
};

function jsonResponse(status: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  return {
    status,
    body,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  };
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json"
      }
    });
  } finally {
    clearTimeout(t);
  }
}

export const handler: AzureFunction = async (context: Context, req: HttpRequest) => {
  const rawPath = (req.params.path || "").replace(/^\/+/, "");

  // Allow only exact allowlist paths
  const mapped = ROUTE_MAP[rawPath];
  if (!mapped) {
    return (context.res = jsonResponse(404, { error: "Not Found" }, { "Cache-Control": "no-store" }));
  }

  const upstreamUrl = `${UPSTREAM_BASE}${mapped}`;

  try {
    const upstream = await fetchWithTimeout(upstreamUrl);

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return (context.res = jsonResponse(
        upstream.status,
        { error: "Upstream error", status: upstream.status, statusText: upstream.statusText, details: text.slice(0, 300) },
        { "Cache-Control": "no-store" }
      ));
    }

    // Size guard
    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return (context.res = jsonResponse(502, { error: "Upstream response too large" }, { "Cache-Control": "no-store" }));
    }

    const json = JSON.parse(new TextDecoder("utf-8").decode(buf));

    // Cache for 60s at edge; allow stale if upstream hiccups
    return (context.res = jsonResponse(200, json, {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=120, stale-if-error=600"
    }));
  } catch (e: unknown) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Upstream timeout" : (e instanceof Error ? e.message : "Unknown error");
    return (context.res = jsonResponse(504, { error: msg }, { "Cache-Control": "no-store" }));
  }
};

export default handler;
