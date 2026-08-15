require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { User, Payment } = require('../models');
const { getStorage } = require('../config/firebase');
const { getStorageDriver } = require('../config/storage');

const outputPath = path.resolve(
  process.cwd(),
  process.env.PRIVATE_MEDIA_AUDIT_OUTPUT || '.local/private-media-inventory.json'
);

function storageKeyFromUrl(value, bucketName) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const publicPrefix = `https://storage.googleapis.com/${bucketName}/`;
  if (raw.startsWith(publicPrefix)) {
    return decodeURIComponent(raw.slice(publicPrefix.length));
  }

  return null;
}

function plannedPrivateKey(sourceKey) {
  return `private/${sourceKey.replace(/^private\//, '')}`;
}

async function addEntry(entries, bucket, entry) {
  const sourceExists = entry.sourceKey
    ? (await bucket.file(entry.sourceKey).exists())[0]
    : false;

  entries.push({
    ...entry,
    sourceExists,
    targetKey: entry.sourceKey ? plannedPrivateKey(entry.sourceKey) : null,
    migrationStatus: entry.sourceKey && sourceExists ? 'ready_for_copy' : 'needs_review',
  });
}

async function auditPrivateMediaMigration() {
  if (getStorageDriver() !== 'firebase') {
    throw new Error('FILE_STORAGE_DRIVER must resolve to firebase before auditing private media migration.');
  }

  await connectDB();
  const bucket = getStorage();
  if (!bucket) {
    throw new Error('Firebase Storage is not initialized. Check Firebase environment variables.');
  }

  const entries = [];
  const users = await User.find({
    $or: [
      { avatar: { $type: 'string', $ne: '' } },
      { 'businessInfo.proofImages.0': { $exists: true } },
    ],
  })
    .select('_id avatar businessInfo.proofImages')
    .lean();

  for (const user of users) {
    if (user.avatar) {
      await addEntry(entries, bucket, {
        type: 'avatar',
        recordType: 'User',
        recordId: String(user._id),
        sourceKey: storageKeyFromUrl(user.avatar, bucket.name),
        sourceUrl: user.avatar,
      });
    }

    for (const [index, proofUrl] of (user.businessInfo?.proofImages || []).entries()) {
      await addEntry(entries, bucket, {
        type: 'business_proof',
        recordType: 'User',
        recordId: String(user._id),
        arrayIndex: index,
        sourceKey: storageKeyFromUrl(proofUrl, bucket.name),
        sourceUrl: proofUrl,
      });
    }
  }

  const payments = await Payment.find({ screenshotUrl: { $type: 'string', $ne: '' } })
    .select('_id orderId userId screenshotUrl screenshotPublicId')
    .lean();

  for (const payment of payments) {
    await addEntry(entries, bucket, {
      type: 'payment_proof',
      recordType: 'Payment',
      recordId: String(payment._id),
      orderId: String(payment.orderId),
      userId: String(payment.userId),
      sourceKey: payment.screenshotPublicId || storageKeyFromUrl(payment.screenshotUrl, bucket.name),
      sourceUrl: payment.screenshotUrl,
    });
  }

  const summary = entries.reduce((result, entry) => {
    result.total += 1;
    result[entry.type] = (result[entry.type] || 0) + 1;
    result[entry.migrationStatus] = (result[entry.migrationStatus] || 0) + 1;
    return result;
  }, { total: 0, ready_for_copy: 0, needs_review: 0 });

  const manifest = {
    generatedAt: new Date().toISOString(),
    bucket: bucket.name,
    sourceDriver: getStorageDriver(),
    summary,
    entries,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log('Private media migration inventory written.', {
    outputPath,
    ...summary,
  });
}

auditPrivateMediaMigration()
  .catch((error) => {
    console.error('Private media migration inventory failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
    process.exit();
  });
