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

const sortVariants = () => [];

const hasRealVariants = () => false;

const getActiveVariants = (product = {}) => {
  return [];
};

const getAnyVariant = (product = {}) => {
  return null;
};

const getDefaultVariant = (product = {}) => {
  return getLegacyVariant(product);
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

  return {
    variant: getLegacyVariant(product),
    variantId: null,
    isLegacy: true,
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
    scope: 'product',
    targetRole: isWholesaler ? USER_ROLES.WHOLESALER : USER_ROLES.BUYER,
  };
};

const getVariantStock = (variant = {}) => toPositiveNumber(variant?.stock);

const getProductStockTotal = (product = {}) => {
  return toPositiveNumber(product?.stock);
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
  name: '',
  displayName: '',
  sku: '',
  attributes: [],
  packing: String(product?.packing || '').trim(),
  priceUnit: String(product?.priceUnit || '').trim(),
});

const normalizeVariantsForPersistence = (variants = [], product = {}) => {
  return [];
};

const applyVariantSummaryToProduct = (product = {}) => {
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
