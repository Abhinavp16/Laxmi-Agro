const { Product, User, DeviceToken, Notification, PriceChangeCampaign } = require('../models');
const logger = require('../utils/logger');
const { USER_ROLES, NOTIFICATION_TYPES, PRODUCT_STATUS } = require('../utils/constants');
const {
  applyVariantSummaryToProduct,
  hasRealVariants,
} = require('../utils/productVariants');
const notificationService = require('./notificationService');

const PRICE_CHANGE_POLL_INTERVAL_MS = 60 * 1000;

const CAMPAIGN_STAGES = [
  {
    key: NOTIFICATION_TYPES.PRICE_CHANGE_CAMPAIGN_STARTED,
    thresholdMs: 24 * 60 * 60 * 1000,
    title: 'Price update scheduled',
    body: 'New prices will apply after 24 hours.',
  },
  {
    key: NOTIFICATION_TYPES.PRICE_CHANGE_CAMPAIGN_12H,
    thresholdMs: 12 * 60 * 60 * 1000,
    title: 'Price update reminder',
    body: 'Most product prices will update in 12 hours.',
  },
  {
    key: NOTIFICATION_TYPES.PRICE_CHANGE_CAMPAIGN_6H,
    thresholdMs: 6 * 60 * 60 * 1000,
    title: 'Price update reminder',
    body: 'Most product prices will update in 6 hours.',
  },
  {
    key: NOTIFICATION_TYPES.PRICE_CHANGE_CAMPAIGN_20M,
    thresholdMs: 20 * 60 * 1000,
    title: 'Price update reminder',
    body: 'Prices on many products will update in 20 minutes.',
  },
];

const FINAL_STAGE = {
  key: NOTIFICATION_TYPES.PRICE_CHANGE_CAMPAIGN_APPLIED,
  title: 'Prices updated',
  body: 'New prices are now applied.',
};

function clearPendingFields(target) {
  target.pendingRetailPrice = null;
  target.pendingWholesalePrice = null;
  target.priceChangeScheduledAt = null;
  target.priceChangeEffectiveAt = null;
}

async function fetchScheduledProducts() {
  return Product.find({
    status: { $ne: PRODUCT_STATUS.ARCHIVED },
    $or: [
      { priceChangeEffectiveAt: { $ne: null } },
      {
        variants: {
          $elemMatch: {
            priceChangeEffectiveAt: { $ne: null },
          },
        },
      },
    ],
  })
    .select('_id orderCount purchaseCountMax priceChangeEffectiveAt variants')
    .lean();
}

function computeCampaignEffectiveAt(products = []) {
  let maxTimestamp = null;

  for (const product of products) {
    const timestamps = [];
    if (product?.priceChangeEffectiveAt) {
      timestamps.push(new Date(product.priceChangeEffectiveAt).getTime());
    }

    for (const variant of product?.variants || []) {
      if (variant?.priceChangeEffectiveAt) {
        timestamps.push(new Date(variant.priceChangeEffectiveAt).getTime());
      }
    }

    for (const timestamp of timestamps) {
      if (!Number.isFinite(timestamp)) continue;
      if (maxTimestamp === null || timestamp > maxTimestamp) {
        maxTimestamp = timestamp;
      }
    }
  }

  return maxTimestamp === null ? null : new Date(maxTimestamp);
}

function pickRepresentativeProductIds(products = []) {
  const normalized = products.map((product) => ({
    id: String(product._id),
    score: Number(product.orderCount || product.purchaseCountMax || 0),
  }));

  const topSelling = [...normalized]
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((item) => item.id);

  const remaining = normalized
    .filter((item) => !topSelling.includes(item.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((item) => item.id);

  return [...new Set([...topSelling, ...remaining])];
}

async function broadcastCampaignNotification(stage, campaign) {
  const appUsers = await User.find({
    role: { $in: [USER_ROLES.BUYER, USER_ROLES.WHOLESALER] },
  }).select('_id');

  if (!appUsers.length) {
    return;
  }

  const userIds = appUsers.map((user) => user._id);
  const tokens = await DeviceToken.find({
    userId: { $in: userIds },
    isActive: true,
  }).select('fcmToken');

  const fcmTokens = [...new Set(tokens.map((token) => token.fcmToken).filter(Boolean))];
  const notification = {
    title: stage.title,
    body: stage.body,
  };
  const data = {
    type: stage.key,
    campaignId: String(campaign._id),
    effectiveAt: campaign.effectiveAt ? new Date(campaign.effectiveAt).toISOString() : '',
  };

  if (fcmTokens.length > 0) {
    try {
      await notificationService.sendToMultipleDevices(
        fcmTokens,
        notification,
        data,
        {
          androidDataOnly: true,
        }
      );
    } catch (error) {
      logger.error('Failed to send price campaign notification:', error);
    }
  }

  try {
    await Notification.insertMany(
      userIds.map((userId) => ({
        userId,
        title: notification.title,
        body: notification.body,
        type: stage.key,
        data,
      }))
    );
  } catch (error) {
    logger.error('Failed to persist price campaign notifications:', error);
  }
}

async function getActiveCampaign() {
  return PriceChangeCampaign.findOne({ status: 'active' }).sort({ createdAt: -1 });
}

async function registerPriceChangeCampaign() {
  const scheduledProducts = await fetchScheduledProducts();
  if (!scheduledProducts.length) {
    return null;
  }

  const effectiveAt = computeCampaignEffectiveAt(scheduledProducts);
  if (!effectiveAt) {
    return null;
  }

  const includedProductIds = [...new Set(scheduledProducts.map((product) => String(product._id)))];
  const representativeProductIds = pickRepresentativeProductIds(scheduledProducts);
  let campaign = await getActiveCampaign();

  if (!campaign) {
    campaign = await PriceChangeCampaign.create({
      status: 'active',
      startAt: new Date(),
      effectiveAt,
      includedProductIds,
      representativeProductIds,
      sentStages: [],
      lastMergedAt: new Date(),
    });
  } else {
    campaign.effectiveAt = effectiveAt;
    campaign.includedProductIds = includedProductIds;
    campaign.representativeProductIds = representativeProductIds;
    campaign.lastMergedAt = new Date();
    await campaign.save();
  }

  await sendDueCampaignStages();
  return campaign;
}

async function sendDueCampaignStages() {
  const campaign = await getActiveCampaign();
  if (!campaign) {
    return;
  }

  const now = Date.now();
  const effectiveAt = new Date(campaign.effectiveAt).getTime();
  const remainingMs = effectiveAt - now;
  const sentStages = new Set(campaign.sentStages || []);

  for (const stage of CAMPAIGN_STAGES) {
    if (sentStages.has(stage.key)) {
      continue;
    }

    const shouldSend =
      stage.key === NOTIFICATION_TYPES.PRICE_CHANGE_CAMPAIGN_STARTED
        ? true
        : remainingMs <= stage.thresholdMs;

    if (!shouldSend) {
      continue;
    }

    await broadcastCampaignNotification(stage, campaign);
    campaign.sentStages = [...new Set([...(campaign.sentStages || []), stage.key])];
    await campaign.save();
  }
}

async function finalizeCompletedCampaignIfNeeded() {
  const campaign = await getActiveCampaign();
  if (!campaign) {
    return;
  }

  const scheduledProducts = await fetchScheduledProducts();
  if (scheduledProducts.length > 0) {
    campaign.includedProductIds = [...new Set(scheduledProducts.map((product) => String(product._id)))];
    campaign.representativeProductIds = pickRepresentativeProductIds(scheduledProducts);
    const effectiveAt = computeCampaignEffectiveAt(scheduledProducts);
    if (effectiveAt) {
      campaign.effectiveAt = effectiveAt;
    }
    campaign.lastMergedAt = new Date();
    await campaign.save();
    return;
  }

  const sentStages = new Set(campaign.sentStages || []);
  if (!sentStages.has(FINAL_STAGE.key)) {
    await broadcastCampaignNotification(FINAL_STAGE, campaign);
    campaign.sentStages = [...new Set([...(campaign.sentStages || []), FINAL_STAGE.key])];
  }

  campaign.status = 'completed';
  campaign.completedAt = new Date();
  await campaign.save();
}

async function processDuePriceChanges() {
  const now = new Date();
  const dueProducts = await Product.find({
    $or: [
      { priceChangeEffectiveAt: { $lte: now } },
      {
        variants: {
          $elemMatch: {
            priceChangeEffectiveAt: { $lte: now },
          },
        },
      },
    ],
  });

  for (const product of dueProducts) {
    let didChange = false;

    if (product.priceChangeEffectiveAt && product.priceChangeEffectiveAt <= now) {
      const nextRetail = product.pendingRetailPrice;
      const nextWholesale = product.pendingWholesalePrice;

      if (nextRetail !== null && nextRetail !== undefined) {
        product.retailPrice = nextRetail;
      }
      if (nextWholesale !== null && nextWholesale !== undefined) {
        product.wholesalePrice = nextWholesale;
      }

      clearPendingFields(product);
      didChange = true;
    }

    for (const variant of product.variants || []) {
      if (!variant.priceChangeEffectiveAt || variant.priceChangeEffectiveAt > now) {
        continue;
      }

      const nextRetail = variant.pendingRetailPrice;
      const nextWholesale = variant.pendingWholesalePrice;

      if (nextRetail !== null && nextRetail !== undefined) {
        variant.retailPrice = nextRetail;
      }
      if (nextWholesale !== null && nextWholesale !== undefined) {
        variant.wholesalePrice = nextWholesale;
      }

      clearPendingFields(variant);
      didChange = true;
    }

    if (!didChange) {
      continue;
    }

    if (hasRealVariants(product)) {
      applyVariantSummaryToProduct(product);
    }

    await product.save();
  }
}

async function runPriceSchedulerTick() {
  await processDuePriceChanges();
  await registerPriceChangeCampaign();
  await finalizeCompletedCampaignIfNeeded();
}

let schedulerHandle = null;

function startPriceChangeScheduler() {
  if (schedulerHandle) {
    return schedulerHandle;
  }

  schedulerHandle = setInterval(() => {
    runPriceSchedulerTick().catch((error) => {
      logger.error('Product price scheduler failed:', error);
    });
  }, PRICE_CHANGE_POLL_INTERVAL_MS);

  runPriceSchedulerTick().catch((error) => {
    logger.error('Initial product price scheduler run failed:', error);
  });

  return schedulerHandle;
}

module.exports = {
  startPriceChangeScheduler,
  processDuePriceChanges,
  registerPriceChangeCampaign,
  clearPendingFields,
};
