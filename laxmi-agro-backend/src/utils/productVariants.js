const { USER_ROLES } = require('./constants');

const normalizeObjectIdLike = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const toPositiveNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

const sortVariants = (variants = []) => [...variants].sort((a, b) => {
  const orderA = Number(a?.order ?? 0);
  const orderB = Number(b?.order ?? 0);
  if (orderA !== orderB) return orderA - orderB;
  return String(a?.name || '').localeCompare(String(b?.name || ''));
});

const hasRealVariants = (product = {}) => Array.isArray(product?.variants) && product.variants.length > 0;

const getActiveVariants = (product = {}) => {
  if (!hasRealVariants(product)) return [];

  return sortVariants(product.variants).filter((variant) => variant?.isActive !== false);
};

const getAnyVariant = (product = {}) => {
  const sorted = sortVariants(product?.variants || []);
  return sorted[0] || null;
};

const getDefaultVariant = (product = {}) => {
  const active = getActiveVariants(product);
  if (active.length > 0) return active[0];
  return getAnyVariant(product);
};

const getLegacyVariant = (product = {}) => ({
  _id: null,
  name: product?.name || 'Default',
  sku: product?.sku || '',
  attributes: [],
  mrp: toPositiveNumber(product?.mrp),
  retailPrice: toPositiveNumber(product?.retailPrice),
  wholesalePrice: toPositiveNumber(product?.wholesalePrice),
  stock: toPositiveNumber(product?.stock),
  lowStockThreshold: toPositiveNumber(product?.lowStockThreshold, 5),
  minOrderQuantity: toPositiveNumber(product?.minWholesaleQuantity, 1),
  priceUnit: product?.priceUnit || '',
  packing: product?.packing || '',
  isActive: true,
  order: 0,
});

const getVariantById = (product = {}, variantId) => {
  const normalizedVariantId = normalizeObjectIdLike(variantId);

  if (!hasRealVariants(product)) {
    if (!normalizedVariantId) {
      return {
        variant: getLegacyVariant(product),
        variantId: null,
        isLegacy: true,
      };
    }

    return null;
  }

  if (!normalizedVariantId) {
    const defaultVariant = getDefaultVariant(product);
    return defaultVariant
      ? {
          variant: defaultVariant,
          variantId: normalizeObjectIdLike(defaultVariant?._id),
          isLegacy: false,
        }
      : null;
  }

  const variant = (product.variants || []).find(
    (item) => normalizeObjectIdLike(item?._id) === normalizedVariantId
  );

  if (!variant) return null;

  return {
    variant,
    variantId: normalizedVariantId,
    isLegacy: false,
  };
};

const getPriceForUser = (product = {}, userRole = USER_ROLES.BUYER, variantInput = null) => {
  const variant = variantInput || getDefaultVariant(product) || getLegacyVariant(product);
  const isWholesaler = userRole === USER_ROLES.WHOLESALER;

  return {
    price: isWholesaler ? toPositiveNumber(variant?.wholesalePrice) : toPositiveNumber(variant?.retailPrice),
    mrp: toPositiveNumber(variant?.mrp),
    retailPrice: toPositiveNumber(variant?.retailPrice),
    wholesalePrice: toPositiveNumber(variant?.wholesalePrice),
    minWholesaleQuantity: toPositiveNumber(product?.minWholesaleQuantity, 1),
    negotiationEnabled: Boolean(product?.negotiationEnabled),
    canNegotiate: isWholesaler && Boolean(product?.negotiationEnabled),
  };
};

const getPendingPriceChangeForUser = (product = {}, userRole = USER_ROLES.BUYER, variantInput = null) => {
  const variant = variantInput || getDefaultVariant(product) || getLegacyVariant(product);
  const isWholesaler = userRole === USER_ROLES.WHOLESALER;
  const currentPrice = isWholesaler
    ? toPositiveNumber(variant?.wholesalePrice)
    : toPositiveNumber(variant?.retailPrice);
  const pendingPrice = isWholesaler
    ? variant?.pendingWholesalePrice
    : variant?.pendingRetailPrice;
  const effectiveAt = variant?.priceChangeEffectiveAt || product?.priceChangeEffectiveAt || null;
  const scheduledAt = variant?.priceChangeScheduledAt || product?.priceChangeScheduledAt || null;

  if (pendingPrice === null || pendingPrice === undefined || !effectiveAt) {
    return null;
  }

  const nextPrice = toPositiveNumber(pendingPrice);
  if (nextPrice === currentPrice) {
    return null;
  }

  return {
    currentPrice,
    newPrice: nextPrice,
    scheduledAt,
    effectiveAt,
    scope: variantInput ? 'variant' : 'product',
    targetRole: isWholesaler ? USER_ROLES.WHOLESALER : USER_ROLES.BUYER,
  };
};

const getVariantStock = (variant = {}) => toPositiveNumber(variant?.stock);

const getProductStockTotal = (product = {}) => {
  if (!hasRealVariants(product)) {
    return toPositiveNumber(product?.stock);
  }

  return getActiveVariants(product).reduce((sum, variant) => sum + getVariantStock(variant), 0);
};

const buildVariantAttributes = (attributes = []) => {
  if (!Array.isArray(attributes)) return [];

  return attributes
    .map((item) => ({
      key: String(item?.key || '').trim(),
      value: String(item?.value || '').trim(),
    }))
    .filter((item) => item.key && item.value);
};

const getVariantDisplayName = (product = {}, variant = {}) => {
  const baseName = String(product?.name || '').trim();
  const variantName = String(variant?.name || '').trim();

  if (!variantName || variantName.toLowerCase() === baseName.toLowerCase()) {
    return baseName || variantName;
  }

  return baseName ? `${baseName} - ${variantName}` : variantName;
};

const serializeVariantForUser = (product = {}, variant = {}, userRole = USER_ROLES.BUYER) => {
  const pricing = getPriceForUser(product, userRole, variant);
  const stock = getVariantStock(variant);
  const variantId = normalizeObjectIdLike(variant?._id);

  return {
    id: variantId,
    name: String(variant?.name || '').trim(),
    displayName: getVariantDisplayName(product, variant),
    sku: String(variant?.sku || '').trim(),
    attributes: buildVariantAttributes(variant?.attributes),
    mrp: pricing.mrp,
    price: pricing.price,
    retailPrice: pricing.retailPrice,
    wholesalePrice: pricing.wholesalePrice,
    stock,
    inStock: stock > 0,
    lowStockThreshold: toPositiveNumber(variant?.lowStockThreshold, 5),
    minOrderQuantity: toPositiveNumber(variant?.minOrderQuantity, 1),
    priceUnit: String(variant?.priceUnit || '').trim(),
    packing: String(variant?.packing || '').trim(),
    isActive: variant?.isActive !== false,
    order: Number(variant?.order || 0),
    pendingPriceChange: getPendingPriceChangeForUser(product, userRole, variant),
  };
};

const buildVariantSnapshot = (product = {}, variant = {}) => ({
  name: String(variant?.name || '').trim(),
  displayName: getVariantDisplayName(product, variant),
  sku: String(variant?.sku || '').trim(),
  attributes: buildVariantAttributes(variant?.attributes),
  packing: String(variant?.packing || '').trim(),
  priceUnit: String(variant?.priceUnit || '').trim(),
});

const normalizeVariantsForPersistence = (variants = [], product = {}) => {
  if (!Array.isArray(variants)) return [];

  return sortVariants(variants)
    .map((variant, index) => ({
      ...variant,
      name: String(variant?.name || '').trim(),
      sku: String(variant?.sku || '').trim().toUpperCase(),
      attributes: buildVariantAttributes(variant?.attributes),
      mrp: toPositiveNumber(variant?.mrp),
      retailPrice: toPositiveNumber(variant?.retailPrice),
      wholesalePrice: toPositiveNumber(variant?.wholesalePrice),
      stock: toPositiveNumber(variant?.stock),
      lowStockThreshold: toPositiveNumber(variant?.lowStockThreshold, product?.lowStockThreshold || 5),
      minOrderQuantity: toPositiveNumber(variant?.minOrderQuantity, 1),
      priceUnit: String(variant?.priceUnit || '').trim(),
      packing: String(variant?.packing || '').trim(),
      isActive: variant?.isActive !== false,
      order: Number(variant?.order ?? index),
    }))
    .filter((variant) => variant.name && variant.sku);
};

const applyVariantSummaryToProduct = (product = {}) => {
  if (!hasRealVariants(product)) {
    return product;
  }

  const activeVariants = getActiveVariants(product);
  const summarySource = activeVariants[0] || getAnyVariant(product);

  if (!summarySource) return product;

  product.sku = String(summarySource.sku || '').trim().toUpperCase();
  product.mrp = toPositiveNumber(summarySource.mrp);
  product.retailPrice = toPositiveNumber(summarySource.retailPrice);
  product.wholesalePrice = toPositiveNumber(summarySource.wholesalePrice);
  product.lowStockThreshold = toPositiveNumber(summarySource.lowStockThreshold, product.lowStockThreshold || 5);
  product.stock = activeVariants.reduce((sum, variant) => sum + getVariantStock(variant), 0);

  return product;
};

module.exports = {
  normalizeObjectIdLike,
  hasRealVariants,
  getActiveVariants,
  getDefaultVariant,
  getLegacyVariant,
  getVariantById,
  getPriceForUser,
  getPendingPriceChangeForUser,
  getVariantStock,
  getProductStockTotal,
  serializeVariantForUser,
  buildVariantSnapshot,
  normalizeVariantsForPersistence,
  applyVariantSummaryToProduct,
  getVariantDisplayName,
};
