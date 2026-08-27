# TeenRaah — Find Your Path

A full-stack e-commerce app for a bags & travel-gear brand: React (Vite) storefront + hidden admin panel,
Node/Express API, MongoDB, Redis, Cloudinary, Razorpay, Resend, and Socket.io for live order tracking.

This is a **real, working codebase** — not a mockup. It builds cleanly and the server boots correctly.
The only thing missing is your own API keys (see below), which is intentional — you asked for the `.env`
files to ship with placeholders so you can drop in the real zip of credentials afterwards.

---

## 1. What's inside

```
TeenRaah/
├── backend/    Node.js + Express API
└── frontend/   React 18 + Vite storefront and admin panel
```

| Requirement                                    | How it's implemented                                                                 |
|-------------------------------------------------|----------------------------------------------------------------------------------------|
| MongoDB + Redis for speed                       | Mongoose for persistent data; Redis for OTP codes, the live cart, product-list caching, and geocoding cache |
| Secret admin panel                              | Hidden route (`VITE_ADMIN_PATH`), admin accounts seeded server-side only (never via public signup), JWT + a second shared-secret header on every admin API call |
| Coupons & referral codes                        | Admin-managed coupons; every customer gets a referral code, both sides earn wallet credit on the referred user's first order |
| Saved addresses (Zomato/Blinkit style)           | Map picker with search-as-you-type + draggable pin, using **free** OpenStreetMap/Nominatim (no API key, no billing) |
| Admin can see customer locations                | Every order shows the exact delivery pin; a dedicated Customers → Map view plots every saved address |
| Product images & videos                          | Cloudinary, uploaded straight from the admin product form |
| **AI Photo Studio** (background removal)          | Admin drops in a raw bag photo → background removed and recomposited on a clean white background, Amazon-style — no new signup, uses your existing Cloudinary account |
| **TeenRaah Assistant** (chatbot)                   | Customer-facing shopping assistant, streams real-time answers, grounded in your actual product/order data via tool-calling (never invents prices or stock) — powered by OpenRouter |
| **AI concept image generation**                    | Customers can ask the assistant to visualize a custom bag idea; generation is scoped to bags/travel gear only, gated behind login, and rate-limited (real per-call cost, no free tier) |
| **Firewall / hardening**                           | helmet security headers, NoSQL-injection sanitization, HTTP parameter pollution protection, plus dedicated rate limits on the chat and image-generation endpoints |
| Payments                                        | Razorpay (test mode is free) — order created & priced server-side, signature verified before an order is ever written to the DB |
| Order tracking like Flipkart                     | Animated status timeline + **live** updates via Socket.io (no refresh needed) |
| Email verification                               | Resend sends a 6-digit OTP on signup; unverified accounts can't check out |
| React, heavily animated                          | Framer Motion throughout — page transitions, hero, cards, drawers, the order-tracking "path" line |
| Domain/proxy not finalised                       | Nothing is hardcoded — `VITE_API_BASE_URL`, `VITE_API_PROXY_TARGET`, `CLIENT_URL`/`ALLOWED_ORIGINS` are all env-driven, plus a Vite dev proxy so frontend/backend never need to agree on a real domain until you have one |

**Theme note:** you asked for something close to `zuok.co.in` — that's **Zouk** (zouk.co.in), the Indian
bags/accessories brand. I used their layout patterns (circular category icons, bestseller carousel with
sale pricing and countdown timers, trust-badge strip, review carousel, rich footer) but built the actual
color/type system from TeenRaah's own uploaded logo (black/white, bold, angular) rather than copying
Zouk's cream-and-maroon palette, since your logo is the more specific brand signal. Full design tokens are
in `frontend/tailwind.config.js` if you want to adjust anything.

---

## 2. Before you run it

### AI Photo Studio needs one extra step

In the admin product form, each photo gets an **"AI Studio"** button — it strips the background and
recomposites the bag onto a clean white square, the same look Amazon requires for main product images.
This runs on **Cloudinary's Background Removal add-on**, so it needs no new account or API key — but it
does need to be turned on:

1. Cloudinary Console → **Add-ons** → enable **Background Removal**
2. That's it — no new env vars, `AI_STUDIO_BACKGROUND_COLOR` in `backend/.env` just lets you swap the white
   background for another color later if you want.

**Worth knowing before you rely on it:**
- It's **not** part of Cloudinary's base free plan — it's a paid add-on with its own trial/usage pricing.
  Check current terms in the Cloudinary console before enabling, since I couldn't get a reliable read on
  current pricing when researching this (search results for background-removal pricing across providers
  were unusually inconsistent — even contradicting each other on the same date).
- If you'd rather have **zero marginal cost per photo**, the alternative is a self-hosted option like
  `@imgly/background-removal-node` (runs locally, no per-image fee) — I didn't wire this in by default
  because it's **AGPL-licensed**, which has real implications for a closed-source commercial app (using
  AGPL code in a network service can require releasing your own source, or buying a commercial license
  from IMG.LY). Worth a quick read of the AGPL before switching to it, not something to route around
  quietly.
- Every click of "AI Studio" processes one photo through the add-on — if your Cloudinary plan bills per
  use, keep half an eye on usage as the catalog grows.

You mentioned you'll drop in a zip with real credentials — here's exactly what each `.env` needs and
where to get each one for free:

### `backend/.env`
| Variable | Where to get it |
|---|---|
| `MONGO_URI` | Free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) |
| `REDIS_URL` | Free instance at [redis.io/try-free](https://redis.io/try-free/), or run `redis-server` locally |
| `JWT_SECRET`, `COOKIE_SECRET` | Any long random strings, e.g. `openssl rand -hex 32` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PANEL_ACCESS_KEY` | You choose these — see "Creating the admin account" below |
| `CLOUDINARY_*` | Free account at [cloudinary.com](https://cloudinary.com) → Dashboard shows all 3 values |
| `RAZORPAY_*` | Free **test mode** keys at [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys |
| `RESEND_*` | Free account at [resend.com](https://resend.com) → API Keys. The default `onboarding@resend.dev` sender works immediately with no domain setup, for testing |
| `NOMINATIM_*` | Already filled in — it's free, no key required |

### `frontend/.env`
| Variable | Notes |
|---|---|
| `VITE_RAZORPAY_KEY_ID` | Same value as backend's `RAZORPAY_KEY_ID` (the public one — safe to expose) |
| `VITE_ADMIN_PATH` | Change this to something non-guessable before deploying. Don't link to it anywhere public. |
| everything else | Already set for local development |

### TeenRaah Assistant needs one key — and a cost decision

The chat widget (bottom-right on every storefront page) is a real, tool-calling shopping assistant, not a
canned FAQ bot. It's grounded in your actual database: it calls `search_products`/`track_order` behind the
scenes rather than inventing prices, stock, or order details, and it flatly declines to discuss anything
outside TeenRaah shopping.

1. Get one key at [openrouter.ai/keys](https://openrouter.ai/keys) → set `OPENROUTER_API_KEY` in `backend/.env`.
2. That's it for text chat — `OPENROUTER_MODEL` defaults to `meta-llama/llama-3.3-70b-instruct:free`, a
   **free** model as of this build. Free-tier model availability on OpenRouter rotates fairly often though —
   check [openrouter.ai/models](https://openrouter.ai/models) before assuming this specific one is still free
   or even still listed, and swap the env var if it's moved on.

**AI concept image generation is a different story — it is not free on any current OpenRouter model.**
Every image is billed per call (nothing charged on failure, per OpenRouter's docs). Because of that:
- The model itself can only *suggest* generating an image — it can never trigger one on its own. Actually
  spending money always requires the customer to be logged in and click a real "Generate Image" button.
- It's rate-limited two ways: an hourly cap (`imageGenLimiter`, resets on server restart) and a persistent
  daily-per-user cap stored in Redis (`AI_IMAGE_DAILY_CAP_PER_USER`, default 5 — survives restarts, since
  this is the one that actually matters for cost control).
- Every generation is wrapped in a fixed "professional product photography of a [bag/gear category]"
  template server-side, regardless of what the customer typed, plus a basic keyword filter — so this can't
  be turned into a general-purpose image generator even by a crafted request.

If you'd rather launch with chat only and add image generation later, just leave `OPENROUTER_IMAGE_MODEL`
as-is — the feature is additive and nothing else breaks without it, generation calls will simply fail
gracefully with a "try again" message until real usage limits are tuned to the client's budget.

### Firewall

`helmet`, `express-mongo-sanitize`, and `hpp` are applied globally in `server.js` (see
`backend/middleware/security.js`) — security headers, NoSQL-injection sanitization on
`req.body`/`query`/`params`, and HTTP parameter pollution protection. This is the standard hardening layer
for a Node API, not a network appliance; nothing here needs configuration or an account.

---

## 3. Running it locally

```bash
# Backend
cd backend
npm install
npm run seed:admin      # creates the ONE admin account, from ADMIN_EMAIL/ADMIN_PASSWORD in .env
npm run seed:products   # optional — adds 10 demo bags so the store isn't empty
npm run dev              # http://localhost:5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Open `http://localhost:5173` for the storefront.
Open `http://localhost:5173/tr-control-9273/login` for the admin panel (or whatever you set `VITE_ADMIN_PATH` to).

## 4. Creating the admin account

There's deliberately **no sign-up form for admins** — that's what makes the panel actually secret rather
than just hidden. To create the one admin account:

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`
2. Set `ADMIN_PANEL_ACCESS_KEY` to any long random string (also copy this into `frontend/.env` if you ever
   hardcode it there — currently the frontend receives it automatically at login time and keeps it in
   memory only, never `localStorage`)
3. Run `npm run seed:admin` once
4. Log in at `/<your-admin-path>/login`

## 5. Deploying

Nothing in the code assumes a specific domain. When your client picks one:
- Backend: update `CLIENT_URL` / `ALLOWED_ORIGINS` in `backend/.env`
- Frontend: update `VITE_API_BASE_URL` (and `VITE_API_PROXY_TARGET` for local dev) in `frontend/.env`
- No other code changes needed — CORS, the Vite dev proxy, and the Socket.io client all read from these.

Common free/cheap hosts that work well with this stack: Render or Railway for the backend, Vercel or
Netlify for the frontend (it's a static Vite build).

---

## 6. A few honest notes

- **This was built and tested in a sandbox without live MongoDB/Cloudinary/Razorpay/Resend accounts**,
  since those need real credentials only you can create. What *was* verified here: the backend boots
  cleanly and every route mounts correctly, Redis-backed caching/OTP logic was run live and passed, and
  the entire frontend builds with zero errors and is fully cross-checked against the backend's actual API
  routes. Once you add real keys, the remaining risk is normal "first real run" issues (a typo'd key, a
  Cloudinary upload preset setting) rather than logic bugs.
- **Stock decrements happen as sequential updates, not a database transaction.** MongoDB Atlas (even the
  free M0 tier) supports transactions if you want to harden this further — flagged in
  `orderController.js` for whoever picks this up next.
- **Delivery fee (₹79, free over ₹999) and referral reward amounts (₹100 / ₹50)** are placeholder numbers
  in `backend/utils/constants.js` — change them to match the client's actual pricing.
- The 10 demo products use placeholder photos (picsum.photos) so the store isn't empty on first run.
  Replace them via the admin panel whenever real product photography is ready.
- **The chatbot's SSE streaming pipeline was tested against a mock OpenRouter server** standing in for the
  real API (no network access to openrouter.ai from the sandbox this was built in) — verified end-to-end
  through the real backend and a real SSE client: tool-call detection, tool execution against the actual
  Product/Order models, error handling, and the token-by-token stream relay all confirmed working correctly
  (this process actually caught and fixed a real bug — direct answers with no tool call were arriving as
  one blind chunk instead of a paced stream, now fixed in `chatController.js`). What's *not* verified is
  OpenRouter's real API responses, since that needs your real key — the request/response shapes used here
  come straight from OpenRouter's own current docs, not memory, but model behavior itself (whether it calls
  tools sensibly, how it phrases things) is only knowable once it's running against a real key.
