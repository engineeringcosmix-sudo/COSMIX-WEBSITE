# Cosmix Engineering

Static website for Cosmix Engineering (Pvt.) Ltd., Karachi. It replaces the WordPress/Elementor site with a content-driven Astro build: AUX, CLIVET and dehumidifiers are three separate catalogues.

## Develop

```bash
npm install
npm run dev
```

Open the URL Astro prints (usually http://localhost:4321).

```bash
npm run check   # catalogues, brand separation, and PHP Hub signing
npm run build   # static pages plus PHP form endpoints in dist/
node scripts/check-client-bundle.mjs  # fails if Hub secrets are in the browser assets
```

Node.js 22 builds the pages. The host only needs Apache and PHP 8.1.

## Hero videos

Background clips live in `public/videos/hero/`. Each clip has an `.mp4`, a `.webm`, and a poster at `public/videos/posters/<same-name>.jpg`. The home page lists those names in `src/pages/index.astro`. To use the owner’s footage, replace the three files for a name and keep the file name, or change the `slides` list to the new file name. Keep each file under about 3 MB at 720p. The clips shipping now are Mixkit stock (rooftop plant, site construction, outdoor condensing units), muted, looping, and covered by the Mixkit licence. The Internet Archive did not return the old WordPress video files.

## Deploy on Hostinger

`npm run build` writes `dist/`. That folder is the contents of `public_html`: HTML, images, `.htaccess`, and `api/*.php`. There is no Node server. `.htaccess` turns on HTTPS, serves directory URLs, sends unknown paths to `404.html`, compresses text, and maps `/api/lead`, `/api/quote`, `/api/complaint` and `/api/wa-click` to the PHP files.

Hub credentials live in `cosmix-config.php` **next to** `public_html`, not inside it. Copy `config.sample.php` from this repo to that path and fill in:

| Key | What it is |
| --- | --- |
| `HUB_BASE_URL` | Hub origin, for example `https://hub.example.com` |
| `HUB_API_KEY` | Sent as `X-Cosmix-Key` |
| `HUB_HMAC_SECRET` | HMAC secret for `X-Cosmix-Signature` |

Leave them empty until Hub has issued them. The forms still open and ask the visitor to continue on WhatsApp. `PUBLIC_TURNSTILE_SITE_KEY` is optional and is baked in at build time. The Turnstile secret stays on the Hub host.

1. In hPanel, turn on the free SSL certificate for cosmixengineering.com before uploading. The site redirects HTTP to HTTPS.
2. Download a copy of the current `public_html` (the WordPress site) before replacing it.
3. In File Manager, open the folder that **contains** `public_html`. Upload the filled `cosmix-config.php` there, beside `public_html`.
4. Open `public_html`, upload `cosmix-hostinger-public_html.zip`, and extract it so `index.html`, `.htaccess` and `api/` sit directly in `public_html`.
5. Delete the zip from `public_html`. Do not upload `cosmix-config.php` into `public_html`.

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
10. **Hub intake.** Copy `config.sample.php` to `cosmix-config.php` beside `public_html` and fill in the three Hub values. Create the Turnstile widget if you want the captcha (`PUBLIC_TURNSTILE_SITE_KEY` at build time, secret on Hub).
11. **Duplicate photo.** `event_17.jpg` was identical to `event_04.jpg`. The gallery shows that photograph once (19 of the 20 files).

## Catalogues

| Catalogue | Series | URL |
| --- | --- | --- |
| AUX | 44, including VRF | `/brands/aux` |
| CLIVET | 20, no VRF | `/brands/clivet` |
| LUKO dehumidifiers | 7 | `/brands/dehumidifiers` |

Product pages follow the approved layout: breadcrumb, gallery, title and short points, capacity boxes, one Request a quote button, overview, feature cards, capacity line-up, same-brand related products, and an enquiry strip. There is no downloads tab, no catalogue button, and no EER/COP/SEER table.
