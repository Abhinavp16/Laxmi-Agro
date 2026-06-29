require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const slugify = require('slugify');
const { Product, Category, Company } = require('../models');

const APPLY_FLAG = '--apply';
const shouldApply = process.argv.includes(APPLY_FLAG);

const SHIVNATH_PUMP_CATEGORIES = [
  { oldName: 'SUB V-3 13 FEET', name: 'Shivnath Sub V-3 13 Feet' },
  { oldName: 'SUB V-4 20 FEET', name: 'Shivnath Sub V-4 20 Feet' },
  { oldName: 'SUB V-4 20 FEET (LOTA BODY)', name: 'Shivnath Sub V-4 20 Feet Lota Body' },
  { oldName: 'SUB V-5 25 FEET', name: 'Shivnath Sub V-5 25 Feet Q Type' },
  { oldName: 'SUB V-6 30 FEET', name: 'Shivnath Sub V-6 30 Feet K Type' },
  { oldName: null, name: 'Shivnath Sub V-6 30 Feet Q Type' },
  { oldName: 'SUB V-6 50 FEET', name: 'Shivnath Sub V-6 50 Feet' },
];

const STALE_SHIVNATH_PUMP_NAMES = SHIVNATH_PUMP_CATEGORIES
  .map((category) => category.oldName)
  .filter(Boolean);

const normalizeSpaces = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const makeSlug = (value) => slugify(value, { lower: true, strict: true });
const stripPumpType = (value = '') => normalizeSpaces(value.replace(/\s+(K|Q)\s+TYPE\b/gi, ''));

const getNextProductCategory = (product) => {
  const category = normalizeSpaces(product.category);
  const name = normalizeSpaces(product.name).toUpperCase();

  if (category === 'Shivnath Sub V-5 25 Feet') return 'Shivnath Sub V-5 25 Feet Q Type';
  if (category === 'Shivnath Sub V-5 25 Feet Q Type') return category;

  if (category === 'Shivnath Sub V-6 30 Feet') {
    return name.includes(' Q TYPE') ? 'Shivnath Sub V-6 30 Feet Q Type' : 'Shivnath Sub V-6 30 Feet K Type';
  }

  if (category === 'Shivnath Sub V-6 30 Feet K Type' || category === 'Shivnath Sub V-6 30 Feet Q Type') {
    return category;
  }

  return null;
};

const findReusableCategory = (categories, companyId, target) => {
  const names = [target.name, target.oldName].filter(Boolean).map((name) => name.toLowerCase());
  return categories.find((category) => (
    String(category.company) === String(companyId)
    && names.includes(String(category.name || '').toLowerCase())
  ));
};

async function buildCategoryUpdates(company, productCounts) {
  const existingCategories = await Category.find({ company: company._id }).sort({ order: 1, name: 1 }).lean();
  const updates = [];
  const creates = [];
  const touchedIds = new Set();

  for (const target of SHIVNATH_PUMP_CATEGORIES) {
    const existing = findReusableCategory(existingCategories, company._id, target);
    const count = productCounts.get(target.name) || 0;
    const next = {
      name: target.name,
      slug: makeSlug(target.name),
      productCount: count,
      isActive: true,
      showOnWebsite: true,
    };

    if (existing) {
      touchedIds.add(String(existing._id));
      updates.push({
        id: String(existing._id),
        from: existing.name,
        to: target.name,
        count,
        update: next,
      });
    } else {
      creates.push({
        name: target.name,
        slug: makeSlug(target.name),
        company: company._id,
        description: '',
        image: { url: null, publicId: null, blurHash: null },
        parent: null,
        order: 0,
        isActive: true,
        showOnWebsite: true,
        productCount: count,
      });
    }
  }

  const stale = existingCategories
    .filter((category) => !touchedIds.has(String(category._id)))
    .filter((category) => STALE_SHIVNATH_PUMP_NAMES.includes(category.name))
    .map((category) => ({
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      productCount: 0,
      isActive: false,
      showOnWebsite: false,
    }));

  return { updates, creates, stale };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  const shivnath = await Company.findOne({ slug: 'shivnath' }).select('_id name slug').lean();
  if (!shivnath) throw new Error('SHIVNATH company was not found');

  const products = await Product.find({
    company: shivnath._id,
    category: {
      $in: [
        'Shivnath Sub V-5 25 Feet',
        'Shivnath Sub V-5 25 Feet Q Type',
        'Shivnath Sub V-6 30 Feet',
        'Shivnath Sub V-6 30 Feet K Type',
        'Shivnath Sub V-6 30 Feet Q Type',
      ],
    },
  })
    .select('_id name category categoryRef slug sku retailPrice')
    .sort({ category: 1, retailPrice: 1, name: 1 })
    .lean();

  const productTargets = products
    .map((product) => {
      const nextCategory = getNextProductCategory(product);
      if (!nextCategory) return null;
      const nextName = stripPumpType(product.name);
      return {
        id: String(product._id),
        sku: product.sku || '',
        slug: product.slug || '',
        currentCategoryRef: product.categoryRef ? String(product.categoryRef) : null,
        oldCategory: product.category || '',
        newCategory: nextCategory,
        oldName: product.name || '',
        newName: nextName,
      };
    })
    .filter(Boolean);
  const productChanges = productTargets.filter((change) => (
    change.oldCategory !== change.newCategory || change.oldName !== change.newName
  ));

  const projectedCounts = new Map();
  const allShivnathProducts = await Product.find({ company: shivnath._id })
    .select('_id category')
    .lean();
  const categoryByProductId = new Map(productTargets.map((change) => [change.id, change.newCategory]));
  for (const product of allShivnathProducts) {
    const nextCategory = categoryByProductId.get(String(product._id)) || product.category;
    projectedCounts.set(nextCategory, (projectedCounts.get(nextCategory) || 0) + 1);
  }

  const categoryChanges = await buildCategoryUpdates(shivnath, projectedCounts);
  const backup = {
    productChanges,
    categoryChanges,
  };
  const backupPath = path.join(
    os.tmpdir(),
    `laxmi-agro-shivnath-kq-category-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  console.log(`Product updates: ${productChanges.length}`);
  productChanges.forEach((change) => {
    console.log(`${change.oldCategory} -> ${change.newCategory} | ${change.oldName} -> ${change.newName}`);
  });

  console.log(`Category updates: ${categoryChanges.updates.length}`);
  categoryChanges.updates.forEach((change) => {
    console.log(`${change.from} -> ${change.to} | live count ${change.count}`);
  });

  console.log(`Category creates: ${categoryChanges.creates.length}`);
  categoryChanges.creates.forEach((category) => {
    console.log(`${category.name} | live count ${category.productCount}`);
  });

  console.log(`Stale categories to deactivate: ${categoryChanges.stale.length}`);
  categoryChanges.stale.forEach((category) => console.log(`${category.name} | ${category.slug}`));
  console.log(`Backup written: ${backupPath}`);

  if (!shouldApply) {
    console.log(`Dry run only. Re-run with ${APPLY_FLAG} to update database.`);
    return;
  }

  for (const change of categoryChanges.updates) {
    await Category.updateOne({ _id: change.id }, { $set: change.update });
  }

  if (categoryChanges.creates.length > 0) {
    await Category.insertMany(categoryChanges.creates, { ordered: true });
  }

  for (const category of categoryChanges.stale) {
    await Category.updateOne({ _id: category.id }, {
      $set: {
        productCount: 0,
        isActive: false,
        showOnWebsite: false,
      },
    });
  }

  const categoryRefs = await Category.find({
    company: shivnath._id,
    name: { $in: SHIVNATH_PUMP_CATEGORIES.map((category) => category.name) },
  }).select('_id name').lean();
  const categoryRefByName = new Map(categoryRefs.map((category) => [category.name, category._id]));
  const productBulkUpdates = productTargets
    .map((change) => {
      const nextCategoryRef = categoryRefByName.get(change.newCategory);
      if (!nextCategoryRef) throw new Error(`Missing Category document for ${change.newCategory}`);
      if (
        change.oldCategory === change.newCategory
        && change.oldName === change.newName
        && change.currentCategoryRef === String(nextCategoryRef)
      ) return null;

      return {
        updateOne: {
          filter: { _id: change.id },
          update: {
            $set: {
              category: change.newCategory,
              categoryRef: nextCategoryRef,
              name: change.newName,
            },
          },
        },
      };
    })
    .filter(Boolean);

  if (productBulkUpdates.length > 0) {
    await Product.bulkWrite(productBulkUpdates);
  }

  console.log('Shivnath K/Q categories synced. Product slugs were left unchanged. Counts are based on live Product records.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
