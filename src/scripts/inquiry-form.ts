import { attributionFields } from "./attribution";

const TEXT_FIELDS = [
  "name",
  "company",
  "designation",
  "mobile",
  "whatsapp",
  "email",
  "city",
  "province",
  "productInterest",
  "projectType",
  "areaSqFt",
  "estimatedTR",
  "timeline",
  "budget",
] as const;

function showStatus(form: HTMLFormElement, text: string) {
  const status = form.querySelector("[data-status]");
  if (!(status instanceof HTMLElement)) return;
  status.classList.remove("hidden");
  status.textContent = text;
}

function composedMessage(data: FormData) {
  const product = String(data.get("product") || "").trim();
  const message = String(data.get("message") || "").trim();
  return product ? `Product: ${product}\n\n${message}` : message;
}

function whatsappHref(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function applyAttribution(target: { set: (key: string, value: string) => void }) {
  const fields = attributionFields();
  for (const [key, value] of Object.entries(fields)) {
    if (value) target.set(key, value);
  }
}

export function bindInquiryForms() {
  document.querySelectorAll("[data-inquiry]").forEach((node) => {
    if (node instanceof HTMLFormElement) bindInquiryForm(node);
  });
}

function bindInquiryForm(form: HTMLFormElement) {
  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";
  const mode = form.dataset.mode === "contact" ? "contact" : "quote";
  const whatsapp = form.dataset.whatsapp || "";
  const params = new URLSearchParams(location.search);
  const interest = form.querySelector("[name='productInterest']");
  const product = form.querySelector("[name='product']");
  const requestedInterest = params.get("interest") || "";
  if (interest instanceof HTMLSelectElement && requestedInterest) {
    interest.value = [...interest.options].some((option) => option.value === requestedInterest) ? requestedInterest : "";
  }
  if (product instanceof HTMLInputElement) {
    product.value = params.get("product") || params.get("productName") || "";
  }

  const wa = form.querySelector("[data-wa]");
  const refreshWa = () => {
    if (!(wa instanceof HTMLAnchorElement) || !whatsapp) return;
    const data = new FormData(form);
    const interestLabel =
      interest instanceof HTMLSelectElement && interest.value
        ? interest.selectedOptions[0]?.textContent?.trim() || ""
        : "";
    const lines = [
      "Hello Cosmix Engineering,",
      "",
      `Name: ${data.get("name") || ""}`,
      `Company: ${data.get("company") || ""}`,
      `Phone: ${data.get("mobile") || ""}`,
      `City: ${data.get("city") || ""}`,
      interestLabel ? `Range: ${interestLabel}` : "",
      data.get("product") ? `Product: ${data.get("product")}` : "",
      "",
      String(data.get("message") || ""),
    ];
    wa.href = whatsappHref(whatsapp, lines.filter((line) => line !== "").join("\n"));
  };
  form.addEventListener("input", refreshWa);
  refreshWa();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (String(data.get("company_website") || "").trim()) return;
    const file = data.get("boq");
    if (file instanceof File && file.size > 15 * 1024 * 1024) {
      showStatus(form, "The bill of quantities must be 15 MB or smaller.");
      return;
    }
    if (file instanceof File && file.size > 0 && !/\.(pdf|xlsx|xls)$/i.test(file.name)) {
      showStatus(form, "Upload the bill of quantities as an Excel or PDF file.");
      return;
    }

    const button = form.querySelector("[type='submit']");
    if (button instanceof HTMLButtonElement) button.disabled = true;
    showStatus(form, "Sending…");
    const message = composedMessage(data);
    try {
      const response =
        mode === "contact"
          ? await fetch("/api/lead", {
              method: "POST",
              headers: { "content-type": "application/json", accept: "application/json" },
              body: JSON.stringify(leadPayload(data, message)),
            })
          : await fetch("/api/quote", { method: "POST", body: quotePayload(data, message) });
      const result = await readJson(response);
      if (!response.ok || result.ok === false) {
        showStatus(form, result.message || "Please message us on WhatsApp and we will take this from there.");
        return;
      }
      showStatus(
        form,
        mode === "contact"
          ? "Thank you. The Cosmix team has your message."
          : "Thank you. The Cosmix team has your quotation request.",
      );
      form.reset();
      refreshWa();
      resetTurnstile();
    } catch {
      showStatus(form, "Please message us on WhatsApp and we will take this from there.");
    } finally {
      if (button instanceof HTMLButtonElement) button.disabled = false;
    }
  });
}

function leadPayload(data: FormData, message: string) {
  const body: Record<string, string> = {
    company_website: String(data.get("company_website") || ""),
    message,
  };
  for (const key of TEXT_FIELDS) {
    const value = String(data.get(key) || "").trim();
    if (value) body[key] = value;
  }
  const token = String(data.get("cf-turnstile-response") || "").trim();
  if (token) body.turnstileToken = token;
  applyAttribution({ set: (key, value) => { body[key] = value; } });
  return body;
}

function quotePayload(data: FormData, message: string) {
  data.set("message", message);
  data.delete("product");
  const token = String(data.get("cf-turnstile-response") || "").trim();
  if (token) data.set("turnstileToken", token);
  data.delete("cf-turnstile-response");
  applyAttribution(data);
  return data;
}

async function readJson(response: Response): Promise<{ ok?: boolean; message?: string; ticketNumber?: string }> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function resetTurnstile() {
  const turnstile = (window as unknown as { turnstile?: { reset: () => void } }).turnstile;
  turnstile?.reset();
}
