require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

/* ============================================================
 * Mourya pump merge: 11 old parents + model subs -> ONE parent
 * "Mourya Sub Pumps" with 7 model subs (no dashes in names).
 *
 *   Mourya Sub Pumps
 *   |-- V4            <- 6 HP subs of Mourya Sub V-4 20 Feet
 *   |-- V6 30 Ft      <- 6 HP subs of Mourya Sub V-6 30 Feet
 *   |-- V6 50 Ft      <- 6 HP subs of Mourya Sub V-6 50 Feet
 *   |-- V5            <- 6 HP subs of Mourya Sub V-5 25 Feet
 *   |-- V3            <- 3 HP subs of Mourya Sub V-3 13 Feet
 *   |-- V4 Lota Body  <- 4 Lota HP subs of Mourya Sub V-4 Lota Body
 *   |-- Openwells     <- all subs of the 5 openwell parents
 *                        (V-7 CI/SS, V-9 CI/SS, Vertical)
 *
 * Cables (SUBMERSIBLE CABLE, MOURYA SERVICE CABLE) untouched.
 * Old parents + subs deactivated (isActive=false), never deleted.
 *
 * Usage: node scripts/mergeMouryaSubPumps.js [--dry-run]
 * Idempotent: safe to re-run. Already-moved products are skipped.
 * ============================================================ */

const DRY_RUN = process.argv.includes('--dry-run');

// Old MOURYA parents (slugs company-scoped; 'open-well-ss-body-v-7'
// exists twice - always scope by company + parent:null).
const OLD_PARENT_SLUGS = [
  'mourya-sub-v-3-13-feet',
  'mourya-sub-v-4-20-feet',
  'mourya-sub-v-4-20-feet-lota-body',
  'mourya-sub-v-5-25-feet',
  'mourya-sub-v-6-30-feet',
  'mourya-sub-v-6-50-feet',
  'mourya-openwell-v-7-ci',
  'open-well-ss-body-v-7', // MOURYA V-7 SS (SHIVNATH products already moved out)
  'mourya-openwell-v-9-ci',
  'mourya-openwell-v-9-ss',
  'open-well-ci-body', // MOURYA VERTICAL OPENWELL
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

const NEW_PARENT_NAME = 'Mourya Sub Pumps';
const NEW_PARENT_SLUG = 'mourya-sub-pumps';

const MODEL_BY_PARENT_SLUG = {
  'mourya-sub-v-3-13-feet': 'V3',
  'mourya-sub-v-4-20-feet': 'V4',
  'mourya-sub-v-4-20-feet-lota-body': 'V4 Lota Body',
  'mourya-sub-v-5-25-feet': 'V5',
  'mourya-sub-v-6-30-feet': 'V6 30 Ft',
  'mourya-sub-v-6-50-feet': 'V6 50 Ft',
  'mourya-openwell-v-7-ci': 'Openwells',
  'open-well-ss-body-v-7': 'Openwells',
  'mourya-openwell-v-9-ci': 'Openwells',
  'mourya-openwell-v-9-ss': 'Openwells',
  'open-well-ci-body': 'Openwells',
};

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

  const company = await Company.findOne({ name: 'MOURYA' });
  if (!company) {
    console.error('MOURYA company not found!');
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
      description: 'Mourya submersible pumps - all models',
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
    const directCount = await Product.countDocuments({
      categoryRef: parent._id,
    });
    if (directCount > 0) {
      console.log(
        `NOTE: ${directCount} products sit directly on old parent '${parent.name}' - mapping to '${MODEL_BY_PARENT_SLUG[parentSlug]}'`
      );
      plan.push({
        fromSubId: parent._id,
        fromSlug: parent.slug,
        fromName: parent.name,
        toDisplay: MODEL_BY_PARENT_SLUG[parentSlug],
        count: directCount,
      });
    }
    const children = await Category.find({ parent: parent._id }).lean();
    for (const child of children) {
      const count = await Product.countDocuments({
        categoryRef: child._id,
      });
      const nonMourya = await Product.countDocuments({
        categoryRef: child._id,
        $nor: [
          { brand: { $regex: /^mourya$/i } },
          { brand: { $exists: false } },
          { brand: '' },
        ],
      });
      plan.push({
        fromSubId: child._id,
        fromSlug: child.slug,
        fromName: child.name,
        toDisplay: MODEL_BY_PARENT_SLUG[parentSlug],
        count,
        nonMourya,
      });
    }
  }

  // ---------- report ----------
  let total = 0;
  console.log('\n--- MOVE PLAN ---');
  for (const step of plan) {
    total += step.count;
    console.log(
      `${step.count}x '${step.fromName}' (${step.fromSlug}) -> '${step.toDisplay}'` +
        (step.nonMourya ? ` [WARN ${step.nonMourya} non-MOURYA]` : '')
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
    const res = await Product.updateMany(
      { categoryRef: step.fromSubId },
      {
        $set: {
          categoryRef: target._id,
          category: target.slug,
          subCategory: target.slug,
        },
      }
    );
    rollbackMap.push({
      from: String(step.fromSubId),
      to: String(target._id),
      moved: res.modifiedCount,
    });
    console.log(`moved ${res.modifiedCount}x -> '${step.toDisplay}'`);
  }

  // refresh counts on new subs (active products only)
  for (const [display, sub] of Object.entries(newSubByDisplay)) {
    const c = await Product.countDocuments({
      categoryRef: sub._id,
      status: 'active',
    });
    await Category.updateOne({ _id: sub._id }, { $set: { productCount: c } });
    console.log(`new sub '${display}': ${c} products`);
  }

  // refresh + deactivate old parents and their subs
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
  console.log('DONE. Old parents + subs deactivated (reversible).');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
