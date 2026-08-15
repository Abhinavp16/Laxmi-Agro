# Private Firebase Media Migration Runbook

## Scope

This release migrates **wholesaler business-proof images** from legacy public Firebase Storage paths to private paths. It does not migrate customer avatars or manual payment screenshots yet, because those flows need their own authorized-delivery implementations first. Product and admin marketing images remain public and are out of scope.

## Safety rules

- Run the read-only inventory command first and review every entry.
- **Deploy the backend and admin private-media code before running the migration.** The migration removes legacy public proof URLs from MongoDB, so deployed code must convert the new private keys into signed URLs for administrators.
- The migration command requires `CONFIRM_PRIVATE_MEDIA_MIGRATION=1`; it never runs through the normal application server.
- Keep source objects intact through the rollback window. This command never deletes the old public copies and never changes bucket-wide IAM.
- Do not make a bucket-wide public-access/IAM change until every migrated record has a verified authorized read and the support owner signs off.
- Store the generated audit and migration manifests in the ignored `.local/` directory as operational evidence.

## Required deployment configuration

The deployed backend needs Firebase Admin credentials that can:

1. Read and create objects in the Firebase Storage bucket.
2. Create V4 signed read URLs. A service-account private key or an equivalent signing-capable Google identity is required.
3. Remove object ACLs when the bucket does not use uniform bucket-level access.

Set `FILE_STORAGE_DRIVER=firebase`. Optionally set `PRIVATE_MEDIA_SIGNED_URL_TTL_SECONDS`; it defaults to 900 seconds and is capped at 24 hours by the backend. No new public bucket URL, browser token, or mobile-app Firebase credential is needed.

Before migration, verify the bucket security posture:

- `private/` objects must not be anonymously readable.
- With uniform bucket-level access, bucket IAM must not grant `allUsers` read access.
- Without uniform bucket-level access, the migration removes inherited object ACLs from each new private copy.
- Existing `proofs/` source objects remain public only during the rollback window.

## Phase 1: Read-only inventory

Run against the intended environment:

```sh
npm run media:audit-private
```

The command writes `.local/private-media-inventory.json` unless `PRIVATE_MEDIA_AUDIT_OUTPUT` supplies a different path. Review that file and ensure every entry is a `business_proof` with `migrationStatus: "ready_for_copy"`. The current reviewed production inventory contains six business-proof records and no avatars or payment screenshots.

## Phase 2: Deploy secure delivery

1. Deploy the backend changes that store new uploads at `private/proofs/...` and return short-lived signed URLs only in authenticated admin customer responses.
2. Deploy the admin application.
3. In the deployed admin panel, submit a non-production test proof (or use a controlled staging account) and confirm only authenticated administrators can view it.
4. Confirm that an unauthenticated request cannot use an expired signed URL.
5. Keep the prior backend version available for rollback during the migration window.

Do not proceed to Phase 3 until this phase is complete.

## Phase 3: Copy, verify, and update MongoDB

Run the reviewed migration in the same environment that generated the audit manifest:

```sh
CONFIRM_PRIVATE_MEDIA_MIGRATION=1 npm run media:migrate-private
```

For every proof record, the command:

1. Copies `proofs/<userId>/...` to `private/proofs/<userId>/...`.
2. Makes the copied object private where object ACLs apply.
3. Verifies source/target size and checksum when available.
4. Generates and performs an authorized signed read of the private copy.
5. Confirms the MongoDB proof URL array still matches the reviewed audit snapshot.
6. Replaces the legacy proof URLs with private object keys only after all copies are verified.
7. Writes progress, original database values, and verification timestamps to `.local/private-media-migration.json`.

It refuses to run if there are unresolved audit entries, unsupported avatar/payment records, a bucket mismatch, changed proof records, missing source objects, or missing signed-read capability.

After the command succeeds, use the deployed admin panel to view every migrated proof document. The old public objects still exist, enabling a database-only rollback.

## Rollback

Before changing bucket IAM or deleting source objects, restore all migrated database references with:

```sh
CONFIRM_PRIVATE_MEDIA_MIGRATION=1 npm run media:rollback-private
```

The rollback verifies that no proof was changed after migration, restores the legacy proof URL array from the ignored migration manifest, and leaves both private copies and original public sources untouched. If a record has changed since migration, the command refuses to overwrite newer data; resolve that record manually with the manifest as evidence.

## Phase 4: Revoke public access and cleanup

Only after the agreed rollback window and a verified admin review:

1. Record an owner approval and preserve both manifests.
2. Remove anonymous public access from migrated legacy source objects or delete them in a separate, reviewed operation.
3. Verify anonymous reads fail for all sensitive source and private destination paths.
4. Retain the migration manifest, deployment version, validation evidence, and cleanup approval.

Do not revoke broader bucket public access until you have confirmed that unrelated public product/marketing images use separate paths and still work. This release intentionally does **not** automate cleanup or bucket-IAM changes.
