import { absoluteUrl, companyImages, site, type Product } from "./catalog";

export function organizationLd() {
  return {
    "@type": "HVACBusiness",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: absoluteUrl(companyImages.logo.src),
    image: absoluteUrl(companyImages.og.src),
    email: site.emails[0],
    telephone: site.phones.map((phone) => phone.display),
    openingHours: "Mo-Sa 09:00-20:00",
    address: site.offices.map((office) => ({
      "@type": "PostalAddress",
      streetAddress: office.lines.slice(0, -1).join(", "),
      addressLocality: office.city,
      addressCountry: "PK",
    })),
    sameAs: site.socials.map((social) => social.href),
    areaServed: { "@type": "Country", name: "Pakistan" },
  };
}

export function productLd(product: Product) {
  const data: Record<string, unknown> = {
    "@type": "Product",
    name: product.name,
    description: product.overview,
    image: product.gallery.map((image) => absoluteUrl(image.src)),
    category: product.categoryName,
    url: absoluteUrl(`/brands/${product.brand}/${product.slug}`),
    sku: `${product.brand}-${product.slug}`,
  };
  if (product.brand === "aux" || product.brand === "clivet") {
    data.brand = { "@type": "Brand", name: product.brand === "aux" ? "AUX" : "CLIVET" };
  }
  return data;
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function jsonLd(nodes: Record<string, unknown>[]) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
}
