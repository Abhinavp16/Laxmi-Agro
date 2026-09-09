require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../src/models/Company');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

// Prices from PRIMATE price list (trial: only 4 sizes)
// ELBOWS: 1/2=20.75, 3/4=28.90, 1=40.50, 1.1/4=61.00
// TEES:   1/2=28.90, 3/4=40.50, 1=53.75, 1.1/4=81.70
// SOCKETS:1/2=16.60, 3/4=22.40, 1=28.10, 1.1/4=43.05
const SIZES = [
  { label: '1/2 inch', short: '12', priceKey: 'half' },
  { label: '3/4 inch', short: '34', priceKey: 'threeFour' },
  { label: '1 inch', short: '1', priceKey: 'one' },
  { label: '1.1/4 inch', short: '114', priceKey: 'oneQuarter' },
];

const SUBS = [
  {
    name: 'Elbows',
    code: 'ELB',
    prices: { half: 20.75, threeFour: 28.9, one: 40.5, oneQuarter: 61.0 },
  },
  {
    name: 'Tees',
    code: 'TEE',
    prices: { half: 28.9, threeFour: 40.5, one: 53.75, oneQuarter: 81.7 },
  },
  {
    name: 'Sockets',
    code: 'SOC',
    prices: { half: 16.6, threeFour: 22.4, one: 28.1, oneQuarter: 43.05 },
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // 1. Generic brand/company
  let company = await Company.findOne({ name: 'General' });
  if (!company) {
    company = await Company.create({ name: 'General', isActive: true, showOnWebsite: true });
    console.log('Created Company: General', company._id.toString());
  } else {
    console.log('Found Company: General', company._id.toString());
  }

  // 2. Parent category GI Products
  let parent = await Category.findOne({ company: company._id, slug: 'gi-products' });
  if (!parent) {
    parent = await Category.create({
      name: 'GI Products',
      company: company._id,
      parent: null,
      description: 'GI fittings trial - elbows, tees, sockets',
      order: 999,
      isActive: true,
      showOnWebsite: true,
    });
    console.log('Created Category: GI Products', parent._id.toString());
  } else {
    console.log('Found Category: GI Products', parent._id.toString());
    // ensure it is root + active
    parent.parent = null;
    parent.isActive = true;
    parent.showOnWebsite = true;
    await parent.save();
  }

  for (const sub of SUBS) {
    let subCat = await Category.findOne({ company: company._id, parent: parent._id, slug: sub.name.toLowerCase() });
    if (!subCat) {
      subCat = await Category.create({
        name: sub.name,
        company: company._id,
        parent: parent._id,
        description: `GI ${sub.name} - trial`,
        order: SUBS.indexOf(sub),
        isActive: true,
        showOnWebsite: true,
      });
      console.log(`Created Subcategory: ${sub.name}`, subCat._id.toString());
    } else {
      console.log(`Found Subcategory: ${sub.name}`, subCat._id.toString());
    }

    for (const size of SIZES) {
      const price = sub.prices[size.priceKey];
      const name = `GI ${sub.name.replace(/s$/, '')} ${size.label}`; // e.g. GI Elbow 1/2 inch
      const sku = `GI-${sub.code}-${size.short}`.toUpperCase();
      const existing = await Product.findOne({ sku });
      if (existing) {
        console.log(`  Exists: ${name} (${sku}) Rs.${existing.retailPrice}`);
        // repair links if needed
        let dirty = false;
        if (String(existing.categoryRef || '') !== String(subCat._id)) {
          existing.categoryRef = subCat._id;
          dirty = true;
        }
        if (existing.category !== subCat.slug) {
          existing.category = subCat.slug;
          dirty = true;
        }
        if (dirty) {
          await existing.save();
          console.log(`  Repaired links for ${sku}`);
        }
        continue;
      }
      await Product.create({
        name,
        category: subCat.slug,
        categoryRef: subCat._id,
        company: company._id,
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
        shortDescription: `${sub.name} ${size.label} - GI fitting (trial)`,
        tags: ['gi', 'gi-products', sub.name.toLowerCase(), size.label],
      });
      console.log(`  Created: ${name} (${sku}) Rs.${price}`);
    }

    const count = await Product.countDocuments({ categoryRef: subCat._id });
    subCat.productCount = count;
    await subCat.save();
    console.log(`  Subcategory ${sub.name} count=${count}`);
  }

  const parentCount = await Product.countDocuments({
    categoryRef: { $in: await Category.find({ parent: parent._id }).distinct('_id') },
  });
  parent.productCount = parentCount;
  await parent.save();
  console.log(`Parent GI Products total linked=${parentCount}`);
  console.log('Done. Old categories/products untouched.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
