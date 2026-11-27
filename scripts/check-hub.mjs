import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { buildMultipart, signBody } from "../src/server/hub-sign.mjs";
import { postHub } from "../src/server/hub.mjs";
import { leadFromFields, looksLike } from "../src/server/intake.mjs";

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const secret = "test-secret";
const timestamp = "1700000000";
const body = '{"name":"Ayesha Khan","mobile":"03001234567"}';
const expected = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
if (signBody(secret, timestamp, body) !== expected) fail("String signature did not match.");
if (signBody(secret, timestamp, Buffer.from(body)) !== expected) fail("Buffer signature did not match the string body.");

const missing = await postHub({
  path: "leads",
  rawBody: body,
  contentType: "application/json",
  clientIp: "203.0.113.10",
  env: {},
});
if (!missing.body?.fallback || missing.body.ok !== false) fail("Missing Hub configuration should ask the visitor to use WhatsApp.");

if (!leadFromFields({}).error) fail("A lead without a name should be rejected.");
if (!leadFromFields({ name: "A", mobile: "0300", productInterest: "VRF" }).error) fail("Unknown product interest should be rejected.");
const lead = leadFromFields({
  name: "Ayesha Khan",
  mobile: "03001234567",
  productInterest: "AUX_VRF",
  areaSqFt: "1200",
  estimatedTR: "",
  utm_source: "google",
  company: "",
});
if (lead.error || lead.lead.areaSqFt !== 1200 || lead.lead.productInterest !== "AUX_VRF") fail("Lead fields were not normalised.");
if ("company" in lead.lead || "estimatedTR" in lead.lead) fail("Empty lead fields should be omitted.");

if (!looksLike(Buffer.from("%PDF-1.4"), "pdf")) fail("PDF magic bytes should pass.");
if (looksLike(Buffer.from("not a pdf"), "pdf")) fail("Plain text should not pass as a PDF.");
const xlsx = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from("xl/workbook.xml")]);
if (!looksLike(xlsx, "xlsx")) fail("XLSX magic bytes should pass.");
if (looksLike(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]), "xlsx")) fail("A ZIP without an xl/ entry should not pass as XLSX.");

const server = createServer((request, response) => {
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    const raw = Buffer.concat(chunks);
    const signed = signBody(secret, request.headers["x-cosmix-timestamp"], raw);
    const ok =
      request.url === "/api/v1/public/leads" &&
      request.headers["x-cosmix-key"] === "test-key" &&
      request.headers["x-cosmix-signature"] === signed &&
      request.headers["x-cosmix-client-ip"] === "203.0.113.10" &&
      raw.toString() === body;
    response.writeHead(ok ? 201 : 401, { "content-type": "application/json" });
    response.end(ok ? JSON.stringify({ leadId: "lead-1", duplicate: false }) : JSON.stringify({ message: "Website credential was missing or did not match." }));
  });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const posted = await postHub({
  path: "leads",
  rawBody: body,
  contentType: "application/json",
  clientIp: "203.0.113.10",
  env: {
    HUB_BASE_URL: `http://127.0.0.1:${port}`,
    HUB_API_KEY: "test-key",
    HUB_HMAC_SECRET: secret,
  },
});
server.close();

if (!posted.ok || posted.body.leadId !== "lead-1") fail("Signed lead was not accepted by the mock Hub.");

const multipart = buildMultipart({ name: "Ayesha", mobile: "03001234567" }, [
  { name: "boq", filename: "boq.pdf", type: "application/pdf", bytes: Buffer.from("%PDF-1.4") },
]);
if (!multipart.contentType.includes("boundary=") || !multipart.body.includes(Buffer.from("%PDF-1.4"))) {
  fail("Multipart body did not keep the file bytes.");
}
if (!multipart.body.includes(Buffer.from('name="boq"'))) fail("Multipart body did not include the BOQ part.");

if (process.exitCode) console.error("Hub check failed");
else console.log("Hub check ok");
