# Laxmi Agro — Project Overview

**Business:** Laxmi Agro Enterprises / Ashirvad Marketing, Station Road, Raipur (C.G.) — wholesale + retail marketplace for agricultural equipment (pumps, pipes, cables, sprinklers, GI fittings, control panels, Jhatka machines).
**Contact:** +91 91791 10159 · +91 87709 74845 · ashirvadmarketing62@gmail.com
**App version:** 1.0.3+5 · **Catalog (live):** 40 categories · 164 subcategories · 609 products

## 0. Main purpose

Laxmi Agro Enterprises (run as Ashirvad Marketing, Raipur) sells agricultural equipment — submersible/openwell pumps, column pipes, cables, sprinklers, GI fittings, control panels, Jhatka machines — to two audiences: **retail farmers** and **wholesale dealers**. Before this system, dealing happened over phone/WhatsApp with paper price lists: no live catalog, no structured bargaining, no order records.

This project digitizes the whole business into four connected parts:

| Who | Uses | To do what |
|---|---|---|
| Farmer / dealer (public) | Marketing **site** | Browse the live catalog, read product/brand pages, send a WhatsApp inquiry — no login needed |
| Buyer / wholesaler | Mobile **app** | Shop retail or wholesale prices, bargain over in-app chat negotiation, get push updates, track orders, manage profile and shop addresses |
| Shop owner (**admin**) | **Admin panel** | Own the catalog (brands, categories, products, images, scheduled price changes), bargain back over live chat, accept deals (which auto-creates confirmed orders), fulfill and ship orders, verify payments, manage staff/customers, run banners/website content, view analytics |
| Shop staff | **Staff area** (inside admin panel) | Day-to-day operations with guardrails: view catalog, counter within admin-set minimum prices, accept deals, process orders/payments — no catalog deletes, no settings |
| System (**backend**) | API + realtime + jobs | Single source of truth both UIs share: auth/sessions, catalog, cart, negotiation state machine, order lifecycle, private media, FCM/SMTP notifications, scheduled price rollouts |

**Core design choices:** one MongoDB for everything; 3-tier pricing (MRP/retail/wholesale) so the same product serves both audiences; negotiation-as-chat where only the panel side can accept, and every accept mints a real order (nothing lives only in chat); WhatsApp as the payment/shipping coordination channel with the order recorded first; subcategory cards (Category → Subcategory → Products) as the single navigation pattern in app and panel.

## 1. Repository map

| Folder | What it is | Stack | Port / target |
|---|---|---|---|
| `laxmi-agro-backend/` | REST API + Socket.io + schedulers | Node 18, Express 4, Mongoose 8 (MongoDB Atlas), Firebase Admin | `:5001`, base `/api/v1` |
| `laxmi-agro-app/` | Wholesaler/buyer mobile app | Flutter, Riverpod, GoRouter, Dio | Android APK + iOS |
| `laxmi-agro-admin/` | Admin + staff panel | Next.js 16, React 19, TS, Tailwind 4, shadcn/ui | `:3001` |
| `laxmi-agro-site/` | Public marketing storefront | Next.js 16 (JS), Tailwind 4 | `:3000` |
| `laxmi-agro-backend/scripts/` | Seed + migration scripts | Node | — |

**API base:** prod `https://api.laxmiagroenterprises.com/api/v1` (app default; override with `--dart-define=API_BASE_URL=…`). Admin uses `NEXT_PUBLIC_API_BASE_URL` (local default `http://localhost:5001/api/v1`).

---

## 2. Backend (`laxmi-agro-backend/`)

Entry `src/server.js` → `src/app.js` (helmet, CORS, rate-limit, `/uploads` static, DB+Firebase middleware) → `src/routes/index.js`. All routers mounted under `/api/v1`: `/auth /products /cart /negotiations /orders /payments(retired 410) /admin /staff /companies /categories /upload /notifications`, plus public `/settings/* /offers /reviews /website/catalog/*`, health at `/health`, `/api/v1/health`.

### 2.1 Auth (`controllers/authController.js`, `middlewares/auth.js`)
- Email register/login (buyer + wholesaler-with-proof-images), phone register/login, staff username login (6 h session), admin passwordless magic-link (5 min, one-time, emailed to `ADMIN_EMAILS`), refresh-token rotation, logout, `GET /auth/me`, profile edit, avatar upload (WebP), FCM token register, buyer→wholesaler conversion (private proof images → signed URLs), account-deletion request/cancel.
- Guards: `protect / optionalAuth / authorize(...) / adminOnly / staffOnly / wholesalerOnly`. JWT access ~15 min; staff session expiry embedded in token.

### 2.2 Catalog
- **Models:** `Company` (brand) → `Category` (`company` required, `parent` for subcategory, unique per brand by name+slug) → `Product` (`categoryRef` authoritative + legacy `category` string, `company`, 3-tier pricing MRP/retail/wholesale, `pending*` scheduled prices, stock, images w/ blurhash, `negotiationEnabled`, `minWholesaleQuantity`).
- **Public reads:** `GET /products` (filters: category, subcategory, brand, price, stock, featured/hot, search), `/products/categories|/featured|/search|/:slug|/:id/related`, view/event tracking; `GET /categories`, `/with-subcategories`, `/:id/subcategories`; `GET /companies`; `GET /website/catalog/*` (brand→category→product home tree for the site).
- **Admin writes:** product CRUD + image upload (10 max, WebP), `PUT /:id/price-change` (immediate or scheduled via `productPriceSchedulerService`), price-snapshot XLSX export, stock adjust + stock logs, category/brand CRUD + drag-drop reorder + subcategory management + product assignment, Hindi-name backfill.
- **Taxonomy rule:** subcategory display names are unique per brand (e.g. `V-4 2 HP`, `Column 2 inch`), slugs parent-scoped; product `category/categoryRef/subCategory` always point at the subcategory.
- **Current catalog:** 40 parents / 164 subs / 609 products — pumps split by HP bands, openwell by HP (duplicate SHIVNATH OPENWELL merged into MOURYA V-7 SS, loser deactivated), pipes by diameter, cables by sqmm/core/brand, panels by type (MCB/BCH/Relay/T.P.), GI Products = 13 PRIMATE-list fittings subs (123 products), Harit Sprinkler = 6 brand subs.

### 2.3 Cart (`cartController.js`, buyer/wholesaler/admin)
`GET /cart`, `POST /cart/validate|/items`, `PUT /cart/items/:productId`, `DELETE` item/all. Min-wholesale-qty enforced for wholesalers.

### 2.4 Negotiations (current flow — wholesaler chats, panel accepts)
- **Wholesaler endpoints** (`negotiationRoutes.js`, wholesaler-only): `GET /`, `POST /` (request with qty + price), `GET /:id`, `POST /:id/message` (280 chars, persisted to `history`, socket-emitted). **No accept/counter/reject** — removed.
- **Admin endpoints** (`adminRoutes.js`, admin-only): `GET /`, `GET /:id` (populates wholesaler, message actors, linked order, last order address for prefilling), `POST /:id/message` (admin chat reply, persisted + live + push), `PUT /:id/accept` (validated address), `PUT /:id/reject`, `PUT /:id/counter`.
- **Staff endpoints**: `GET`, `GET /:id`, `PUT /:id/accept` (min-price guard, validated address), `PUT /:id/counter`. No reject, no messaging.
- **Accept = order creation** (shared `services/negotiationOrderService.js`): guards (pending/countered + wholesaler offer, idempotent on existing `orderId`) → stock + min-qty checks → address resolution (request body → wholesaler's last order → profile, else `ADDRESS_INCOMPLETE`) → creates `pending_payment` wholesale `Order` (items from final price × qty, `negotiationId`, admin note) → negotiation → `converted` + `orderId` + `final*` + history stamped `{by:'admin', actorId, actorRole}` → audit → push `negotiation_accepted` (with orderId/orderNumber) + socket `negotiation-accepted`.
- **Attribution:** `approvedBy` (role + name) derived from the accepted history entry on list + detail — admin sees whether staff or admin approved.
- **Statuses:** `pending → countered → converted` (accepted kept only for legacy rows), `rejected/expired`. `canPay = accepted && !orderId` (legacy self-checkout only).
- **Legacy fallback:** `POST /orders/from-negotiation` still converts old accepted-without-order rows (validates `accepted + orderId null + unexpired`).

### 2.5 Orders & checkout
- `POST /orders/preview-coupon`, `POST /orders` (cart → WhatsApp checkout; order created first when `createOrderBeforeRedirect`, else WhatsApp redirect payload), `GET /orders` (own history), `GET /:id`, `GET /:id/export` (PDF receipt / XLSX).
- Coupon engine: affiliate codes + offers (`minPurchase`, `%|fixed`, caps, usage counts).
- Admin orders: list/detail/delete, mark-payment-complete, status (`processing/shipped/delivered/cancelled`), ship with tracking. Staff: list/detail, mark-payment-complete, ship.
- Payments: customer UPI flow **retired (410)**; admin verifies uploaded payment screenshots (`pending/held/verified/rejected`).

### 2.6 Uploads, realtime, jobs, notifications
- **Storage** (`config/storage.js`): local/Firebase drivers; product/category/avatar images → WebP via sharp; wholesaler proofs **private** (signed URLs); generic admin upload (`/upload/image(s)`, folder query).
- **Socket.io** (`negotiationSocketService.js`): rooms `negotiation-<id>`; `join/leave`, `send-message→receive-message`, `typing/stop-typing`, `mark-read`, plus `negotiation-accepted/countered/rejected` lifecycle events.
- **Scheduler** (`productPriceSchedulerService.js`): applies due price changes + campaign stages.
- **Notifications** (`notificationService.js` + FCM): `sendToUser` (DB `Notification` + push), negotiation accepted/rejected/countered/message, order updates; price-campaign countdown pushes; SMTP magic-link mail.
- **Analytics:** `POST /products/:id/view|/event` → dashboard/product/sales/demand/leads endpoints for admin.

---

## 3. Wholesaler/buyer app (`laxmi-agro-app/`, v1.0.3+5)

**Stack:** Flutter + Riverpod (`StateNotifierProvider`), GoRouter, Dio `ApiClient` (auth header + 401→refresh), `flutter_secure_storage` (tokens) + `SharedPreferences` (user/wishlist/addresses/coupons), Firebase Messaging + local notifications, `socket_io_client`, Google Fonts/CachedNetworkImage/Shimmer/BlurHash.

### 3.1 Routes (`core/router/app_router.dart`)
`/` Splash (2 s + auth poll → onboarding or home) · `/permissions-onboarding` · `/login` (phone+password, buyer/wholesaler toggle, terms checkboxes v2026-08-17) · `/home` (tabs + search) · `/popular-products` · `/hot-deals` · `/brand/:id` (→ Categories) · `/product/:id` · `/cart` · `/buy-now` · `/negotiations` · `/negotiation-detail/:id` · `/previous-orders` · `/tracking/:orderId` · `/order-success/:orderId` · `/profile|/edit-profile|/addresses|/account-privacy|/convert-to-wholesaler|/about|/legal/:policyId|/guest-app-preview` · `/help` · `/negotiation-guide` · `/notifications` · `/wishlist` · `/my-coupons` (hidden by flag) · `/add-product`.

### 3.2 State & services
- `authProvider` (login/register/fetch-me/logout, avatar upload, deletion request), `cartProvider` (optimistic UI + 500 ms debounced sync, ₹50 delivery fee, stock validation), `wishlistProvider` (local-only), `guestModeProvider` (3-min trial + preview banner blocking cart/buy/checkout), `orderCountProvider`, `localeProvider` (EN/HI ~150 keys).
- Services: `TokenRefreshService` (30-min proactive) + `AppLifecycleService` (refresh after 5 min background), `NotificationService` (FCM register w/ retry, foreground/background, role-update refetch), `LocalNotificationService` (Android price-campaign countdown), `NotificationNavigationService` (negotiation→detail, order→tracking, price→home), `NegotiationSocketService` (typing/read live; messages via REST), `ShippingAddressService` (2 slots, device-local), `RedeemedCouponService`, `OrderExportService` (PDF download/share), `WhatsAppCheckoutService`, `TransliterationService`.

### 3.3 Key workflows
- **Catalog:** Home (banners, categories, brands, offers, reviews, featured/hot) → Categories screen (left = categories, right = subcategory cards → product grid, back-to-types header) → Product detail (related, negotiation request, transliteration) → Cart/BuyNow → coupon preview → order → PDF receipt → WhatsApp checkout → success/tracking.
- **Negotiation (wholesaler side):** request from product → list (Active = pending/countered, Completed = rest; `View Order` when converted, `Reply in Chat` on admin counter, `Under Review` on pending) → detail = product card + status card + **"Accepted by Staff/Admin name"** + **View Order** + chat (optimistic send, socket typing) — no accept/counter/cancel buttons. Accept push deep-links to detail; order lands in Previous Orders with **Negotiated badge**.
- **Profile:** edit (avatar multipart), local addresses, wholesaler conversion (proofs + shop location map), privacy/deletion, about/legal, guest preview.

---

## 4. Admin + staff panel (`laxmi-agro-admin/`, `:3001`)

**Stack:** Next.js App Router (all client pages), Tailwind 4 + shadcn/ui + Hugeicons, `react-hook-form`+zod (some forms), Recharts, `apiFetch` (Bearer + auto refresh), `socket.io-client` for negotiation chat, Playwright tests. Auth: admin magic-link, staff username/password, 4 h client session, route-group guards. No global store (per-page state).

### 4.1 Pages
- `/login`, `/login/verify` · `/` dashboard (metrics, performance chart, recent orders) · `/products|/add|/edit/[id]` · `/brands` · `/categories` (parents-only default, `Categories|Subcategories|All` tabs, click card → in-place subs, click sub → products, sub badges, add-subcategory shortcut) + `/categories/[id]/products` · `/price-management|/price-changes` (snapshot XLSX) · `/orders` (status/ship/payment-complete) · `/negotiations` (**live chat screen** — see below) · `/negotiation-settings` (staff min prices) · `/staff-management` · `/customers|/potential-customers|/account-upgrades|/account-deletion-requests` · `/analytics` · `/wholesaler-map` · `/banners|/manage-website|/labels|/reviews|/settings` · `/offers/*` (hidden by flag) · `/staff/*` (orders, products read-only, negotiations, payments, change-password).

### 4.2 Negotiation workflow (panel)
Sheet = live chat: summary card → order chip (→ `/orders?search=`) when converted → message bubbles with actor names + prices → typing indicator → admin composer (Enter to send, 280 chars) → counter row → **Accept Deal opens confirm dialog** (qty × price total, address form prefilled from last order/profile, note) → order created → toast + order chip + list refresh; **Reject via styled dialog**; **Approved By column** (`Staff · name` / `Admin`) + header attribution; Live badge; legacy accepted rows show Confirm Order; rejected/expired close chat.

### 4.3 Other workflows
Products (CRUD, images, price scheduling, stock logs), brands, categories (above), price changes, orders fulfillment, payment verification (approve/hold), staff (create, password reset, enable/disable), customers (upgrade to wholesaler, category access, locations, push), deletion requests, banners/website content/labels/reviews/settings, analytics + leads.

---

## 5. Public site (`laxmi-agro-site/`, `:3000`)

**Stack:** Next.js App Router (JS, RSC `force-dynamic`), Tailwind 4. No auth/cart — **WhatsApp inquiry only** (`wa.me/919179110159`).
- **Pages:** `/`, `/about`, `/contact` (form → WhatsApp + Maps), `/dealership|/dealer-pricing|/dealer-agreement`, `/products|/all|/[slug]` (featured), `/category/[slug](//[productSlug])`, `/brand/[brandSlug](/category/[cat](/[product]))`, `/insights/*` (3 articles), `/terms|/privacy|/shipping|/refund|/warranty|/delete-account` (with request form).
- **Data lib:** `api-base` (env base URL) → `catalog-api` (live `/website/catalog/*` + website-content merge) → `website-content/category-products/featured-products` (normalizers + fallbacks), `inquiry.js` (message builders), `media-url` (image normalization).
- **Flow:** backend website-content/catalog APIs → hero/banners/categories/products/brand pages → inquiry buttons open WhatsApp with prefilled product details.

---

## 6. End-to-end workflows (step by step)

### 6.1 Account lifecycle: register → wholesaler → delete
1. **First launch:** Splash (2 s + auth poll) → permissions onboarding → `/home`. Guest mode gives a 3-minute real-data trial with a "Viewing as Customer" banner; cart/buy/checkout are blocked until login.
2. **Register:** phone+password (or email), buyer/wholesaler toggle, terms+privacy checkboxes (v2026-08-17) → `POST /auth/register[-phone][/wholesaler]` → bcrypt-hashed user, JWT pair stored (secure storage), proactive 30-min refresh + resume-refresh after 5 min background.
3. **Become wholesaler:** `/convert-to-wholesaler` → shop form + proof photos + map location → `POST /auth/convert-to-wholesaler` (proofs stored **private**, signed URLs only) → `businessInfo.status=pending` → admin approves in Customers → unlocks wholesale prices + negotiation.
4. **Login sessions:** buyer/admin JWT ~15 min + rotating refresh; staff 6 h embedded session; admin passwordless magic-link (5 min, single-use). `GET /auth/me` rehydrates the app on every cold start.
5. **Delete:** in-app request (`GET/POST /auth/account-deletion-request[/cancel]`) or site `/delete-account` form → admin reviews queue → complete → user deactivated.

### 6.2 Direct order (retail + wholesale)
1. **Discover:** Home (hero banners, categories, brands, reviews, featured/hot) → Categories rail → subcategory cards → product grid → Product detail (gallery, specs, related, Hindi names).
2. **Basket:** add to cart (optimistic UI, 500 ms debounced backend sync, min-wholesale-qty + stock validation) or Buy Now (single-item express) → saved addresses (2 device slots) → coupon/affiliate preview (`POST /orders/preview-coupon`) → place order.
3. **Checkout:** order recorded (`pending_payment`) → PDF receipt generated/downloadable/shareable → WhatsApp deep-link with itemized caption → success screen → shipment tracking → Previous Orders (status pills, price breakup, address, reorder actions).
4. **Backend side:** `POST /orders` (guest allowed if enabled) validates stock/coupons, snapshots prices, increments counts; admin fulfills `pending_payment → processing → shipped (tracking+courier) → delivered`, or cancels.

### 6.3 Negotiation → confirmed order (flagship flow)
1. **Request:** wholesaler taps Negotiate on a product → qty + offered price + note → `POST /negotiations` (checks `negotiationEnabled`, snapshots product/price, expiry = settings days) → appears in panel list + product `negotiationCount++`.
2. **Bargain:** both sides chat live — wholesaler `POST /:id/message`, admin `POST /admin/:id/message` (both persisted to `history`, socket-broadcast, push-notified, 280 chars). Admin/staff can counter (price+note → `countered`, push); staff counters/accepts are clamped to admin-set per-product minimums and blocked after expiry.
3. **Accept (panel only):** admin/staff opens Accept dialog (qty × current price total, address prefilled from wholesaler's last order → profile, optional note) → `PUT /:id/accept` → shared service verifies offer state/stock/min-qty → creates the `pending_payment` wholesale order → negotiation `converted` + `orderId` + actor-stamped history (`Admin name` / `Staff name`) → audit → push `negotiation_accepted` (orderId/orderNumber) + `negotiation-accepted` socket event. Re-accept is idempotent (returns the existing order).
4. **Wholesaler sees:** accept push → detail (Approved-by label, View Order → tracking) or list (View Order); order in Previous Orders with **Negotiated badge**; chat stays open for follow-ups. Legacy pre-auto-creation `accepted` rows still offer one-time Proceed-to-Order fallback.
5. **Reject:** panel dialog with reason → `rejected` + push with reason; chat closes. Wholesaler has no accept/counter/reject at all (endpoints removed; 404/410 on old clients).

### 6.4 Staff's daily loop (guardrailed operations)
Login (username, 6 h) → `/staff/orders` (confirm payments, ship) → `/staff/negotiations` (view, counter/accept within minimums — full admin required past expiry or without a set minimum) → `/staff/payments` (approve uploaded screenshots or hold for admin) → `/staff/products` (read-only catalog) → change password when forced (`mustChangePassword`). Every accept/counter writes history attribution + audit log so admin sees exactly which staffer acted.

### 6.5 Payment verification
Customer pays over WhatsApp/UPI/offline → uploads screenshot (`payment_uploaded`, order `payment_uploaded`) → staff/admin review in Payments → **verify** (`verified` → order can move to processing) or **reject/hold** with reason → wholesaler push (`payment_verified` / `payment_rejected`) + status history entries.

### 6.6 Scheduled price changes & campaigns
Admin sets immediate or scheduled (`schedule_24h/48h/custom`) retail/wholesale changes → `pending*` fields + audit → scheduler applies at effective time (price-snapshot XLSX shows before/after) → app shows PendingPriceChangeNotice → FCM price-campaign countdown pushes (12 h/6 h/20 m) with Android chronometer notification → applied push.

### 6.7 Coupons, affiliates, offers
Admin creates affiliate codes / offers (min purchase, %/fixed, caps, groups, windows) → app coupon screen + checkout preview resolves best discount → usage counts + commission accrual on order → analytics reflect discount source.

### 6.8 Catalog publish (single write, three storefronts)
Admin: brand → parent category → subcategories (unique per brand, parent-scoped slugs) → products (WebP images, 3-tier prices, stock, Hindi names) → product counts recomputed → instantly live in **app** (rail + cards), **panel** (drill-down + badges), **site** (brand/category/product pages + website-content sections). Reorder via drag-drop; bulk ops via PDF import script.

### 6.9 Public inquiry (site, no login)
Visitor browses site (same live catalog APIs) → product/brand/category pages → Inquiry popup / contact / dealership forms → prefilled WhatsApp message → shop replies manually; high-intent visitors are funneled to download the app.

### 6.10 Notifications & messaging matrix
Push + DB notification on: negotiation message/counter/accept/reject, payment verified/rejected, price campaigns, promotions (admin → customers broadcast). Deep links: negotiation → detail, order → tracking, price → home. Typing indicators + read receipts live over sockets; history always re-fetched from REST as source of truth.

## 7. Scripts & ops
Backend `scripts/`: `seedGiProducts` + `seedGiFullList` (GI tree), `seedHaritSprinklerSubs`, `seedAllSubcategories` (full taxonomy + openwell merge, idempotent), plus admin/test-user/negotiation/order seeds, PDF import, variant cleanup, Razorpay cleanup, media migration, SMTP/iOS-push diagnostics. `npm run` shortcuts: `seed:gi-products|gi-full|harit-subs|all-subs`, `catalog:pdf`, `media:*`, `test*`. App release: `flutter build apk --release` (v1.0.3+5, 63 MB, prod API).

## 8. Known limits / next candidates
R/Sockets 5–6" pending (photo cut off); Shivanand singles + Jointing left flat by design; deactivated SHIVNATH OPENWELL kept for rollback; offers/coupons UI hidden by flags (`HIDE_OFFERS_UI`, `kHideOfferCouponUi`); wishlist local-only; no bulk subcategory assign; no subcategory images; test coverage limited to inventory/phone-validation/price-snapshot.
