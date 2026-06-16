require('dotenv').config();

const mongoose = require('mongoose');
const Product = require('../models/Product');
const WebsiteSettings = require('../models/WebsiteSettings');

const isDryRun = process.argv.includes('--dry-run');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickSourceVariant = (variants = []) => {
  if (!Array.isArray(variants) || variants.length === 0) return null;

  const sorted = [...variants].sort((left, right) => {
    const leftOrder = Number(left?.order ?? 0);
    const rightOrder = Number(right?.order ?? 0);
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return String(left?.name || '').localeCompare(String(right?.name || ''));
  });

  return sorted.find((variant) => variant?.isActive !== false) || sorted[0] || null;
};

const buildProductUpdate = (product) => {
  const source = pickSourceVariant(product.variants);
  const update = { variants: [] };

  if (!source) return update;

  update.sku = String(source.sku || product.sku || '').trim().toUpperCase();
  update.mrp = toNumber(source.mrp, toNumber(product.mrp));
  update.retailPrice = toNumber(source.retailPrice, toNumber(product.retailPrice));
  update.wholesalePrice = toNumber(source.wholesalePrice, toNumber(product.wholesalePrice));
  update.stock = toNumber(source.stock, toNumber(product.stock));
  update.lowStockThreshold = toNumber(source.lowStockThreshold, toNumber(product.lowStockThreshold, 5));
  update.priceUnit = String(source.priceUnit || product.priceUnit || '').trim();
  update.packing = String(source.packing || product.packing || '').trim();

  if (source.pendingRetailPrice !== undefined) update.pendingRetailPrice = source.pendingRetailPrice;
  if (source.pendingWholesalePrice !== undefined) update.pendingWholesalePrice = source.pendingWholesalePrice;
  if (source.priceChangeScheduledAt !== undefined) update.priceChangeScheduledAt = source.priceChangeScheduledAt;
  if (source.priceChangeEffectiveAt !== undefined) update.priceChangeEffectiveAt = source.priceChangeEffectiveAt;

  return update;
};

const stripWebsiteVariants = (settings) => {
  let changed = false;
  const productCategories = (settings.productCategories || []).map((category) => {
    const nextCategory = category.toObject ? category.toObject() : { ...category };
    nextCategory.productDetails = (nextCategory.productDetails || []).map((product) => {
      if (Array.isArray(product?.variants) && product.variants.length > 0) changed = true;
      const { variants, ...nextProduct } = product;
      return nextProduct;
    });
    return nextCategory;
  });

  const featuredProducts = (settings.featuredProducts || []).map((product) => {
    const nextProduct = product.toObject ? product.toObject() : { ...product };
    if (Array.isArray(nextProduct.variants) && nextProduct.variants.length > 0) changed = true;
    delete nextProduct.variants;
    return nextProduct;
  });

  return { changed, productCategories, featuredProducts };
};

async function dropVariantSkuIndex() {
  try {
    await Product.collection.dropIndex('variants.sku_1');
    console.log('Dropped products variants.sku_1 index');
  } catch (error) {
    if (error?.codeName === 'IndexNotFound' || /index not found/i.test(error.message)) {
      console.log('products variants.sku_1 index was not present');
      return;
    }
    throw error;
  }
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  console.log(isDryRun ? 'Running dry-run only' : 'Applying product variant removal');

  const products = await Product.find({}).select('+variants');
  let productsWithVariants = 0;
  let productsUpdated = 0;

  for (const product of products) {
    const variantCount = Array.isArray(product.variants) ? product.variants.length : 0;
    if (variantCount > 0) productsWithVariants += 1;

    const update = buildProductUpdate(product);
    const shouldUpdate = variantCount > 0 || !Array.isArray(product.variants);
    if (!shouldUpdate) continue;

    console.log(`${isDryRun ? '[dry-run]' : '[update]'} ${product.name} (${product._id}) variants=${variantCount} sku=${update.sku || product.sku}`);

    if (!isDryRun) {
      await Product.updateOne({ _id: product._id }, { $set: update });
    }
    productsUpdated += 1;
  }

  const settings = await WebsiteSettings.findOne({});
  let websiteSettingsUpdated = false;
  if (settings) {
    const stripped = stripWebsiteVariants(settings);
    websiteSettingsUpdated = stripped.changed;
    if (stripped.changed) {
      console.log(`${isDryRun ? '[dry-run]' : '[update]'} strip website product variants`);
      if (!isDryRun) {
        settings.productCategories = stripped.productCategories;
        settings.featuredProducts = stripped.featuredProducts;
        await settings.save();
      }
    }
  }

  if (!isDryRun) {
    await dropVariantSkuIndex();
  }

  console.log(JSON.stringify({
    dryRun: isDryRun,
    totalProducts: products.length,
    productsWithVariants,
    productsUpdated,
    websiteSettingsUpdated,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
