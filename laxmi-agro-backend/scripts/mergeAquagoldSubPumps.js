require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

/* ============================================================
 * Aquagold pump merge: 4 old parents + HP subs -> ONE parent
 * "Aquagold Sub Pumps" with 4 model subs (no dashes in names).
 *
 *   Aquagold Sub Pumps
 *   |-- V4       <- 5 HP subs of AQUAGOLDEN v-4 SUB PUMP
 *   |-- V6 30 Ft <- 5 HP subs of AQUAGOLDEN SUB V-6 30ft
 *   |-- V6 50 Ft <- 4 HP subs of AQUAGOLDEN SUB V-6 50ft
 *   |-- V3       <- 3 HP subs of AQUAGOLDEN v3 SUBMERSIBLE
 *
 * MAYUR PANKH v-4 (stage-based subs) stays as its own parent.
 * Old parents + HP subs deactivated (isActive=false), never deleted.
 *
 * Usage: node scripts/mergeAquagoldSubPumps.js [--dry-run]
 * Idempotent: safe to re-run. Already-moved products are skipped.
 * ============================================================ */

const DRY_RUN = process.argv.includes('--dry-run');

// Old AQUA GOLDEN pump parents (slugs company-scoped).
const OLD_PARENT_SLUGS = [
  'aquagolden-v-4-submersible-pump',
  'aquagolden-v-6-sub-pump',
  'aquagolden-sub-v-6-50ft',
  'sub-v-3-13-feet', // generic slug - scoped by company + parent:null
];

// New model subs in display order. No dashes in display names.
const NEW_SUBS = [
  { display: 'V4', order: 0 },
  { display: 'V6 30 Ft', order: 1 },
  { display: 'V6 50 Ft', order: 2 },
  { display: 'V3', order: 3 },
];

const NEW_PARENT_NAME = 'Aquagold Sub Pumps';
const NEW_PARENT_SLUG = 'aquagold-sub-pumps';

const MODEL_BY_PARENT_SLUG = {
  'aquagolden-v-4-submersible-pump': 'V4',
  'aquagolden-v-6-sub-pump': 'V6 30 Ft',
  'aquagolden-sub-v-6-50ft': 'V6 50 Ft',
  'sub-v-3-13-feet': 'V3',
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

  const company = await Company.findOne({ name: 'AQUA GOLDEN' });
  if (!company) {
    console.error('AQUA GOLDEN company not found!');
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
      description: 'Aquagold submersible pumps - all models',
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
    if (String(parent.company) !== String(company._id)) {
      console.log(`SKIP '${parentSlug}' belongs to another brand - not touching`);
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
      plan.push({
        fromSubId: child._id,
        fromSlug: child.slug,
        fromName: child.name,
        toDisplay: MODEL_BY_PARENT_SLUG[parentSlug],
        count,
      });
    }
  }

  // ---------- report ----------
  let total = 0;
  console.log('\n--- MOVE PLAN ---');
  for (const step of plan) {
    total += step.count;
    console.log(
      `${step.count}x '${step.fromName}' (${step.fromSlug}) -> '${step.toDisplay}'`
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
