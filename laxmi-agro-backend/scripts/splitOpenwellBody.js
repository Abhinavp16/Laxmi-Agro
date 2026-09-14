require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

/* ============================================================
 * Split openwell subs by BODY (CI vs SS). No dashes in names.
 * Dots are stripped before matching so S.S./C.I. always hit.
 *
 *   Mourya Openwell V7      -> Openwell V7 CI Body / Openwell V7 SS Body
 *   Mourya Openwell V9      -> Openwell V9 CI Body / Openwell V9 SS Body
 *   Mourya Openwell V9 7.5 HP -> Openwell V9 7.5 HP CI Body / ... SS Body
 *   Shivnath Openwells      -> Openwell CI Body / Openwell SS Body
 *   Mourya Openwell Vertical-> verified all-CI: left as-is
 *
 * Rule: CI w/o SS => CI Body; SS w/o CI => SS Body; both/neither
 * are reported in dry-run and stay put until classified.
 * Statuses preserved. emptied sources deactivated (reversible).
 *
 * Usage: node scripts/splitOpenwellBody.js [--dry-run]
 * Idempotent: safe to re-run.
 * ============================================================ */

const DRY_RUN = process.argv.includes('--dry-run');

// source sub slug -> { CI: display, SS: display }
const PLAN = {
  'mourya-sub-pumps-openwell-v7': {
    CI: 'Openwell V7 CI Body',
    SS: 'Openwell V7 SS Body',
  },
  'mourya-sub-pumps-openwell-v9': {
    CI: 'Openwell V9 CI Body',
    SS: 'Openwell V9 SS Body',
  },
  'mourya-sub-pumps-openwell-v9-75-hp': {
    CI: 'Openwell V9 7.5 HP CI Body',
    SS: 'Openwell V9 7.5 HP SS Body',
  },
  'shivnath-sub-pumps-openwells': {
    CI: 'Openwell CI Body',
    SS: 'Openwell SS Body',
  },
  'mourya-sub-pumps-openwell-vertical': {
    CI: 'Openwell Vertical CI Body',
    SS: 'Openwell Vertical SS Body',
  },
};

function scopedSlug(parentSlug, display) {
  return `${parentSlug}-${slugify(display, { lower: true, strict: true })}`;
}

// Dots REMOVED (not spaced) so "S.S."/"C.I." become SS/CI and match.
function bodyOf(p) {
  // Manual overrides: no body marker, but each came from an SS-body
  // old sub (verified in dry-run).
  const OVERRIDES = {
    'MR-OP-2-V-7': 'SS',
    'MR-OP-2-TP-V-7': 'SS',
    'MR-OP-3-V-7-2.5': 'SS',
    'MR-OP-V-7-5-2.5': 'SS',
    'MR-OP-V9-7.5-2.5': 'SS',
  };
  if (OVERRIDES[p.sku]) return OVERRIDES[p.sku];
  const hay = `${p.name} ${p.sku} ${(p.tags || []).join(' ')}`
    .toUpperCase()
    .replace(/\./g, '');
  const ci = /\bCI\b/.test(hay);
  const ss = /\bSS\b/.test(hay);
  if (ci && !ss) return 'CI';
  if (ss && !ci) return 'SS';
  return 'UNCLEAR';
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB', DRY_RUN ? '(DRY RUN - no writes)' : '');
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');

  for (const [sourceSlug, targets] of Object.entries(PLAN)) {
    const source = await Category.findOne({ slug: sourceSlug });
    if (!source) {
      console.log(`SKIP source '${sourceSlug}' not found`);
      continue;
    }
    const parent = await Category.findById(source.parent);
    const companyId = source.company;
    console.log(`\n== ${source.name} (${sourceSlug})`);

    const products = await Product.find({ categoryRef: source._id }).select(
      'name sku tags status'
    );
    const buckets = { CI: [], SS: [], UNCLEAR: [] };
    for (const p of products) buckets[bodyOf(p)].push(p);

    for (const key of ['CI', 'SS', 'UNCLEAR']) {
      const list = buckets[key];
      const active = list.filter((p) => p.status === 'active').length;
      console.log(`${key}: ${list.length} (${active} active)`);
      list.forEach((p) => console.log(` - ${p.name} [${p.status}]`));
    }

    if (DRY_RUN) continue;

    // ensure target subs (placeholder-name trick: pre-save slug regen)
    const siblings = await Category.find({ parent: parent._id });
    let nextOrder =
      siblings.reduce((m, s) => Math.max(m, Number(s.order) || 0), 0) + 1;
    for (const key of ['CI', 'SS']) {
      const display = targets[key];
      const slug = scopedSlug(parent.slug, display);
      let target = await Category.findOne({ company: companyId, slug });
      if (!target) {
        const created = await Category.create({
          name: `${display} New`,
          company: companyId,
          parent: parent._id,
          description: `${display} - part of ${parent.name}`,
          order: nextOrder++,
          isActive: true,
          showOnWebsite: true,
        });
        await Category.updateOne(
          { _id: created._id },
          { $set: { name: display, slug } }
        );
        target = await Category.findById(created._id);
        console.log(`  + sub '${display}' (${slug})`);
      }
      const ids = buckets[key].map((p) => p._id);
      if (ids.length === 0) {
        // leave empty-but-live subs out: remove if we just created and unused
        continue;
      }
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
      console.log(`  moved ${res.modifiedCount}x -> '${display}'`);
      const c = await Product.countDocuments({
        categoryRef: target._id,
        status: 'active',
      });
      await Category.updateOne(
        { _id: target._id },
        { $set: { productCount: c } }
      );
    }

    // remove freshly created but unused target subs (e.g. all-CI Vertical)
    for (const key of ['CI', 'SS']) {
      const slug = scopedSlug(parent.slug, targets[key]);
      const target = await Category.findOne({ company: companyId, slug });
      if (!target) continue;
      const c = await Product.countDocuments({ categoryRef: target._id });
      if (c === 0) {
        await Category.deleteOne({ _id: target._id });
        console.log(`  - removed unused '${targets[key]}'`);
      }
    }

    const remaining = await Product.countDocuments({
      categoryRef: source._id,
    });
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
        ? `source '${source.name}' empty -> deactivated (reversible)`
        : `source '${source.name}' keeps ${remaining} (UNCLEAR, still live)`
    );
  }

  if (DRY_RUN) console.log('\nDry run complete - no writes made.');
  else console.log('\nDONE.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
