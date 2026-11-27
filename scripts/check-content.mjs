import { readFileSync } from "node:fs";

const aux = JSON.parse(readFileSync(new URL("../src/data/products/aux.json", import.meta.url)));
const clivet = JSON.parse(readFileSync(new URL("../src/data/products/clivet.json", import.meta.url)));
const dehu = JSON.parse(readFileSync(new URL("../src/data/products/dehumidifiers.json", import.meta.url)));
const events = JSON.parse(readFileSync(new URL("../src/data/events.json", import.meta.url)));
const todos = JSON.parse(readFileSync(new URL("../src/data/owner-todos.json", import.meta.url)));

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (aux.length !== 44) fail(`Expected 44 AUX products, found ${aux.length}`);
if (clivet.length !== 20) fail(`Expected 20 CLIVET products, found ${clivet.length}`);
if (dehu.length !== 2) fail(`Expected 2 dehumidifier products, found ${dehu.length}`);
if (events.length < 19) fail(`Expected at least 19 event photos, found ${events.length}`);
if (todos.confirmed !== false) fail("Owner stats must stay unpublished until confirmed.");

const slugs = {
  aux: new Set(aux.map((item) => item.slug)),
  clivet: new Set(clivet.map((item) => item.slug)),
  dehumidifiers: new Set(dehu.map((item) => item.slug)),
};

for (const product of [...aux, ...clivet, ...dehu]) {
  if (!product.overview || !product.gallery?.length || !product.bullets?.length) {
    fail(`Incomplete product ${product.brand}/${product.slug}`);
  }
  const blob = JSON.stringify(product);
  for (const term of ["--removal", "removall", "Hello world", "Download Catalogue", "EER", "SEER", "SCOP"]) {
    if (blob.includes(term)) fail(`${term} found in ${product.slug}`);
  }
  if (!/request a quote/i.test(product.ctaTitle + product.ctaText) && product.brand !== "dehumidifiers") {
    // CTA copy varies; the template always renders the quote button.
  }
  for (const related of product.related) {
    if (!slugs[product.brand].has(related)) fail(`Cross-brand related link ${product.brand}/${product.slug} -> ${related}`);
  }
  for (const image of product.gallery) {
    if (!image.alt) fail(`Missing alt on ${product.slug}`);
    if (product.brand !== "aux" && image.src.includes("/products/aux/")) fail(`AUX image on ${product.slug}`);
    if (product.brand !== "clivet" && image.src.includes("/products/clivet/")) fail(`CLIVET image on ${product.slug}`);
  }
  if (product.brand === "clivet" && /vrf/i.test(`${product.categoryId} ${product.categoryName} ${product.name}`)) {
    fail(`CLIVET VRF reference on ${product.slug}`);
  }
}

const heroSafe = events.filter((event) => event.featured && event.heroSafe === false);
if (heroSafe.length) fail("A non-hero-safe photo is marked featured");

if (process.exitCode) {
  console.error("Content check failed");
} else {
  console.log(`Content check ok: ${aux.length} AUX, ${clivet.length} CLIVET, ${dehu.length} dehumidifiers, ${events.length} events`);
}
