import type { APIRoute } from "astro";
import { buildMultipart } from "../../server/hub-sign.mjs";
import { postHub, clientIp } from "../../server/hub.mjs";
import { COMPLAINT_BRANDS, clean, looksLike, photoKind } from "../../server/intake.mjs";

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
  const customerName = clean(form.get("customerName") || form.get("name"), 160);
  const problemDescription = clean(form.get("problemDescription") || form.get("problem"), 4000);
  if (!customerName || !problemDescription) {
    return json({ ok: false, message: "Please enter your name and describe the problem." }, 400);
  }
  const brand = clean(form.get("brand"), 20);
  if (brand && !COMPLAINT_BRANDS.includes(brand)) {
    return json({ ok: false, message: "Please choose a brand." }, 400);
  }
  const fields: Record<string, string> = {
    customerName,
    mobile: clean(form.get("mobile") || form.get("phone"), 40),
    email: clean(form.get("email"), 160),
    city: clean(form.get("city"), 80),
    siteAddress: clean(form.get("siteAddress") || form.get("address"), 300),
    brand,
    unitType: clean(form.get("unitType"), 120),
    model: clean(form.get("model"), 120),
    serialNumber: clean(form.get("serialNumber"), 120),
    errorCode: clean(form.get("errorCode"), 80),
    problemDescription,
    preferredVisitTime: clean(form.get("preferredVisitTime") || form.get("visit"), 160),
    turnstileToken: clean(form.get("turnstileToken"), 2000),
  };
  const photos = form.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0).slice(0, 3);
  if (form.getAll("photos").filter((item) => item instanceof File && item.size > 0).length > 3) {
    return json({ ok: false, message: "Please choose no more than 3 photos." }, 400);
  }
  const files = [];
  for (const photo of photos) {
    if (photo.size > 8 * 1024 * 1024) return json({ ok: false, message: "Each photo must be 8 MB or smaller." }, 400);
    const kind = photoKind(photo.name);
    const bytes = Buffer.from(await photo.arrayBuffer());
    if (!kind || !looksLike(bytes, kind)) return json({ ok: false, message: "Photos must be JPEG, PNG, or WEBP." }, 400);
    files.push({ name: "photos", filename: photo.name, type: photo.type || "image/jpeg", bytes });
  }
  const video = form.get("video");
  if (video instanceof File && video.size > 0) {
    if (video.size > 50 * 1024 * 1024) return json({ ok: false, message: "The video must be 50 MB or smaller." }, 400);
    const bytes = Buffer.from(await video.arrayBuffer());
    if (!video.name.toLowerCase().endsWith(".mp4") || !looksLike(bytes, "mp4")) {
      return json({ ok: false, message: "The video must be an MP4 file." }, 400);
    }
    files.push({ name: "video", filename: video.name, type: "video/mp4", bytes });
  }
  const multipart = buildMultipart(fields, files);
  const result = await postHub({
    path: "complaints",
    rawBody: multipart.body,
    contentType: multipart.contentType,
    clientIp: clientIp(request),
  });
  return json(result.body, result.status);
};
