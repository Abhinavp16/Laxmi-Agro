require('dotenv').config();
const mongoose = require('mongoose');

const SUB_NAMES = [
  'SAARAS',
  'SAARAS BRASS',
  'GARUD',
  'BALWAN',
  'NARMADA',
  // NOTE: user wrote "RAIGUN" but all 5 products say "RAINGUN" - using RAINGUN.
  'RAINGUN',
];

// IMPORTANT: SAARAS BRASS must be tested before SAARAS.
function matchSub(productName) {
  const n = String(productName || '').toUpperCase();
  if (n.includes('SAARAS BRASS')) return 'SAARAS BRASS';
  if (n.includes('SAARAS')) return 'SAARAS';
  if (n.includes('GARUD')) return 'GARUD';
  if (n.includes('BALWAN')) return 'BALWAN';
  if (n.includes('NARMADA')) return 'NARMADA';
  if (n.includes('RAINGUN') || n.includes('RAIGUN')) return 'RAINGUN';
  return null;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');

  const parent = await Category.findOne({ slug: 'harit-sprinkler-set' });
  if (!parent) {
    console.error('Parent HARIT SPRINKLER SET not found!');
    process.exit(1);
  }
  console.log(`Parent: ${parent.name} (${parent._id}) company=${parent.company}`);

  // 1. Create subcategories (idempotent)
  const subByName = {};
  for (let i = 0; i < SUB_NAMES.length; i++) {
    const name = SUB_NAMES[i];
    let sub = await Category.findOne({
      company: parent.company,
      parent: parent._id,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    });
    if (!sub) {
      // fallback: same company + same name (any parent)
      sub =
        (await Category.findOne({
          company: parent.company,
          parent: parent._id,
          name,
        })) || null;
    }
    if (!sub) {
      sub = await Category.create({
        name,
        company: parent.company,
        parent: parent._id,
        description: `${name} sprinklers - part of Harit Sprinkler Set`,
        order: i,
        isActive: true,
        showOnWebsite: true,
      });
      console.log(`Created sub: ${name} (${sub._id})`);
    } else {
      console.log(`Found sub: ${sub.name} (${sub._id})`);
      sub.parent = parent._id;
      sub.company = parent.company;
      sub.isActive = true;
      sub.showOnWebsite = true;
      await sub.save();
    }
    subByName[sub.name.toUpperCase()] = sub;
  }
  // normalize keys for lookup
  const lookup = {};
  for (const [k, v] of Object.entries(subByName)) lookup[k] = v;

  // 2. Reassign the 10 parent products into subs
  const products = await Product.find({
    $or: [
      { categoryRef: parent._id },
      { category: { $in: [parent.name, parent.slug] } },
    ],
  });
  console.log(`Found ${products.length} products under parent`);

  const counts = {};
  const unmatched = [];
  for (const p of products) {
    const targetName = matchSub(p.name);
    if (!targetName) {
      unmatched.push(p.name);
      continue;
    }
    const sub = lookup[targetName];
    if (!sub) {
      unmatched.push(`${p.name} (no sub doc for ${targetName})`);
      continue;
    }
    p.categoryRef = sub._id;
    p.category = sub.slug;
    p.subCategory = sub.slug;
    await p.save();
    counts[targetName] = (counts[targetName] || 0) + 1;
    console.log(`  ${p.name} -> ${targetName}`);
  }

  if (unmatched.length > 0) {
    console.log('UNMATCHED (left on parent):', unmatched);
  }

  // 3. Refresh productCounts
  for (const sub of Object.values(lookup)) {
    const c = await Product.countDocuments({ categoryRef: sub._id });
    sub.productCount = c;
    await sub.save();
    console.log(`  count ${sub.name} = ${c}`);
  }
  const remaining = await Product.countDocuments({ categoryRef: parent._id });
  parent.productCount = remaining;
  await parent.save();
  console.log(`  remaining directly on parent = ${remaining}`);

  console.log('Done. Distribution:', JSON.stringify(counts));
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
