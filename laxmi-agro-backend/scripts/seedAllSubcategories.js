require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

/* ============================================================
 * Master taxonomy migration: Category -> Subcategory -> Products
 * - Idempotent: safe to re-run. Unmatched products stay on parent.
 * - Display names stay clean ("2 HP"); slugs are parent-scoped
 *   ("mourya-sub-v-4-20-feet-2-hp") to respect the per-brand
 *   unique slug constraint.
 * - STEP 0 merges the duplicate openwell categories first.
 * ============================================================ */

const MOURYA_V7_SS_ID = '6a33bcb3a31cf8a44e3313e2'; // survivor
const SHIVNATH_OPENWELL_ID = '6a33c76c2c8f4a73ab4ec480'; // loser -> deactivated

function hpBucket(name) {
  const n = String(name || '').toUpperCase().replace(/\(4\)/g, '');
  const m = n.match(/(\d+(?:\.\d+)?)\s*HP/);
  if (!m) return null;
  return `${parseFloat(m[1])} HP`;
}

function diaBucket(name) {
  const m = String(name || '').match(/(\d+(?:\.\d+)?)\s*(?:inch|[”"“])/i);
  if (!m) return null;
  return `${parseFloat(m[1])} inch`;
}

function sqmmBucket(name) {
  const m = String(name || '').match(/(\d+(?:\.\d+)?)\s*sqmm/i);
  if (!m) return null;
  return `${m[1]} sqmm`;
}

function coreBucket(name) {
  const m = String(name || '').match(/([234])\s*core/i);
  if (!m) return null;
  return `${m[1]} Core`;
}

function wireBrandBucket(name) {
  const m = String(name || '').match(/^\s*(Ideal|Folex|Shivnath)/i);
  if (!m) return null;
  return m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
}

function panelTypeBucket(name) {
  const n = String(name || '').toUpperCase();
  if (n.includes('MCB')) return 'MCB';
  if (n.includes('BCH')) return 'BCH';
  if (n.includes('RELAY')) return 'Relay';
  return 'T.P. Panel';
}

function stageBucket(name) {
  const m = String(name || '').match(/(\d+)\s*STAGE/i);
  if (!m) return null;
  return `${m[1]} Stage`;
}

function starterOilBucket(name) {
  const n = String(name || '');
  if (/bentex/i.test(n)) return 'Bentex 7.5 HP';
  if (/1\.5/.test(n)) return '1.5 Ltr';
  return '1 Ltr';
}

// parentSlug -> bucketizer + display-order hint + model prefix.
// prefix is REQUIRED wherever the same bucket labels repeat inside one
// brand, because category names are unique per (company, name).
const PLAN = {
  // ---- AQUA GOLDEN pumps (HP) ----
  'mayur-pankh-v-4': { fn: stageBucket, order: 'alpha', prefix: '' },
  'aquagolden-v-6-sub-pump': { fn: hpBucket, order: 'hp', prefix: 'V-6 30ft' },
  'aquagolden-sub-v-6-50ft': { fn: hpBucket, order: 'hp', prefix: 'V-6 50ft' },
  'sub-v-3-13-feet': { fn: hpBucket, order: 'hp', prefix: 'V-3' },
  'aquagolden-v-4-submersible-pump': { fn: hpBucket, order: 'hp', prefix: 'V-4' },
  // ---- MOURYA pumps (HP) ----
  'mourya-sub-v-3-13-feet': { fn: hpBucket, order: 'hp', prefix: 'V-3' },
  'mourya-sub-v-4-20-feet': { fn: hpBucket, order: 'hp', prefix: 'V-4' },
  'mourya-sub-v-4-20-feet-lota-body': { fn: hpBucket, order: 'hp', prefix: 'V-4 Lota' },
  'mourya-sub-v-5-25-feet': { fn: hpBucket, order: 'hp', prefix: 'V-5' },
  'mourya-sub-v-6-30-feet': { fn: hpBucket, order: 'hp', prefix: 'V-6 30ft' },
  'mourya-sub-v-6-50-feet': { fn: hpBucket, order: 'hp', prefix: 'V-6 50ft' },
  // ---- SHIVNATH pumps (HP) ----
  'shivnath-sub-v-4-20-feet': { fn: hpBucket, order: 'hp', prefix: 'V-4' },
  'shivnath-sub-v-6-30-feet-k-type': { fn: hpBucket, order: 'hp', prefix: 'V-6 30ft' },
  'shivnath-sub-v-6-50-feet': { fn: hpBucket, order: 'hp', prefix: 'V-6 50ft' },
  'shivnath-sub-v-5-25-feet-q-type': { fn: hpBucket, order: 'hp', prefix: 'V-5' },
  'shivnath-sub-v-3-13-feet': { fn: hpBucket, order: 'hp', prefix: 'V-3' },
  'shivnath-sub-v-4-20-feet-lota-body': { fn: hpBucket, order: 'hp', prefix: 'V-4 Lota' },
  // ---- Openwell (HP) ----
  'mourya-openwell-v-7-ci': { fn: hpBucket, order: 'hp', prefix: 'V-7 CI' },
  'mourya-openwell-v-9-ci': { fn: hpBucket, order: 'hp', prefix: 'V-9 CI' },
  'mourya-openwell-v-9-ss': { fn: hpBucket, order: 'hp', prefix: 'V-9 SS' },
  'open-well-ci-body': { fn: hpBucket, order: 'hp', prefix: 'Vertical' },
  'open-well-ss-body-v-7': { fn: hpBucket, order: 'hp', prefix: 'V-7 SS' }, // merged survivor (MOURYA)
  // ---- Pipes (diameter) ----
  'pvc-column-pipes': { fn: diaBucket, order: 'num', prefix: 'Column' },
  'ashirvad-column-pipes': { fn: diaBucket, order: 'num', prefix: '' },
  'finolex-hdep-pipes': { fn: diaBucket, order: 'num', prefix: '' },
  'roll-pipe': { fn: diaBucket, order: 'num', prefix: 'Roll' },
  'gi-pipes': { fn: diaBucket, order: 'num', prefix: 'GI' },
  'column-adopter': { fn: diaBucket, order: 'num', prefix: 'Adopter' },
  // ---- Cables ----
  'submersible-cable': { fn: sqmmBucket, order: 'num', prefix: '' },
  'service-cable': { fn: coreBucket, order: 'num', prefix: '' },
  'service-wire-aluminium': { fn: wireBrandBucket, order: 'alpha', prefix: '' },
  // ---- Panels ----
  'control-panels': { fn: panelTypeBucket, order: 'alpha', prefix: '' },
  // ---- Misc ----
  'starter-oil': { fn: starterOilBucket, order: 'alpha', prefix: '' },
};

// One-off rename of subs created by the first partial run (plain "3 HP"
// style) to the prefixed scheme, keeping product links intact.
const RENAME_FIX = [
  { oldSlug: 'aquagolden-v-6-sub-pump-3-hp', name: 'V-6 30ft 3 HP' },
  { oldSlug: 'aquagolden-v-6-sub-pump-4-hp', name: 'V-6 30ft 4 HP' },
  { oldSlug: 'aquagolden-v-6-sub-pump-5-hp', name: 'V-6 30ft 5 HP' },
  { oldSlug: 'aquagolden-v-6-sub-pump-6-hp', name: 'V-6 30ft 6 HP' },
  { oldSlug: 'aquagolden-v-6-sub-pump-75-hp', name: 'V-6 30ft 7.5 HP' },
];

function displayName(prefix, bucket) {
  return prefix ? `${prefix} ${bucket}` : bucket;
}

function scopedSlug(parentSlug, display) {
  return `${parentSlug}-${slugify(display, { lower: true, strict: true })}`;
}

function sortDisplays(displays, order) {
  const arr = [...displays];
  if (order === 'hp' || order === 'num') {
    arr.sort((a, b) => parseFloat(a) - parseFloat(b));
  } else {
    arr.sort((a, b) => a.localeCompare(b));
  }
  return arr;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');

  /* ---------- STEP 0: merge duplicate openwell ---------- */
  const survivor = await Category.findById(MOURYA_V7_SS_ID);
  const loser = await Category.findById(SHIVNATH_OPENWELL_ID);
  if (!survivor || !loser) {
    console.error('Openwell merge pair not found!');
    process.exit(1);
  }
  if (loser.isActive !== false) {
    const moving = await Product.find({ categoryRef: loser._id });
    console.log(`Merging: moving ${moving.length} products SHIVNATH OPENWELL -> MOURYA V-7 SS`);
    for (const p of moving) {
      p.categoryRef = survivor._id;
      p.category = survivor.slug;
      p.subCategory = survivor.slug;
      await p.save();
    }
    loser.isActive = false;
    loser.showOnWebsite = false;
    await loser.save();
    console.log('Loser deactivated (reversible).');
  } else {
    console.log('Merge already done (loser inactive). Verifying no stragglers...');
    const stragglers = await Product.countDocuments({ categoryRef: loser._id });
    console.log(`Stragglers on loser: ${stragglers}`);
  }

  /* ---------- STEP 0b: rename fix from partial run ---------- */
  for (const fix of RENAME_FIX) {
    const sub = await Category.findOne({ slug: fix.oldSlug });
    if (!sub) continue;
    const newSlug = scopedSlug(
      String((await Category.findById(sub.parent))?.slug || 'cat'),
      fix.name
    );
    await Category.updateOne({ _id: sub._id }, { $set: { name: fix.name, slug: newSlug } });
    await Product.updateMany(
      { categoryRef: sub._id },
      { $set: { category: newSlug, subCategory: newSlug } }
    );
    console.log(`Renamed '${fix.oldSlug}' -> '${fix.name}' (${newSlug})`);
  }

  /* ---------- STEP 1: subcategories per plan ---------- */
  const grand = { subs: 0, moved: 0, unmatched: 0 };
  for (const [parentSlug, rule] of Object.entries(PLAN)) {
    // 'open-well-ss-body-v-7' exists twice (survivor + deactivated loser):
    // always use the active survivor by id.
    const parent =
      parentSlug === 'open-well-ss-body-v-7'
        ? await Category.findById(MOURYA_V7_SS_ID)
        : await Category.findOne({ slug: parentSlug, parent: null, isActive: true });
    if (!parent) {
      console.log(`SKIP parent slug '${parentSlug}' not found`);
      continue;
    }
    const products = await Product.find({
      $or: [{ categoryRef: parent._id }, { category: { $in: [parent.name, parent.slug] } }],
    })
      // NOTE: 'slug' must be selected, otherwise pre('save') regenerates it
      // from name and collides with same-named products of other brands.
      .select('name slug categoryRef category subCategory');

    // bucketize first (so sub creation order is deterministic)
    const buckets = new Map(); // display -> products[]
    const unmatched = [];
    for (const p of products) {
      // skip products already sitting on a subcategory (from earlier runs)
      if (String(p.categoryRef || '') !== String(parent._id)) continue;
      const bucket = rule.fn(p.name);
      if (!bucket) {
        unmatched.push(p.name);
        continue;
      }
      const display = displayName(rule.prefix, bucket);
      if (!buckets.has(bucket)) buckets.set(bucket, { display, products: [] });
      buckets.get(bucket).products.push(p);
    }

    // sort by raw bucket value ("3 HP" -> 3), display carries the prefix
    const orderedBuckets = sortDisplays(buckets.keys(), rule.order);
    const orderedDisplays = orderedBuckets.map((b) => buckets.get(b).display);
    let idx = 0;
    for (const bucket of orderedBuckets) {
      const display = buckets.get(bucket).display;
      const slug = scopedSlug(parent.slug, display);
      let sub = await Category.findOne({ company: parent.company, slug });
      if (!sub) {
        const created = await Category.create({
          name: display,
          company: parent.company,
          parent: parent._id,
          description: `${display} - part of ${parent.name}`,
          order: idx,
          isActive: true,
          showOnWebsite: true,
        });
        // bypass slug-regenerating pre-save hook to keep scoped slug
        await Category.updateOne({ _id: created._id }, { $set: { slug } });
        sub = await Category.findById(created._id);
        console.log(`  + sub '${display}' (${slug})`);
        grand.subs += 1;
      }
      for (const p of buckets.get(bucket).products) {
        p.categoryRef = sub._id;
        p.category = sub.slug;
        p.subCategory = sub.slug;
        await p.save();
        grand.moved += 1;
      }
      const c = await Product.countDocuments({ categoryRef: sub._id });
      await Category.updateOne({ _id: sub._id }, { $set: { productCount: c } });
      idx += 1;
    }

    const remaining = await Product.countDocuments({ categoryRef: parent._id });
    await Category.updateOne({ _id: parent._id }, { $set: { productCount: remaining } });
    grand.unmatched += unmatched.length;
    console.log(
      `${parent.name}: subs=${orderedDisplays.length} [${orderedDisplays.join(' | ')}] remaining=${remaining}` +
        (unmatched.length ? ` UNMATCHED=${JSON.stringify(unmatched)}` : '')
    );
  }

  console.log('\nGRAND TOTAL:', JSON.stringify(grand));
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
