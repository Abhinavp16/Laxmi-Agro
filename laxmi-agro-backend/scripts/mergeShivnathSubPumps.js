require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

/* ============================================================
 * Shivnath pump merge: 7 old parents + HP subs -> ONE parent
 * "Shivnath Sub Pumps" with 7 model subs (no dashes in names).
 *
 *   Shivnath Sub Pumps
 *   |-- V4            <- 6 HP subs of Shivnath V-4
 *   |-- V6 30 Ft      <- 6 HP subs of Shivnath Sub V-6 30 Ft
 *   |-- V6 50 Ft      <- 7 HP subs of Shivnath Sub V-6 50 Feet
 *   |-- V5            <- 6 HP subs of Shivnath Sub V-5
 *   |-- V3            <- 3 HP subs of Shivnath Sub V-3 13 Feet
 *   |-- V4 Lota Body  <- 4 Lota HP subs of Shivnath V-4 Lota Body
 *   |-- Openwells     <- SHIVNATH-brand products in the 8 V-7 SS
 *                        survivor subs (MOURYA products stay put)
 *
 * SHIVNATH CONTROL PANELS is untouched. Old parents + HP subs are
 * deactivated (isActive=false), never deleted - full rollback by
 * reactivating + reversing the printed map.
 *
 * Usage: node scripts/mergeShivnathSubPumps.js [--dry-run]
 * Idempotent: safe to re-run. Already-moved products are skipped.
 * ============================================================ */

const DRY_RUN = process.argv.includes('--dry-run');

// Old SHIVNATH pump parents (slugs are company-scoped; the openwell
// slug exists twice - we always scope by company + parent:null).
const OLD_PARENT_SLUGS = [
  'shivnath-sub-v-4-20-feet',
  'shivnath-sub-v-6-30-feet-k-type',
  'shivnath-sub-v-6-50-feet',
  'shivnath-sub-v-5-25-feet-q-type',
  'shivnath-sub-v-3-13-feet',
  'shivnath-sub-v-4-20-feet-lota-body',
  'open-well-ss-body-v-7', // SHIVNATH loser, already inactive, 0 products
];

// New model subs in display order. No dashes in display names.
const NEW_SUBS = [
  { display: 'V4', order: 0 },
  { display: 'V6 30 Ft', order: 1 },
  { display: 'V6 50 Ft', order: 2 },
  { display: 'V5', order: 3 },
  { display: 'V3', order: 4 },
  { display: 'V4 Lota Body', order: 5 },
  { display: 'Openwells', order: 6 },
];

const NEW_PARENT_NAME = 'Shivnath Sub Pumps';
const NEW_PARENT_SLUG = 'shivnath-sub-pumps';

// Which old HP-sub slug belongs to which new model sub.
// Built dynamically from each old parent's children, except Openwells
// (V-7 SS survivor subs, shared with MOURYA - brand-filtered).
const MODEL_BY_PARENT_SLUG = {
  'shivnath-sub-v-4-20-feet': 'V4',
  'shivnath-sub-v-6-30-feet-k-type': 'V6 30 Ft',
  'shivnath-sub-v-6-50-feet': 'V6 50 Ft',
  'shivnath-sub-v-5-25-feet-q-type': 'V5',
  'shivnath-sub-v-3-13-feet': 'V3',
  'shivnath-sub-v-4-20-feet-lota-body': 'V4 Lota Body',
};

// V-7 SS survivor subs (active, shared brand family). Only
// SHIVNATH-brand products move to Openwells.
const OPENWELL_SUB_SLUGS = [
  'open-well-ss-body-v-7-v-7-ss-75-hp',
  'open-well-ss-body-v-7-v-7-ss-5-hp',
  'open-well-ss-body-v-7-v-7-ss-3-hp',
  'open-well-ss-body-v-7-v-7-ss-2-hp',
  'open-well-ss-body-v-7-v-7-ss-15-hp',
  'open-well-ss-body-v-7-v-7-ss-1-hp',
  'open-well-ss-body-v-7-v-7-ss-10-hp',
  'open-well-ss-body-v-7-v-7-ss-05-hp',
];

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

  const company = await Company.findOne({ name: 'SHIVNATH' });
  if (!company) {
    console.error('SHIVNATH company not found!');
    process.exit(1);
  }

  // ---------- new parent ----------
  let newParent = await Category.findOne({
    company: company._id,
    slug: NEW_PARENT_SLUG,
  });
  if (!newParent && !DRY_RUN) {
    const created = await Category.create({
      name: NEW_PARENT_NAME,
      company: company._id,
      parent: null,
      description: 'Shivnath submersible pumps - all models',
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

  // ---------- new subs ----------
  const newSubByDisplay = {};
  for (const { display, order } of NEW_SUBS) {
    const slug = scopedSlug(NEW_PARENT_SLUG, display);
    let sub = await Category.findOne({ company: company._id, slug });
    if (!sub && !DRY_RUN) {
      const created = await Category.create({
        name: display,
        company: company._id,
        parent: newParent._id,
        description: `${display} - part of ${NEW_PARENT_NAME}`,
        order,
        isActive: true,
        showOnWebsite: true,
      });
      await Category.updateOne({ _id: created._id }, { $set: { slug } });
      sub = await Category.findById(created._id);
      console.log(`  + sub '${display}' (${slug})`);
    }
    if (sub) newSubByDisplay[display] = sub;
    else console.log(`(dry-run) would ensure sub '${display}' (${slug})`);
  }

  // ---------- build move plan ----------
  // plan: [{ fromSubId, fromSlug, fromName, toDisplay, brandOnly, count }]
  const plan = [];

  for (const parentSlug of OLD_PARENT_SLUGS) {
    const parent = await Category.findOne({
      company: company._id,
      slug: parentSlug,
      parent: null,
    });
    if (!parent) {
      console.log(`SKIP old parent '${parentSlug}' not found`);
      continue;
    }
    // products sitting directly on the old parent (expect 0)
    const directCount = await Product.countDocuments({
      categoryRef: parent._id,
    });
    if (directCount > 0) {
      console.log(
        `NOTE: ${directCount} products sit directly on old parent '${parent.name}' - mapping to '${MODEL_BY_PARENT_SLUG[parentSlug] || 'Openwells'}'`
      );
      plan.push({
        fromSubId: parent._id,
        fromSlug: parent.slug,
        fromName: parent.name,
        toDisplay: MODEL_BY_PARENT_SLUG[parentSlug] || 'Openwells',
        brandOnly: false,
        count: directCount,
      });
    }
    const children = await Category.find({ parent: parent._id }).lean();
    for (const child of children) {
      const count = await Product.countDocuments({
        categoryRef: child._id,
      });
      plan.push({
        fromSubId: child._id,
        fromSlug: child.slug,
        fromName: child.name,
        toDisplay: MODEL_BY_PARENT_SLUG[parentSlug],
        brandOnly: false,
        count,
      });
    }
  }

  // Openwells: SHIVNATH-brand products only, from shared V-7 survivor subs
  for (const slug of OPENWELL_SUB_SLUGS) {
    const sub = await Category.findOne({ slug, isActive: true });
    if (!sub) {
      console.log(`SKIP openwell sub '${slug}' not found`);
      continue;
    }
    const count = await Product.countDocuments({
      categoryRef: sub._id,
      brand: { $regex: /^shivnath$/i },
    });
    const other = await Product.countDocuments({
      categoryRef: sub._id,
      brand: { $not: /^shivnath$/i },
    });
    plan.push({
      fromSubId: sub._id,
      fromSlug: sub.slug,
      fromName: sub.name,
      toDisplay: 'Openwells',
      brandOnly: true,
      count,
      staysPut: other,
    });
  }

  // ---------- report ----------
  let total = 0;
  console.log('\n--- MOVE PLAN ---');
  for (const step of plan) {
    total += step.count;
    console.log(
      `${step.count}x '${step.fromName}' (${step.fromSlug}) -> '${step.toDisplay}'` +
        (step.brandOnly ? ` [SHIVNATH brand only${step.staysPut ? `, ${step.staysPut} stay` : ''}]` : '')
    );
  }
  console.log(`TOTAL TO MOVE: ${total}`);

  if (DRY_RUN) {
    console.log('\nDry run complete - no writes made.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ---------- execute ----------
  const rollbackMap = [];
  for (const step of plan) {
    if (step.count === 0) continue;
    const target = newSubByDisplay[step.toDisplay];
    if (!target) throw new Error(`Missing target sub '${step.toDisplay}'`);
    const filter = { categoryRef: step.fromSubId };
    if (step.brandOnly) filter.brand = { $regex: /^shivnath$/i };
    const res = await Product.updateMany(filter, {
      $set: {
        categoryRef: target._id,
        category: target.slug,
        subCategory: target.slug,
      },
    });
    rollbackMap.push({
      from: String(step.fromSubId),
      to: String(target._id),
      moved: res.modifiedCount,
    });
    console.log(`moved ${res.modifiedCount}x -> '${step.toDisplay}'`);
  }

  // refresh counts on new subs
  for (const [display, sub] of Object.entries(newSubByDisplay)) {
    const c = await Product.countDocuments({ categoryRef: sub._id });
    await Category.updateOne({ _id: sub._id }, { $set: { productCount: c } });
    console.log(`new sub '${display}': ${c} products`);
  }

  // refresh + deactivate old parents and their HP subs
  for (const parentSlug of OLD_PARENT_SLUGS) {
    const parent = await Category.findOne({
      company: company._id,
      slug: parentSlug,
      parent: null,
    });
    if (!parent) continue;
    const children = await Category.find({ parent: parent._id });
    for (const child of children) {
      const c = await Product.countDocuments({ categoryRef: child._id });
      await Category.updateOne(
        { _id: child._id },
        { $set: { productCount: c, isActive: false, showOnWebsite: false } }
      );
      if (c > 0) console.log(`WARN: ${c} stragglers left on '${child.name}'`);
    }
    const remaining = await Product.countDocuments({
      categoryRef: parent._id,
    });
    await Category.updateOne(
      { _id: parent._id },
      {
        $set: {
          productCount: remaining,
          isActive: false,
          showOnWebsite: false,
        },
      }
    );
    if (remaining > 0)
      console.log(`WARN: ${remaining} stragglers left on '${parent.name}'`);
  }

  console.log('\nROLLBACK MAP:', JSON.stringify(rollbackMap));
  console.log('DONE. Old parents + HP subs deactivated (reversible).');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
