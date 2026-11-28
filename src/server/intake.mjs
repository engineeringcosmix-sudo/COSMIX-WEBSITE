export const PRODUCT_INTERESTS = [
  "AUX_VRF",
  "AUX_OTHER",
  "CLIVET_CHILLER",
  "CLIVET_HEATPUMP",
  "CLIVET_ROOFTOP",
  "CLIVET_AHU",
  "LUKO_DEHUMIDIFIER",
  "HOLTOP_AHU",
  "SERVICES",
];

export const SOURCES = ["WEBSITE", "GOOGLE", "FACEBOOK", "WHATSAPP", "EXHIBITION", "REFERRAL"];

export const COMPLAINT_BRANDS = ["AUX", "CLIVET", "LUKO", "OTHER"];

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

export function clean(value, max = 500) {
  return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, max);
}

export function leadFromFields(fields) {
  const name = clean(fields.name, 160);
  const mobile = clean(fields.mobile || fields.phone, 40);
  const whatsapp = clean(fields.whatsapp, 40);
  const email = clean(fields.email, 160);
  if (!name) return { error: "Please enter your name." };
  if (!mobile && !whatsapp && !email) return { error: "Please enter a mobile number, WhatsApp number, or email." };
  const productInterest = clean(fields.productInterest, 40);
  if (productInterest && !PRODUCT_INTERESTS.includes(productInterest)) return { error: "Please choose a product interest." };
  const source = SOURCES.includes(clean(fields.source, 20)) ? clean(fields.source, 20) : "WEBSITE";
  const lead = { name, source };
  const optional = {
    company: clean(fields.company, 160),
    designation: clean(fields.designation, 120),
    mobile,
    whatsapp,
    email,
    city: clean(fields.city, 80),
    province: clean(fields.province, 80),
    message: clean(fields.message, 4000),
    productInterest,
    projectType: clean(fields.projectType, 120),
    timeline: clean(fields.timeline, 120),
    budget: clean(fields.budget, 80),
    pageUrl: clean(fields.pageUrl, 500),
    turnstileToken: clean(fields.turnstileToken, 2000),
  };
  for (const [key, value] of Object.entries(optional)) {
    if (value) lead[key] = value;
  }
  const area = Number(fields.areaSqFt);
  const tons = Number(fields.estimatedTR);
  if (Number.isFinite(area) && fields.areaSqFt !== "" && fields.areaSqFt != null) lead.areaSqFt = area;
  if (Number.isFinite(tons) && fields.estimatedTR !== "" && fields.estimatedTR != null) lead.estimatedTR = tons;
  for (const key of UTM) {
    const value = clean(fields[key], 160);
    if (value) lead[key] = value;
  }
  return { lead };
}

export function looksLike(bytes, kind) {
  if (kind === "pdf") return bytes.length > 4 && bytes.subarray(0, 4).toString() === "%PDF";
  if (kind === "xlsx") {
    return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes.includes(Buffer.from("xl/"));
  }
  if (kind === "xls") return bytes.length > 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  if (kind === "jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (kind === "png") return bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (kind === "webp") return bytes.length > 12 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (kind === "mp4") return bytes.subarray(0, Math.min(bytes.length, 32)).includes(Buffer.from("ftyp"));
  return false;
}

export function boqKind(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  return "";
}

export function photoKind(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  return "";
}
