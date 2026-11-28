import type { APIRoute } from "astro";
import { postHub, clientIp } from "../../server/hub.mjs";
import { leadFromFields } from "../../server/intake.mjs";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: "Please check the form and try again." }, 400);
  }
  if (String(payload.company_website || "").trim()) {
    return json({ ok: false, message: "Please message us on WhatsApp." }, 400);
  }
  const parsed = leadFromFields(payload);
  if (parsed.error) return json({ ok: false, message: parsed.error }, 400);
  const raw = JSON.stringify(parsed.lead);
  const result = await postHub({
    path: "leads",
    rawBody: raw,
    contentType: "application/json",
    clientIp: clientIp(request),
  });
  return json(result.body, result.status);
};
