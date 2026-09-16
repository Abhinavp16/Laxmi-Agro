require('dotenv').config();
/* ============================================================
 * Aqua Gold restructure APPLY.
 * DEFAULT = DRY RUN (prints plan, writes nothing).
 * Run with --apply to execute.
 * Promotes V-6 30ft, V-6 50ft, V-4, V-3 to roots (paper order),
 * creates PLAIN-HP subs ("3 HP") from birth, moves 55 products,
 * retires umbrella + empty shells. Requires Phase A (no
 * company+name unique index) already applied.
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const slugify = require('slugify');

const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = path.join(__dirname, '..', '..', '.local');

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
const bucketSort = (a, b) => parseFloat(a) - parseFloat(b);

const ROOTS = ['V6 30 Ft', 'V6 50 Ft', 'V4', 'V3'];
const UMBRELLA = 'Aquagold Sub Pumps';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');
  const Company = mongoose.model('Company');

  const say = (s) => console.log(s);
  const write = async (fn) => { if (APPLY) await fn(); };

  const ag = await Company.findOne({ name: 'AQUA GOLDEN' });
  if (!ag) throw new Error('AQUA GOLDEN missing');
  const cats = await Category.find({ company: ag._id });
  const prods = await Product.find({ company: ag._id }).select('name sku category categoryRef subCategory status company').lean();
  say(`BEFORE_TOTAL: AQUA=${prods.length}`);

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(BACKUP_DIR, `aqua-restructure-backup-${stamp}.json`), JSON.stringify({ createdAt: new Date().toISOString(), categories: cats, products: prods }, null, 2));
  say('BACKUP_WRITTEN');

  const byRef = {};
  for (const p of prods) {
    const k = p.categoryRef ? String(p.categoryRef) : 'NULL';
    (byRef[k] = byRef[k] || []).push(p);
  }
  const itemsOf = (id) => byRef[String(id)] || [];
  const findCat = (name) => cats.find((c) => c.name === name);

  for (let oi = 0; oi < ROOTS.length; oi += 1) {
    const rootName = ROOTS[oi];
    const root = findCat(rootName);
    if (!root) { say(`  MISSING root '${rootName}' -- SKIPPED`); continue; }
    say(`  ROOT '${rootName}' promote order=${oi}`);
    await write(async () => { root.parent = null; root.order = oi; root.isActive = true; root.showOnWebsite = true; await root.save(); });
    const pool = [...itemsOf(root._id)];
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
    for (const key of orderedKeys) {
      say(`    + SUB '${key}' n=${groups[key].length}`);
      await write(async () => {
        const created = await Category.create({ name: key, company: ag._id, parent: root._id, description: `${key} - part of ${rootName}`, order: 0, isActive: true, showOnWebsite: true });
        await Category.updateOne({ _id: created._id }, { $set: { slug: scopedSlug(root.slug, key) } });
        const sub = await Category.findById(created._id);
        cats.push(sub);
      });
    }
    if (APPLY) {
      for (const key of orderedKeys) {
        const subDoc = await Category.findOne({ company: ag._id, parent: root._id, name: key });
        if (!subDoc) { console.log(`    !! NO SUB DOC '${key}'`); continue; }
        const ids = groups[key].map((p) => p._id);
        await Product.updateMany({ _id: { $in: ids } }, { $set: { categoryRef: subDoc._id, category: subDoc.slug, subCategory: subDoc.slug } });
      }
      const children = await Category.find({ parent: root._id });
      children.sort((a, b) => parseFloat(a.name) - parseFloat(b.name));
      for (let i = 0; i < children.length; i += 1) { children[i].order = i; await children[i].save(); }
    } else say('    (dry) children would be HP-ordered here');
  }

  say('\n--- RETIRE (zero-check) ---');
  const retireTargets = [UMBRELLA, 'AQUAGOLDEN SUB V-6 30ft', 'AQUAGOLDEN SUB V-6 50ft', 'AQUAGOLDEN v3 SUBMERSIBLE', 'AQUAGOLDEN v-4 SUB PUMP'];
  for (const name of retireTargets) {
    const c = findCat(name);
    if (!c) { say(`  '${name}' not found -- skip`); continue; }
    await write(async () => {
      const n = await Product.countDocuments({ categoryRef: c._id });
      const kids = await Category.countDocuments({ parent: c._id, isActive: true });
      if (n === 0 && kids === 0) { c.isActive = false; c.showOnWebsite = false; await c.save(); console.log(`  RETIRE '${name}'`); }
      else console.log(`  KEEP '${name}' products=${n} activeKids=${kids}`);
    });
    if (!APPLY) say(`  (dry) RETIRE '${name}' after zero-check`);
  }

  if (APPLY) {
    const recount = await Category.find({ company: ag._id });
    for (const c of recount) {
      const n = await Product.countDocuments({ categoryRef: c._id, status: { $ne: 'archived' } });
      await Category.updateOne({ _id: c._id }, { $set: { productCount: n } });
    }
    const after = await Product.countDocuments({ company: ag._id });
    say(`\nAFTER_TOTAL: AQUA=${after} (was ${prods.length}) ASSERT=${after === prods.length ? 'PASS' : 'FAIL'}`);
  } else {
    say('\nDRY RUN COMPLETE — no writes made. Re-run with --apply to execute.');
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error('APPLY_ERROR:' + e.message); process.exit(1); });
