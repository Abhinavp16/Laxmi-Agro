const { Product, StockLog, WebsiteSettings } = require('../../models');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const { paginate, formatPaginationResponse, generateSKU } = require('../../utils/helpers');
const { deleteImage } = require('../../config/cloudinary');
const { saveBuffer } = require('../../config/storage');
const { transliterateToHindi } = require('../../services/hindiTransliterationService');
const { PRODUCT_STATUS } = require('../../utils/constants');
const { updateProductCount } = require('../categoryController');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const slugify = require('slugify');
const { encode } = require('blurhash');
const {
  normalizeObjectIdLike,
  normalizeVariantsForPersistence,
  applyVariantSummaryToProduct,
  getVariantDisplayName,
} = require('../../utils/productVariants');
const {
  registerPriceChangeCampaign,
  clearPendingFields,
} = require('../../services/productPriceSchedulerService');

const PRICE_CHANGE_MODE_SCHEDULED = 'schedule_24h';
const PRICE_CHANGE_MODE_IMMEDIATE = 'immediate';
const PRICE_CHANGE_DELAY_MS = 24 * 60 * 60 * 1000;

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildVariantLookup(existingVariants = []) {
  const lookup = new Map();

  for (const variant of existingVariants) {
    const byId = normalizeObjectIdLike(variant?._id || variant?.id);
    const bySku = String(variant?.sku || '').trim().toUpperCase();

    if (byId) {
      lookup.set(`id:${byId}`, variant);
    }
    if (bySku) {
      lookup.set(`sku:${bySku}`, variant);
    }
  }

  return lookup;
}

function syncScheduledBasePrices(product, updateData, mode, scheduledAt, effectiveAt) {
  const hasRetailChange =
    updateData.retailPrice !== undefined &&
    Number(updateData.retailPrice) !== Number(product.retailPrice);
  const hasWholesaleChange =
    updateData.wholesalePrice !== undefined &&
    Number(updateData.wholesalePrice) !== Number(product.wholesalePrice);

  if (mode === PRICE_CHANGE_MODE_IMMEDIATE) {
    if (hasRetailChange || hasWholesaleChange) {
      clearPendingFields(updateData);
    } else {
      updateData.pendingRetailPrice = product.pendingRetailPrice ?? null;
      updateData.pendingWholesalePrice = product.pendingWholesalePrice ?? null;
      updateData.priceChangeScheduledAt = product.priceChangeScheduledAt ?? null;
      updateData.priceChangeEffectiveAt = product.priceChangeEffectiveAt ?? null;
    }
    return [];
  }

  if (!hasRetailChange && !hasWholesaleChange) {
    updateData.pendingRetailPrice = product.pendingRetailPrice ?? null;
    updateData.pendingWholesalePrice = product.pendingWholesalePrice ?? null;
    updateData.priceChangeScheduledAt = product.priceChangeScheduledAt ?? null;
    updateData.priceChangeEffectiveAt = product.priceChangeEffectiveAt ?? null;
    return [];
  }

  const nextPendingRetail = hasRetailChange
    ? Number(updateData.retailPrice)
    : numberOrNull(product.pendingRetailPrice);
  const nextPendingWholesale = hasWholesaleChange
    ? Number(updateData.wholesalePrice)
    : numberOrNull(product.pendingWholesalePrice);

  updateData.pendingRetailPrice = nextPendingRetail;
  updateData.pendingWholesalePrice = nextPendingWholesale;
  updateData.priceChangeScheduledAt = scheduledAt;
  updateData.priceChangeEffectiveAt = effectiveAt;

  if (hasRetailChange) {
    updateData.retailPrice = product.retailPrice;
  }
  if (hasWholesaleChange) {
    updateData.wholesalePrice = product.wholesalePrice;
  }

  return [{
    productId: product._id,
    productName: product.name,
    currentRetailPrice: product.retailPrice,
    newRetailPrice: nextPendingRetail,
    currentWholesalePrice: product.wholesalePrice,
    newWholesalePrice: nextPendingWholesale,
    effectiveAt,
  }];
}

function syncScheduledVariantPrices(product, incomingVariants, mode, scheduledAt, effectiveAt) {
  if (!Array.isArray(incomingVariants) || incomingVariants.length === 0) {
    return { variants: incomingVariants, notifications: [] };
  }

  const existingVariantLookup = buildVariantLookup(product.variants || []);
  const notifications = [];

  const variants = incomingVariants.map((variant) => {
    const variantId = normalizeObjectIdLike(variant?._id || variant?.id);
    const skuKey = String(variant?.sku || '').trim().toUpperCase();
    const existingVariant =
      (variantId && existingVariantLookup.get(`id:${variantId}`)) ||
      (skuKey && existingVariantLookup.get(`sku:${skuKey}`)) ||
      null;

    const nextVariant = {
      ...variant,
      _id: variantId || variant?._id,
    };

    if (!existingVariant) {
      clearPendingFields(nextVariant);
      return nextVariant;
    }

    const retailChanged = Number(variant.retailPrice) !== Number(existingVariant.retailPrice);
    const wholesaleChanged = Number(variant.wholesalePrice) !== Number(existingVariant.wholesalePrice);

    if (mode === PRICE_CHANGE_MODE_IMMEDIATE) {
      if (retailChanged || wholesaleChanged) {
        clearPendingFields(nextVariant);
      } else {
        nextVariant.pendingRetailPrice = existingVariant.pendingRetailPrice ?? null;
        nextVariant.pendingWholesalePrice = existingVariant.pendingWholesalePrice ?? null;
        nextVariant.priceChangeScheduledAt = existingVariant.priceChangeScheduledAt ?? null;
        nextVariant.priceChangeEffectiveAt = existingVariant.priceChangeEffectiveAt ?? null;
      }
      return nextVariant;
    }

    if (!retailChanged && !wholesaleChanged) {
      nextVariant.pendingRetailPrice = existingVariant.pendingRetailPrice ?? null;
      nextVariant.pendingWholesalePrice = existingVariant.pendingWholesalePrice ?? null;
      nextVariant.priceChangeScheduledAt = existingVariant.priceChangeScheduledAt ?? null;
      nextVariant.priceChangeEffectiveAt = existingVariant.priceChangeEffectiveAt ?? null;
      return nextVariant;
    }

    const nextPendingRetail = retailChanged
      ? Number(variant.retailPrice)
      : numberOrNull(existingVariant.pendingRetailPrice);
    const nextPendingWholesale = wholesaleChanged
      ? Number(variant.wholesalePrice)
      : numberOrNull(existingVariant.pendingWholesalePrice);

    nextVariant.pendingRetailPrice = nextPendingRetail;
    nextVariant.pendingWholesalePrice = nextPendingWholesale;
    nextVariant.priceChangeScheduledAt = scheduledAt;
    nextVariant.priceChangeEffectiveAt = effectiveAt;

    if (retailChanged) {
      nextVariant.retailPrice = existingVariant.retailPrice;
    }
    if (wholesaleChanged) {
      nextVariant.wholesalePrice = existingVariant.wholesalePrice;
    }

    notifications.push({
      productId: product._id,
      productName: product.name,
      variantId: existingVariant._id,
      variantName: getVariantDisplayName(product, existingVariant),
      currentRetailPrice: existingVariant.retailPrice,
      newRetailPrice: nextPendingRetail,
      currentWholesalePrice: existingVariant.wholesalePrice,
      newWholesalePrice: nextPendingWholesale,
      effectiveAt,
    });

    return nextVariant;
  });

  return { variants, notifications };
}

async function uploadFilesToStorage(files, folder = 'products') {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const webpBuffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
    const saved = await saveBuffer({
      buffer: webpBuffer,
      folder,
      filename: `${uuidv4()}.webp`,
      contentType: 'image/webp',
      metadata: { originalName: file.originalname },
    });

    // Generate BlurHash for preview
    let blurHash = null;
    try {
      const { data: pixels, info: { width, height } } = await sharp(file.buffer)
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: 'inside' })
        .toBuffer({ resolveWithObject: true });
      
      blurHash = encode(new Uint8ClampedArray(pixels), width, height, 4, 4);
    } catch (err) {
      console.error('Error generating blurhash:', err);
    }

    results.push({ url: saved.url, publicId: saved.publicId, blurHash });
  }
  return results;
}

function toLabelIdArray(labelIds = []) {
  if (Array.isArray(labelIds)) {
    return labelIds;
  }

  if (typeof labelIds === 'string') {
    const trimmed = labelIds.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_) {}

    return trimmed.split(',').map((value) => value.trim()).filter(Boolean);
  }

  return [];
}

async function normalizeProductLabelIds(labelIds = []) {
  const incomingValues = toLabelIdArray(labelIds)
    .map((value) => {
      if (value && typeof value === 'object') {
        return String(value.id || value.title || '').trim();
      }
      return String(value || '').trim();
    })
    .filter(Boolean);

  if (incomingValues.length === 0) {
    return [];
  }

  const settings = await WebsiteSettings.getSettings();
  const labels = Array.isArray(settings?.labels) ? settings.labels : [];

  const matchedIds = incomingValues
    .map((value) => {
      const normalizedValue = value.toLowerCase();
      const match = labels.find((label) => {
        const labelId = String(label?.id || '').trim().toLowerCase();
        const labelTitle = String(label?.title || '').trim().toLowerCase();
        return normalizedValue === labelId || normalizedValue === labelTitle;
      });

      if (!match) {
        return value;
      }

      const resolvedId = String(match.id || '').trim();
      return resolvedId || value;
    })
    .filter(Boolean);

  return [...new Set(matchedIds)];
}

function parseStructuredField(value, fallback) {
  if (typeof value !== 'string') return value ?? fallback;

  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function prepareProductData(productData) {
  const prepared = { ...productData };

  if (typeof prepared.specifications === 'string') {
    prepared.specifications = parseStructuredField(prepared.specifications, []);
  }
  if (typeof prepared.tags === 'string') {
    prepared.tags = parseStructuredField(prepared.tags, []);
  }
  if (typeof prepared.variants === 'string') {
    prepared.variants = parseStructuredField(prepared.variants, []);
  }

  prepared.variants = normalizeVariantsForPersistence(prepared.variants, prepared);
  if (prepared.variants.length > 0) {
    applyVariantSummaryToProduct(prepared);
  }

  return prepared;
}

function buildPriceChangeRow({
  product,
  scope,
  variant = null,
}) {
  const target = variant || product;
  const currentRetailPrice = Number(target.retailPrice ?? product.retailPrice ?? 0);
  const currentWholesalePrice = Number(target.wholesalePrice ?? product.wholesalePrice ?? 0);
  const newRetailPrice = target.pendingRetailPrice ?? null;
  const newWholesalePrice = target.pendingWholesalePrice ?? null;
  const scheduledAt = target.priceChangeScheduledAt || product.priceChangeScheduledAt || null;
  const effectiveAt = target.priceChangeEffectiveAt || product.priceChangeEffectiveAt || null;
  const productName = String(product.name || '').trim();
  const variantName = variant ? getVariantDisplayName(product, variant) : '';
  const searchText = [
    productName,
    product.sku,
    product.category,
    variantName,
    variant?.sku,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    id: scope === 'variant' ? `${product._id}:${variant?._id}` : String(product._id),
    productId: String(product._id),
    productName,
    productSku: String(product.sku || '').trim(),
    category: String(product.category || '').trim(),
    scope,
    variantId: variant?._id ? String(variant._id) : null,
    variantName,
    variantSku: String(variant?.sku || '').trim(),
    oldRetailPrice: currentRetailPrice,
    newRetailPrice,
    oldWholesalePrice: currentWholesalePrice,
    newWholesalePrice,
    scheduledAt,
    effectiveAt,
    searchText,
  };
}

exports.getProducts = async (req, res, next) => {
  try {
    const { status, category, search, sort } = req.query;
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: PRODUCT_STATUS.ARCHIVED };
    }
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption = { [field]: order === 'asc' ? 1 : -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      ...formatPaginationResponse(products, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.getPriceChanges = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const search = String(req.query.search || '').trim().toLowerCase();

    const products = await Product.find({
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
      .select('name sku category retailPrice wholesalePrice pendingRetailPrice pendingWholesalePrice priceChangeScheduledAt priceChangeEffectiveAt variants')
      .sort({ priceChangeEffectiveAt: 1, updatedAt: -1 })
      .lean();

    const rows = [];

    for (const product of products) {
      if (product.priceChangeEffectiveAt) {
        rows.push(buildPriceChangeRow({ product, scope: 'product' }));
      }

      for (const variant of product.variants || []) {
        if (!variant?.priceChangeEffectiveAt) continue;
        rows.push(buildPriceChangeRow({ product, variant, scope: 'variant' }));
      }
    }

    const filteredRows = search
      ? rows.filter((row) => row.searchText.includes(search))
      : rows;

    const paginatedRows = filteredRows.slice(skip, skip + limit);

    res.json({
      success: true,
      ...formatPaginationResponse(paginatedRows, filteredRows.length, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const productData = prepareProductData(req.body);

    if (!productData.sku && (!Array.isArray(productData.variants) || productData.variants.length === 0)) {
      productData.sku = generateSKU(productData.category, productData.name);
    }

    productData.slug = slugify(productData.name, { lower: true, strict: true });

    if (req.files && req.files.length > 0) {
      const uploaded = await uploadFilesToStorage(req.files, 'products');
      productData.images = uploaded.map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        isPrimary: index === 0,
        order: index,
      }));
    }

    if (productData.labelIds !== undefined) {
      productData.labelIds = await normalizeProductLabelIds(productData.labelIds);
    }

    const product = await Product.create(productData);
    if (product.category) {
      await updateProductCount(product.category);
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const previousCategory = product.category;
    const updateData = prepareProductData(req.body);
    const priceChangeMode = req.body.priceChangeMode || PRICE_CHANGE_MODE_SCHEDULED;
    const scheduledAt = new Date();
    const effectiveAt = new Date(scheduledAt.getTime() + PRICE_CHANGE_DELAY_MS);
    delete updateData.priceChangeMode;
    const scheduledNotifications = [];

    if (updateData.name && updateData.name !== product.name) {
      updateData.slug = slugify(updateData.name, { lower: true, strict: true });
    }

    if (req.files && req.files.length > 0) {
      const uploaded = await uploadFilesToStorage(req.files, 'products');
      const newImages = uploaded.map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        isPrimary: false,
        order: product.images.length + index,
      }));
      updateData.images = [...product.images, ...newImages];
    }

    if (updateData.labelIds !== undefined) {
      updateData.labelIds = await normalizeProductLabelIds(updateData.labelIds);
    }

    const hasIncomingVariants = Array.isArray(updateData.variants) && updateData.variants.length > 0;

    if (hasIncomingVariants) {
      updateData.pendingRetailPrice = product.pendingRetailPrice ?? null;
      updateData.pendingWholesalePrice = product.pendingWholesalePrice ?? null;
      updateData.priceChangeScheduledAt = product.priceChangeScheduledAt ?? null;
      updateData.priceChangeEffectiveAt = product.priceChangeEffectiveAt ?? null;
    } else {
      scheduledNotifications.push(
        ...syncScheduledBasePrices(product, updateData, priceChangeMode, scheduledAt, effectiveAt)
      );
    }

    if (Array.isArray(updateData.variants)) {
      const scheduledVariantState = syncScheduledVariantPrices(
        product,
        updateData.variants,
        priceChangeMode,
        scheduledAt,
        effectiveAt
      );
      updateData.variants = scheduledVariantState.variants;
      scheduledNotifications.push(...scheduledVariantState.notifications);
      if (updateData.variants.length > 0) {
        applyVariantSummaryToProduct(updateData);
      }
    }

    Object.assign(product, updateData);
    await product.save();

    if (priceChangeMode === PRICE_CHANGE_MODE_SCHEDULED && scheduledNotifications.length > 0) {
      await registerPriceChangeCampaign();
    }

    await Promise.all(
      [...new Set([previousCategory, product.category].filter(Boolean))].map((categorySlug) =>
        updateProductCount(categorySlug)
      )
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const previousCategory = product.category;
    product.status = 'archived';
    await product.save();
    if (previousCategory) {
      await updateProductCount(previousCategory);
    }

    res.json({
      success: true,
      message: 'Product archived successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { stock, adjustment, reason } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const previousStock = product.stock;
    let newStock;
    let action;
    let quantityChange;

    if (stock !== undefined) {
      // Absolute set
      newStock = Math.max(0, parseInt(stock));
      quantityChange = newStock - previousStock;
      action = 'manual_set';
    } else if (adjustment) {
      // Relative adjustment (+N or -N)
      const adjustmentValue = parseInt(adjustment);
      newStock = previousStock + adjustmentValue;
      if (newStock < 0) {
        throw new BadRequestError(
          `Cannot reduce stock below 0. Current: ${previousStock}, Adjustment: ${adjustmentValue}`,
          'STOCK_BELOW_ZERO'
        );
      }
      quantityChange = adjustmentValue;
      action = 'manual_adjust';
    } else {
      throw new BadRequestError('Provide stock or adjustment', 'MISSING_STOCK_PARAM');
    }

    // Atomic update with guard for adjustments
    if (action === 'manual_adjust' && quantityChange < 0) {
      const result = await Product.findOneAndUpdate(
        { _id: req.params.id, stock: { $gte: Math.abs(quantityChange) } },
        { $inc: { stock: quantityChange } },
        { new: true }
      );
      if (!result) {
        throw new BadRequestError(
          'Stock changed concurrently. Please refresh and retry.',
          'STOCK_RACE_CONDITION'
        );
      }
      newStock = result.stock;
    } else {
      if (action === 'manual_set') {
        product.stock = newStock;
      } else {
        product.stock = previousStock + quantityChange;
        newStock = product.stock;
      }
      await product.save();
    }

    await StockLog.create({
      productId: product._id,
      action,
      quantityChange,
      previousStock,
      newStock,
      reason: reason || `Manual ${action === 'manual_set' ? 'set to ' + newStock : 'adjustment ' + (quantityChange > 0 ? '+' : '') + quantityChange}`,
      performedBy: req.user._id,
    });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        productId: product._id,
        previousStock,
        newStock,
        change: quantityChange,
        reason,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getStockLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const query = { productId: req.params.id };

    const [logs, total] = await Promise.all([
      StockLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name')
        .populate('orderId', 'orderNumber')
        .lean(),
      StockLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      ...formatPaginationResponse(logs, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProductImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const imageIndex = product.images.findIndex(
      img => img._id.toString() === imageId || img.publicId === imageId
    );

    if (imageIndex === -1) {
      throw new NotFoundError('Image not found', 'IMAGE_NOT_FOUND');
    }

    const image = product.images[imageIndex];
    await deleteImage(image.publicId);

    product.images.splice(imageIndex, 1);

    if (image.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.generateMissingHindiNames = async (req, res, next) => {
  try {
    const requestedBatchSize = Number(req.body?.batchSize ?? req.query.batchSize ?? 0);
    const batchSize = Number.isFinite(requestedBatchSize) && requestedBatchSize > 0
      ? Math.min(requestedBatchSize, 5000)
      : 0;

    const query = {
      status: { $ne: PRODUCT_STATUS.ARCHIVED },
      $or: [
        { nameHindi: { $exists: false } },
        { nameHindi: null },
        { nameHindi: '' },
      ],
    };

    let finder = Product.find(query).select('_id name nameHindi').sort({ createdAt: 1 }).lean();
    if (batchSize > 0) {
      finder = finder.limit(batchSize);
    }

    const products = await finder;
    if (products.length === 0) {
      return res.json({
        success: true,
        message: 'No products require Hindi name conversion',
        data: {
          processed: 0,
          updated: 0,
          skipped: 0,
          failed: 0,
        },
      });
    }

    const updates = [];
    const failedProducts = [];
    let skipped = 0;

    const processProduct = async (product) => {
      const englishName = (product.name || '').trim();
      if (!englishName) {
        skipped += 1;
        failedProducts.push({
          id: product._id.toString(),
          reason: 'Missing English product name',
        });
        return;
      }

      try {
        const hindiName = await transliterateToHindi(englishName);
        if (!hindiName || !hindiName.trim() || hindiName.trim() === englishName) {
          skipped += 1;
          return;
        }

        updates.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $set: { nameHindi: hindiName.trim() } },
          },
        });
      } catch (error) {
        skipped += 1;
        failedProducts.push({
          id: product._id.toString(),
          name: englishName,
          reason: error.message || 'Transliteration failed',
        });
      }
    };

    // Small concurrency to avoid external API bursts while keeping execution reasonable.
    const concurrency = 5;
    for (let i = 0; i < products.length; i += concurrency) {
      const chunk = products.slice(i, i + concurrency);
      await Promise.all(chunk.map(processProduct));
    }

    if (updates.length > 0) {
      await Product.bulkWrite(updates, { ordered: false });
    }

    res.json({
      success: true,
      message: `Hindi name conversion completed. Updated ${updates.length} products.`,
      data: {
        processed: products.length,
        updated: updates.length,
        skipped,
        failed: failedProducts.length,
        failedProducts: failedProducts.slice(0, 20),
      },
    });
  } catch (error) {
    next(error);
  }
};
