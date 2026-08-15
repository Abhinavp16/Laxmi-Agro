# Laxmi Agro data retention, backup, and deletion policy

**Status:** Operational policy for implementation. Business and legal owners must approve it before the public policy and App Store / Google Play declarations are published.

**Effective only after approval:** The backend deletion workflow is designed to enforce the actions below. Infrastructure owners must separately configure backups and storage lifecycle rules to meet the stated backup-expiry limit.

## Deletion request commitment

- A user may request account deletion in the app or at the public website deletion page.
- The request is recorded with a due date **30 calendar days** after submission.
- Staff verify public website requests against the account holder before processing them.
- A pending request may be cancelled by the authenticated user before staff mark it in review.
- Completion immediately revokes refresh tokens and disables the account. The user can no longer sign in or access account data.
- A staff audit record stores request status, due date, action history, processor, completion time, and backup-expiry date.

## Retention schedule

| Data category | Purpose | Retention / deletion action | Owner |
| --- | --- | --- | --- |
| Account profile, addresses, avatar, business profile, GST/business proofs, shop location | Account and wholesale-service delivery | Remove or anonymize within the 30-day deletion process; delete associated avatar and proof files | Product / operations |
| Cart, device tokens, notification history, negotiated quotes | Personalised app service and communications | Delete when the deletion request is completed | Product / operations |
| Authentication refresh tokens and active access | Account security | Revoke all refresh tokens and disable the account at completion; expired tokens are automatically purged | Engineering |
| Orders, invoices, payment proofs, payment transaction references, shipping records | Financial, tax, fraud-prevention, dispute, and warranty obligations | Keep in restricted finance/operations records for **8 financial years after the financial year of the transaction**, unless a longer legal hold applies. Remove from normal app access when the account is deleted. | Finance / operations |
| Product-view events and non-financial operational logs | Service performance and security | Keep no longer than **90 days**, then delete or aggregate so they no longer identify a user | Engineering |
| Deletion request audit record | Demonstrate privacy-rights handling and prevent repeated/abusive requests | Keep for **8 financial years** with access limited to authorised staff | Compliance / operations |
| Encrypted backups | Service recovery | Deleted/anonymized data must age out of backups within **90 days** of account-deletion completion. Restores must reapply completed-deletion records before users regain access. | Infrastructure |

## Backup controls

1. Backups that can include customer data must be encrypted and accessible only to authorised infrastructure personnel.
2. Every completed deletion request records `backupExpiryAt` as 90 days after completion.
3. Infrastructure owners must configure a lifecycle rule or documented recurring job to purge backup versions no later than that date.
4. A backup restore must first apply completed deletion requests whose `backupExpiryAt` has not passed, preventing a restored account from becoming usable again.
5. Backup expiry evidence (lifecycle configuration, job output, or provider audit logs) must be retained with the deletion request audit record.

## Required approval and verification

Before release, the business owner, finance owner, infrastructure owner, and legal/compliance reviewer must confirm that the schedule is accurate for the actual GST, invoice, payment-provider, storage-provider, and backup arrangements. Do not publish a conflicting retention statement or complete Apple/Google privacy forms until that review is complete.
