# DAMI MERIDIAN

**STYLE. SCENT. IDENTITY.**

A premium fashion, fragrance and lifestyle storefront — and admin dashboard — for **DAMI MERIDIAN**, a brand based at Elizade University, Ilara Mokin, Ondo State, Nigeria.

> This project was previously a jewellery-only site branded *ROCKYLUXE*. It has been rebranded end to end: identity, product categories, imagery, copy, admin and backend schema. The word ROCKYLUXE no longer appears in the application.

---

## What it does

### Storefront

A dark editorial storefront where **every major screen is its own route** with a real URL (shareable, refreshable, deep-linkable). Customers browse a live catalogue and place every order through WhatsApp — there is **no cart, checkout or payment integration** (deliberate).

| Route | Page | Notes |
| --- | --- | --- |
| `/` | `HomePage` | Hero → Categories → Collections → Shop → Brand story → Why → How to order → Testimonials → FAQ → Contact |
| `/shop` | `ShopPage` | Full catalogue; reads `?collection=` and `?q=` so nav/footer/category links pre-filter it |
| `/collections` | `CollectionsPage` | The five collections at a glance |
| `/about` | `AboutPage` | Brand story, values, built only from supplied facts |
| `/contact` | `ContactPage` | WhatsApp, phone, location + form that hands off to WhatsApp |
| `/products/:id` | `ProductDetailsPage` | Fetched from the backend by Mongo `_id` (`GET /jewelry/products/:id`) |
| `*` | `NotFoundPage` | 404 with a way back |

Shared chrome lives in `PublicLayout`: skip link, sticky **Navigation** (wordmark + meridian mark, router links, WhatsApp CTA, admin access, full-screen blurred mobile menu, search → `/shop?q=`), `<main>`, **Footer**, and the floating **WhatsApp button**.

Home sections worth calling out:

| Section | Purpose |
| --- | --- |
| **Hero** | Split editorial hero — "STYLE. SCENT. IDENTITY." with a fashion photograph, *Explore Collections* and *Chat on WhatsApp* CTAs, and four trust indicators (Premium Quality, Secure Ordering, Reliable Delivery, Customer Satisfaction). |
| **Categories** | Five editorial cards — Men's T-Shirts, Women's T-Shirts, Unisex Joggers, Perfumes, Jewellery — each with category-correct photography and a *Browse Collection* link to `/shop?collection=<id>`. |
| **Collections** | Bento-style feature grid; each tile links to `/shop?collection=<id>`. |
| **Shop** | Live catalogue with **search, collection filter and price sorting**, skeleton loaders, an error state with retry, and an empty state. Product cards navigate to `/products/:id`. |
| **Product detail** | Gallery (prev/next/thumbnails/counter), price, availability, description, size/colour pickers for apparel only, fragrance details when present, `Reference:` line, related products, and an *Order on WhatsApp* CTA carrying the product URL. |
| **Testimonials** | Carousel, currently an honest empty state — no reviews have been supplied yet. |
| **FAQ** | Accessible accordion (one panel open at a time, `aria-expanded`/`aria-controls`). |
| **Contact** | WhatsApp, phone and location cards, plus a form that hands the message off to WhatsApp. |

**Search state** — `?q=` on the Shop URL is the single source of truth for search: the committed term is derived from `useSearchParams` (trimmed, lowercased) and never stored in state, so the two can never drift apart. The visible search box is local UI state adopted one-way from the URL — an effect syncs external writes (e.g. the nav bar navigating to `/shop?q=…` while the section is already mounted), guarded by normalized equality so it can never bounce a committed value back. Typing debounces a 200 ms write-back with `{ replace: true }`, keeping keystrokes out of the history stack, and every `setSearchParams` call is value-guarded so an equal value causes zero navigation.

### Admin (`/admin/*`)

A responsive sidebar dashboard for managing the catalogue — also fully routed, with `AdminLayout` guarding every protected screen (unauthenticated visitors are redirected to `/admin/login`; an expired JWT triggers `UNAUTHORIZED_EVENT` → cleared session → login with a notice).

| Route | Page | Notes |
| --- | --- | --- |
| `/admin` | Session-aware redirect (dashboard if valid, login otherwise) | |
| `/admin/login` | `AdminLoginPage` (authenticated → dashboard) | |
| `/admin/register` | `AdminRegisterPage` (offered **only** while `GET /admin/status` reports no admin) | |
| `/admin/dashboard` | `AdminDashboardPage` | |
| `/admin/products` | `AdminProductsPage` | |
| `/admin/products/lookup` | `AdminProductLookupPage` | Fetch a product's full details by Reference (Mongo `_id`) — deep-linkable via `?ref=<id>` |
| `/admin/products/new` | `AdminAddProductPage` | |
| `/admin/products/:id/edit` | `AdminEditProductPage` | |
| `/admin/settings` | `AdminSettingsPage` | |
| `/admin/change-password` | `AdminChangePasswordPage` | |
| `/admin/*` (unknown) | Redirect to `/admin` | |

1. **Bootstrap** — `GET /admin/status` decides the screen: registration is shown **only** when no admin exists, otherwise login.
2. **Login / register** — email + password; the returned JWT is stored in `sessionStorage` and decoded locally to enforce the 1-hour expiry client-side.
3. **Dashboard** — inventory summary cards computed from the real product list (total, in stock, out of stock, made to order, inventory value, price range). No fabricated sales, revenue or customer figures.
4. **Products** — searchable, filterable table with thumbnails, name, collection, ₦ price, availability, edit and delete. Below `md` it becomes a stacked card list rather than a squeezed table.
5. **Add / edit product** — name, collection, price, availability, description, optional sizes/colors/fragrance details, and multi-image drag-and-drop upload (PNG/JPG, ≤ 5 MB each) with previews for both new and already-saved images.
6. **Settings / Change Password** — current + new password with show/hide toggles and inline validation.
7. **Logout** — clears the session.
8. **Product Lookup** (`/admin/products/lookup`) — fetch a single product by its Reference: the 24-hex Mongo `_id` (a pasted product URL is accepted too — the id is pulled from its last path segment). The page moves through explicit states: an idle explainer, a loading spinner, and a 404/network error state that keeps the API client's own wording and offers Retry. On success it renders the full record — gallery, price, availability, collection, sizes/colors/fragrance details — with a **Copy reference** button and **Edit product** / **View storefront page** actions. It is deep-linkable via `?ref=<id>` and is reachable from the sidebar's **Product Lookup** entry, the **Look up reference** button in the Products header, a quick-action card on the Dashboard, the per-row copy-reference and view (eye) actions in the product table, and the **Reference** line with its copy button on the edit page.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Build tool | Vite 5 (`@vitejs/plugin-react`) |
| Framework | React 19 + TypeScript 5.7 (strict) |
| Routing | react-router-dom 6 (`BrowserRouter`) |
| Server state | TanStack React Query 5 — one cache, shared by every screen |
| Styling | Tailwind CSS v4 (CSS-first config in `src/index.css`) |
| Type | Cormorant Garamond (display) + Jost (body), self-hosted via Fontsource |
| Icons | lucide-react, react-icons |
| Dialogs / toasts | SweetAlert2 |
| Backend | Separate Express + MongoDB API hosted on Render — **not in this repo** |

`@radix-ui/*`, `recharts`, `react-hook-form`, `zod`, `sonner` and friends are installed for the shadcn/ui set in `src/components/ui`, which is currently unused by the application itself.

---

## Server state (TanStack React Query)

Every piece of **server** state goes through React Query. Ordinary UI state — form
inputs, the mobile drawer, the search box, the sort dropdown — stays in React
state, because it is not the server's business.

| Piece | Where |
| --- | --- |
| The client | `src/lib/queryClient.ts` — a single module-level instance |
| The keys | `src/lib/queryKeys.ts` — one factory for the whole app |
| The queries | `src/hooks/queries/*` |
| The writes | `src/hooks/mutations/*` |
| The provider | `src/main.tsx` — mounted once, around `<App />` |

**Defaults** — a catalogue page stays fresh for 60 s and is dropped from the
cache after 5 min of disuse; returning to the tab does not re-download it; one
retry covers a transient network blip, but a 4xx is never retried.

**Query keys** carry everything that changes the answer, so two views of the
same thing share one request:

```
['products']                                    → the whole product family
['products', 'list']                            → the full catalogue
['products', 'page', {page,limit,q,collection,sort}] → one page
['products', 'detail', '<id>']                  → one product
```

**Invalidation** is targeted. Creating, editing or deleting a product
invalidates the product family — the shop pages, the admin table, the dashboard
statistics and the product page all refresh — and nothing else. The admin
session's cached data is dropped when the session ends or expires.

**Cancellation** is real. `src/lib/api.ts` combines the caller's `AbortSignal`
with its own timeout, so React Query can abort a request when a query key
changes or a component unmounts, and a cancelled request is never reported to
the visitor as a failure.

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
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint .` — **note: ESLint is not installed and there is no config** |

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
    ├── App.tsx                # Router: public layout group + guarded admin group (see Routes)
    ├── index.css              # Design system: tokens, utilities, motion, dialog theme
    ├── vite-env.d.ts          # VITE_API_URL typing
    ├── types/product.ts       # Product, AdminFormProduct, InventorySummary
    ├── hooks/
    │   ├── queries/           # TanStack React Query hooks (one file per resource)
    │   │   ├── useProductPageQuery.ts  # One page of the catalogue
    │   │   ├── useProductListQuery.ts  # The full catalogue
    │   │   ├── useProductQuery.ts      # One product by reference
    │   │   └── useAdminStatusQuery.ts  # Has an admin been registered?
    │   ├── mutations/         # React Query writes + targeted invalidation
    │   │   ├── useProductMutations.ts  # Create / update / delete a product
    │   │   └── useAuthMutations.ts     # Login / register / change password
    │   ├── usePageTitle.ts    # document.title per page, restored on unmount
    │   ├── use-mobile.ts      # (shadcn)
    │   └── use-toast.ts       # (shadcn)
    ├── lib/
    │   ├── api.ts             # API client + VITE_API_URL + getProduct(id) + Bearer auth
    │   ├── queryClient.ts     # The single TanStack QueryClient + its defaults
    │   ├── queryKeys.ts       # Every server-state key, in one factory
    │   ├── brand.ts           # Brand constants and contact details
    │   ├── collections.ts     # The five collections
    │   ├── availability.ts    # Availability badge helpers
    │   ├── session.ts         # JWT storage, expiry, auth header
    │   ├── whatsapp.ts        # Order-message builders + product page URL
    │   ├── productImages.ts   # imageURLs normalisation
    │   └── utils.ts           # cn() helper
    ├── layouts/
    │   └── AdminLayout.tsx    # Guarded admin shell: sidebar, topbar, session-expiry handling
    ├── pages/
    │   ├── HomePage.tsx  ShopPage.tsx  CollectionsPage.tsx
    │   ├── AboutPage.tsx  ContactPage.tsx  ProductDetailsPage.tsx  NotFoundPage.tsx
    │   └── admin/
    │       ├── AdminLoginPage.tsx      AdminRegisterPage.tsx
    │       ├── AdminDashboardPage.tsx  AdminProductsPage.tsx
    │       ├── AdminAddProductPage.tsx AdminEditProductPage.tsx
    │       └── AdminSettingsPage.tsx   AdminChangePasswordPage.tsx
    └── components/
        ├── Section.tsx  ScrollToTop.tsx  PublicLayout.tsx
        ├── Navigation.tsx     Footer.tsx
        ├── ProductCard.tsx    ProductDetailView.tsx
        ├── WhatsAppButton.tsx WhatsAppOrderButton.tsx
        ├── admin/
        │   ├── AdminSidebar.tsx
        │   ├── AdminProductForm.tsx
        │   ├── InventorySummary.tsx  ProductTable.tsx  ChangePasswordForm.tsx
        ├── sections/
        │   ├── Hero.tsx  Categories.tsx  Collections.tsx  Shop.tsx
        │   ├── BrandStory.tsx  WhyShop.tsx  HowItWorks.tsx
        │   └── Testimonials.tsx  FAQ.tsx  Contact.tsx
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

The frontend talks to a **separate** Express + MongoDB service. The base URL is `import.meta.env.VITE_API_URL`, falling back to the live Render deployment when unset:

```bash
# .env.local  (git-ignored)
VITE_API_URL=http://localhost:4500   # for a local backend — use the PORT from the backend's .env
# unset → https://dami-meridian-be.onrender.com (live)
```

> The live service is `dami-meridian-be.onrender.com`. If the Render service is ever renamed, update `VITE_API_URL` and the fallback in `src/lib/api.ts`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/jewelry/getallproducts` | public | List products |
| `GET` | `/jewelry/products/:id` | public | Single product by Mongo `_id` — 400 invalid id, 404 missing |
| `POST` | `/jewelry/addproducts` | **Bearer** | Create product (multipart) |
| `PUT` | `/jewelry/editproducts/:id` | **Bearer** | Update product (multipart) |
| `DELETE` | `/jewelry/deleteproducts/:id` | **Bearer** | Delete product |
| `GET` | `/admin/status` | public | `{ adminExists: boolean }` |
| `POST` | `/admin/login` | public | Returns `{ token }` (JWT, 1 h) |
| `POST` | `/admin/register` | public | Creates the first admin only |
| `PUT` | `/admin/changepassword` | **Bearer** | Change admin password |

`src/lib/api.ts` attaches `Authorization: Bearer <token>` to every protected call automatically, using the token from `src/lib/session.ts`. `getProduct(id)` validates the ObjectId client-side before calling, so a malformed URL short-circuits to the 404 state without hitting the API. `GET /jewelry/products/:id` also powers the admin Product Lookup page (`/admin/products/lookup`), which reuses the same client-side reference validation.

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

Orders are placed over WhatsApp. `src/lib/whatsapp.ts` builds a prefilled message containing the brand, product name, chosen size and colour, price, the currently viewed image URL, a product reference (the Mongo `_id`), and — when the reference is an ObjectId — the canonical **product page URL** (`getProductUrl(id)`), then links to `https://wa.me/2348155589764`. Size and colour are only included for apparel products, so a perfume or jewellery order can never claim "Size: M".

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
<meta name="build-id" content="dm-2026-10-21-lookup-1" />
```

Check which build is live:

```bash
curl -s https://your-domain.example/ | grep -i 'build-id\|application-name'
```

The output must contain `content="dm-2026-10-21-lookup-1"`. If it contains an older marker (or no marker at all), the deployment is serving an older build — check that `dist/` was rebuilt and redeployed, and that the build id in `index.html` was bumped.

**A hard refresh should no longer be needed.** The HTML entry point is served with `no-cache, no-store, must-revalidate, max-age=0`, so the browser revalidates and re-downloads the document on every normal load; it can never keep serving a cached document that points at an old bundle. The fingerprinted files under `/assets/` are served `immutable`, which is safe because their URLs change whenever the content changes.

Bump `build-id` in `index.html` whenever a new build is shipped so the marker keeps identifying the live build.

---

## Backend work required

The frontend and backend live in separate repositories. The following backend changes are already implemented in `luxury-jewelry-website-bd` and **must be deployed** for the frontend to work correctly:

1. **`middleware/auth.js` was ESM inside a CommonJS package.** It used `export const` while `package.json` has no `"type": "module"`, so importing it would have thrown a `SyntaxError` and taken the server down. That is why it was never wired up. It is now CommonJS.
2. **`verifyToken` is now mounted** on `POST /jewelry/addproducts`, `PUT /jewelry/editproducts/:id`, `DELETE /jewelry/deleteproducts/:id` and `PUT /admin/changepassword`. Before this, **every write endpoint was open to anyone** — `DELETE` returned `{"message":"Product deleted"}` for a non-existent id with no token at all.
3. **`Models/modelProduct.js`** gained the `collection`, `sizes`, `colors`, `fragranceNotes` and `volume` fields, all optional and backward compatible.
4. **`Controllers/user.controllersproduct.js`** now returns `404` for a missing product on delete/edit instead of reporting success.
5. **`GET /jewelry/products/:id` is new** (`getproductbyid`) — a public single-product lookup that powers `/products/:id`. It validates the ObjectId (400), returns 404 for a missing product, and responds with the bare product document. **This endpoint must be deployed for product detail pages and the "Product page:" line in WhatsApp messages to work.**

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
| `index.js` | 524.59 kB | 145.69 kB |
| `index.css` | 155.49 kB | 23.54 kB |
| Fonts | 8 woff2 subsets, self-hosted | — |

> Sizes above are indicative only — the next build will re-measure and refresh them.

Typecheck (`npm run typecheck`) is clean. `lucide-react` tree-shakes correctly, so unused icons are not shipped.

> Vite warns that the single JS chunk exceeds 500 kB — admin + storefront + the (unused) shadcn/ui kit ship in one bundle. Lazy-loading the `/admin/*` group with `React.lazy` or a `manualChunks` rule would split it, left out to keep behavior boring and predictable.
