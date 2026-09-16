require('dotenv').config();
/* ============================================================
 * Brand restructure APPLY (Mourya + Shivnath) — v3 final.
 * DEFAULT = DRY RUN (prints plan, writes nothing).
 * Run with --apply to execute. Backup already in .local/.
 * Rulings: live numbers win; Lota HP-splits; mirror live
 * parse incl. phases; panels -> new adjacent brand; existing
 * names kept, order follows paper sequence.
 * ============================================================ */
const mongoose = require('mongoose');
const slugify = require('slugify');

const APPLY = process.argv.includes('--apply');

function parseHp(name) {
  const n = String(name || '').toUpperCase().replace(/\(4\)/g, '');
  const m = n.match(/(\d+(?:\.\d+)?)\s*H\.?\s*P\.?/);
  if (!m) return null;
  return parseFloat(m[1]);
}
function parsePhase(name) {
  const n = String(name || '').toUpperCase();
  const sp = /\bS\.?\s*P\.?\b/.test(n);
  const tp = /\bT\.?\s*P\.?\b/.test(n);
  if (sp && tp) return 'BOTH';
  if (sp) return 'SP';
  if (tp) return 'TP';
  return null;
}
const scopedSlug = (parentSlug, display) =>
  `${parentSlug}-${slugify(display, { lower: true, strict: true })}`;
function bucketLabel(hp, phase) {
  const h = Number.isInteger(hp) ? String(hp) : String(hp);
  return phase ? `${h} HP ${phase}` : `${h} HP`;
}
const phaseRank = (b) => (b.endsWith(' SP') ? 1 : b.endsWith(' TP') ? 2 : b.endsWith(' BOTH') ? 3 : 0);
const bucketSort = (a, b) => parseFloat(a) - parseFloat(b) || phaseRank(a) - phaseRank(b);
// trailing HP bucket of a sub display name (for ordering + matching)
function trailingBucket(display, rootName) {
  const rest = display.startsWith(rootName + ' ') ? display.slice(rootName.length + 1) : display;
  const hp = parseHp(rest);
  if (hp == null) return null;
  return bucketLabel(hp, parsePhase(rest));
}

const PLAN = {
  MOURYA: ['V6 30 Ft', 'V6 50 Ft', 'V4', 'V3', 'V4 Lota Body', 'V5', 'Openwell V7 SS Body', 'Openwell V7 CI Body', 'Openwell V9 SS Body', 'Openwell V9 CI Body'],
  SHIVNATH: ['V6 30 Ft', 'V6 50 Ft', 'V4', 'V3', 'V4 Lota Body', 'V5', 'Openwell CI Body', 'Openwell SS Body'],
};
const MERGE = {
  MOURYA: { 'Openwell V9 7.5 HP CI Body': 'Openwell V9 CI Body', 'Openwell V9 7.5 HP SS Body': 'Openwell V9 SS Body' },
  SHIVNATH: {},
};
const PANEL_ROOTS = ['BCH', 'MCB', 'Relay', 'T.P. Panel'];
const UMBRELLAS = ['Mourya Sub Pumps', 'Shivnath Sub Pumps', 'SHIVNATH CONTROL PANELS'];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');
  const Company = mongoose.model('Company');

  const say = (s) => console.log(s);
  const write = async (fn) => { if (APPLY) await fn(); };

  const mourya = await Company.findOne({ name: 'MOURYA' });
  const shivnath = await Company.findOne({ name: 'SHIVNATH' });
  const allCompanies = await Company.find({}).sort({ order: 1 });
  const cats = await Category.find({ company: { $in: [mourya._id, shivnath._id] } });
  const prods = await Product.find({ company: { $in: [mourya._id, shivnath._id] } }).select('name sku category categoryRef subCategory status company');
  const byRef = {};
  for (const p of prods) {
    const k = p.categoryRef ? String(p.categoryRef) : 'NULL';
    (byRef[k] = byRef[k] || []).push(p);
  }
  const itemsOf = (id) => byRef[String(id)] || [];
  const beforeTotals = {
    MOURYA: prods.filter((p) => String(p.company) === String(mourya._id)).length,
    SHIVNATH: prods.filter((p) => String(p.company) === String(shivnath._id)).length,
  };
  say(`BEFORE_TOTALS: MOURYA=${beforeTotals.MOURYA} SHIVNATH=${beforeTotals.SHIVNATH}`);
  const findCat = (brandId, name) => cats.find((c) => String(c.company) === String(brandId) && c.name === name);
  const rootNamesAll = new Set([...PLAN.MOURYA, ...PLAN.SHIVNATH, ...PANEL_ROOTS]);

  // ---- 1. panels brand + renumber ----
  let panelCo = await Company.findOne({ name: 'Shivnath Control Panel' });
  if (!panelCo) {
    say('NEW_BRAND create: Shivnath Control Panel at order 3 (shift 3+ up by 1)');
    await write(async () => {
      panelCo = await Company.create({ name: 'Shivnath Control Panel', slug: 'shivnath-control-panel', order: 3, isActive: true, showOnWebsite: true });
      for (const c of allCompanies) if (c.order >= 3) { c.order += 1; await c.save(); }
    });
    if (!APPLY) panelCo = { _id: 'DRYRUN', name: 'Shivnath Control Panel' };
  } else say('NEW_BRAND exists already');

  // ---- 2/3. per brand ----
  for (const [brandName, brand] of [['MOURYA', mourya], ['SHIVNATH', shivnath]]) {
    say(`\n--- ${brandName} ---`);
    for (let oi = 0; oi < PLAN[brandName].length; oi += 1) {
      const rootName = PLAN[brandName][oi];
      const root = findCat(brand._id, rootName);
      if (!root) { say(`  MISSING root '${rootName}' -- SKIPPED`); continue; }
      say(`  ROOT '${rootName}' promote order=${oi}`);
      await write(async () => { root.parent = null; root.order = oi; root.isActive = true; root.showOnWebsite = true; await root.save(); });

      // pool = direct + merged sources
      let pool = [...itemsOf(root._id)];
      const mergeSources = [];
      for (const [mergeName, target] of Object.entries(MERGE[brandName] || {})) {
        if (target !== rootName) continue;
        const mdoc = findCat(brand._id, mergeName);
        if (!mdoc) { say(`    MERGE source '${mergeName}' missing -- SKIPPED`); continue; }
        pool = pool.concat(itemsOf(mdoc._id));
        mergeSources.push(mdoc);
        say(`    MERGE '${mergeName}' (${itemsOf(mdoc._id).length}) -> pool`);
      }
      // assigned HP kids (prefix match, excluding other roots/panels)
      const kids = cats.filter((c) => String(c.company) === String(brand._id) && c.parent && c.name.startsWith(rootName + ' ') && !rootNamesAll.has(c.name) && !PANEL_ROOTS.includes(c.name));
      if (kids.length) {
        say(`    ASSIGNED_KIDS: ${kids.map((k) => `'${k.name}'(${itemsOf(k._id).length})`).join(', ')}`);
        for (const k of kids) pool = pool.concat(itemsOf(k._id));
      }
      // bucketize
      const groups = {};
      const unmatched = [];
      for (const p of pool) {
        const hp = parseHp(p.name);
        if (hp == null) { unmatched.push(p.name); continue; }
        const key = bucketLabel(hp, parsePhase(p.name));
        (groups[key] = groups[key] || []).push(p);
      }
      const orderedKeys = Object.keys(groups).sort(bucketSort);
      say(`    pool=${pool.length} buckets=${orderedKeys.map((k) => `${k}:${groups[k].length}`).join(', ') || '(none)'}`);
      if (unmatched.length) say(`    UNMATCHED (${unmatched.length}): ${JSON.stringify(unmatched.slice(0, 8))}`);

      // desired final subs for this root
      const desired = orderedKeys.map((k) => `${rootName} ${k}`);
      // reuse kid docs whose name already matches (reparent under root)
      const reuseMap = {};
      for (const k of kids) {
        if (desired.includes(k.name)) {
          reuseMap[k.name] = k;
          say(`    REUSE kid '${k.name}'`);
          await write(async () => { k.parent = root._id; k.isActive = true; k.showOnWebsite = true; await k.save(); });
        }
      }
      // create missing
      for (const d of desired) {
        if (kids.some((k) => k.name === d)) continue;
        say(`    + SUB '${d}' n=${groups[d.slice(rootName.length + 1)].length}`);
        await write(async () => {
          const created = await Category.create({ name: d, company: brand._id, parent: root._id, description: `${d} - part of ${rootName}`, order: 0, isActive: true, showOnWebsite: true });
          await Category.updateOne({ _id: created._id }, { $set: { slug: scopedSlug(root.slug, d) } });
          const sub = await Category.findById(created._id);
          cats.push(sub);
        });
      }
      // move pool products into final subs (resolve live at apply)
      if (APPLY) {
        for (const key of orderedKeys) {
          const display = `${rootName} ${key}`;
          const subDoc = await Category.findOne({ company: brand._id, slug: scopedSlug(root.slug, display) });
          const fallback = subDoc || kids.find((k) => k.name === display);
          if (!fallback) { console.log(`    !! NO SUB DOC for '${display}' -- products stay`); continue; }
          const ids = groups[key].map((p) => p._id);
          await Product.updateMany({ _id: { $in: ids } }, { $set: { categoryRef: fallback._id, category: fallback.slug, subCategory: fallback.slug } });
        }
      }
      // order final children HP-ascending
      await write(async () => {
        const children = await Category.find({ parent: root._id });
        children.sort((a, b) => {
          const ba = trailingBucket(a.name, rootName);
          const bb = trailingBucket(b.name, rootName);
          if (!ba && !bb) return a.name.localeCompare(b.name);
          if (!ba) return 1;
          if (!bb) return -1;
          return bucketSort(ba, bb);
        });
        for (let i = 0; i < children.length; i += 1) { children[i].order = i; await children[i].save(); }
      });
      if (!APPLY) say('    (dry) children would be HP-ordered here');
      // retire dissolved leftovers: assigned kids not reused + merge sources (verify empty)
      const dissolved = [...kids.filter((k) => !desired.includes(k.name)), ...mergeSources];
      for (const k of dissolved) {
        await write(async () => {
          const n = await Product.countDocuments({ categoryRef: k._id });
          if (n === 0) { k.isActive = false; k.showOnWebsite = false; await k.save(); console.log(`    RETIRE '${k.name}'`); }
          else console.log(`    KEEP '${k.name}' still has ${n}`);
        });
        if (!APPLY) say(`    (dry) RETIRE '${k.name}' after empty-check`);
      }
    }
  }

  // ---- 4. panels (whole, no splits) ----
  say('\n--- PANELS -> new brand ---');
  const panelParent = cats.find((c) => String(c.company) === String(shivnath._id) && c.name === 'SHIVNATH CONTROL PANELS');
  for (let oi = 0; oi < PANEL_ROOTS.length; oi += 1) {
    const sub = cats.find((c) => panelParent && c.parent && String(c.parent) === String(panelParent._id) && c.name === PANEL_ROOTS[oi]);
    if (!sub) { say(`  MISSING panel '${PANEL_ROOTS[oi]}' -- SKIPPED`); continue; }
    say(`  PANEL '${sub.name}' (${itemsOf(sub._id).length}) -> root order=${oi}`);
    await write(async () => {
      sub.parent = null; sub.order = oi; sub.company = panelCo._id; sub.isActive = true; sub.showOnWebsite = true; await sub.save();
      await Product.updateMany({ categoryRef: sub._id }, { $set: { company: panelCo._id } });
    });
  }

  // ---- 5. retire umbrellas ----
  say('\n--- RETIRE umbrellas ---');
  for (const name of UMBRELLAS) {
    for (const brand of [mourya, shivnath]) {
      const c = findCat(brand._id, name);
      if (!c) continue;
      await write(async () => {
        const n = await Product.countDocuments({ categoryRef: c._id });
        const kids = await Category.countDocuments({ parent: c._id, isActive: true });
        if (n === 0 && kids === 0) { c.isActive = false; c.showOnWebsite = false; await c.save(); console.log(`  RETIRE '${name}'`); }
        else console.log(`  KEEP '${name}' products=${n} activeKids=${kids}`);
      });
      if (!APPLY) say(`  (dry) RETIRE '${name}' after zero-check`);
    }
  }

  // ---- 6. recount + verify ----
  if (APPLY) {
    const ids = [mourya._id, shivnath._id, panelCo._id];
    const recount = await Category.find({ company: { $in: ids } });
    for (const c of recount) {
      const n = await Product.countDocuments({ categoryRef: c._id, status: { $ne: 'archived' } });
      await Category.updateOne({ _id: c._id }, { $set: { productCount: n } });
    }
    const afterM = await Product.countDocuments({ company: mourya._id });
    const afterS = await Product.countDocuments({ company: shivnath._id });
    const afterP = await Product.countDocuments({ company: panelCo._id });
    say(`\nAFTER_TOTALS: MOURYA=${afterM} (was ${beforeTotals.MOURYA}) SHIVNATH=${afterS} (was ${beforeTotals.SHIVNATH}) PANELS=${afterP}`);
    say(`ASSERT conserved: ${afterM + afterS + afterP === beforeTotals.MOURYA + beforeTotals.SHIVNATH ? 'PASS' : 'FAIL'}`);
  } else {
    say('\nDRY RUN COMPLETE — no writes made. Re-run with --apply to execute.');
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error('APPLY_ERROR:' + e.message); process.exit(1); });
