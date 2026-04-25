// Proxy relais : Inwi → Deno → Worker CF → Cible
const WORKER_URL = "https://inwi.abdou-benadada.workers.dev";
const API_KEY = ""; // ou "" si pas de clé

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  
  if (!target) {
    return new Response("Usage: ?url=https://site.com", { status: 400 });
  }

  // Appel au Worker Cloudflare (depuis Deno, pas depuis Inwi)
  const workerUrl = `${WORKER_URL}/?url=${encodeURIComponent(target)}`;
  
  const workerReq = new Request(workerUrl, {
    method: req.method,
    headers: {
      "Authorization": API_KEY ? `Bearer ${API_KEY}` : "",
      "X-Forwarded-For": req.headers.get("x-forwarded-for") || "unknown",
    },
    body: req.body,
  });

  try {
    const resp = await fetch(workerReq);
    const newHeaders = new Headers(resp.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    
    return new Response(resp.body, {
      status: resp.status,
      headers: newHeaders,
    });
  } catch (err) {
    return new Response("Relay error: " + err.message, { status: 502 });
  }
});
