const HTML_RESPONSE_RE = /<\s*!doctype\s+html|<\s*html[\s>]/i;

export async function normalizeApiResponse(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const isTextResponse = contentType.includes("text/html") || contentType.includes("text/plain");
  const isJsonResponse = contentType.includes("application/json") || contentType.includes("application/superjson");
  const body = await response.clone().text();
  // Certains proxies/CDN conservent le corps JSON mais remplacent ou
  // suppriment son Content-Type. Détecter uniquement le MIME laisse alors
  // passer une réponse JSON brute, que tRPC ne peut pas transformer.
  const trimmedBody = body.trim();
  const looksLikeJson = trimmedBody.startsWith("{") || trimmedBody.startsWith("[");
  if (!isTextResponse && !isJsonResponse && !looksLikeJson) return response;
  if (isJsonResponse || looksLikeJson) {
    try {
      const parsed = JSON.parse(body) as unknown;
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      const alreadyTrpc = entries.every((entry) => Boolean(entry && typeof entry === "object" && ("result" in entry || "error" in entry)));
      if (alreadyTrpc) {
        if (isJsonResponse) return response;
        return new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: { ...Object.fromEntries(response.headers.entries()), "content-type": "application/json; charset=utf-8" },
        });
      }
      const wrapped = entries.map((entry) => ({ result: { data: { json: entry } } }));
      return new Response(JSON.stringify(wrapped), { status: response.status, statusText: response.statusText, headers: { ...Object.fromEntries(response.headers.entries()), "content-type": "application/json; charset=utf-8" } });
    } catch {
      // Le repli HTML ci-dessous fournit une erreur tRPC lisible pour les corps non JSON.
    }
  }

  if (!HTML_RESPONSE_RE.test(body)) {
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  const payload = [{
    error: {
      json: {
        message: "Le serveur a renvoyé une page au lieu de la réponse API. Veuillez réessayer.",
        code: "INTERNAL_SERVER_ERROR",
        data: { httpStatus: 502, path: null },
      },
    },
  }];

  return new Response(JSON.stringify(payload), {
    status: 502,
    statusText: "Bad Gateway",
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
