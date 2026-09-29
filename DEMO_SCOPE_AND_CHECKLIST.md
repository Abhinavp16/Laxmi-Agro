# Distribution Demo Suite — Verified Scope and Dependency Checklist

Status: **planning only — not approved, nothing built.**
Verified against the working tree on 2026-09-28 (app `1.0.7+10`, uncommitted). Companion to `DEMO_ROLE_WORKING_FLOWS.md`.

Approval gates before any build work:

- [ ] **G1 — Source reuse.** Written confirmation from the business owner / Laxmi Agro that the existing source code may be reused for a generic demo. The repo has no LICENSE file and no ownership statement, so this cannot be inferred from the code.
- [ ] **G2 — Scope.** The "Demo scope" section below is approved, including the decisions in "Open decisions".

---

## 1. Handoff claims corrected by the code

| # | Handoff / earlier docs said | Code actually does | Demo impact |
|---|---|---|---|
| C1 | Wholesaler enters quantity, target price **and message** | App sheet sends only `productId, quantity, pricePerUnit` (`product_detail_screen.dart:4660`). Backend already accepts `message` (`validations/index.js:198-204`) | Add message field to the demo app sheet (small) |
| C2 | Staff accept is limited by admin-set minimum prices | **No minimum-price guard exists in the backend.** Admin UI reads `staffMinPrice`, which nothing supplies, so staff accept is always enabled | Disable the staff accept route and button in the demo build |
| C3 | Staff can act only on pending or countered negotiations | Staff guard also allows **counter on `accepted`/`converted`** (`staffOperationsController.js:186`) and can reset a converted deal to `countered` | Block in demo. Separately a **live-system bug** |
| C4 | Wholesaler can choose cart order or negotiated requirement | Wholesalers get **no Cart or Buy Now** on product detail, only "Send Requirement" | Walkthrough wording only |
| C5 | Send Requirement only on negotiation-enabled products | Button shows on **every in-stock product** for wholesalers. Backend rejects when `negotiationEnabled=false` | Seed every wholesale product with negotiation enabled, or gate the button |
| C6 | Wholesale pricing unlocked after approval | Direct wholesaler registration creates role `wholesaler` immediately. `verified:false` is never checked | Seed a pre-approved wholesaler. Don't demo live signup as "approval-gated" |
| C7 | Category restrictions apply to wholesalers | Applied to catalog reads only, **not** to cart, order or negotiation creation | Don't claim hard enforcement |
| C8 | Accepted negotiation commits inventory | Accept only **checks** stock. Commit happens on payment verify or on moving to `processing` | To show stock drop live, move the order to Processing |
| C9 | Order flow: Submitted → Accepted → Payment Verified → … | True for **buyer** orders only. Negotiated orders start at `pending_payment` with `acceptanceStatus=null` | Two separate status flows in the script |
| C10 | Negotiations expire | Expiry date is set (default 7 days). **No job marks them expired**; status changes only on accept attempt | Reset must set `expiresAt` explicitly |
| C11 | System records audit events | Admin counter, admin reject, price and product changes are **not** audited | Say "order, payment and staff actions are audited" |
| C12 | Admin logs in by magic link | UI is magic-link only (requires SMTP, mails fixed admin addresses). Backend `/auth/login` still accepts a password admin | Demo-only password login in admin UI, gated by demo mode |
| C13 | Production fallback only in the app | Admin panel **socket** URLs also fall back to `api.laxmiagroenterprises.com` (3 places) | Remove all four fallbacks |
| C14 | WhatsApp number comes from settings | Backend uses env var or hardcoded number; DB setting is ignored. Site hardcodes it in `lib/inquiry.js:1` | Replace constants; disable wa.me in demo |
| C15 | Store links are configurable | `Settings.js:9-16` restricts store URLs to an **enum** of the live listings | Relax enum in demo copy |
| C16 | Tests are safe to run | Backend `inventory` and `orderApproval` tests connect to `MONGODB_URI`. With the current `.env` that is **live Atlas**. Admin Playwright `admin-flow` sends a real magic-link email | Never run these against the current `.env` |

Also confirmed as described in the handoff:

- idempotent single-order creation
- negotiation–order linkage
- wholesaler has no accept/counter/reject
- admin chat, counter, accept and reject
- buyer acceptance flow
- customer payment routes retired (410)
- Firebase and SMTP degrade gracefully when unset
- no third-party analytics in backend or app

---

## 2. Live-system issues found (outside demo scope — not changed)

1. **Unauthenticated Socket.IO negotiation rooms.** Any client can `join-negotiation` and broadcast `send-message` with a spoofed role (`negotiationSocketService.js:55-100`).
2. **Staff can counter an accepted or converted negotiation** (C3).
3. **Backend tests and some Playwright tests write to production** with the current `.env` (C16).
4. **CORS accepts any `*.vercel.app` origin** (`app.js:48-55`).
5. **Hardcoded plaintext passwords in seed scripts**; some print them to the console.
6. **Staff and admin negotiation lists disagree on "expired"** (C10).

These should be reported to the owner separately. The demo copy will fix 1–4 in its own codebase only.

---

## 3. Demo scope (proposed for approval)

### In scope

- Backend, Flutter app (Android APK), and admin + staff panel.
- The primary flow: wholesaler requirement → admin chat/counter → admin accept → one linked order → wholesaler sees order → admin fulfils.
- Supporting screens:
  - catalog, brands and categories
  - pricing and stock
  - customers and wholesaler approval
  - buyer order with acceptance
  - staff restricted panel (accept disabled)
  - dashboard and analytics
  - in-app notifications
- Synthetic seed + `demo:reset` CLI + protected "Reset Demo" admin button.

### Out of scope unless separately approved

- Public website: about 35–40% hardcoded Laxmi content; +1.5–2 days.
- Flutter web: `dart:io` uploads and `youtube_player_flutter` break it; +1–2 days.
- iOS build: needs a separate bundle ID and signing team.
- Push, email, WhatsApp, payments, courier or ERP integrations.

### Demo-only code changes (made in the demo copy, never in Laxmi's repo)

| Area | Change |
|---|---|
| Backend | `DEMO_MODE` guard: refuse to start unless the DB name contains `demo`, no Firebase vars, no SMTP vars, and no known production hosts, emails, phones or IDs |
| Backend | Disable staff negotiation accept and the converted-counter path; authenticate socket rooms |
| Backend | Remove hardcoded contacts: `publicBusiness.js`, `Settings.js` defaults, `DEFAULT_ADMIN_EMAILS`, store-URL enum |
| Backend | `scripts/demo/seed.js` + `demo:reset` (versioned JSON fixtures). Replace broken `npm run seed`. Do not reuse `seedLocalCatalog`/`importPdfCatalog`, which contain real contacts and catalog |
| Backend | Seed `Analytics` view events so conversion and trending panels aren't empty |
| App | Remove `hostedUrl` production fallback: fail with a clear screen if `API_BASE_URL` is missing |
| App | Remove `google-services.json` and plist, and the gms plugin |
| App | New app ID `com.<vendor>.distributiondemo`, new name, logo, launcher and launch images |
| App | Replace legal text assets and all branded strings (~150 hits in `lib/`) |
| App | Add message field to requirement sheet; demo banner; rename existing "demo mode" (customer preview) label to avoid confusion |
| Admin | Remove the 3 socket production fallbacks; demo password login; demo banner; Reset Demo button |
| Admin | Rebrand ~12 files and icons; remove Vercel Analytics; neutral map centre; hide staff Accept |

### Isolation (recommended form)

- **New private repository with fresh history**, created from a sanitized export.
  - Not a branch or fork: this repo's history contains the Laxmi Firebase config files (4 commits), legal text and branding.
- Nothing copied from:
  - `.env`, `.env.local`
  - `.local/` (production catalog backups)
  - `uploads/`
  - `extracted-docs/`
  - `LAXMI AGRO/`
  - `android/key.properties`, `*.jks`
  - site/admin `public/` brand images, root PNG/SVG/RAR files
- Separate deployment:
  - own backend URL
  - own MongoDB **replica set**: transactions require it; a separate Atlas project on free tier or `mongod --replSet`
  - own secrets, own signing key
  - Firebase and SMTP unset

---

## 4. Dependency checklist (tick during build)

**Data and infrastructure**
- [ ] New MongoDB replica set; DB name contains `demo`; no production data imported
- [ ] New `JWT_SECRET`; fresh `.env` written from `.env.example` only
- [ ] `FIREBASE_*` unset; `FILE_STORAGE_DRIVER=local`; `SMTP_*` unset; `ADMIN_EMAILS` synthetic
- [ ] `PUBLIC_ORDER_WHATSAPP_NUMBER`, `DEFAULT_UPI_*` synthetic or blank
- [ ] `CORS_ORIGIN` limited to the demo admin URL; `*.vercel.app` wildcard removed
- [ ] Startup guard refuses production hosts, DB name `laxmiagro`, Firebase project `laxmi-agro-1df4b`, `com.laxmiagro.app`, known phones and emails

**Client builds**
- [ ] App built with `--dart-define=API_BASE_URL=<demo>`; no fallback in code
- [ ] Android `applicationId` and namespace changed; new keystore; Kotlin package path moved
- [ ] No `google-services.json`, `GoogleService-Info.plist`, or gms plugin
- [ ] Store-update check disabled (no redirect to the live Play or App Store listing)
- [ ] Admin `NEXT_PUBLIC_API_BASE_URL` set; no production socket fallback; `NEXT_PUBLIC_FIREBASE_*` empty

**Content**
- [ ] Generic name, logo, colours, legal, help and about content in app and admin
- [ ] Grep gate passes on the demo repo. Zero hits for:
  `laxmi|ashirvad|raipur|9179110159|8770974845|laxmiagroenterprises|ashirvadmarketing|laxmi-agro-1df4b|com\.laxmiagro|UW9NZM7BNP|id6804305521`
- [ ] Generated or licensed images only

**Seed baseline**
- [ ] Catalog:
  - 3 brands
  - 4 parent categories
  - 8–10 subcategories
  - 15–20 products, all with negotiation enabled and stock above the demo quantity
- [ ] Accounts: admin, wholesaler (pre-approved, complete address), buyer, staff
- [ ] Activity:
  - 3–5 historical negotiations
  - 5–8 orders across statuses
  - notifications
  - analytics events
- [ ] One clean product and wholesaler with no open negotiation, ready for the live run

**Reset**
- [ ] `npm run demo:reset` refuses unless demo mode is on and the DB name contains `demo`
- [ ] Admin Reset button: admin-only, typed confirmation, same guards
- [ ] Reset clears presentation activity, restores baseline, and sets fresh `expiresAt`

**Acceptance run** (recorded):
- [ ] Wholesaler submits a requirement with a message
- [ ] Admin sees it live
- [ ] Admin counters and chats
- [ ] Admin accepts; exactly one order is created
- [ ] Wholesaler sees the order and timeline
- [ ] Admin moves the order to Processing and Shipped; stock drops
- [ ] Staff cannot accept
- [ ] Reset returns to baseline
- [ ] The run is repeated a second time

---

## 5. Open decisions

1. **Reuse permission (G1).** If it is not granted, the plan becomes a clean-room rebuild, about 12–15 days.
2. **Prospect access.**
   - Option A: presenter-driven only (APK on your device + hosted admin).
   - Option B: prospects get their own login. That needs Flutter web or APK distribution, plus per-prospect reset.
3. **Hosting.** Where the demo backend and admin run (separate account from Laxmi's), and who owns that account.
4. **Generic company name and vendor app ID** (e.g. `com.<vendor>.distributiondemo`).
5. **Website:** include or skip for v1.

## 6. Revised estimate (source reuse approved, Android + admin only)

| Work | Days |
|---|---|
| Sanitized repo, isolation guards, env, infrastructure | 1–1.5 |
| Rebranding and legal replacement (app + admin) | 1.5 |
| Demo auth, dependency removal, staff-accept disable, socket auth, message field | 1–1.5 |
| Seed fixtures, reset CLI and button | 1.5–2 |
| Deployment, QA, recording, docs | 1.5–2 |
| **Total** | **7–9 working days** |

The total is up from 6–8 days because of C1, C2, C12, C13 and the need to build the seed from scratch.
