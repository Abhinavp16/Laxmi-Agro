require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = path.join(__dirname, '..', '..', '.local');
const TARGET_COMPANY_SLUG = 'submersible-cables';
const SOURCE_COMPANY_SLUG = 'mourya';
const ROOT_CATEGORY_ID = '6a33d6318d0d58faca6d399e';
const EXPECTED_CHILDREN = new Map([
  ['1.5 sqmm', 1],
  ['2.5 sqmm', 2],
  ['4.0 sqmm', 7],
  ['6.0 sqmm', 1],
]);

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (APPLY && process.env.CONFIRM_CABLE_HIERARCHY_REPAIR !== '1') {
    throw new Error('Set CONFIRM_CABLE_HIERARCHY_REPAIR=1 to apply');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');
  const Company = require('../src/models/Company');

  const [targetCompany, sourceCompany, root] = await Promise.all([
    Company.findOne({ slug: TARGET_COMPANY_SLUG }),
    Company.findOne({ slug: SOURCE_COMPANY_SLUG }),
    Category.findById(ROOT_CATEGORY_ID),
  ]);

  if (!targetCompany) throw new Error(`Target company '${TARGET_COMPANY_SLUG}' not found`);
  if (!sourceCompany) throw new Error(`Source company '${SOURCE_COMPANY_SLUG}' not found`);
  if (!root || root.name !== 'MOURYA SUBMERSIBLE CABLE') {
    throw new Error('Expected MOURYA SUBMERSIBLE CABLE root category not found');
  }
  if (String(root.company) !== String(targetCompany._id)) {
    throw new Error('Root category is not assigned to SUBMERSIBLE CABLES');
  }

  const children = await Category.find({ parent: root._id }).sort({ order: 1, name: 1 });
  const childNames = new Set(children.map((child) => child.name));
  if (children.length !== EXPECTED_CHILDREN.size
      || [...EXPECTED_CHILDREN.keys()].some((name) => !childNames.has(name))) {
    throw new Error(`Unexpected child categories: ${children.map((child) => child.name).join(', ')}`);
  }

  const categoryIds = [root._id, ...children.map((child) => child._id)];
  const products = await Product.find({ categoryRef: { $in: categoryIds } })
    .select('name sku brand category categoryRef subCategory company status showOnWebsite')
    .lean();
  const activeProducts = products.filter((product) => product.status === 'active');
  if (products.length !== 11 || activeProducts.length !== 11) {
    throw new Error(`Expected 11 active products, found ${activeProducts.length} active / ${products.length} total`);
  }

  for (const child of children) {
    const expectedCount = EXPECTED_CHILDREN.get(child.name);
    const actualCount = products.filter(
      (product) => String(product.categoryRef) === String(child._id),
    ).length;
    if (actualCount !== expectedCount) {
      throw new Error(`${child.name}: expected ${expectedCount} products, found ${actualCount}`);
    }
  }

  const backup = {
    createdAt: new Date().toISOString(),
    targetCompany: targetCompany.toObject(),
    sourceCompany: sourceCompany.toObject(),
    root: root.toObject(),
    children: children.map((child) => child.toObject()),
    products,
  };
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `mourya-submersible-cable-backup-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Backup: ${backupPath}`);
  console.log(`Root: ${root.name}`);
  for (const child of children) {
    console.log(`  ${child.name}: ${EXPECTED_CHILDREN.get(child.name)} products`);
  }
  console.log(`Products: ${products.length}`);

  if (!APPLY) {
    console.log('Dry run complete. No database records changed.');
    return;
  }

  await Category.updateOne(
    { _id: root._id },
    { $set: { isActive: true, showOnWebsite: true, productCount: 0 } },
  );
  await Category.updateMany(
    { _id: { $in: children.map((child) => child._id) } },
    { $set: { company: targetCompany._id, isActive: true, showOnWebsite: true } },
  );
  await Product.updateMany(
    { categoryRef: { $in: categoryIds } },
    { $set: { company: targetCompany._id } },
  );

  for (const child of children) {
    const count = await Product.countDocuments({
      categoryRef: child._id,
      status: { $ne: 'archived' },
    });
    await Category.updateOne({ _id: child._id }, { $set: { productCount: count } });
  }

  const [targetProductCount, sourceProductCount] = await Promise.all([
    Product.countDocuments({ company: targetCompany._id, status: { $ne: 'archived' } }),
    Product.countDocuments({ company: sourceCompany._id, status: { $ne: 'archived' } }),
  ]);
  await Promise.all([
    Company.updateOne({ _id: targetCompany._id }, { $set: { productCount: targetProductCount } }),
    Company.updateOne({ _id: sourceCompany._id }, { $set: { productCount: sourceProductCount } }),
  ]);

  const [mismatchedChildren, mismatchedProducts, visibleRoot] = await Promise.all([
    Category.countDocuments({
      _id: { $in: children.map((child) => child._id) },
      company: { $ne: targetCompany._id },
    }),
    Product.countDocuments({
      categoryRef: { $in: categoryIds },
      company: { $ne: targetCompany._id },
    }),
    Category.findOne({
      _id: root._id,
      company: targetCompany._id,
      isActive: true,
      showOnWebsite: true,
    }).lean(),
  ]);
  if (mismatchedChildren || mismatchedProducts || !visibleRoot) {
    throw new Error(
      `Verification failed: children=${mismatchedChildren}, products=${mismatchedProducts}, root=${Boolean(visibleRoot)}`,
    );
  }

  console.log(`Repair complete: ${children.length} subcategories and ${products.length} products aligned.`);
  console.log(`SUBMERSIBLE CABLES product count: ${targetProductCount}`);
}

main()
  .catch((error) => {
    console.error(`REPAIR_ERROR: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
