require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

/* ============================================================
 * Split Mourya "Openwells" (40+ products, too mixed) into:
 *
 *   Mourya Sub Pumps
 *   |-- Openwell V7       <- V-7 family (CI + SS body)
 *   |-- Openwell V9       <- V-9 family
 *   |-- Openwell Vertical <- vertical-body stage pumps
 *
 * Bucketing is deterministic from SKU/name/tags (verified against
 * all 46 linked products before writing this script):
 *   V9  <=> /\bV-?9\b/ in name/sku/tags
 *   Vertical <=> "STAGE" in name OR "C.I. BODY" tag
 *   V7  <=> everything else (V-7 family + SS body line)
 * Statuses (incl. archived) are preserved - only category moves.
 * Old "Openwells" sub is deactivated once empty (reversible).
 *
 * Usage: node scripts/splitMouryaOpenwells.js [--dry-run]
 * Idempotent: safe to re-run.
 * ============================================================ */

const DRY_RUN = process.argv.includes('--dry-run');

const SOURCE_SLUG = 'mourya-sub-pumps-openwells';

const NEW_SUBS = [
  { display: 'Openwell V7', order: 6 },
  { display: 'Openwell V9', order: 7 },
  { display: 'Openwell Vertical', order: 8 },
];

function scopedSlug(parentSlug, display) {
  return `${parentSlug}-${slugify(display, { lower: true, strict: true })}`;
}

function bucket(p) {
  const tags = (p.tags || []).join(' ');
  const hay = `${p.name} ${p.sku} ${tags}`.toUpperCase();
  if (/\bV-?9\b/.test(hay)) return 'Openwell V9';
  if (p.name.toUpperCase().includes('STAGE') || tags.toUpperCase().includes('C.I. BODY'))
    return 'Openwell Vertical';
  return 'Openwell V7';
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB', DRY_RUN ? '(DRY RUN - no writes)' : '');
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');
  const Company = require('../src/models/Company');

  const company = await Company.findOne({ name: 'MOURYA' });
  if (!company) {
    console.error('MOURYA company not found!');
    process.exit(1);
  }
  const parent = await Category.findOne({
    company: company._id,
    slug: 'mourya-sub-pumps',
    parent: null,
  });
  if (!parent) {
    console.error('Mourya Sub Pumps parent not found!');
    process.exit(1);
  }
  const source = await Category.findOne({
    company: company._id,
    slug: SOURCE_SLUG,
  });
  if (!source) {
    console.log('Source Openwells sub not found - nothing to split.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const products = await Product.find({ categoryRef: source._id }).select(
    'name sku tags status'
  );
  console.log(`linked products: ${products.length}`);

  const buckets = { 'Openwell V7': [], 'Openwell V9': [], 'Openwell Vertical': [] };
  for (const p of products) buckets[bucket(p)].push(p);

  console.log('\n--- SPLIT PLAN ---');
  for (const { display } of NEW_SUBS) {
    const list = buckets[display];
    const active = list.filter((p) => p.status === 'active').length;
    console.log(`${display}: ${list.length} (${active} active)`);
    list.forEach((p) => console.log(` - ${p.name} [${p.status}]`));
  }

  if (DRY_RUN) {
    console.log('\nDry run complete - no writes made.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // create new subs (placeholder-name trick: pre-save slug would collide otherwise)
  const subByDisplay = {};
  for (const { display, order } of NEW_SUBS) {
    const slug = scopedSlug(parent.slug, display);
    let sub = await Category.findOne({ company: company._id, slug });
    if (!sub) {
      const created = await Category.create({
        name: `${display} New`,
        company: company._id,
        parent: parent._id,
        description: `${display} - part of Mourya Sub Pumps`,
        order,
        isActive: true,
        showOnWebsite: true,
      });
      await Category.updateOne(
        { _id: created._id },
        { $set: { name: display, slug } }
      );
      sub = await Category.findById(created._id);
      console.log(`  + sub '${display}' (${slug})`);
    }
    subByDisplay[display] = sub;
  }

  for (const { display } of NEW_SUBS) {
    const ids = buckets[display].map((p) => p._id);
    if (ids.length === 0) continue;
    const target = subByDisplay[display];
    const res = await Product.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          categoryRef: target._id,
          category: target.slug,
          subCategory: target.slug,
        },
      }
    );
    console.log(`moved ${res.modifiedCount}x -> '${display}'`);
    const c = await Product.countDocuments({
      categoryRef: target._id,
      status: 'active',
    });
    await Category.updateOne({ _id: target._id }, { $set: { productCount: c } });
  }

  const remaining = await Product.countDocuments({ categoryRef: source._id });
  await Category.updateOne(
    { _id: source._id },
    {
      $set: {
        productCount: remaining,
        isActive: remaining === 0 ? false : true,
        showOnWebsite: remaining === 0 ? false : true,
      },
    }
  );
  console.log(
    remaining === 0
      ? 'source Openwells empty -> deactivated (reversible)'
      : `WARN: ${remaining} stragglers left on source`
  );

  console.log('DONE.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
