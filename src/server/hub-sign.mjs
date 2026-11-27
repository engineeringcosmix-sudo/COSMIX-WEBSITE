import { createHmac, randomBytes } from "node:crypto";

/** HMAC-SHA256 of `${timestamp}.${rawBody}`, matching Cosmix Hub website intake. */
export function signBody(secret, timestamp, rawBody) {
  const prefix = Buffer.from(`${timestamp}.`);
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const hex = createHmac("sha256", secret).update(Buffer.concat([prefix, body])).digest("hex");
  return `sha256=${hex}`;
}

export function buildMultipart(fields, files) {
  const boundary = `----CosmixHub${randomBytes(8).toString("hex")}`;
  const chunks = [];
  const push = (value) => chunks.push(Buffer.from(value));
  for (const [name, value] of Object.entries(fields)) {
    if (value == null || value === "") continue;
    push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${String(value)}\r\n`,
    );
  }
  for (const file of files) {
    const type = file.type || "application/octet-stream";
    const filename = String(file.filename || "upload").replace(/[\r\n"]/g, "");
    push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${filename}"\r\nContent-Type: ${type}\r\n\r\n`,
    );
    chunks.push(file.bytes);
    push("\r\n");
  }
  push(`--${boundary}--\r\n`);
  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}
