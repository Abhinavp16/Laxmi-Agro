# Distribution Demo Suite — Role-Based Working Flows

## Document purpose

This document defines what each person does in the proposed isolated sales demo, how work passes from one role to another, what the software does automatically, and which parts already exist in the Laxmi Agro project.

It is a planning document only. Creating this document does not authorize or start the demo clone.

## Demo context, data, and safety

### Business problem demonstrated

Many distributors and manufacturers currently manage dealer orders through:

- WhatsApp conversations
- Phone calls
- Printed or PDF price lists
- Excel sheets
- Manually written quotations
- Separate billing or accounting software
- Informal approval between salespeople and owners

This creates common problems:

- Negotiations are scattered across messages and calls.
- Dealers may receive outdated prices.
- Owners cannot easily see what the salesperson promised.
- Order details must be entered again after a deal is agreed.
- Customer and pricing history is difficult to find.
- Follow-ups depend on individual staff members.
- It is difficult to measure demand, conversion, and sales activity.

The demo shows how those steps can be managed in one controlled workflow.

### Dummy data requirements

The demo should contain only synthetic information.

#### Company and branding

- New generic company name
- Generic logo and colour palette
- Demo phone number and email address
- Synthetic address
- New privacy, terms, support, and help content
- “Demonstration Environment” notice

#### Catalog

Recommended baseline:

- 3 generic brands
- 4 parent categories
- 8–10 subcategories
- 15–20 sample products
- Product variants and packaging sizes
- Retail price, dealer price, and sample stock
- Generated or properly licensed images
- Sample specifications and descriptions

The products can initially use neutral categories such as tools, equipment, components, consumables, and accessories. This makes the demo usable for prospects from several industries.

#### Accounts

- One business-owner/admin account
- One dealer/customer account
- Optional staff account for technical review
- Clearly fictional customer names and addresses

For the first version, only the admin should have deal-approval authority. This keeps the presentation predictable and avoids ambiguity around staff permissions.

#### Transactions

- 3–5 historical negotiations
- 5–8 sample orders in different states
- One clean negotiation available for the live presentation
- Sample notifications
- Synthetic analytics and dashboard totals

No existing customer names, addresses, phone numbers, business documents, uploaded proofs, orders, reviews, or analytics should be copied.

### Live dependencies found in the current project

| Current dependency | Risk | Demo treatment |
|---|---|---|
| Production API domain | App could contact the live backend | Remove the production fallback and fail safely if the demo API is missing |
| MongoDB | Could expose or modify real records | Create a new demo-only database |
| Firebase project | Connected to Laxmi's app, storage, and notifications | Use a separate demo Firebase project or disable it |
| Firebase Storage | May contain client product and user files | Use demo storage or local synthetic assets |
| Push notifications | Could reach real devices | Disable them or configure a dedicated demo sender |
| SMTP magic-link login | Could email real addresses | Use demo-only credentials and no outbound email |
| WhatsApp links | Contain production contact details | Disable them or use a non-sending simulation |
| Play Store/App Store links | Point to the live Laxmi application | Remove or replace them with placeholders |
| Public website and support links | Point to Laxmi services | Replace them with generic demo pages |
| Application IDs | Currently identify the Laxmi app | Assign separate Android and iOS identifiers |
| Legal and support content | Contains Laxmi-specific information | Replace it completely |
| Product images and PDFs | May be client-owned | Do not reuse them without written permission |

The Socket.IO negotiation system can be retained because it runs through the demo backend. It must use only the demo API and demo database.

#### Dependency safety rules

- Never copy production `.env` files into the demo.
- Never copy production database connection strings, API keys, tokens, certificates, or Firebase configuration files.
- Do not leave a production URL as a fallback value.
- Keep email, WhatsApp, payment, and external push delivery disabled unless separate demo-only services are deliberately configured.
- Make the demo backend refuse to start if it detects a production hostname, database, Firebase project, or application identifier.
- Store generated or licensed product media in demo-only storage.
- Display a visible “Demo Data” or “Demonstration Environment” label in both the customer app and admin panel.

## Roles covered

| Role | Main purpose | Interface used |
|---|---|---|
| Visitor | Explore the public catalog before registering | Customer app or public website |
| Customer / Buyer | Purchase products at customer pricing and track orders | Customer app |
| Wholesaler / Dealer | Access approved bulk products and pricing, submit requirements, negotiate, and track bulk orders | Customer app in wholesaler mode |
| Staff / Operator | Handle approved operational work without full business-control access | Restricted staff panel |
| Admin / Business Owner | Control products, pricing, customers, negotiations, orders, staff, settings, and reporting | Full admin panel |
| System Automation | Validate data, calculate totals, create records, update inventory, notify users, and preserve history | Backend services |

---

# 1. Visitor Working Flow

## Objective

Allow a potential customer to understand the catalog and value of the business before creating an account.

## Tasks performed by the visitor

1. Opens the customer app or website.
2. Views featured products, categories, brands, offers, and popular products.
3. Searches or filters the catalog.
4. Opens a product to review:
   - Product name and image
   - Description and specifications
   - Packing or variant information
   - Public/customer price
   - Availability
   - Related products
5. Decides whether to register as a normal customer or wholesaler.

## What the system does

- Shows only active, publicly available products.
- Uses public pricing for unauthenticated visitors.
- Records non-personal product-interest events where analytics are enabled.
- Requests login before account-only actions such as persistent cart, ordering, negotiation, wishlist, and order history.

## Demo data required

- Generic home banners
- Four sample categories
- Three sample brands
- Fifteen to twenty sample products
- Generated or properly licensed images
- Clearly fictional prices and offers

## Result and next action

The visitor either continues browsing or registers for the appropriate account type.

---

# 2. Customer / Buyer Working Flow

## Objective

Let a retail or standard business customer find products, prepare an order, submit it for approval, and follow its status.

## A. Registration and profile

### Customer tasks

1. Selects Customer registration.
2. Provides name, phone or email, and password.
3. Accepts the applicable privacy policy and terms.
4. Signs in.
5. Adds or edits profile and delivery-address information.

### System tasks

- Creates a user with the `buyer` role.
- Maintains the authenticated session.
- Applies customer pricing.
- Keeps customer records separate from wholesaler-only records and functionality.

### Admin visibility

The admin can see the new customer in customer management and can inspect their profile and order history.

## B. Product discovery

### Customer tasks

1. Browses products by category or brand.
2. Searches for a product.
3. Reviews product specifications, images, price, packing, and stock.
4. Adds a product to the wishlist or cart.
5. Changes quantities or removes cart items.

### System tasks

- Shows the applicable buyer price.
- Validates that the product is active.
- Validates the selected quantity and available stock.
- Calculates the running cart value.
- Preserves the authenticated customer's cart.

## C. Customer order submission

### Customer tasks

1. Opens the cart.
2. Reviews products and quantities.
3. Adds a delivery address and optional note.
4. Applies an eligible coupon or affiliate code when available.
5. Reviews subtotal, delivery fee, discount, and total.
6. Places the order.
7. Waits for business acceptance.

### System tasks

- Revalidates price, quantity, stock, coupon, and offer eligibility.
- Creates the order with `acceptanceStatus: pending` for a buyer order.
- Adds the initial status-history entry.
- Notifies the admin and relevant operational staff.
- Shows the customer that the order is awaiting acceptance.

### Admin or staff tasks

1. Opens the pending order.
2. Reviews the customer, products, quantities, price, address, and note.
3. Accepts the order or rejects it with a reason.

### Result

- If accepted, inventory is committed and the order proceeds to payment confirmation and processing.
- If rejected, the customer sees the rejection and reason.

## D. Customer order tracking

### Customer tasks

1. Opens Previous Orders.
2. Selects an order.
3. Reviews the order number, amount, items, delivery address, and status timeline.
4. Views courier and tracking information after shipment.
5. Exports the order document when that option is enabled.

### System tasks

- Returns only orders belonging to the signed-in customer.
- Shows the preserved product and price snapshot used when the order was placed.
- Records every status change in chronological order.
- Sends in-app or configured push notifications when status changes.

## E. Requesting wholesaler access

### Customer tasks

1. Opens Convert to Wholesaler.
2. Provides business name, address, GST details where applicable, contact information, and shop location.
3. Uploads business proof where required.
4. Submits the application.
5. Waits for approval or responds to a rejection by correcting the application.

### System tasks

- Stores the application as pending.
- Keeps proof files private.
- Notifies the admin about the application.

### Admin tasks

1. Reviews the applicant and business information.
2. Accepts or rejects the application.
3. Selects any categories the wholesaler must not access.
4. Records verification status and time.

### Result

After approval, the user receives the wholesaler role and the permitted wholesale catalog experience.

---

# 3. Wholesaler / Dealer Working Flow

## Objective

Let an approved wholesaler find bulk products, see the applicable pricing, submit a commercial requirement, discuss it with the seller, and receive a confirmed order.

## A. Wholesaler onboarding

### Wholesaler tasks

The wholesaler can enter through either route:

1. Register directly as a wholesaler and provide business information; or
2. Start as a customer and request conversion to wholesaler.

For the demo, a pre-approved wholesaler account will be used so that no real documents are required.

### Admin tasks

- Verifies the wholesaler account.
- Approves or rejects the application.
- Controls category access.
- Reviews shop location where that feature is enabled.

### System tasks

- Applies the wholesaler role and approved access rules.
- Uses wholesale prices for permitted products.
- Enforces minimum wholesale quantities.

## B. Bulk catalog discovery

### Wholesaler tasks

1. Signs in using the wholesaler account.
2. Browses only the categories available to that account.
3. Searches by product, brand, category, or SKU.
4. Reviews wholesale price, packing, stock, and minimum order quantity.
5. Chooses between a standard cart order and a negotiated requirement where negotiation is enabled.

### System tasks

- Applies wholesale pricing.
- Excludes restricted categories.
- Displays whether negotiation is available.
- Validates minimum quantity and stock.

## C. Requirement and negotiation flow — primary demo flow

### Wholesaler tasks

1. Opens an eligible product.
2. Selects Send Requirement.
3. Enters:
   - Required quantity
   - Target price per unit
   - Delivery or commercial requirement message
4. Reviews the calculated requested total.
5. Submits the requirement.
6. Opens My Negotiations to follow it.
7. Reads the seller's message or structured counteroffer.
8. Uses negotiation chat to clarify quantity, price, delivery, or packing.
9. Waits for the admin or authorized operator to confirm the final offer.

### System tasks

- Confirms that the account is a wholesaler.
- Confirms that negotiation is enabled for the product.
- Saves a product-and-price snapshot.
- Creates a negotiation number.
- Calculates the requested total.
- Sets an expiry date.
- Creates the first history entry as `requested`.
- Notifies the admin.
- Delivers chat and counteroffer updates through the realtime channel.

### Admin tasks

1. Opens the Deal Desk.
2. Searches or filters pending negotiations.
3. Reviews:
   - Wholesaler and business identity
   - Product
   - Requested quantity
   - Listed price
   - Target price
   - Requested total
   - Current offer
   - Message and history
   - Previous delivery address where available
4. Sends a message, makes a counteroffer, accepts the deal, or rejects it with a reason.
5. Supplies or confirms the shipping address when accepting.

### System tasks after a counteroffer

- Sets the negotiation to `countered`.
- Stores the new price per unit and total.
- Records who made the counteroffer.
- Updates the wholesaler in realtime.
- Adds the action to the negotiation history.

### System tasks after acceptance

- Uses the current structured price as the final price.
- Records the approver and time.
- Creates one order linked to the negotiation.
- Prevents duplicate order creation when acceptance is retried.
- Preserves the negotiated product, quantity, and price snapshot.
- Returns the order number to the admin.
- Makes the linked order visible to the wholesaler.
- Notifies the wholesaler.

### System tasks after rejection

- Records the reason.
- Closes the requirement as rejected.
- Prevents further messages for rejected or expired negotiations.
- Notifies the wholesaler.

### Important current behavior

- The wholesaler communicates through chat but does not press a structured Accept, Counter, or Reject button.
- Final acceptance is performed from the admin or staff panel.
- For the sales demo, final acceptance should be restricted to the admin/business-owner account so the approval responsibility is unambiguous.

## D. Wholesaler order follow-up

### Wholesaler tasks

1. Opens the accepted negotiation.
2. Follows the linked order.
3. Reviews final quantity, agreed unit price, total, address, and status history.
4. Receives shipment and tracking information.

### System tasks

- Links the negotiation and resulting order in both directions.
- Shows who approved the negotiation.
- Sends status notifications.
- Preserves an auditable history of the agreed commercial terms.

---

# 4. Staff / Operator Working Flow

## Objective

Allow trusted employees to perform routine order and deal operations without gaining access to all owner settings and business controls.

## A. Staff access

### Staff tasks

1. Signs in with the username and temporary password created by the admin.
2. Changes the password when required.
3. Uses the restricted staff workspace.

### Admin tasks

- Creates the staff account.
- Resets the staff password.
- Activates or deactivates the account.

### System tasks

- Uses a shorter staff session.
- Records staff login and operational actions in the audit history.
- Prevents staff from opening full-admin routes.

## B. Staff product access

### Staff tasks

- Searches products.
- Browses products by category.
- Views retail price, wholesale price, SKU, packing, and stock.

### Restriction

The staff product catalog is read-only. Staff cannot create, edit, delete, reprice, or change stock directly through this area.

## C. Staff order operations

### Staff tasks

1. Searches and filters orders.
2. Opens order details.
3. Reviews customer, items, total, status, and payment information.
4. Accepts a pending order.
5. Rejects a pending order with a reason.
6. Marks an eligible in-office payment as completed.
7. Ships a processing order by entering courier and tracking information.

### Current restrictions

- Staff cannot delete orders.
- Staff cannot use the full arbitrary status-transition control available to an admin.
- Final exceptional decisions should be escalated to the admin.

## D. Staff payment review

### Staff tasks

1. Opens a payment awaiting review.
2. Checks the uploaded proof when the legacy/uploaded-payment workflow applies.
3. Approves a valid uploaded pending payment.
4. Places a questionable payment on hold with a required reason.
5. Escalates held payments to the admin.

### System tasks

- Allows approval only for eligible pending uploaded payments.
- Records the reviewer or person placing the payment on hold.
- Adds the event to the audit history.

## E. Staff negotiation operations

### Staff tasks currently supported

- View and search negotiations.
- Review wholesaler and product information.
- Send a structured counteroffer.
- Accept an eligible negotiation and create its order.

### Current restrictions

- Expired negotiations require full-admin handling.
- Staff has no negotiation-rejection route.
- The current staff API does not provide the same free-form negotiation-chat action as the full admin.

### Proposed demo restriction

Staff negotiation acceptance should be hidden or disabled in the initial sales demo. Staff can be shown as an operations role, while the owner/admin performs the commercial approval.

---

# 5. Admin / Business Owner Working Flow

## Objective

Give the business owner complete control of commercial rules, catalog data, customers, staff, orders, content, and reporting.

## A. Dashboard and notifications

### Admin tasks

- Reviews headline sales and operational statistics.
- Opens alerts for new orders, wholesaler applications, deal requests, messages, and low stock.
- Marks alerts as read.
- Uses alerts to move directly to the relevant record.

### System tasks

- Stores notifications in the admin inbox.
- Sends realtime events to signed-in admin panels.
- Optionally sends dedicated demo push notifications if a separate demo Firebase project is approved.

## B. Product and catalog management

### Admin tasks

- Creates, edits, archives, and deletes products where allowed.
- Uploads and removes product images.
- Manages brand, category, subcategory, product label, and packing information.
- Sets retail price, wholesale price, stock, minimum wholesale quantity, and negotiation availability.
- Changes stock and reviews stock logs.
- Downloads price snapshots and reviews price-change history.
- Controls which catalog items appear on the website.

### System tasks

- Validates product data.
- Maintains product and price history.
- Makes catalog changes available to the customer app and website.
- Generates low-stock notifications where configured.

## C. Price management

### Admin tasks

- Changes retail and wholesale prices.
- Reviews price-change history.
- Uses planned or campaign-style price changes where enabled.
- Reviews the customer group affected by a price change.

### System tasks

- Activates scheduled changes.
- Records the old and new values.
- Notifies eligible customer groups where configured.

## D. Customer and wholesaler management

### Admin tasks

- Searches customers.
- Opens a customer's profile and order history.
- Approves or rejects wholesaler applications.
- Controls wholesaler category access.
- Reviews accepted wholesaler locations on the map.
- Sends targeted customer notifications.
- Processes account-deletion requests according to the configured policy.

### System tasks

- Records role changes and verification information.
- Protects private proof documents.
- Applies category restrictions during catalog access.
- Preserves required financial records when an account is deleted or anonymized.

## E. Negotiation management

### Admin tasks

- Reviews all deal requests.
- Filters by status and searches by customer, deal number, or product.
- Reads the full message and price history.
- Sends chat messages.
- Counters with a structured price.
- Accepts and converts the deal into an order.
- Rejects with a recorded reason.
- Handles expired or exceptional negotiations.

### System tasks

- Keeps a timestamped action history.
- Records the approving user and role.
- Delivers realtime changes.
- Prevents duplicate conversion.
- Connects the accepted negotiation to its order.

## F. Order and fulfilment management

### Admin tasks

- Searches and filters orders by type, status, date, customer, and acceptance state.
- Reviews customer, item, price, payment, address, and negotiation information.
- Accepts or rejects buyer orders.
- Confirms an in-office payment.
- Moves eligible orders to processing.
- Adds courier and tracking information.
- Marks shipped orders as delivered.
- Cancels an eligible order.
- Deletes only eligible cancelled orders or orders with rejected payment; negotiated orders cannot be deleted.

### System tasks

- Enforces valid order-status transitions.
- Commits inventory when an order is accepted or confirmed.
- Releases inventory when an eligible order is rejected or cancelled.
- Records status history and audit entries.
- Notifies the customer about important changes.

## G. Staff, content, and business settings

### Admin tasks

- Creates and controls staff accounts.
- Manages offers, coupons, affiliate codes, and commissions.
- Reviews or moderates product reviews.
- Manages banners and website content.
- Configures ordering, support, pricing, app-store, and business settings.
- Reviews product, sales, demand, and potential-customer analytics.

### Demo treatment

Only a small representative dataset should be included. Real analytics, campaigns, affiliates, phone numbers, legal content, and external links must not be copied.

---

# 6. System Automation Working Flow

## Objective

Perform repeatable validation and record keeping so that users do not have to manually copy the same information between conversations, spreadsheets, and orders.

## Automated tasks

### Identity and access

- Authenticates users.
- Applies buyer, wholesaler, staff, and admin permissions.
- Prevents one role from using another role's protected API routes.

### Pricing and catalog

- Selects the correct buyer or wholesale price.
- Enforces product visibility and category access.
- Validates stock and minimum quantities.
- Preserves product snapshots in negotiations and orders.

### Negotiations

- Generates a negotiation number.
- Calculates requested and counteroffer totals.
- Applies an expiry time.
- Preserves the full action history.
- Sends realtime updates.
- Converts an accepted negotiation into one linked order.

### Orders and inventory

- Generates an order number.
- Calculates subtotal, discount, delivery fee, and final total.
- Records acceptance and order-status history.
- Commits or releases inventory at controlled points.
- Prevents invalid status changes.

### Notifications and audit

- Creates admin alerts.
- Creates customer or wholesaler notifications.
- Records important staff and admin actions.
- Identifies who approved or changed a record.

### Demo reset

- Clears presentation activity from the demo database.
- Restores fixed accounts, products, stock, negotiations, and historical orders.
- Refuses to run unless the database is explicitly identified as a demo database.

---

# 7. Cross-Role Handoffs

| Starting action | Started by | Received by | Receiver action | System result |
|---|---|---|---|---|
| New buyer order | Customer | Admin or staff | Accept or reject | Inventory is committed or order is rejected |
| Wholesaler application | Customer | Admin | Verify, approve, reject, set category access | Role and permissions are updated |
| Bulk requirement | Wholesaler | Admin | Review, message, counter, accept, or reject | Negotiation history is updated |
| Accepted requirement | Admin | Wholesaler and operations | Follow order fulfilment | One linked order is created |
| Suspicious payment | Staff | Admin | Review and decide | Payment remains held until resolved |
| Shipment prepared | Admin or staff | Customer/wholesaler | Follow tracking | Courier and tracking become visible |
| Low stock | System | Admin | Replenish or adjust catalog | Availability can be corrected |
| Account deletion request | Customer | Admin | Verify and complete | Personal data is removed or anonymized according to policy |

---

# 8. Status Flows

## Negotiation status

```text
Pending
  -> Countered
  -> Accepted / Converted to Order
  -> Rejected
  -> Expired
```

The history also records requested, countered, accepted, rejected, and message actions.

## Customer-order approval

```text
Submitted / Awaiting Approval
  -> Accepted
  -> Rejected with Reason
```

## Order fulfilment

```text
Pending Payment
  -> Payment Verified
  -> Processing
  -> Shipped
  -> Delivered
```

Cancellation is permitted only from supported states and must release inventory where it was previously committed.

## Wholesaler application

```text
Not Applied
  -> Pending
  -> Accepted and Verified
  -> Rejected / Correct and Reapply
```

---

# 9. Recommended Demo Role Setup

The first sales-demo release should contain these prepared identities:

| Demo identity | Role | Purpose |
|---|---|---|
| Priya Sharma | Customer | Demonstrate standard catalog and order history |
| Sunrise Trade House | Wholesaler | Demonstrate the requirement-to-order flow |
| Demo Operator | Staff | Explain restricted operational access, without final deal approval |
| Demo Business Owner | Admin | Demonstrate complete business control and deal approval |

All names, contact details, addresses, tax identifiers, orders, and business histories must be explicitly synthetic.

---

# 10. Recommended Three-to-Five-Minute Role Walkthrough

## 0:00–0:30 — Current business problem

Explain that dealer requirements, bargaining, and order confirmation are often split between WhatsApp, phone calls, PDFs, and spreadsheets.

## 0:30–1:30 — Wholesaler

1. Sign in as Sunrise Trade House.
2. Browse the permitted bulk catalog.
3. Open a negotiation-enabled product.
4. Enter quantity, target price, and delivery requirement.
5. Submit the requirement.

## 1:30–2:40 — Admin / business owner

1. Open the Deal Desk.
2. Show the incoming requirement and wholesaler information.
3. Send a counteroffer and short message.
4. Confirm the final structured price.
5. Accept the deal.

## 2:40–3:30 — Automated handoff

1. Show the automatically created order number.
2. Return to the wholesaler account.
3. Show the accepted negotiation and linked order.
4. Show the order timeline.

## 3:30–4:30 — Owner control and staff separation

Briefly show catalog pricing, customer records, orders, stock, and reporting. Explain that staff can handle routine operations through a restricted panel while the owner retains full control.

## 4:30–5:00 — Customization boundary

Clarify which capabilities already work and which items would be configured for the prospect, such as branding, catalog structure, approval rules, taxes, integrations, reports, language, and delivery operations.

---

# 11. Current Implementation Gaps to Handle in the Demo

These are planning observations, not instructions to change the live system.

1. **Wholesaler confirmation is conversational.** Wholesalers can chat after a counteroffer but do not have a structured Accept Counteroffer action. The demo script should use a clear chat acknowledgement followed by admin acceptance, or a future approved demo-only acknowledgement can be designed.
2. **Staff can currently accept negotiations.** The first demo should reserve commercial approval for the admin to keep the responsibility easy to explain.
3. **Staff negotiation chat is narrower than admin chat.** The staff role supports countering and accepting but does not have the same free-form chat route as admin.
4. **Customer payment-upload endpoints are retired.** The current customer flow expects the shop to confirm payment. The demo should not promise online payment or proof upload.
5. **Direct wholesaler registration and approval must be made visually clear.** The seeded demo wholesaler should be explicitly accepted and verified, with predetermined category access.
6. **External notifications require production-like services.** The initial demo should use in-app and realtime notifications, with email, WhatsApp, and push disabled unless dedicated demo services are created.
7. **Delivery is manually administered.** Courier name and tracking number are entered by an operator or admin; there is no live courier integration in the proposed scope.
8. **The strongest demo uses the app, admin, and backend.** A public marketing website is useful as an optional addition but is not needed for the core requirement-to-order story.

---

# 12. Completion Check for Role Workflows

The role-flow portion of the dummy demo is complete when:

- A customer can browse and inspect their prepared order history.
- An approved wholesaler can submit a fresh requirement.
- The admin can see it without using production services.
- The admin can counter, communicate, and accept it.
- Exactly one linked order is created.
- The wholesaler can see the approved result and order timeline.
- Staff access is visibly restricted from full-admin control.
- Every identity and record is synthetic.
- The complete scenario can be reset for the next prospect.
- Presentation notes clearly separate existing capabilities from client-specific customization.
