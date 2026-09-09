require('dotenv').config();
const mongoose = require('mongoose');

// Full PRIMATE price-list transcription.
// Sizes in order: 1/2, 3/4, 1, 1.1/4, 1.1/2, 2, 2.1/2, 3, 4, 5, 6
// null = "**" (not available) -> skipped.
const SIZES = [
  { label: '1/2 inch', code: '12' },
  { label: '3/4 inch', code: '34' },
  { label: '1 inch', code: '1' },
  { label: '1.1/4 inch', code: '114' },
  { label: '1.1/2 inch', code: '112' },
  { label: '2 inch', code: '2' },
  { label: '2.1/2 inch', code: '212' },
  { label: '3 inch', code: '3' },
  { label: '4 inch', code: '4' },
  { label: '5 inch', code: '5' },
  { label: '6 inch', code: '6' },
];

const SUBS = [
  // Existing trial subs (only missing larger sizes will be added)
  { name: 'Elbows', singular: 'Elbow', code: 'ELB', prices: [null, null, null, null, 82.6, 122.6, 234.6, 333.5, 567.45, 1890.35, 2306.4] },
  { name: 'Tees', singular: 'Tee', code: 'TEE', prices: [null, null, null, null, 106.9, 164.0, 297.6, 435.65, 727.6, 2519.2, 2916.3] },
  { name: 'Sockets', singular: 'Socket', code: 'SOC', prices: [null, null, null, null, 55.85, 91.0, 147.0, 221.1, 357.7, 1302.5, 1738.65] },
  // New subs (full columns)
  { name: 'Unions', singular: 'Union', code: 'UNI', prices: [48.4, 60.25, 82.0, 123.6, 149.95, 230.0, 432.1, 599.25, 846.6, 2571.45, 3124.75] },
  { name: 'Nipples', singular: 'Nipple', code: 'NIP', prices: [18.8, 24.35, 37.9, 60.5, 72.6, 114.75, 208.0, 309.55, 571.95, 1932.7, 2372.9] },
  { name: 'Crosses', singular: 'Cross', code: 'CRO', prices: [40.35, 53.9, 85.5, 143.0, 193.45, 292.45, 458.35, 615.9, 1667.8, null, null] },
  { name: '3-Way Elbows', singular: '3-Way Elbow', code: '3WAY', prices: [35.85, 50.0, 79.6, 121.5, 167.85, 264.6, 389.2, 524.2, 1065.8, null, null] },
  { name: 'Short Bends', singular: 'Short Bend', code: 'SHB', prices: [33.3, 52.3, 76.8, 135.85, 221.95, 329.85, 892.0, 1528.5, 1801.75, null, null] },
  { name: 'Tank Nipples', singular: 'Tank Nipple', code: 'TNK', prices: [48.0, 69.5, 91.86, 160.23, 260.53, 340.94, null, null, null, null, null] },
  { name: 'Check Nuts', singular: 'Check Nut', code: 'CHK', prices: [12.4, 20.5, 26.4, 30.7, 55.2, 70.5, 123.6, 138.1, 251.2, null, null] },
  { name: 'R/Elbows', singular: 'R/Elbow', code: 'RELB', prices: [null, 31.8, 44.55, 67.1, 91.45, 136.25, 258.15, 366.95, 624.75, null, null] },
  { name: 'R/Tees', singular: 'R/Tee', code: 'RTEE', prices: [null, 44.55, 60.0, 87.9, 115.1, 176.6, 327.5, 479.3, 800.5, 2770.0, 3207.5] },
  // R/Sockets 5" (~1432.60 unclear) + 6" (cut off in photo) skipped for now
  { name: 'R/Sockets', singular: 'R/Socket', code: 'RSOC', prices: [null, 24.8, 31.15, 47.7, 61.45, 100.15, 161.65, 243.2, 393.5, null, null] },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');

  const parent = await Category.findOne({ slug: 'gi-products' });
  if (!parent) {
    console.error('GI Products parent not found!');
    process.exit(1);
  }
  console.log(`Parent: ${parent.name} company=${parent.company}`);

  let createdSubs = 0;
  let createdProducts = 0;
  for (const [si, sub] of SUBS.entries()) {
    let subCat = await Category.findOne({ company: parent.company, parent: parent._id, slug: sub.name.toLowerCase().replace(/\s+/g, '-') });
    if (!subCat) {
      subCat = await Category.findOne({ company: parent.company, parent: parent._id, name: sub.name });
    }
    if (!subCat) {
      subCat = await Category.create({
        name: sub.name,
        company: parent.company,
        parent: parent._id,
        description: `GI ${sub.name} - PRIMATE price list`,
        order: si,
        isActive: true,
        showOnWebsite: true,
      });
      createdSubs += 1;
      console.log(`Created sub: ${sub.name}`);
    }
    for (const [i, price] of sub.prices.entries()) {
      if (price === null) continue;
      const size = SIZES[i];
      const name = `GI ${sub.singular} ${size.label}`;
      const sku = `GI-${sub.code}-${size.code}`.toUpperCase();
      const existing = await Product.findOne({ sku });
      if (existing) continue;
      await Product.create({
        name,
        category: subCat.slug,
        categoryRef: subCat._id,
        company: parent.company,
        brand: 'General',
        subCategory: subCat.slug,
        mrp: price,
        retailPrice: price,
        wholesalePrice: price,
        sku,
        stock: 100,
        minWholesaleQuantity: 10,
        negotiationEnabled: true,
        status: 'active',
        showOnWebsite: true,
        shortDescription: `${sub.name} ${size.label} - GI fitting (PRIMATE)`,
        tags: ['gi', 'gi-products', 'primate', sub.name.toLowerCase(), size.label],
      });
      createdProducts += 1;
    }
    const count = await Product.countDocuments({ categoryRef: subCat._id });
    await Category.updateOne({ _id: subCat._id }, { $set: { productCount: count } });
    console.log(`  ${sub.name}: ${count} products`);
  }

  const total = await Product.countDocuments({
    categoryRef: { $in: await Category.find({ parent: parent._id }).distinct('_id') },
  });
  await Category.updateOne({ _id: parent._id }, { $set: { productCount: total } });
  console.log(`\nNew subs: ${createdSubs}, new products: ${createdProducts}, GI total linked: ${total}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
