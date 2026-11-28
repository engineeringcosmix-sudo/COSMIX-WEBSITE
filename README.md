# Cosmix Engineering

Static website for Cosmix Engineering (Pvt.) Ltd., Karachi. It replaces the WordPress/Elementor site with a content-driven Astro build: AUX, CLIVET and dehumidifiers are three separate catalogues.

## Develop

```bash
npm install
npm run dev
```

Open the URL Astro prints (usually http://localhost:4321).

```bash
npm run check   # catalogues, brand separation, and Hub request signing
npm run build   # static pages in dist/, form routes as a Netlify function
node scripts/check-client-bundle.mjs  # fails if Hub secrets are in the browser assets
```

Node.js 22 is the version this project was built with.

## Deploy

Pages are prerendered. The contact, quote, complaint and WhatsApp-click routes run as server functions through the Netlify adapter. A host that only serves files will still show the pages; the forms then ask the visitor to continue on WhatsApp.

### Netlify

1. Import the repository. Netlify should detect Astro.
2. Build command: `npm run build`.
3. Publish directory: `dist`. The adapter writes the form function beside it, and Netlify publishes both.
4. Set these environment variables on the site. Do not prefix the Hub values with `PUBLIC_`.

| Variable | Where it is used |
| --- | --- |
| `HUB_BASE_URL` | Hub origin, for example `https://hub.example.com`. Server only. |
| `HUB_API_KEY` | Sent as `X-Cosmix-Key`. Server only. |
| `HUB_HMAC_SECRET` | HMAC secret for `X-Cosmix-Signature`. Server only. |
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key. This one is visible in the browser. |

The Turnstile secret stays on the Hub host. Leave the Hub values empty until the owner has them. The forms still open and, until Hub is configured, ask the visitor to continue on WhatsApp.

### Static hosting

Uploading `dist/` to cPanel serves the pages. `/api/lead`, `/api/quote`, `/api/complaint` and `/api/wa-click` need the Netlify functions (or another host that runs this Astro adapter). Without them, submitting a form shows the WhatsApp message.

The canonical URL is set to `https://cosmixengineering.com` in `astro.config.mjs`. Change `site` there, and the sitemap line in `public/robots.txt`, if the domain differs.

## Enquiry and quote forms

`/contact` posts JSON to `/api/lead`. `/quote` posts multipart form data to `/api/quote`, including an optional Excel or PDF bill of quantities up to 15 MB. The website server signs the raw body and calls Hub at `/api/v1/public/leads` or `/api/v1/public/quote-requests`. The browser never sees the API key or the HMAC secret.

The range menu keeps AUX, CLIVET, LUKO, HOLTOP and Services in separate groups. A honeypot field and, when `PUBLIC_TURNSTILE_SITE_KEY` is set, a Turnstile widget are included. UTM parameters from the landing visit are stored for the session and sent with the form.

Sales calls and the site-wide WhatsApp button use +92 333 3152331. After-sales calls and complaint WhatsApp use +92 343 8248687. Clicks on `wa.me` links are posted to `/api/wa-click`.

## Complaints

`/complaint` posts to `/api/complaint`. Hub returns a reference such as `CMP-20261127-001`. The received page shows that number and can open WhatsApp to After-Sales on +92 343 8248687. Photos are JPEG, PNG or WEBP, up to three files of 8 MB. An MP4 up to 50 MB can be attached. Until Hub is configured, the form does not invent a reference; it asks the visitor to continue on WhatsApp.

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
7. **Dehumidifier manufacturer.** Done. The Industrial Dehumidifiers section lists seven LUKO series.
8. **Third testimonial.** The sentence beginning “I really liked their services” sat ahead of the name Engineer Khalid Asghar, NUTECH, on the old page. Confirm that it is his.
9. **Logo permissions.** Confirm Cosmix may keep showing the ASHRAE, CEO Club Pakistan, TextileAsia, AUX, CLIVET, HOLTOP and RC Group marks.
10. **Hub intake.** Set `HUB_BASE_URL`, `HUB_API_KEY` and `HUB_HMAC_SECRET` on the website host, and create the Turnstile widget (`PUBLIC_TURNSTILE_SITE_KEY` here, secret on Hub).
11. **Duplicate photo.** `event_17.jpg` was identical to `event_04.jpg`. The gallery shows that photograph once (19 of the 20 files).

## Catalogues

| Catalogue | Series | URL |
| --- | --- | --- |
| AUX | 44, including VRF | `/brands/aux` |
| CLIVET | 20, no VRF | `/brands/clivet` |
| LUKO dehumidifiers | 7 | `/brands/dehumidifiers` |

Product pages follow the approved layout: breadcrumb, gallery, title and short points, capacity boxes, one Request a quote button, overview, feature cards, capacity line-up, same-brand related products, and an enquiry strip. There is no downloads tab, no catalogue button, and no EER/COP/SEER table.
