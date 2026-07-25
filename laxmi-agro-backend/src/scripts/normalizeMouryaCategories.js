require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const slugify = require('slugify');
const { Product, Category, Company } = require('../models');
const { PRODUCT_STATUS } = require('../utils/constants');

const APPLY_FLAG = '--apply';
const shouldApply = process.argv.includes(APPLY_FLAG);

const MOURYA_CATEGORY_NAMES = [
  'Mourya Sub V-3 13 Feet',
  'Mourya Sub V-4 20 Feet',
  'Mourya Sub V-4 20 Feet Lota Body',
  'Mourya Sub V-5 25 Feet',
  'Mourya Sub V-6 30 Feet',
  'Mourya Sub V-6 50 Feet',
];

const makeSlug = (value) => slugify(value, { lower: true, strict: true });

async function buildPlan() {
  const mourya = await Company.findOne({ slug: 'mourya' }).select('_id name slug').lean();
  if (!mourya) throw new Error('MOURYA company was not found');

  const [existingCategories, matchingProducts] = await Promise.all([
    Category.find({
      company: mourya._id,
      $or: [
        { name: { $in: MOURYA_CATEGORY_NAMES } },
        { slug: { $in: MOURYA_CATEGORY_NAMES.map(makeSlug) } },
      ],
    }).select('_id name slug showOnWebsite isActive productCount').lean(),
    Product.find({
      company: mourya._id,
      category: { $in: MOURYA_CATEGORY_NAMES },
    }).select('_id name sku category categoryRef status').lean(),
  ]);

  const categoryByKey = new Map();
  for (const category of existingCategories) {
    categoryByKey.set(String(category.name).toLowerCase(), category);
    categoryByKey.set(String(category.slug).toLowerCase(), category);
  }

  const productsByCategory = new Map(MOURYA_CATEGORY_NAMES.map((name) => [name, []]));
  for (const product of matchingProducts) {
    productsByCategory.get(product.category)?.push(product);
  }

  const targets = MOURYA_CATEGORY_NAMES.map((name) => {
    const existing = categoryByKey.get(name.toLowerCase()) || categoryByKey.get(makeSlug(name));
    const products = productsByCategory.get(name) || [];
    const activeProductCount = products.filter((product) => product.status === PRODUCT_STATUS.ACTIVE).length;
    const nonArchivedProductCount = products.filter((product) => product.status !== PRODUCT_STATUS.ARCHIVED).length;

    return {
      name,
      slug: makeSlug(name),
      existing,
      products,
      activeProductCount,
      nonArchivedProductCount,
    };
  });

  return { mourya, targets };
}

function writeBackup(plan) {
  const backup = {
    createdAt: new Date().toISOString(),
    company: plan.mourya,
    categories: plan.targets.map((target) => ({
      name: target.name,
      existingCategory: target.existing || null,
      products: target.products.map((product) => ({
        id: String(product._id),
        name: product.name,
        sku: product.sku,
        category: product.category,
        categoryRef: product.categoryRef ? String(product.categoryRef) : null,
        status: product.status,
      })),
    })),
  };
  const backupPath = path.join(
    os.tmpdir(),
    `laxmi-agro-mourya-category-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  return backupPath;
}

async function applyPlan(plan) {
  for (const target of plan.targets) {
    if (!target.existing) {
      const category = await Category.create({
        name: target.name,
        slug: target.slug,
        company: plan.mourya._id,
        description: '',
        image: { url: null, publicId: null, blurHash: null },
        parent: null,
        order: 0,
        isActive: true,
        // Preserve the existing Mourya website-visibility decision.
        showOnWebsite: false,
        productCount: target.nonArchivedProductCount,
      });
      target.existing = category.toObject();
    } else {
      await Category.updateOne(
        { _id: target.existing._id },
        { $set: { productCount: target.nonArchivedProductCount } },
      );
    }

    const categoryId = target.existing._id;
    await Product.updateMany(
      {
        company: plan.mourya._id,
        category: target.name,
        categoryRef: { $ne: categoryId },
      },
      { $set: { categoryRef: categoryId } },
    );
  }
}

async function verifyPlan(plan) {
  const targetNames = plan.targets.map((target) => target.name);
  const categories = await Category.find({
    company: plan.mourya._id,
    name: { $in: targetNames },
  }).select('_id name slug isActive showOnWebsite productCount').lean();
  const categoryByName = new Map(categories.map((category) => [category.name, category]));

  const products = await Product.find({
    company: plan.mourya._id,
    category: { $in: targetNames },
  }).select('_id category categoryRef status').lean();

  const unresolvedProducts = products.filter((product) => {
    const category = categoryByName.get(product.category);
    return !category || String(product.categoryRef || '') !== String(category._id);
  });

  if (categories.length !== MOURYA_CATEGORY_NAMES.length) {
    throw new Error(`Expected ${MOURYA_CATEGORY_NAMES.length} Mourya Category documents; found ${categories.length}`);
  }
  if (unresolvedProducts.length > 0) {
    throw new Error(`${unresolvedProducts.length} Mourya products are not linked to their Category document`);
  }

  return {
    categoryCount: categories.length,
    productCount: products.length,
    activeProductCount: products.filter((product) => product.status === PRODUCT_STATUS.ACTIVE).length,
    categories: categories.map((category) => ({
      name: category.name,
      slug: category.slug,
      isActive: category.isActive,
      showOnWebsite: category.showOnWebsite,
      productCount: category.productCount,
    })),
  };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  console.log(shouldApply ? 'Applying Mourya category normalization' : 'Running dry-run only');

  const plan = await buildPlan();
  const backupPath = writeBackup(plan);

  console.log(`MOURYA category records to create: ${plan.targets.filter((target) => !target.existing).length}`);
  console.log(`Matching MOURYA products: ${plan.targets.reduce((total, target) => total + target.products.length, 0)}`);
  for (const target of plan.targets) {
    console.log(`${target.name}: ${target.products.length} products (${target.activeProductCount} active), ${target.existing ? 'reuse existing category' : 'create category'}`);
  }
  console.log(`Backup written: ${backupPath}`);

  if (!shouldApply) {
    console.log(`Dry run only. Re-run with ${APPLY_FLAG} to update the database.`);
    return;
  }

  await applyPlan(plan);
  const verification = await verifyPlan(plan);
  console.log(JSON.stringify({ success: true, ...verification }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
