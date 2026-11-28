import type { APIRoute } from "astro";
import { postHub, clientIp } from "../../server/hub.mjs";
import { clean } from "../../server/intake.mjs";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }
  const body: Record<string, string> = {
    page: clean(payload.page, 300),
    brand: clean(payload.brand, 40),
  };
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = clean(payload[key], 160);
    if (value) body[key] = value;
  }
  const result = await postHub({
    path: "whatsapp-clicks",
    rawBody: JSON.stringify(body),
    contentType: "application/json",
    clientIp: clientIp(request),
  });
  return new Response(JSON.stringify(result.ok ? { ok: true } : { ok: false }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
