import auxJson from "../data/products/aux.json";
import clivetJson from "../data/products/clivet.json";
import dehuJson from "../data/products/dehumidifiers.json";
import servicesJson from "../data/services.json";
import projectsJson from "../data/projects.json";
import eventsJson from "../data/events.json";
import siteJson from "../data/site.json";
import imagesJson from "../data/company-images.json";
import partnersJson from "../data/partners.json";
import testimonialsJson from "../data/testimonials.json";

export type BrandId = "aux" | "clivet" | "dehumidifiers";

export interface ProductImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  kind?: "photo" | "icon";
}

export interface Product {
  brand: BrandId;
  slug: string;
  name: string;
  subtitle: string;
  categoryId: string;
  categoryName: string;
  group: string;
  model: string;
  bullets: string[];
  capacityBoxes: { label: string; value: string }[];
  capacity: { text: string; min: number | null; max: number | null; unit: string | null };
  overview: string;
  features: { title: string; text: string; image: ProductImage | null }[];
  lineupLabel: string;
  lineup: string[];
  lineupNote: string;
  gallery: ProductImage[];
  related: string[];
  ctaTitle: string;
  ctaText: string;
}

export interface BrandInfo {
  id: BrandId;
  name: string;
  href: string;
  possessive: string;
  summary: string;
  note: string;
}

export const site = siteJson;
export const companyImages = imagesJson;
export const partners = partnersJson.partners;
export const affiliations = partnersJson.affiliations;
export const events = eventsJson;
export const services = servicesJson;
export const projects = projectsJson;
export const testimonials = testimonialsJson;

export const brands: BrandInfo[] = [
  {
    id: "aux",
    name: "AUX",
    href: "/brands/aux",
    possessive: "AUX",
    summary:
      "VRF outdoor and indoor units, ventilation kits, chillers, fan coil units, light commercial splits, Free Match multi-split, residential wall-mounted units, heat pumps and controls.",
    note: "From compact rooms to large modular systems.",
  },
  {
    id: "clivet",
    name: "CLIVET",
    href: "/brands/clivet",
    possessive: "CLIVET",
    summary:
      "Air-cooled and water-cooled chillers, heat pumps, rooftop packages, and air handling and fresh-air units.",
    note: "Plant for offices, hotels, hospitals and industry.",
  },
  {
    id: "dehumidifiers",
    name: "Industrial Dehumidifiers",
    href: "/brands/dehumidifiers",
    possessive: "dehumidifier",
    summary: "Desiccant and inverter dehumidifiers for storage, process rooms and other spaces that need controlled humidity.",
    note: "Humidity control for commercial and industrial rooms.",
  },
];

const catalogs: Record<BrandId, Product[]> = {
  aux: auxJson as Product[],
  clivet: clivetJson as Product[],
  dehumidifiers: dehuJson as Product[],
};

export function isBrand(value: string): value is BrandId {
  return value === "aux" || value === "clivet" || value === "dehumidifiers";
}

export function brandInfo(id: BrandId): BrandInfo {
  const brand = brands.find((item) => item.id === id);
  if (!brand) throw new Error(`Unknown brand ${id}`);
  return brand;
}

export function productsFor(brand: BrandId): Product[] {
  return catalogs[brand];
}

export function allProducts(): Product[] {
  return [...catalogs.aux, ...catalogs.clivet, ...catalogs.dehumidifiers];
}

export function categoriesFor(brand: BrandId) {
  const seen = new Map<string, { id: string; name: string; group: string; count: number }>();
  for (const product of catalogs[brand]) {
    const current = seen.get(product.categoryId);
    if (current) current.count += 1;
    else seen.set(product.categoryId, { id: product.categoryId, name: product.categoryName, group: product.group, count: 1 });
  }
  return [...seen.values()];
}

export function relatedProducts(product: Product): Product[] {
  const list = catalogs[product.brand];
  return product.related
    .map((slug) => list.find((item) => item.slug === slug))
    .filter((item): item is Product => Boolean(item));
}

export function productPath(product: Product): string {
  return `/brands/${product.brand}/${product.slug}`;
}

/** AUX ARV-H outdoor VRF only. Indoor VRF, ARV-C, and every other range are excluded. */
export function showsEuroventBadge(product: Product): boolean {
  return product.brand === "aux" && product.categoryId === "vrf-outdoor" && /ARV-H/i.test(product.model);
}

export const euroventCertificate = {
  href: "https://www.eurovent-certification.com/en/advancedsearch/result?program=VRF&product_type=VRF%2FA%2FR&current_range=AUX%7CARV-H-%2FNR1A",
  label: "Eurovent Certified Performance – Certificate N° 19.11.005",
  image: "/images/certification/eurovent-ecp.png",
  width: 1618,
  height: 559,
};

export function searchText(product: Product): string {
  return [product.name, product.subtitle, product.model, product.categoryName, product.capacity.text]
    .join(" ")
    .toLowerCase();
}

export const inquiryEndpoint = import.meta.env.PUBLIC_INQUIRY_ENDPOINT || site.inquiry.endpoint;

export function whatsappLink(text: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return new URL(path, site.url).href;
}

export const eventCategories = [
  { id: "all", name: "All" },
  { id: "awards", name: "Awards & Recognition" },
  { id: "exhibitions", name: "Exhibitions" },
  { id: "summits", name: "Summits" },
] as const;
