# Cosmix Engineering

Static website for Cosmix Engineering (Pvt.) Ltd., Karachi. It replaces the WordPress/Elementor site with a content-driven Astro build: AUX, CLIVET and dehumidifiers are three separate catalogues.

## Develop

```bash
npm install
npm run dev
```

Open the URL Astro prints (usually http://localhost:4321).

```bash
npm run check   # brand separation, product counts, banned phrases
npm run build   # writes the static site to dist/
npm run preview # serve dist/ locally
```

Node.js 22 is the version this project was built with.

## Deploy

The site is a static export. `npm run build` produces `dist/`. Upload or host that folder. No Node server is required in production.

### Vercel

1. Import the repository.
2. Framework preset: Astro.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Optional environment variable: `PUBLIC_INQUIRY_ENDPOINT` (see below).

### Netlify

1. Build command: `npm run build`.
2. Publish directory: `dist`.
3. Optional environment variable: `PUBLIC_INQUIRY_ENDPOINT`.

### cPanel or any static host

1. Run `npm run build` on your computer or in CI.
2. Upload the **contents** of `dist/` into `public_html` (or the subdomain folder). Include the `images` folder, `sitemap-index.xml` and `robots.txt`.
3. The host must serve `index.html` for directory URLs such as `/brands/aux/`.

The canonical URL is set to `https://cosmixengineering.com` in `astro.config.mjs`. Change `site` there, and the sitemap line in `public/robots.txt`, if the domain differs.

## Enquiry form

`src/data/site.json` has `inquiry.endpoint`. Leave it empty and the quote form opens an email to sales@cosmixengineering.com. Set that field, or set `PUBLIC_INQUIRY_ENDPOINT` at build time, to an HTTPS URL that accepts `POST` with `Content-Type: application/json`.

WhatsApp click-to-chat uses +92 333 3152331 on every page.

## Adding a product

Edit only the catalogue it belongs to:

- `src/data/products/aux.json`
- `src/data/products/clivet.json`
- `src/data/products/dehumidifiers.json`

Copy an existing object. Keep `brand` the same as the file. Put WebP images in `public/images/products/<brand>/<slug>/` and point `gallery` and feature images at them. `related` must be slugs from the **same** file. VRF belongs in the AUX file only.

`npm run check` fails if a related product points at another brand, if a CLIVET product is named as VRF, or if the product counts change unexpectedly. Update the expected counts in `scripts/check-content.mjs` when you add a series on purpose.

## Owner decisions still open

These live in `src/data/owner-todos.json`. The public site does not print them.

1. **Years.** The old site said both “15+ years in business” and “since 1968” (Gafoor Engineering Services). Pick one. The new site says only that the company was formerly Gafoor Engineering Services, with no year and no counter.
2. **Projects.** The old site said both “more than 200 projects” and “2.5k projects completed”. The new site lists the six named projects and does not print a total.
3. **People.** The old site said both “31 engineers” and “150+ trained staff”, and also “1.5k happy clients”. No headcount is published.
4. **Warranty.** The old homepage offered a 1-year warranty on services. Confirm the wording before publishing it.
5. **Certification.** The old homepage said “Certified Company” and did not name a certificate.
6. **Shahrah-e-Faisal.** The old contact page listed “Shahrah-e-Faisal, Karachi” with no street number. The new site uses the head office the owner confirmed: C-25, Block 4, Gulshan-e-Iqbal, Karachi, plus Lahore at 516-E, Tajpura Scheme, Ghaziabad.
7. **Dehumidifier manufacturer.** Two products are listed (desiccant adsorption, inverter) with honest copy and diagrams. The old descriptions were copied from cassette and duct units and have been removed. Name the brand, then replace the diagrams and add a real capacity line-up.
8. **Third testimonial.** The sentence beginning “I really liked their services” sat ahead of the name Engineer Khalid Asghar, NUTECH, on the old page. Confirm that it is his.
9. **Logo permissions.** Confirm Cosmix may keep showing the ASHRAE, CEO Club Pakistan, TextileAsia, AUX, CLIVET, HOLTOP and RC Group marks.
10. **Enquiry endpoint.** Connect `inquiry.endpoint` or `PUBLIC_INQUIRY_ENDPOINT`.
11. **Duplicate photo.** `event_17.jpg` was identical to `event_04.jpg`. The gallery shows that photograph once (19 of the 20 files).

## Catalogues

| Catalogue | Series | URL |
| --- | --- | --- |
| AUX | 44, including VRF | `/brands/aux` |
| CLIVET | 20, no VRF | `/brands/clivet` |
| Dehumidifiers | 2 | `/brands/dehumidifiers` |

Product pages follow the approved layout: breadcrumb, gallery, title and short points, capacity boxes, one Request a quote button, overview, feature cards, capacity line-up, same-brand related products, and an enquiry strip. There is no downloads tab, no catalogue button, and no EER/COP/SEER table.
