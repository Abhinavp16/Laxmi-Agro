require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { User } = require('../models');
const { getStorage } = require('../config/firebase');
const { getSignedReadUrl, getStorageDriver } = require('../config/storage');

const auditManifestPath = path.resolve(
  process.cwd(),
  process.env.PRIVATE_MEDIA_AUDIT_OUTPUT || '.local/private-media-inventory.json'
);
const migrationManifestPath = path.resolve(
  process.cwd(),
  process.env.PRIVATE_MEDIA_MIGRATION_OUTPUT || '.local/private-media-migration.json'
);
const migrationMode = (process.env.PRIVATE_MEDIA_MIGRATION_MODE || 'migrate').trim().toLowerCase();

function serialise(value) {
  return JSON.stringify(value || []);
}

function sameStringArray(left, right) {
  return serialise(left) === serialise(right);
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`${label} was not found at ${filePath}. Run npm run media:audit-private first.`);
    }
    throw new Error(`Unable to read ${label}: ${error.message}`);
  }
}

async function writeMigrationManifest(manifest) {
  await fs.mkdir(path.dirname(migrationManifestPath), { recursive: true });
  await fs.writeFile(migrationManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function assertConfirmation() {
  if (process.env.CONFIRM_PRIVATE_MEDIA_MIGRATION !== '1') {
    throw new Error(
      'Refusing to modify storage or MongoDB. Re-run with CONFIRM_PRIVATE_MEDIA_MIGRATION=1 after backend/admin private-media delivery is deployed.'
    );
  }
}

function assertFirebaseStorage(bucket) {
  if (getStorageDriver() !== 'firebase' || !bucket) {
    throw new Error('FILE_STORAGE_DRIVER must resolve to firebase and Firebase Storage must be initialized.');
  }
}

function getReviewedProofEntries(inventory) {
  if (!Array.isArray(inventory.entries)) {
    throw new Error('The audit manifest has no entries array. Re-run the inventory command.');
  }

  const unresolved = inventory.entries.filter((entry) => entry.migrationStatus !== 'ready_for_copy');
  if (unresolved.length > 0) {
    throw new Error(`The audit manifest includes ${unresolved.length} unresolved entries. Resolve them before migration.`);
  }

  const unsupported = inventory.entries.filter(
    (entry) => entry.type !== 'business_proof' || entry.recordType !== 'User'
  );
  if (unsupported.length > 0) {
    throw new Error(
      `This release only migrates business proofs. The audit contains ${unsupported.length} avatar or payment-proof entry/entries that need their private delivery implementation first.`
    );
  }

  const entries = inventory.entries.map((entry) => ({ ...entry }));
  if (entries.length === 0) {
    throw new Error('The audit manifest has no business proofs to migrate.');
  }

  for (const entry of entries) {
    if (!entry.sourceKey || !entry.sourceUrl || !entry.targetKey) {
      throw new Error(`Incomplete audit entry for user ${entry.recordId}. Re-run the inventory command.`);
    }
    if (!entry.sourceKey.startsWith('proofs/') || !entry.targetKey.startsWith('private/proofs/')) {
      throw new Error(`Unexpected proof path for user ${entry.recordId}; do not migrate it automatically.`);
    }
  }

  return entries;
}

async function makeTargetPrivate(bucket, targetFile) {
  const [bucketMetadata] = await bucket.getMetadata();
  const uniformAccessEnabled = Boolean(
    bucketMetadata.iamConfiguration?.uniformBucketLevelAccess?.enabled
  );

  // With uniform bucket-level access, object ACLs are disabled and IAM controls access.
  // Otherwise remove inherited/public object ACLs before the database points at this copy.
  if (!uniformAccessEnabled) {
    await targetFile.makePrivate();
  }
}

async function copyAndVerify(bucket, entry) {
  const sourceFile = bucket.file(entry.sourceKey);
  const targetFile = bucket.file(entry.targetKey);
  const [sourceExists] = await sourceFile.exists();
  if (!sourceExists) {
    throw new Error(`Source object no longer exists: ${entry.sourceKey}`);
  }

  const [targetExists] = await targetFile.exists();
  if (!targetExists) {
    await sourceFile.copy(targetFile);
  }

  await makeTargetPrivate(bucket, targetFile);

  const [[sourceMetadata], [targetMetadata]] = await Promise.all([
    sourceFile.getMetadata(),
    targetFile.getMetadata(),
  ]);
  const sourceSize = Number(sourceMetadata.size);
  const targetSize = Number(targetMetadata.size);

  if (!Number.isFinite(sourceSize) || sourceSize < 0 || sourceSize !== targetSize) {
    throw new Error(`Size verification failed for ${entry.sourceKey}.`);
  }
  if (sourceMetadata.md5Hash && targetMetadata.md5Hash && sourceMetadata.md5Hash !== targetMetadata.md5Hash) {
    throw new Error(`Checksum verification failed for ${entry.sourceKey}.`);
  }

  const signedReadUrl = await getSignedReadUrl(entry.targetKey, 60);
  if (!signedReadUrl) {
    throw new Error(`Unable to generate an authorized read URL for ${entry.targetKey}.`);
  }

  const response = await fetch(signedReadUrl);
  if (!response.ok) {
    throw new Error(`Authorized read verification failed for ${entry.targetKey}: HTTP ${response.status}.`);
  }
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length !== sourceSize) {
    throw new Error(`Authorized read size verification failed for ${entry.targetKey}.`);
  }

  return {
    sourceSize,
    targetSize,
    md5Hash: targetMetadata.md5Hash || null,
    authorizedReadVerifiedAt: new Date().toISOString(),
  };
}

function groupEntriesByUser(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const group = groups.get(entry.recordId) || [];
    group.push(entry);
    groups.set(entry.recordId, group);
  }

  return [...groups.entries()].map(([userId, userEntries]) => ({
    userId,
    entries: userEntries.sort((left, right) => left.arrayIndex - right.arrayIndex),
  }));
}

async function updateDatabaseReferences(migrationManifest) {
  for (const group of groupEntriesByUser(migrationManifest.entries)) {
    const user = await User.findById(group.userId);
    if (!user) {
      throw new Error(`User ${group.userId} no longer exists; no database references were updated for this user.`);
    }

    const businessInfo = user.businessInfo?.toObject?.() || user.businessInfo || {};
    const expectedLegacyUrls = group.entries.map((entry) => entry.sourceUrl);
    const currentLegacyUrls = businessInfo.proofImages || [];
    const currentPrivateKeys = businessInfo.proofImageKeys || [];

    if (!sameStringArray(currentLegacyUrls, expectedLegacyUrls) || currentPrivateKeys.length > 0) {
      throw new Error(
        `Proof references for user ${group.userId} changed after the audit. Re-run the audit and start a new reviewed migration.`
      );
    }

    const previousBusinessInfo = {
      proofImages: [...currentLegacyUrls],
      proofImageKeys: [...currentPrivateKeys],
    };
    const targetKeys = group.entries.map((entry) => entry.targetKey);

    user.businessInfo = {
      ...businessInfo,
      proofImages: [],
      proofImageKeys: targetKeys,
    };
    await user.save();

    for (const entry of group.entries) {
      entry.migrationStatus = 'database_updated';
      entry.databaseUpdatedAt = new Date().toISOString();
      entry.previousBusinessInfo = previousBusinessInfo;
    }
    await writeMigrationManifest(migrationManifest);
  }
}

async function migrate() {
  const inventory = await readJson(auditManifestPath, 'Private-media audit manifest');
  const bucket = getStorage();
  assertFirebaseStorage(bucket);

  if (inventory.bucket !== bucket.name) {
    throw new Error(`Audit bucket ${inventory.bucket} does not match active bucket ${bucket.name}.`);
  }

  const entries = getReviewedProofEntries(inventory);
  const migrationManifest = {
    version: 1,
    mode: 'migrate',
    startedAt: new Date().toISOString(),
    completedAt: null,
    bucket: bucket.name,
    auditManifestPath,
    sourceManifestGeneratedAt: inventory.generatedAt,
    entries: entries.map((entry) => ({ ...entry, migrationStatus: 'pending' })),
  };
  await writeMigrationManifest(migrationManifest);

  for (const entry of migrationManifest.entries) {
    try {
      entry.copyVerification = await copyAndVerify(bucket, entry);
      entry.migrationStatus = 'copy_verified';
      entry.copyVerifiedAt = new Date().toISOString();
      await writeMigrationManifest(migrationManifest);
    } catch (error) {
      entry.migrationStatus = 'copy_failed';
      entry.failureReason = error.message;
      await writeMigrationManifest(migrationManifest);
      throw error;
    }
  }

  await updateDatabaseReferences(migrationManifest);
  migrationManifest.completedAt = new Date().toISOString();
  await writeMigrationManifest(migrationManifest);

  console.log('Private business-proof migration completed.', {
    outputPath: migrationManifestPath,
    migrated: migrationManifest.entries.length,
    sourceObjectsRetained: true,
  });
}

async function rollback() {
  const migrationManifest = await readJson(migrationManifestPath, 'Private-media migration manifest');
  const bucket = getStorage();
  assertFirebaseStorage(bucket);

  if (migrationManifest.bucket !== bucket.name) {
    throw new Error(`Migration bucket ${migrationManifest.bucket} does not match active bucket ${bucket.name}.`);
  }

  const updatedEntries = (migrationManifest.entries || []).filter(
    (entry) => entry.migrationStatus === 'database_updated'
  );
  if (updatedEntries.length === 0) {
    throw new Error('There are no database-updated entries available to roll back.');
  }

  for (const group of groupEntriesByUser(updatedEntries)) {
    const user = await User.findById(group.userId);
    if (!user) {
      throw new Error(`User ${group.userId} no longer exists; rollback stopped.`);
    }

    const businessInfo = user.businessInfo?.toObject?.() || user.businessInfo || {};
    const expectedPrivateKeys = group.entries.map((entry) => entry.targetKey);
    const previousBusinessInfo = group.entries[0].previousBusinessInfo;

    if (!previousBusinessInfo || !sameStringArray(businessInfo.proofImageKeys || [], expectedPrivateKeys)
      || (businessInfo.proofImages || []).length > 0) {
      throw new Error(
        `Proof references for user ${group.userId} changed after migration. Refusing to overwrite newer data during rollback.`
      );
    }

    user.businessInfo = {
      ...businessInfo,
      proofImages: previousBusinessInfo.proofImages || [],
      proofImageKeys: previousBusinessInfo.proofImageKeys || [],
    };
    await user.save();

    for (const entry of group.entries) {
      entry.rollbackStatus = 'database_restored';
      entry.rolledBackAt = new Date().toISOString();
    }
    await writeMigrationManifest(migrationManifest);
  }

  migrationManifest.rollbackCompletedAt = new Date().toISOString();
  await writeMigrationManifest(migrationManifest);
  console.log('Private business-proof database references restored. Private copies and original public sources were retained.', {
    outputPath: migrationManifestPath,
    restored: updatedEntries.length,
  });
}

async function run() {
  assertConfirmation();

  if (migrationMode === 'migrate') {
    await migrate();
    return;
  }
  if (migrationMode === 'rollback') {
    await rollback();
    return;
  }

  throw new Error(`Unsupported PRIVATE_MEDIA_MIGRATION_MODE: ${migrationMode}`);
}

run()
  .catch((error) => {
    console.error('Private media migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
    process.exit();
  });
