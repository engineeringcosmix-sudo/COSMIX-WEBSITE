import type { APIRoute } from "astro";
import { buildMultipart } from "../../server/hub-sign.mjs";
import { postHub, clientIp } from "../../server/hub.mjs";
import { boqKind, leadFromFields, looksLike } from "../../server/intake.mjs";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, message: "Please check the form and try again." }, 400);
  }
  if (String(form.get("company_website") || "").trim()) {
    return json({ ok: false, message: "Please message us on WhatsApp." }, 400);
  }
  const fields = Object.fromEntries([...form.entries()].filter((entry) => typeof entry[1] === "string"));
  const parsed = leadFromFields(fields);
  if (parsed.error) return json({ ok: false, message: parsed.error }, 400);
  const file = form.get("boq");
  const files = [];
  if (file instanceof File && file.size > 0) {
    if (file.size > 15 * 1024 * 1024) return json({ ok: false, message: "The bill of quantities must be 15 MB or smaller." }, 400);
    const kind = boqKind(file.name);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!kind || !looksLike(bytes, kind)) {
      return json({ ok: false, message: "Upload the bill of quantities as an Excel or PDF file." }, 400);
    }
    files.push({ name: "boq", filename: file.name, type: file.type || "application/octet-stream", bytes });
  }
  const multipart = buildMultipart(parsed.lead as Record<string, string | number>, files);
  const result = await postHub({
    path: "quote-requests",
    rawBody: multipart.body,
    contentType: multipart.contentType,
    clientIp: clientIp(request),
  });
  return json(result.body, result.status);
};
