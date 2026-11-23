import { boundedBody } from '../../api/gateway.js';

// Reuse the audited gateway with Netlify's web-standard Request/Response API.
export function adapt(handler) {
  return async function (request) {
    let body;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try { body = await boundedBody(request, 1_500_000); }
      catch { return Response.json({ error: { code: 'GOLD_NETWORK', message: 'Request exceeds its limit.' } }, { status: 413 }); }
    }
    const headers = new Headers();
    let result;
    const response = {
      statusCode: 200,
      setHeader(name, value) { headers.set(name, value); },
      end(value) { result = value; },
    };
    await handler({
      method: request.method,
      url: request.url,
      headers: { ...Object.fromEntries(request.headers), host: new URL(request.url).host },
      body,
    }, response);
    return new Response(request.method === 'HEAD' ? null : result ?? null, { status: response.statusCode, headers });
  };
}
