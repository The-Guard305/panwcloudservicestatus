/*
  PANW Status API Proxy (Azure Static Web Apps Functions)
  Node 18 compatible CommonJS handler.
  - Strict allowlist to prevent open proxy abuse
  - Timeout + size guard
  - Cache headers for cost control and resilience
*/

const UPSTREAM_BASE = "https://status.paloaltonetworks.com/api/v2";
const TIMEOUT_MS = 8000;
const MAX_BYTES = 1_500_000; // 1.5MB

const ROUTE_MAP = {
  "summary": "/summary.json",
  "status": "/status.json",
  "components": "/components.json",
  "incidents/unresolved": "/incidents/unresolved.json",
  "incidents": "/incidents.json",
  "scheduled-maintenances/upcoming": "/scheduled-maintenances/upcoming.json",
  "scheduled-maintenances/active": "/scheduled-maintenances/active.json",
  "scheduled-maintenances": "/scheduled-maintenances.json"
};

function json(status, body, headers = {}) {
  return {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    },
    body
  };
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json" }
    });
  } finally {
    clearTimeout(t);
  }
}

module.exports = async function (context, req) {
  const rawPath = (context.bindingData && context.bindingData.path ? context.bindingData.path : "")
    .toString()
    .replace(/^\/+/, "");

  const mapped = ROUTE_MAP[rawPath];
  if (!mapped) {
    context.res = json(404, { error: "Not Found" }, { "Cache-Control": "no-store" });
    return;
  }

  const upstreamUrl = `${UPSTREAM_BASE}${mapped}`;

  try {
    const upstream = await fetchWithTimeout(upstreamUrl);

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      context.res = json(
        upstream.status,
        {
          error: "Upstream error",
          status: upstream.status,
          statusText: upstream.statusText,
          details: text.slice(0, 300)
        },
        { "Cache-Control": "no-store" }
      );
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      context.res = json(502, { error: "Upstream response too large" }, { "Cache-Control": "no-store" });
      return;
    }

    const parsed = JSON.parse(buf.toString("utf-8"));

    context.res = json(200, parsed, {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=120, stale-if-error=600"
    });
  } catch (e) {
    const msg = e && e.name === "AbortError" ? "Upstream timeout" : (e && e.message ? e.message : "Unknown error");
    context.res = json(504, { error: msg }, { "Cache-Control": "no-store" });
  }
};
