# Laxmi Agro data retention, backup, and deletion policy

**Status:** Internal implementation guidance. The business, finance, infrastructure, and legal owners must approve a complete retention schedule before detailed public retention commitments or store privacy declarations are published.

## Current deletion workflow

- A user may request account deletion in the app or on the public website.
- The request receives a due date 30 calendar days after submission.
- Staff must verify website-submitted requests before completing them.
- Completion revokes refresh tokens, disables the account, removes or anonymizes direct account data, and removes associated avatar and business-proof files.
- Orders and payment records remain restricted because they may be needed for financial, tax, payment, fraud-prevention, dispute, warranty, or other legal obligations.

## Current retention position

The repository does not implement or verify a backup lifecycle or backup-purge job. It must not promise a specific backup expiry period. Public policy text therefore states only that backup handling follows applicable operational and legal retention requirements.

## Required approval before more specific claims

Before setting any exact retention period or completing Apple/Google privacy declarations, the responsible owners must document and approve:

1. The legal entity/controller and privacy contact details.
2. The applicable retention periods for invoices, tax, orders, payments, fraud prevention, disputes, and warranties.
3. Each storage and backup provider, its data location, lifecycle configuration, restore process, and deletion evidence.
4. The actual timing and process for deleting, purging, or reapplying completed deletion requests to restored data.

Until that evidence exists, do not add a `backupExpiryAt` field, a fixed backup-deletion deadline, or a public claim that a specific backup purge process operates.
