require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

/* ============================================================
 * Jhatka normalization (brand GENERAL PRODUCTS):
 *
 *   Jhatka                  (renamed from JHATKA MACHINE,
 *                            slug jhatka-machine UNCHANGED)
 *   |-- Jhatka Machine      (new sub, 4 products moved off parent)
 *   |-- Solar Plates        (renamed from Solar plate, slug kept)
 *   |-- Jhatka Accessories  (already correct, untouched)
 *
 * Display names only - slugs never change, so no link breakage.
 * No dashes in display names.
 *
 * Usage: node scripts/mergeJhatka.js [--dry-run]
 * Idempotent: safe to re-run.
 * ============================================================ */

const DRY_RUN = process.argv.includes('--dry-run');

const PARENT_SLUG = 'jhatka-machine';
const NEW_PARENT_NAME = 'Jhatka';
const MACHINE_SUB_NAME = 'Jhatka Machine';
const SOLAR_OLD_NAME = 'Solar plate';
const SOLAR_NEW_NAME = 'Solar Plates';

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

  const company = await Company.findOne({ name: 'GENERAL PRODUCTS' });
  if (!company) {
    console.error('GENERAL PRODUCTS company not found!');
    process.exit(1);
  }

  const parent = await Category.findOne({
    company: company._id,
    slug: PARENT_SLUG,
    parent: null,
  });
  if (!parent) {
    console.error(`Parent '${PARENT_SLUG}' not found!`);
    process.exit(1);
  }
  console.log(`parent: '${parent.name}' (${parent.slug})`);

  // 1. rename parent display
  if (parent.name !== NEW_PARENT_NAME) {
    console.log(`rename parent '${parent.name}' -> '${NEW_PARENT_NAME}' (slug kept)`);
    if (!DRY_RUN) {
      await Category.updateOne(
        { _id: parent._id },
        { $set: { name: NEW_PARENT_NAME } }
      );
    }
  } else {
    console.log('parent name already correct');
  }

  // 2. ensure Jhatka Machine sub
  const machineSlug = scopedSlug(PARENT_SLUG, MACHINE_SUB_NAME);
  let machineSub = await Category.findOne({
    company: company._id,
    slug: machineSlug,
  });
  // NOTE: pre('save') regenerates slug from name, and "Jhatka Machine"
  // slugifies to the parent's slug ("jhatka-machine") -> E11000. So
  // create with a unique placeholder name, then set name + slug.
  if (!machineSub) {
    console.log(`would ensure sub '${MACHINE_SUB_NAME}' (${machineSlug})`);
    if (!DRY_RUN) {
      const created = await Category.create({
        name: `${MACHINE_SUB_NAME} New`,
        company: company._id,
        parent: parent._id,
        description: `${MACHINE_SUB_NAME} - part of ${NEW_PARENT_NAME}`,
        order: 0,
        isActive: true,
        showOnWebsite: true,
      });
      await Category.updateOne(
        { _id: created._id },
        { $set: { name: MACHINE_SUB_NAME, slug: machineSlug } }
      );
      machineSub = await Category.findById(created._id);
      console.log(`  + sub '${MACHINE_SUB_NAME}' (${machineSlug})`);
    }
  } else {
    console.log(`sub '${MACHINE_SUB_NAME}' exists (${machineSlug})`);
  }

  // 3. rename Solar plate -> Solar Plates (display only)
  const solar = await Category.findOne({ parent: parent._id, slug: 'solar-plate' });
  if (solar && solar.name !== SOLAR_NEW_NAME) {
    console.log(`rename sub '${solar.name}' -> '${SOLAR_NEW_NAME}' (slug kept)`);
    if (!DRY_RUN) {
      await Category.updateOne(
        { _id: solar._id },
        { $set: { name: SOLAR_NEW_NAME } }
      );
    }
  } else if (solar) {
    console.log('solar sub name already correct');
  } else {
    console.log("SKIP solar sub 'solar-plate' not found");
  }

  // 4. move direct parent products -> Jhatka Machine
  const direct = await Product.find({ categoryRef: parent._id }).select(
    'name status'
  );
  console.log(`\n${direct.length}x products directly on parent -> '${MACHINE_SUB_NAME}'`);
  direct.forEach((p) => console.log(` - ${p.name} [${p.status}]`));

  if (!DRY_RUN) {
    if (direct.length > 0 && !machineSub) {
      throw new Error('Machine sub missing - cannot move products');
    }
    if (direct.length > 0) {
      const res = await Product.updateMany(
        { categoryRef: parent._id },
        {
          $set: {
            categoryRef: machineSub._id,
            category: machineSub.slug,
            subCategory: machineSub.slug,
          },
        }
      );
      console.log(`moved ${res.modifiedCount}x`);
    }
    // refresh counts (active only)
    const subs = await Category.find({ parent: parent._id });
    for (const sub of subs) {
      const c = await Product.countDocuments({
        categoryRef: sub._id,
        status: 'active',
      });
      await Category.updateOne(
        { _id: sub._id },
        { $set: { productCount: c } }
      );
      const fresh = await Category.findById(sub._id).lean();
      console.log(`sub '${fresh.name}': ${c} products`);
    }
    const remaining = await Product.countDocuments({
      categoryRef: parent._id,
    });
    await Category.updateOne(
      { _id: parent._id },
      { $set: { productCount: remaining } }
    );
    if (remaining > 0) console.log(`WARN: ${remaining} stragglers on parent`);
    else console.log('parent holds 0 products directly');
  } else {
    console.log('\nDry run complete - no writes made.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
