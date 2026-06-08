const { Product, User, DeviceToken, Notification } = require('../models');
const logger = require('../utils/logger');
const { USER_ROLES, NOTIFICATION_TYPES } = require('../utils/constants');
const {
  applyVariantSummaryToProduct,
  getVariantDisplayName,
  hasRealVariants,
} = require('../utils/productVariants');
const notificationService = require('./notificationService');

const PRICE_CHANGE_POLL_INTERVAL_MS = 60 * 1000;

function formatMoney(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

function clearPendingFields(target) {
  target.pendingRetailPrice = null;
  target.pendingWholesalePrice = null;
  target.priceChangeScheduledAt = null;
  target.priceChangeEffectiveAt = null;
}

function buildPriceChangeLines(currentRetail, newRetail, currentWholesale, newWholesale) {
  const lines = [];

  if (newRetail !== null && newRetail !== undefined && Number(newRetail) !== Number(currentRetail)) {
    lines.push(`Customer ${formatMoney(currentRetail)} -> ${formatMoney(newRetail)}`);
  }

  if (newWholesale !== null && newWholesale !== undefined && Number(newWholesale) !== Number(currentWholesale)) {
    lines.push(`Wholesale ${formatMoney(currentWholesale)} -> ${formatMoney(newWholesale)}`);
  }

  return lines;
}

async function broadcastPriceChange(notification, data) {
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
  if (fcmTokens.length > 0) {
    try {
      await notificationService.sendToMultipleDevices(fcmTokens, notification, data);
    } catch (error) {
      logger.error('Failed to send price change push notification:', error);
    }
  }

  try {
    await Notification.insertMany(
      userIds.map((userId) => ({
        userId,
        title: notification.title,
        body: notification.body,
        type: data.type,
        data,
      }))
    );
  } catch (error) {
    logger.error('Failed to persist price change notifications:', error);
  }
}

async function notifyScheduledPriceChange({
  productId,
  productName,
  variantId = null,
  variantName = '',
  currentRetailPrice,
  newRetailPrice,
  currentWholesalePrice,
  newWholesalePrice,
  effectiveAt,
}) {
  const priceLines = buildPriceChangeLines(
    currentRetailPrice,
    newRetailPrice,
    currentWholesalePrice,
    newWholesalePrice
  );

  if (!priceLines.length) {
    return;
  }

  const targetName = variantName ? `${productName} (${variantName})` : productName;
  await broadcastPriceChange(
    {
      title: 'Price update scheduled',
      body: `${targetName} price will change in 24 hours. ${priceLines.join(' | ')}`,
    },
    {
      type: NOTIFICATION_TYPES.PRICE_CHANGE_SCHEDULED,
      productId: String(productId),
      variantId: variantId ? String(variantId) : '',
      currentRetailPrice: String(currentRetailPrice ?? ''),
      newRetailPrice: String(newRetailPrice ?? ''),
      currentWholesalePrice: String(currentWholesalePrice ?? ''),
      newWholesalePrice: String(newWholesalePrice ?? ''),
      effectiveAt: new Date(effectiveAt).toISOString(),
    }
  );
}

async function notifyActivatedPriceChange({
  productId,
  productName,
  variantId = null,
  variantName = '',
  currentRetailPrice,
  newRetailPrice,
  currentWholesalePrice,
  newWholesalePrice,
}) {
  const priceLines = buildPriceChangeLines(
    currentRetailPrice,
    newRetailPrice,
    currentWholesalePrice,
    newWholesalePrice
  );

  if (!priceLines.length) {
    return;
  }

  const targetName = variantName ? `${productName} (${variantName})` : productName;
  await broadcastPriceChange(
    {
      title: 'Price update is live',
      body: `${targetName} price is now updated. ${priceLines.join(' | ')}`,
    },
    {
      type: NOTIFICATION_TYPES.PRICE_CHANGE_ACTIVATED,
      productId: String(productId),
      variantId: variantId ? String(variantId) : '',
      currentRetailPrice: String(currentRetailPrice ?? ''),
      newRetailPrice: String(newRetailPrice ?? ''),
      currentWholesalePrice: String(currentWholesalePrice ?? ''),
      newWholesalePrice: String(newWholesalePrice ?? ''),
    }
  );
}

async function processDuePriceChanges() {
  const now = new Date();
  const dueProducts = await Product.find({
    $or: [
      { priceChangeEffectiveAt: { $lte: now } },
      { 'variants.priceChangeEffectiveAt': { $lte: now } },
    ],
  });

  for (const product of dueProducts) {
    const activationNotifications = [];
    let didChange = false;

    if (product.priceChangeEffectiveAt && product.priceChangeEffectiveAt <= now) {
      const nextRetail = product.pendingRetailPrice;
      const nextWholesale = product.pendingWholesalePrice;

      activationNotifications.push({
        productId: product._id,
        productName: product.name,
        currentRetailPrice: product.retailPrice,
        newRetailPrice: nextRetail,
        currentWholesalePrice: product.wholesalePrice,
        newWholesalePrice: nextWholesale,
      });

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

      activationNotifications.push({
        productId: product._id,
        productName: product.name,
        variantId: variant._id,
        variantName: getVariantDisplayName(product, variant),
        currentRetailPrice: variant.retailPrice,
        newRetailPrice: nextRetail,
        currentWholesalePrice: variant.wholesalePrice,
        newWholesalePrice: nextWholesale,
      });

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

    for (const payload of activationNotifications) {
      await notifyActivatedPriceChange(payload);
    }
  }
}

let schedulerHandle = null;

function startPriceChangeScheduler() {
  if (schedulerHandle) {
    return schedulerHandle;
  }

  schedulerHandle = setInterval(() => {
    processDuePriceChanges().catch((error) => {
      logger.error('Product price scheduler failed:', error);
    });
  }, PRICE_CHANGE_POLL_INTERVAL_MS);

  processDuePriceChanges().catch((error) => {
    logger.error('Initial product price scheduler run failed:', error);
  });

  return schedulerHandle;
}

module.exports = {
  startPriceChangeScheduler,
  processDuePriceChanges,
  notifyScheduledPriceChange,
  clearPendingFields,
};
