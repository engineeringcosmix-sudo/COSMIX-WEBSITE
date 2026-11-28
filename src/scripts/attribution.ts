const KEY = "cosmix-attribution";
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

type Attribution = Partial<Record<(typeof UTM)[number], string>> & { referrer?: string; landing?: string };

function read(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") as Attribution;
  } catch {
    return {};
  }
}

function mapSource(data: Attribution) {
  const source = (data.utm_source || "").toLowerCase();
  if (source.includes("google")) return "GOOGLE";
  if (source.includes("facebook") || source.includes("instagram") || source === "fb") return "FACEBOOK";
  if (source.includes("whatsapp")) return "WHATSAPP";
  if (source.includes("exhibition")) return "EXHIBITION";
  if (source.includes("referral")) return "REFERRAL";
  return "WEBSITE";
}

export function attributionFields() {
  const data = read();
  return {
    utm_source: data.utm_source || "",
    utm_medium: data.utm_medium || "",
    utm_campaign: data.utm_campaign || "",
    utm_term: data.utm_term || "",
    utm_content: data.utm_content || "",
    pageUrl: location.href,
    source: mapSource(data),
  };
}

function brandFromPath() {
  const match = location.pathname.match(/^\/brands\/(aux|clivet|dehumidifiers)(?:\/|$)/);
  if (!match) return "";
  if (match[1] === "dehumidifiers") return "LUKO";
  return match[1].toUpperCase();
}

export function installAttribution() {
  const flag = "__cosmixAttribution";
  if ((window as unknown as Record<string, boolean>)[flag]) return;
  (window as unknown as Record<string, boolean>)[flag] = true;

  const params = new URLSearchParams(location.search);
  const current = read();
  let changed = false;
  for (const key of UTM) {
    const value = params.get(key);
    if (value && !current[key]) {
      current[key] = value.slice(0, 160);
      changed = true;
    }
  }
  if (!current.referrer && document.referrer) {
    current.referrer = document.referrer.slice(0, 500);
    changed = true;
  }
  if (!current.landing) {
    current.landing = location.href.slice(0, 500);
    changed = true;
  }
  if (changed) sessionStorage.setItem(KEY, JSON.stringify(current));

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[href*='wa.me']");
    if (!(link instanceof HTMLAnchorElement)) return;
    const fields = attributionFields();
    const payload = JSON.stringify({
      page: location.pathname,
      brand: link.dataset.waBrand || brandFromPath(),
      utm_source: fields.utm_source,
      utm_medium: fields.utm_medium,
      utm_campaign: fields.utm_campaign,
      utm_term: fields.utm_term,
      utm_content: fields.utm_content,
    });
    fetch("/api/wa-click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  });
}
