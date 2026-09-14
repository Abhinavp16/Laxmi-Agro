require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

/* ============================================================
 * Carve crowded HP (and V4 2HP phase) groups out of the merged
 * model subs into sibling subs. No dashes in display names.
 *
 *   Shivnath Sub Pumps: V4 1.5 HP, V4 2 HP SP, V4 2 HP TP,
 *     V4 3 HP, V6 30 Ft 5 HP
 *   Mourya Sub Pumps: V4 1.5 HP, V4 2 HP SP, V4 2 HP TP,
 *     V4 3 HP, V6 30 Ft 5 HP, Openwell V9 7.5 HP
 *
 * Matching: first HP mention in product name (1.50->1.5 etc).
 * Phase: TP <=> T.P./TP/THREE PHASE, SP <=> S.P./SP/SINGLE PHASE.
 * Unmarked phases stay in the HP sub. '?' names stay put.
 * Model subs stay live with remainders. Statuses preserved.
 *
 * Usage: node scripts/carveCrowdedHpSubs.js [--dry-run]
 * Idempotent: safe to re-run.
 * ============================================================ */

const DRY_RUN = process.argv.includes('--dry-run');

// source sub slug -> carves [{ hp, phase ('SP'|'TP'|null), display }]
const PLAN = {
  'shivnath-sub-pumps-v4': [
    { hp: '1.5', phase: null, display: 'V4 1.5 HP' },
    { hp: '2', phase: 'SP', display: 'V4 2 HP SP' },
    { hp: '2', phase: 'TP', display: 'V4 2 HP TP' },
    { hp: '3', phase: null, display: 'V4 3 HP' },
  ],
  'shivnath-sub-pumps-v6-30-ft': [
    { hp: '5', phase: null, display: 'V6 30 Ft 5 HP' },
  ],
  'mourya-sub-pumps-v4': [
    { hp: '1.5', phase: null, display: 'V4 1.5 HP' },
    { hp: '2', phase: 'SP', display: 'V4 2 HP SP' },
    { hp: '2', phase: 'TP', display: 'V4 2 HP TP' },
    { hp: '3', phase: null, display: 'V4 3 HP' },
  ],
  'mourya-sub-pumps-v6-30-ft': [
    { hp: '5', phase: null, display: 'V6 30 Ft 5 HP' },
  ],
  'mourya-sub-pumps-openwell-v9': [
    { hp: '7.5', phase: null, display: 'Openwell V9 7.5 HP' },
  ],
};

function normHp(raw) {
  return String(parseFloat(raw));
}

function productHp(name) {
  const m = String(name || '').toUpperCase().match(/(\d+(?:\.\d+)?)\s*HP/);
  return m ? normHp(m[1]) : null;
}

function productPhase(name) {
  const n = String(name || '').toUpperCase();
  if (/T\.P\.|THREE PHASE|\bTP\b/.test(n)) return 'TP';
  if (/S\.P\.|SINGLE PHASE|\bSP\b/.test(n)) return 'SP';
  return null;
}

function scopedSlug(parentSlug, display) {
  return `${parentSlug}-${slugify(display, { lower: true, strict: true })}`;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB', DRY_RUN ? '(DRY RUN - no writes)' : '');
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');

  let totalMoves = 0;
  const leftovers = [];

  for (const [sourceSlug, carves] of Object.entries(PLAN)) {
    const source = await Category.findOne({ slug: sourceSlug });
    if (!source) {
      console.log(`SKIP source '${sourceSlug}' not found`);
      continue;
    }
    const parent = await Category.findById(source.parent);
    const companyId = source.company;
    console.log(`\n== ${source.name} (${sourceSlug})`);

    const products = await Product.find({ categoryRef: source._id }).select(
      'name status'
    );

    // match products to carves
    const moves = new Map(); // display -> products[]
    for (const p of products) {
      const hp = productHp(p.name);
      const phase = productPhase(p.name);
      const hit = carves.find(
        (c) => c.hp === hp && (c.phase === null || c.phase === phase)
      );
      if (hit) {
        if (!moves.has(hit.display)) moves.set(hit.display, []);
        moves.get(hit.display).push(p);
      } else {
        leftovers.push({ sub: source.name, name: p.name, status: p.status });
      }
    }

    for (const carve of carves) {
      const list = moves.get(carve.display) || [];
      const active = list.filter((p) => p.status === 'active').length;
      console.log(`${carve.display}: ${list.length} (${active} active)`);
      if (DRY_RUN) list.forEach((p) => console.log(` - ${p.name} [${p.status}]`));
      totalMoves += DRY_RUN ? 0 : 0;
    }

    if (DRY_RUN) continue;

    // ensure target subs (placeholder-name trick: pre-save slug regen)
    const siblings = await Category.find({ parent: parent._id });
    let nextOrder =
      siblings.reduce((m, s) => Math.max(m, Number(s.order) || 0), 0) + 1;
    for (const carve of carves) {
      const slug = scopedSlug(parent.slug, carve.display);
      let target = await Category.findOne({ company: companyId, slug });
      if (!target) {
        const created = await Category.create({
          name: `${carve.display} New`,
          company: companyId,
          parent: parent._id,
          description: `${carve.display} - part of ${parent.name}`,
          order: nextOrder++,
          isActive: true,
          showOnWebsite: true,
        });
        await Category.updateOne(
          { _id: created._id },
          { $set: { name: carve.display, slug } }
        );
        target = await Category.findById(created._id);
        console.log(`  + sub '${carve.display}' (${slug})`);
      }
      const ids = (moves.get(carve.display) || []).map((p) => p._id);
      if (ids.length === 0) continue;
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
      console.log(`  moved ${res.modifiedCount}x -> '${carve.display}'`);
      totalMoves += res.modifiedCount;
      const c = await Product.countDocuments({
        categoryRef: target._id,
        status: 'active',
      });
      await Category.updateOne(
        { _id: target._id },
        { $set: { productCount: c } }
      );
    }

    // refresh source count
    const remaining = await Product.countDocuments({
      categoryRef: source._id,
      status: 'active',
    });
    await Category.updateOne(
      { _id: source._id },
      { $set: { productCount: remaining } }
    );
    console.log(`source '${source.name}' remainder: ${remaining} active`);
  }

  if (DRY_RUN) {
    console.log(`\nLeftovers staying put: ${leftovers.length}`);
    const bySub = {};
    leftovers.forEach((l) => {
      bySub[l.sub] = bySub[l.sub] || [];
      bySub[l.sub].push(l.name);
    });
    for (const [sub, names] of Object.entries(bySub)) {
      console.log(` ${sub} keeps ${names.length}: ${names.slice(0, 6).join(' | ')}${names.length > 6 ? ' ...' : ''}`);
    }
    console.log('\nDry run complete - no writes made.');
  } else {
    console.log(`\nTOTAL MOVED: ${totalMoves}`);
    console.log('DONE.');
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
