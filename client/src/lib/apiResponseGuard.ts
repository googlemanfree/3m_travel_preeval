const HTML_RESPONSE_RE = /<\s*!doctype\s+html|<\s*html[\s>]/i;

export async function normalizeApiResponse(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    return response;
  }

  const body = await response.text();
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
