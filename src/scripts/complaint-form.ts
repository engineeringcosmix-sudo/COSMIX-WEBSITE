function showStatus(form: HTMLFormElement, text: string) {
  const status = form.querySelector("[data-status]");
  if (!(status instanceof HTMLElement)) return;
  status.classList.remove("hidden");
  status.textContent = text;
}

function complaintText(data: FormData) {
  const lines = [
    `Name: ${data.get("customerName") || ""}`,
    `Phone: ${data.get("mobile") || ""}`,
    `Email: ${data.get("email") || "—"}`,
    `City: ${data.get("city") || "—"}`,
    `Address: ${data.get("siteAddress") || "—"}`,
    `Brand: ${data.get("brand") || "—"}`,
    `Unit type: ${data.get("unitType") || "—"}`,
    `Model: ${data.get("model") || "—"}`,
    `Serial number: ${data.get("serialNumber") || "—"}`,
    `Error code: ${data.get("errorCode") || "—"}`,
    `Purchase or installation date: ${data.get("installed") || "—"}`,
    `Preferred visit: ${data.get("preferredVisitTime") || "—"}`,
    "",
    String(data.get("problemDescription") || ""),
  ];
  return lines.join("\n");
}

export function bindComplaintForm() {
  const form = document.querySelector("[data-complaint]");
  if (!(form instanceof HTMLFormElement) || form.dataset.bound === "true") return;
  form.dataset.bound = "true";
  const whatsapp = form.dataset.whatsapp || "";
  const photos = form.querySelector('input[name="photos[]"]');
  photos?.addEventListener("change", () => {
    if (!(photos instanceof HTMLInputElement) || !photos.files || photos.files.length <= 3) return;
    showStatus(form, "Please choose no more than 3 photos.");
    photos.value = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (String(data.get("company_website") || "").trim()) return;
    const files = photos instanceof HTMLInputElement && photos.files ? [...photos.files] : [];
    if (files.length > 3) {
      showStatus(form, "Please choose no more than 3 photos.");
      return;
    }
    if (files.some((file) => file.size > 8 * 1024 * 1024)) {
      showStatus(form, "Each photo must be 8 MB or smaller.");
      return;
    }
    const video = data.get("video");
    if (video instanceof File && video.size > 50 * 1024 * 1024) {
      showStatus(form, "The video must be 50 MB or smaller.");
      return;
    }
    const text = complaintText(data);
    const installed = String(data.get("installed") || "").trim();
    if (installed) {
      data.set(
        "problemDescription",
        `${String(data.get("problemDescription") || "").trim()}\n\nPurchase or installation date: ${installed}`,
      );
    }
    data.delete("installed");
    const token = String(data.get("cf-turnstile-response") || "").trim();
    if (token) data.set("turnstileToken", token);
    data.delete("cf-turnstile-response");

    const button = form.querySelector("[type='submit']");
    if (button instanceof HTMLButtonElement) button.disabled = true;
    showStatus(form, "Sending…");
    const wa = form.querySelector("[data-wa]");
    if (wa instanceof HTMLAnchorElement && whatsapp) {
      wa.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Complaint\n${text}`)}`;
    }
    try {
      const response = await fetch("/api/complaint", { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));
      const ticket = typeof result.ticketNumber === "string" ? result.ticketNumber : "";
      if (response.ok && result.ok && ticket.startsWith("CMP-")) {
        sessionStorage.setItem("cosmix-complaint", JSON.stringify({ ref: ticket, text: `Complaint ${ticket}\n${text}` }));
        location.href = `/complaint/received?ref=${encodeURIComponent(ticket)}`;
        return;
      }
      showStatus(form, result.message || "Please message us on WhatsApp and we will take this from there.");
    } catch {
      showStatus(form, "Please message us on WhatsApp and we will take this from there.");
    } finally {
      if (button instanceof HTMLButtonElement) button.disabled = false;
    }
  });
}
