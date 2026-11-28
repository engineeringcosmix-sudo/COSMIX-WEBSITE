import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const banned = ["HUB_API_KEY", "HUB_HMAC_SECRET", "HUB_BASE_URL", "WEB3FORMS", "web3forms.com", "PUBLIC_WEB3FORMS", "PUBLIC_INQUIRY_ENDPOINT"];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

function isClientAsset(path) {
  const normalised = path.replaceAll("\\", "/");
  if (normalised.includes("/.netlify/") || normalised.includes("/_worker") || normalised.includes("/server/")) return false;
  return normalised.endsWith(".html") || normalised.endsWith(".js") || normalised.endsWith(".mjs") || normalised.endsWith(".css");
}

const root = new URL("../dist", import.meta.url);
const files = walk(root.pathname).filter(isClientAsset);
let failed = false;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const term of banned) {
    if (text.includes(term)) {
      console.error(`${term} found in client asset ${file}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log(`Client bundle check ok: ${files.length} files`);
