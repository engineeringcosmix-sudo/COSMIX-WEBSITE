import { signBody } from "./hub-sign.mjs";

export function hubConfig(env = process.env) {
  const base = String(env.HUB_BASE_URL || "").trim().replace(/\/$/, "");
  const key = String(env.HUB_API_KEY || "").trim();
  const secret = String(env.HUB_HMAC_SECRET || "").trim();
  if (!base || !key || !secret) return null;
  return { base, key, secret };
}

export function clientIp(request) {
  const header =
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "";
  return header.split(",")[0].trim();
}

export async function postHub({ path, rawBody, contentType, clientIp: ip, env = process.env, fetchImpl = fetch }) {
  const config = hubConfig(env);
  if (!config) {
    return {
      ok: false,
      fallback: true,
      status: 200,
      body: {
        ok: false,
        fallback: true,
        message: "Please message us on WhatsApp and we will take this from there.",
      },
    };
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signBody(config.secret, timestamp, rawBody);
  let response;
  try {
    response = await fetchImpl(`${config.base}/api/v1/public/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "X-Cosmix-Key": config.key,
        "X-Cosmix-Timestamp": timestamp,
        "X-Cosmix-Signature": signature,
        "X-Cosmix-Client-Ip": ip || "",
      },
      body: rawBody,
    });
  } catch {
    return {
      ok: false,
      fallback: true,
      status: 200,
      body: {
        ok: false,
        fallback: true,
        message: "Please message us on WhatsApp and we will take this from there.",
      },
    };
  }
  const text = await response.text();
  let parsed = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { message: text.slice(0, 300) };
  }
  if (!response.ok) {
    return {
      ok: false,
      fallback: false,
      status: response.status,
      body: {
        ok: false,
        message: typeof parsed === "string" ? parsed : parsed.message || parsed.title || "The office system could not accept that.",
      },
    };
  }
  return { ok: true, fallback: false, status: response.status, body: { ok: true, ...parsed } };
}
