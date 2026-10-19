# DAMI MERIDIAN

**STYLE. SCENT. IDENTITY.**

A premium fashion, fragrance and lifestyle storefront — and admin dashboard — for **DAMI MERIDIAN**, a brand based at Elizade University, Ilara Mokin, Ondo State, Nigeria.

> This project was previously a jewellery-only site branded *ROCKYLUXE*. It has been rebranded end to end: identity, product categories, imagery, copy, admin and backend schema. The word ROCKYLUXE no longer appears in the application.

---

## What it does

### Storefront (`/`)

A scroll-driven editorial storefront. Customers browse a live catalogue and place every order through WhatsApp — there is **no cart, checkout or payment integration** (deliberate).

| Section | Purpose |
| --- | --- |
| **Navigation** | Sticky header: DAMI MERIDIAN wordmark + meridian mark, anchor links (Home, Shop, Collections, About, Contact), WhatsApp CTA, admin access, full-screen blurred mobile menu. |
| **Hero** | Split editorial hero — "STYLE. SCENT. IDENTITY." with a fashion photograph, *Explore Collections* and *Chat on WhatsApp* CTAs, and four trust indicators (Premium Quality, Secure Ordering, Reliable Delivery, Customer Satisfaction). |
| **Categories** | Five editorial cards — Men's T-Shirts, Women's T-Shirts, Unisex Joggers, Perfumes, Jewellery — each with category-correct photography and a working *Browse Collection* action that pre-filters the shop. |
| **Collections** | Bento-style feature grid; selecting a tile filters the shop to that collection. |
| **Shop** | Live catalogue with **search, collection filter and price sorting**, skeleton loaders, an error state with retry, and an empty state. |
| **Product modal** | Accessible dialog: large image, prev/next, thumbnail gallery, counter, price, availability, description, size/colour pickers, fragrance details when present, and an *Order on WhatsApp* CTA. |
| **Brand story** | The DAMI MERIDIAN story, built only from supplied facts. |
| **Why DAMI MERIDIAN** | Value cards for curation, secure ordering and service. |
| **How to Order** | The four real steps: browse → view details → order on WhatsApp → confirm. |
| **Testimonials** | Carousel, currently an honest empty state — no reviews have been supplied yet. |
| **FAQ** | Accessible accordion (one panel open at a time, `aria-expanded`/`aria-controls`). |
| **Contact** | WhatsApp, phone and location cards, plus a form that hands the message off to WhatsApp. |
| **Footer** | Brand block, links, the five collections, contact details, social handles. |
| **Floating WhatsApp button** | Always-visible chat button. |

### Admin (`/admin`)

A responsive sidebar dashboard for managing the catalogue.

1. **Bootstrap** — `GET /admin/status` decides the screen: registration is shown **only** when no admin exists, otherwise login.
2. **Login / register** — email + password; the returned JWT is stored in `sessionStorage` and decoded locally to enforce the 1-hour expiry client-side.
3. **Dashboard** — inventory summary cards computed from the real product list (total, in stock, out of stock, made to order, inventory value, price range). No fabricated sales, revenue or customer figures.
4. **Products** — searchable, filterable table with thumbnails, name, collection, ₦ price, availability, edit and delete. Below `md` it becomes a stacked card list rather than a squeezed table.
5. **Add / edit product** — name, collection, price, availability, description, optional sizes/colors/fragrance details, and multi-image drag-and-drop upload (PNG/JPG, ≤ 5 MB each) with previews for both new and already-saved images.
6. **Settings / Change Password** — current + new password with show/hide toggles and inline validation.
7. **Logout** — clears the session.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Build tool | Vite 5 (`@vitejs/plugin-react`) |
| Framework | React 19 + TypeScript 5.7 (strict) |
| Routing | react-router-dom 6 (`BrowserRouter`) |
| Styling | Tailwind CSS v4 (CSS-first config in `src/index.css`) |
| Type | Cormorant Garamond (display) + Jost (body), self-hosted via Fontsource |
| Icons | lucide-react, react-icons |
| Dialogs / toasts | SweetAlert2 |
| Backend | Separate Express + MongoDB API hosted on Render — **not in this repo** |

`@radix-ui/*`, `recharts`, `react-hook-form`, `zod`, `sonner` and friends are installed for the shadcn/ui set in `src/components/ui`, which is currently unused by the application itself.

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on port 3000, opens automatically |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | `eslint .` — **note: ESLint is not installed and there is no config** |
| `npx tsc --noEmit` | Typecheck |

### Path alias

`@/` → `./src` (set in both `vite.config.ts` and `tsconfig.json`).

---

## Project structure

```
.
├── index.html                 # Document shell, SEO + Open Graph metadata
├── vite.config.ts             # @ alias, dev server on :3000
├── postcss.config.mjs         # Tailwind v4 PostCSS plugin
├── components.json            # shadcn/ui config
├── vercel.json                # Vite SPA deployment config
├── .env.example               # VITE_API_URL template
├── public/
│   ├── _headers               # Cache headers for Netlify / Cloudflare-style hosts
│   ├── logo.svg               # DAMI MERIDIAN wordmark lockup
│   ├── logo-mark.svg          # Meridian mark (nav, footer, favicon)
│   ├── favicon.svg            # Mark on a near-black rounded square
│   ├── apple-icon.png         # Generated brand icons
│   └── images/                # Editorial + category photography
│       ├── hero-editorial.jpg     # Hero fashion editorial
│       ├── brand-story.jpg        # Brand story portrait
│       ├── cat-*.jpg              # One shot per collection
│       ├── collection-*.jpg       # Featured collections bento
│       └── why-*.jpg              # Why-shop cards
└── src/
    ├── main.tsx               # React root, font imports
    ├── App.tsx                # Router: "/" → Storefront, "/admin" → AdminPage
    ├── index.css              # Design system: tokens, utilities, motion
    ├── vite-env.d.ts          # VITE_API_URL typing
    ├── types/product.ts       # Product, AdminFormProduct, InventorySummary
    ├── hooks/
    │   ├── useProducts.ts     # Catalogue loader (loading / error / refetch)
    │   ├── use-mobile.ts      # (shadcn)
    │   └── use-toast.ts       # (shadcn)
    ├── lib/
    │   ├── api.ts             # API client + VITE_API_URL + Bearer auth
    │   ├── brand.ts           # Brand constants and contact details
    │   ├── collections.ts     # The five collections
    │   ├── session.ts         # JWT storage, expiry, auth header
    │   ├── whatsapp.ts        # Order-message builders
    │   ├── productImages.ts   # imageURLs normalisation
    │   └── utils.ts           # cn() helper
    ├── pages/
    │   └── AdminPage.tsx      # Bootstrap → login/register → dashboard
    └── components/
        ├── Section.tsx        # Container / Section layout primitives
        ├── Navigation.tsx     Footer.tsx
        ├── ProductCard.tsx    ProductModal.tsx
        ├── WhatsAppButton.tsx WhatsAppOrderButton.tsx
        ├── admin/
        │   ├── AdminDashboard.tsx    AdminSidebar.tsx
        │   ├── AdminProductForm.tsx
        │   ├── InventorySummary.tsx  ProductTable.tsx  ChangePasswordForm.tsx
        └── sections/
            ├── Hero.tsx  Categories.tsx  Collections.tsx  Shop.tsx
            ├── BrandStory.tsx  WhyShop.tsx  HowItWorks.tsx
            ├── Testimonials.tsx  FAQ.tsx  Contact.tsx
        └── ui/               # shadcn/ui primitives (unused by the app)
```

---

## Design system

Defined once in `src/index.css` using Tailwind v4's CSS-first `@theme` block.

| Token | Value | Role |
| --- | --- | --- |
| `--background` | `#0B0B0F` | Page background |
| `--surface` | `#141414` | Raised panels, footer, cards |
| `--primary` | `#C8A24A` | Gold accent — CTAs, icons, active nav |
| `--gold-light` | `#E5C477` | Warm highlight |
| `--foreground` | `#FFFFFF` | Headings |
| `--muted-foreground` | `#B7B7B7` | Supporting text |
| `--border` | `#2A2A2A` | Subtle borders |

**Custom utilities:** `glass`, `glass-gold`, `glass-dark`, `text-gradient`, `gold-hairline`, `btn-gold`, `btn-outline-gold`, `eyebrow`, `rule-gold`, `card-luxury`, `scrollbar-slim`, `line-clamp-2/3`, `animate-drift`.

**Motion:** `animate-fade-in-up`, `animate-fade-in`, `animate-slide-in-left/right`, `animate-float`, `animate-glow`, `animate-shimmer`. A global `prefers-reduced-motion` block disables all of it for users who ask for less motion.

---

## Backend API

The frontend talks to a **separate** Express + MongoDB service. The base URL is read from `VITE_API_URL` in `src/lib/api.ts`, falling back to the live Render deployment.

```bash
# .env.local  (git-ignored)
# VITE_API_URL=http://localhost:4000
# VITE_API_URL=http://localhost:4000   # for a local backend
```

> The Render service is still named `rockyluxe-bd`. That is infrastructure, not branding — if you rename the service, update `VITE_API_URL` and the fallback in `src/lib/api.ts`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/jewelry/getallproducts` | public | List products |
| `POST` | `/jewelry/addproducts` | **Bearer** | Create product (multipart) |
| `PUT` | `/jewelry/editproducts/:id` | **Bearer** | Update product (multipart) |
| `DELETE` | `/jewelry/deleteproducts/:id` | **Bearer** | Delete product |
| `GET` | `/admin/status` | public | `{ adminExists: boolean }` |
| `POST` | `/admin/login` | public | Returns `{ token }` (JWT, 1 h) |
| `POST` | `/admin/register` | public | Creates the first admin only |
| `PUT` | `/admin/changepassword` | **Bearer** | Change admin password |

`src/lib/api.ts` attaches `Authorization: Bearer <token>` to every protected call automatically, using the token from `src/lib/session.ts`.

### Product shape

```ts
interface Product {
  _id?: string
  name: string
  price: number            // naira
  imageURLs: string[]      // one or more image URLs
  description?: string
  category?: string        // AVAILABILITY: "In Stock" | "Out of Stock" | ...
  collection?: string      // men-tshirts | women-tshirts | joggers | perfumes | jewellery
  sizes?: string[]         // optional apparel options
  colors?: string[]        // optional apparel options
  fragranceNotes?: string  // optional fragrance detail
  volume?: string          // optional fragrance detail
}
```

`collection` is **new**. Records created before the rebrand have no value, so the backend falls back to `jewellery` — the previous product line — and every pre-rebrand product keeps working with no migration.

### Product categories vs availability

The backend reuses one field for two things historically. To avoid a breaking change the two concepts are now separate:

- `category` — unchanged: **availability** (`In Stock`, `Out of Stock`, `Made to Order`, `Coming Soon`).
- `collection` — **new**: the product group.

---

## WhatsApp ordering

Orders are placed over WhatsApp. `src/lib/whatsapp.ts` builds a prefilled message containing the brand, product name, chosen size and colour, price, the currently viewed image URL, and a product reference, then links to `https://wa.me/2348155589764`.

The number is defined once in `src/lib/brand.ts` as `WHATSAPP_NUMBER` in international format. The visible number (0815 558 9764) and the calling number (0902 979 4742, `tel:+2349029794742`) live alongside it.

---

## Configuration

There is no `.env` file committed. Everything else is centralised:

| What | Where |
| --- | --- |
| Brand name, slogan, contact details, social handles | `src/lib/brand.ts` |
| The five collections, their copy and imagery | `src/lib/collections.ts` |
| Colour palette, fonts, utilities, motion | `src/index.css` |
| API base URL | `VITE_API_URL` → `src/lib/api.ts` |
| WhatsApp number | `WHATSAPP_NUMBER` in `src/lib/brand.ts` |

Social profiles are rendered as **handles, not links**, because no verified profile URLs have been supplied. Add a `url` to the `SOCIALS` array in `src/lib/brand.ts` and the components will link out automatically.

---

## Deployment

Vercel-ready: `vercel.json` declares `framework: "vite"`, `outputDirectory: "dist"` and an SPA rewrite so `/admin` deep-links work.

```bash
npm run build
```

`dist/` is git-ignored and no longer tracked, so an old build can no longer be resurrected by a checkout, reset or merge.

### Caching

The document and the bundle are cached differently on purpose:

| Path | `Cache-Control` | Why |
| --- | --- | --- |
| `/`, `/index.html`, SPA routes (`/admin`) | `no-cache, no-store, must-revalidate, max-age=0` | The HTML is the only thing that points at the current bundle. It must never be reused, or the browser keeps a document that references deleted assets. |
| `/assets/*` | `public, max-age=31536000, immutable` | Vite fingerprints these filenames, so a new build always produces new URLs. |
| `/images/*` | `public, max-age=604800` | Editorial photography is not fingerprinted, so it only gets a short cache. |

The same policy is repeated in `public/_headers` for Netlify / Cloudflare Pages style hosts, which read a `_headers` file instead of `vercel.json`.

### Verifying a deployment

Every build carries a marker in the served `index.html`:

```html
<meta name="application-name" content="DAMI MERIDIAN" />
<meta name="build-id" content="dm-2026-10-19-rebrand-1" />
```

Check which build is live:

```bash
curl -s https://your-domain.example/ | grep -i 'build-id\|application-name'
```

The output must contain `content="dm-2026-10-19-rebrand-1"`. If it contains the old `ROCKYLUXE` marker (or no marker at all), the deployment is serving an older build — check that `dist/` was rebuilt and redeployed, and that the build id in `index.html` was bumped.

**A hard refresh should no longer be needed.** The HTML entry point is served with `no-cache, no-store, must-revalidate, max-age=0`, so the browser revalidates and re-downloads the document on every normal load; it can never keep serving a cached document that points at an old bundle. The fingerprinted files under `/assets/` are served `immutable`, which is safe because their URLs change whenever the content changes.

Bump `build-id` in `index.html` whenever a new build is shipped so the marker keeps identifying the live build.

---

## Backend work required

The frontend and backend live in separate repositories. The following backend changes are already implemented in `luxury-jewelry-website-bd` and **must be deployed** for the frontend to work correctly:

1. **`middleware/auth.js` was ESM inside a CommonJS package.** It used `export const` while `package.json` has no `"type": "module"`, so importing it would have thrown a `SyntaxError` and taken the server down. That is why it was never wired up. It is now CommonJS.
2. **`verifyToken` is now mounted** on `POST /jewelry/addproducts`, `PUT /jewelry/editproducts/:id`, `DELETE /jewelry/deleteproducts/:id` and `PUT /admin/changepassword`. Before this, **every write endpoint was open to anyone** — `DELETE` returned `{"message":"Product deleted"}` for a non-existent id with no token at all.
3. **`Models/modelProduct.js`** gained the `collection`, `sizes`, `colors`, `fragranceNotes` and `volume` fields, all optional and backward compatible.
4. **`Controllers/user.controllersproduct.js`** now returns `404` for a missing product on delete/edit instead of reporting success.

> **Deployment order matters.** The backend now returns `401` on protected routes. Deploy the frontend (which sends the Bearer token) at the same time as, or before, the backend.

No MongoDB migration is needed — `collection` defaults to `jewellery` for existing documents.

---

## Content that still needs supplying

The site deliberately contains no invented business facts. These are the gaps a brand owner should fill:

- **Social profile URLs** — TikTok and Instagram are shown as the handle "DAMI MERIDIAN" because no URLs were provided.
- **Genuine customer reviews** — the testimonial carousel renders an empty state until real reviews are added to the array in `src/components/sections/Testimonials.tsx`.
- **Email address** — not supplied, so no email link is rendered.
- **Product images for the new categories** — the existing catalogue contains two jewellery products. Adding t-shirts, joggers and perfumes through the admin dashboard will use the correct imagery per category.

---

## Licence

Private project. All rights reserved.

---

## Build output

Production build (`npm run build`):

| Asset | Raw | Gzipped |
| --- | --- | --- |
| `index.js` | 481 kB | 137 kB |
| `index.css` | 153 kB | 23 kB |
| Fonts | 8 woff2 subsets, self-hosted | — |

Typecheck (`npm run typecheck`) is clean. `lucide-react` tree-shakes correctly, so unused icons are not shipped.
