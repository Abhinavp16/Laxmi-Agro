# App text in English and Hindi

All user-visible app text lives in `app_en.arb` (English) and `app_hi.arb` (Hindi).
Flutter generates `generated/app_localizations.dart` from them (`flutter gen-l10n`,
also run automatically by `flutter run` / `flutter build`).

- Use text in widgets with `context.l10n.someKey` (`import 'package:laxmi_agro/l10n/l10n.dart';`).
- Product / category names from the server: `localizedName(context, product)` shows
  `nameHindi` when Hindi is selected and one exists, otherwise the English name.
- `context.isHindi` tells you the current language. Change it with
  `ref.read(localeProvider.notifier).setLocale(...)` or `.toggle()`.
- Every key must exist in both files with the same `{placeholders}`.
  `test/l10n/arb_completeness_test.dart` fails otherwise.

## Rules

1. **Numbers are always Latin digits** (1, 2, 3), never Hindi digits (१, २, ३). Format numbers and
   prices with `core/utils/number_formatter.dart` and pass them in as placeholders.
2. **Write whole sentences** with placeholders (`"Save ₹{amount} on {count} units"`). Don't glue
   translated fragments together, because Hindi word order differs.
3. **Plurals** use ICU: `"{count, plural, =1{1 item} other{{count} items}}"`.
4. **Keep as written:** product/brand names from the server, SKUs, units and codes (HP, sqmm,
   MCB, PVC, V-4), phone numbers, emails, order/deal numbers.
5. **Legal policy documents** (`assets/legal/*.txt`) stay in English. Only the screen around
   them is translated.
6. Customer and dealer wording can differ. Use separate keys (e.g. `homeHotDealsCustomer` vs
   `homeHotDealsDealer`), never one key for both.

## Hindi glossary (use these consistently)

| English | Hindi |
|---|---|
| Cart / Add to Cart | कार्ट / कार्ट में डालें |
| Buy Now | अभी खरीदें |
| Order / Orders / My Orders | ऑर्डर / ऑर्डर / मेरे ऑर्डर |
| Delivery / Delivery fee | डिलीवरी / डिलीवरी शुल्क |
| Price / MRP / Your price | कीमत / MRP / आपकी कीमत |
| Dealer price / Wholesale price | डीलर कीमत / थोक कीमत |
| Quote / Quotation | कोटेशन |
| Requirement / Send Requirement | रिक्वायरमेंट / रिक्वायरमेंट भेजें |
| Negotiation / Deal | मोलभाव / डील |
| Counter offer / New price | नई कीमत |
| Wishlist (customer) | विशलिस्ट |
| Regular items (dealer) | नियमित आइटम |
| Hot deals (customer) / Dealer schemes (dealer) | धमाकेदार डील्स / डीलर स्कीमें |
| Popular products (customer) / Fast-selling (dealer) | लोकप्रिय उत्पाद / तेज़ी से बिकने वाले उत्पाद |
| Wholesaler / Dealer | होलसेलर / डीलर |
| Customer | ग्राहक |
| Product / Products | उत्पाद |
| Category / Subcategory | कैटेगरी / सब-कैटेगरी |
| Brand | ब्रांड |
| Stock / In stock / Out of stock | स्टॉक / स्टॉक में है / स्टॉक में नहीं है |
| Minimum order quantity | न्यूनतम ऑर्डर मात्रा |
| Quantity / Units | मात्रा / यूनिट |
| Discount / % OFF / You save | छूट / % छूट / आपकी बचत |
| Payment / Pay | भुगतान / भुगतान करें |
| Address / Shipping address | पता / डिलीवरी का पता |
| Profile / Edit profile | प्रोफ़ाइल / प्रोफ़ाइल बदलें |
| Log in / Sign up / Log out | लॉग इन करें / साइन अप करें / लॉग आउट करें |
| Help / Support | मदद / सहायता |
| Notifications | सूचनाएं |
| Search | खोजें |
| Filter / Filters | फ़िल्टर |
| Track order / Tracking | ऑर्डर ट्रैक करें / ट्रैकिंग |
| Shipped / Delivered / Cancelled | भेज दिया गया / डिलीवर हो गया / रद्द |
| Pending / Awaiting approval | लंबित / मंज़ूरी का इंतज़ार |
| Accepted / Rejected / Expired | स्वीकार / अस्वीकार / समाप्त |
| Laxmi Agro | लक्ष्मी एग्रो |
