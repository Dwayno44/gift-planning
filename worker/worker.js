// Calendar feed relay for Gift Planner.
//
// Browsers can't fetch an iCloud/Google "webcal://" feed directly from another
// site (no CORS headers), so the app POSTs the feed URL here and this Worker
// fetches it and hands back the raw .ics text.
//
// Locked down so it can't be used as a general-purpose proxy: only calendar
// hosts below, only requests from the planner's own origins.

const ALLOWED_ORIGINS = [
  "https://dwayno44.github.io",
  "http://localhost:5173",
];

const ALLOWED_HOSTS = [
  /\.icloud\.com$/,
  /^calendar\.google\.com$/,
  /^outlook\.(live|office365)\.com$/,
];

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function reply(status, body, origin, extra = {}) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders(origin), ...extra },
  });
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") ?? "";
    if (!ALLOWED_ORIGINS.includes(origin)) return new Response("Forbidden", { status: 403 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== "POST") return reply(405, "POST only", origin);

    let feedUrl;
    try {
      const { url } = await request.json();
      feedUrl = new URL(String(url).trim().replace(/^webcals?:\/\//i, "https://"));
    } catch {
      return reply(400, "That doesn't look like a calendar link.", origin);
    }
    if (feedUrl.protocol !== "https:" || !ALLOWED_HOSTS.some((re) => re.test(feedUrl.hostname))) {
      return reply(400, "Only iCloud, Google or Outlook calendar links are supported.", origin);
    }

    const upstream = await fetch(feedUrl.toString(), { cf: { cacheTtl: 900 } });
    if (!upstream.ok) return reply(502, `The calendar returned an error (${upstream.status}).`, origin);
    const text = await upstream.text();
    if (!text.includes("BEGIN:VCALENDAR")) return reply(502, "That link didn't return a calendar.", origin);

    return reply(200, text, origin, { "Content-Type": "text/calendar; charset=utf-8" });
  },
};
