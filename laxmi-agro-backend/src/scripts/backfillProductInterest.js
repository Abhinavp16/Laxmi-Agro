// One-time deploy step for lead watch-time tracking.
//
//   CONFIRM_PRODUCT_INTEREST_BACKFILL=yes  build leads (ProductInterest) from the
//                                          last LEAD_RETENTION_DAYS of analytics
//   CONFIRM_ANALYTICS_TTL_FIX=yes          replace the plain analytics timestamp
//                                          index with the 90-day TTL index so old
//                                          analytics rows are deleted
//
// Both steps are idempotent. Check the printed database name before confirming.
require('dotenv').config();

const mongoose = require('mongoose');
const { Analytics, ProductInterest } = require('../models');
const { ANALYTICS_EVENTS } = require('../utils/constants');
const { LEAD_RETENTION_DAYS, LEAD_ROLES } = require('../utils/leadInterest');

const ANALYTICS_TTL_SECONDS = 90 * 24 * 60 * 60;

async function backfillProductInterest({ now = new Date() } = {}) {
  const since = new Date(now.getTime() - LEAD_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const groups = await Analytics.aggregate([
    {
      $match: {
        userId: { $ne: null },
        timestamp: { $gte: since },
        eventType: { $in: [ANALYTICS_EVENTS.VIEW, ANALYTICS_EVENTS.CART_ADD] },
      },
    },
    {
      $group: {
        _id: { userId: '$userId', productId: '$productId' },
        viewCount: { $sum: { $cond: [{ $eq: ['$eventType', ANALYTICS_EVENTS.VIEW] }, 1, 0] } },
        firstViewedAt: { $min: { $cond: [{ $eq: ['$eventType', ANALYTICS_EVENTS.VIEW] }, '$timestamp', null] } },
        lastViewedAt: { $max: { $cond: [{ $eq: ['$eventType', ANALYTICS_EVENTS.VIEW] }, '$timestamp', null] } },
        lastCartAddAt: { $max: { $cond: [{ $eq: ['$eventType', ANALYTICS_EVENTS.CART_ADD] }, '$timestamp', null] } },
      },
    },
    { $match: { viewCount: { $gt: 0 } } },
    {
      $lookup: {
        from: 'users',
        localField: '_id.userId',
        foreignField: '_id',
        pipeline: [{ $project: { role: 1 } }],
        as: 'user',
      },
    },
    { $match: { 'user.role': { $in: LEAD_ROLES } } },
  ]);

  if (groups.length === 0) return { leads: 0, upserted: 0, updated: 0 };

  const result = await ProductInterest.bulkWrite(groups.map((group) => ({
    updateOne: {
      filter: { userId: group._id.userId, productId: group._id.productId },
      update: {
        $max: {
          viewCount: group.viewCount,
          lastViewedAt: group.lastViewedAt,
          ...(group.lastCartAddAt ? { lastCartAddAt: group.lastCartAddAt } : {}),
        },
        $min: { firstViewedAt: group.firstViewedAt },
        $setOnInsert: { totalWatchSeconds: 0 },
      },
      upsert: true,
    },
  })), { ordered: false });

  return { leads: groups.length, upserted: result.upsertedCount, updated: result.modifiedCount };
}

async function fixAnalyticsTtlIndex() {
  const indexes = await Analytics.collection.indexes();
  const plain = indexes.find((index) => (
    JSON.stringify(index.key) === JSON.stringify({ timestamp: 1 })
    && index.expireAfterSeconds === undefined
  ));
  if (plain) await Analytics.collection.dropIndex(plain.name);
  await Analytics.collection.createIndex({ timestamp: 1 }, { expireAfterSeconds: ANALYTICS_TTL_SECONDS });
  return { droppedPlainIndex: Boolean(plain) };
}

async function main() {
  const runBackfill = process.env.CONFIRM_PRODUCT_INTEREST_BACKFILL === 'yes';
  const runTtlFix = process.env.CONFIRM_ANALYTICS_TTL_FIX === 'yes';
  if (!runBackfill && !runTtlFix) {
    throw new Error('Nothing to do. Set CONFIRM_PRODUCT_INTEREST_BACKFILL=yes and/or CONFIRM_ANALYTICS_TTL_FIX=yes.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to database "${mongoose.connection.name}" on ${mongoose.connection.host}`);

  await ProductInterest.createIndexes();
  if (runBackfill) console.log('Lead backfill:', await backfillProductInterest());
  if (runTtlFix) console.log('Analytics TTL index:', await fixAnalyticsTtlIndex());
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = { backfillProductInterest, fixAnalyticsTtlIndex };
