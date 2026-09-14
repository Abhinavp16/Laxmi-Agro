require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

/* ============================================================
 * Aluminium Cable: new GENERAL PRODUCTS parent with re-parented
 * wire subs + one new Service Cable sub (no dashes in names).
 *
 *   Aluminium Cable (brand GENERAL PRODUCTS)
 *   |-- Service Cable       <- 11 products (3 core subs of
 *   |                            MOURYA SERVICE CABLE, flattened)
 *   |-- Service Wire Folex  <- existing sub re-parented as-is (2)
 *   |-- Service Wire Ideal  <- existing sub re-parented as-is (4)
 *   |-- Service Wire Shivnath <- existing sub re-parented as-is (3)
 *
 * Wire subs keep their IDs/slugs (product links untouched) - only
 * the `parent` pointer + display name change. Cable products move
 * cross-brand (MOURYA -> GENERAL PRODUCTS parent) - products keep
 * their own brand/company fields.
 * SUBMERSIBLE CABLE is untouched.
 *
 * Old MOURYA SERVICE CABLE parent + core subs and the old
 * SERVICE WIRE ALUMINIUM parent are deactivated, never deleted.
 *
 * Usage: node scripts/mergeAluminiumCable.js [--dry-run]
 * Idempotent: safe to re-run.
 * ============================================================ */

const DRY_RUN = process.argv.includes('--dry-run');

const GENERAL_NAME = 'GENERAL PRODUCTS';
const MOURYA_NAME = 'MOURYA';

const NEW_PARENT_NAME = 'Aluminium Cable';
const NEW_PARENT_SLUG = 'aluminium-cable';

// Existing subs to re-parent (slug -> new display name).
const REPARENT_SUBS = {
  'service-wire-aluminium-folex': 'Service Wire Folex',
  'service-wire-aluminium-ideal': 'Service Wire Ideal',
  'service-wire-aluminium-shivnath': 'Service Wire Shivnath',
};

// Old core subs whose products flatten into Service Cable.
const CABLE_SUB_SLUGS = [
  'service-cable-2-core',
  'service-cable-3-core',
  'service-cable-4-core',
];

const OLD_WIRE_PARENT_SLUG = 'service-wire-aluminium';
const OLD_CABLE_PARENT_SLUG = 'service-cable';

function scopedSlug(parentSlug, display) {
  return `${parentSlug}-${slugify(display, { lower: true, strict: true })}`;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB', DRY_RUN ? '(DRY RUN - no writes)' : '');
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');
  const Company = require('../src/models/Company');

  const general = await Company.findOne({ name: GENERAL_NAME });
  const mourya = await Company.findOne({ name: MOURYA_NAME });
  if (!general || !mourya) {
    console.error('GENERAL PRODUCTS or MOURYA company not found!');
    process.exit(1);
  }

  // ---------- new parent ----------
  let newParent = await Category.findOne({
    company: general._id,
    slug: NEW_PARENT_SLUG,
  });
  if (!newParent && !DRY_RUN) {
    const created = await Category.create({
      name: NEW_PARENT_NAME,
      company: general._id,
      parent: null,
      description: 'Aluminium cables and service wires',
      order: 0,
      isActive: true,
      showOnWebsite: true,
    });
    await Category.updateOne(
      { _id: created._id },
      { $set: { slug: NEW_PARENT_SLUG } }
    );
    newParent = await Category.findById(created._id);
    console.log(`+ parent '${NEW_PARENT_NAME}' (${NEW_PARENT_SLUG})`);
  }
  if (!newParent) {
    console.log(`(dry-run) would ensure parent '${NEW_PARENT_NAME}'`);
  }
  const newParentId = newParent ? newParent._id : null;

  // ---------- new Service Cable sub ----------
  const cableSlug = scopedSlug(NEW_PARENT_SLUG, 'Service Cable');
  let cableSub = await Category.findOne({
    company: general._id,
    slug: cableSlug,
  });
  if (!cableSub && !DRY_RUN) {
    const created = await Category.create({
      name: 'Service Cable',
      company: general._id,
      parent: newParentId,
      description: 'Service Cable - part of Aluminium Cable',
      order: 0,
      isActive: true,
      showOnWebsite: true,
    });
    await Category.updateOne({ _id: created._id }, { $set: { slug: cableSlug } });
    cableSub = await Category.findById(created._id);
    console.log(`  + sub 'Service Cable' (${cableSlug})`);
  }
  if (!cableSub) console.log(`(dry-run) would ensure sub 'Service Cable'`);

  // ---------- move plan ----------
  let total = 0;
  console.log('\n--- MOVE PLAN ---');

  // 1. cable products -> Service Cable (flatten core subs)
  for (const slug of CABLE_SUB_SLUGS) {
    const sub = await Category.findOne({
      company: mourya._id,
      slug,
    });
    if (!sub) {
      console.log(`SKIP cable sub '${slug}' not found`);
      continue;
    }
    const count = await Product.countDocuments({ categoryRef: sub._id });
    total += count;
    console.log(`${count}x '${sub.name}' (${slug}) -> 'Service Cable'`);
    if (!DRY_RUN && count > 0) {
      const res = await Product.updateMany(
        { categoryRef: sub._id },
        {
          $set: {
            categoryRef: cableSub._id,
            category: cableSub.slug,
            subCategory: cableSub.slug,
          },
        }
      );
      console.log(`  moved ${res.modifiedCount}x`);
    }
  }

  // 2. re-parent wire subs as-is (IDs/slugs unchanged -> product links safe)
  for (const [slug, display] of Object.entries(REPARENT_SUBS)) {
    const sub = await Category.findOne({ company: general._id, slug });
    if (!sub) {
      console.log(`SKIP wire sub '${slug}' not found`);
      continue;
    }
    const count = await Product.countDocuments({ categoryRef: sub._id });
    total += count;
    console.log(
      `re-parent '${sub.name}' (${slug}) -> '${display}' under '${NEW_PARENT_NAME}' [${count} products stay linked]`
    );
    if (!DRY_RUN) {
      await Category.updateOne(
        { _id: sub._id },
        { $set: { name: display, parent: newParentId } }
      );
    }
  }
  console.log(`TOTAL PRODUCTS: ${total}`);

  if (DRY_RUN) {
    console.log('\nDry run complete - no writes made.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ---------- refresh counts ----------
  const refreshTargets = [cableSub._id];
  for (const slug of Object.keys(REPARENT_SUBS)) {
    const sub = await Category.findOne({ company: general._id, slug });
    if (sub) refreshTargets.push(sub._id);
  }
  for (const id of refreshTargets) {
    const sub = await Category.findById(id);
    const c = await Product.countDocuments({
      categoryRef: id,
      status: 'active',
    });
    await Category.updateOne({ _id: id }, { $set: { productCount: c } });
    console.log(`sub '${sub.name}': ${c} products`);
  }

  // ---------- deactivate olds ----------
  const mouryaCableParent = await Category.findOne({
    company: mourya._id,
    slug: OLD_CABLE_PARENT_SLUG,
    parent: null,
  });
  const generalWireParent = await Category.findOne({
    company: general._id,
    slug: OLD_WIRE_PARENT_SLUG,
    parent: null,
  });
  const toDeactivate = [];
  if (mouryaCableParent) {
    toDeactivate.push(mouryaCableParent);
    const kids = await Category.find({ parent: mouryaCableParent._id });
    toDeactivate.push(...kids);
  }
  if (generalWireParent) toDeactivate.push(generalWireParent);
  for (const cat of toDeactivate) {
    const remaining = await Product.countDocuments({ categoryRef: cat._id });
    await Category.updateOne(
      { _id: cat._id },
      {
        $set: {
          productCount: remaining,
          isActive: false,
          showOnWebsite: false,
        },
      }
    );
    if (remaining > 0)
      console.log(`WARN: ${remaining} stragglers left on '${cat.name}'`);
  }

  console.log('DONE. Old cable/wire parents deactivated (reversible).');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
