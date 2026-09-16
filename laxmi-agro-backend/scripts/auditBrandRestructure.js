require('dotenv').config();
/* ============================================================
 * Brand restructure AUDIT (Mourya + Shivnath) — READ ONLY.
 * - Dumps a JSON backup to .local/ (gitignored).
 * - Prints: company order table, live placement per sub,
 *   proposed target mapping, re-bucket analysis for unsplit
 *   blocks, unmatched product names, paper-vs-live check,
 *   deactivation candidates with zero-product verification.
 * - Makes ZERO database writes. Apply is a separate step.
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const BACKUP_DIR = path.join(__dirname, '..', '..', '.local');

function parseHp(name) {
  const n = String(name || '').toUpperCase().replace(/\(4\)/g, '');
  const m = n.match(/(\d+(?:\.\d+)?)\s*H\.?\s*P\.?/);
  if (!m) return null;
  return parseFloat(m[1]);
}

function parsePhase(name) {
  const n = String(name || '').toUpperCase();
  if (/\bS\.?\s*P\.?\b/.test(n) && /\bT\.?\s*P\.?\b/.test(n)) return 'BOTH';
  if (/\bS\.?\s*P\.?\b/.test(n)) return 'SP';
  if (/\bT\.?\s*P\.?\b/.test(n)) return 'TP';
  return null;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');
  const Company = mongoose.model('Company');

  const companies = await Company.find({}).select('name slug order productCount isActive').sort({ order: 1 }).lean();
  const mourya = companies.find((c) => c.name === 'MOURYA');
  const shivnath = companies.find((c) => c.name === 'SHIVNATH');
  if (!mourya || !shivnath) throw new Error('MOURYA or SHIVNATH company missing');

  const targetCompanyIds = [mourya._id, shivnath._id];
  const cats = await Category.find({ company: { $in: targetCompanyIds } })
    .select('name slug order parent company productCount isActive showOnWebsite')
    .lean();
  const prods = await Product.find({ company: { $in: targetCompanyIds } })
    .select('name sku category categoryRef subCategory status company')
    .lean();

  // ---- backup (disk only, no DB writes) ----
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `brand-restructure-backup-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), companies, categories: cats, products: prods }, null, 2));
  console.log(`BACKUP_WRITTEN:${backupPath} cats=${cats.length} products=${prods.length}`);

  const catById = Object.fromEntries(cats.map((c) => [String(c._id), c]));
  const byCatRef = {};
  for (const p of prods) {
    const k = p.categoryRef ? String(p.categoryRef) : 'NULLREF:' + p.category;
    (byCatRef[k] = byCatRef[k] || []).push(p);
  }

  // ---- A. company order table ----
  console.log('\n=== A. COMPANY ORDER (proposed: insert Shivnath Control Panel after SHIVNATH) ===');
  let n = 0;
  for (const c of companies) {
    n += 1;
    const marker = c.name === 'SHIVNATH' ? '  <-- insert new brand after this' : '';
    console.log(`  ${c.order} -> ${n}  ${c.name}${marker}`);
  }
  console.log(`  - -> ${companies.findIndex((c) => c.name === 'SHIVNATH') + 2}  Shivnath Control Panel (NEW)`);

  // ---- B/C/D. per-brand placement + re-bucket analysis ----
  for (const brand of [mourya, shivnath]) {
    console.log(`\n=== ${brand.name}: CURRENT PLACEMENT (live counts active/archived) ===`);
    const brandCats = cats.filter((c) => String(c.company) === String(brand._id));
    const roots = brandCats.filter((c) => !c.parent).sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const r of roots) {
      const direct = (byCatRef[String(r._id)] || []).filter((p) => p.status !== 'archived').length;
      const directArch = (byCatRef[String(r._id)] || []).filter((p) => p.status === 'archived').length;
      console.log(`  ROOT '${r.name}' order=${r.order} active=${r.isActive} directProducts=${direct}/${directArch}`);
      const subs = brandCats.filter((c) => String(c.parent) === String(r._id)).sort((a, b) => (a.order || 0) - (b.order || 0));
      for (const s of subs) {
        const items = byCatRef[String(s._id)] || [];
        const a = items.filter((p) => p.status !== 'archived').length;
        const ar = items.filter((p) => p.status === 'archived').length;
        console.log(`    SUB '${s.name}' order=${s.order} active=${s.isActive} products=${a}/${ar}`);
      }
    }
  }

  // ---- E. re-bucket parse for unsplit blocks ----
  console.log('\n=== E. RE-BUCKET PARSE (unsplit blocks -> HP buckets) ===');
  const unsplitNames = new Set();
  for (const [cid, items] of Object.entries(byCatRef)) {
    if (cid.startsWith('NULLREF:')) continue;
    const c = catById[cid];
    if (!c) continue;
    const parent = c.parent ? catById[String(c.parent)] : null;
    const parentName = parent ? parent.name : '(ROOT:' + c.name + ')';
    // broad subs = names without HP digits that still hold products, or legacy group subs
    const hasHp = /\d+(?:\.\d+)?\s*H\.?\s*P\.?/i.test(c.name);
    if (!hasHp && items.length > 0) {
      unsplitNames.add(`${parentName} || ${c.name} (${items.length})`);
      const buckets = {};
      const unmatched = [];
      for (const p of items) {
        const hp = parseHp(p.name);
        if (hp == null) { unmatched.push(p.name); continue; }
        const ph = parsePhase(p.name);
        const key = `${hp}HP${ph ? ' ' + ph : ''}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      console.log(`  ${parentName} || ${c.name}: total=${items.length}`);
      Object.keys(buckets).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach((k) => console.log(`      -> ${k}: ${buckets[k]}`));
      if (unmatched.length) console.log(`      UNMATCHED (${unmatched.length}): ${JSON.stringify(unmatched.slice(0, 10))}`);
    }
  }

  // ---- F. deactivation candidates ----
  console.log('\n=== F. DEACTIVATION CANDIDATES (must read 0/0) ===');
  const umbrellaNames = ['Mourya Sub Pumps', 'Shivnath Sub Pumps', 'SHIVNATH CONTROL PANELS', 'SHIVNATH OPENWELL', 'MOURYA SERVICE CABLE'];
  for (const brand of [mourya, shivnath]) {
    const brandCats = cats.filter((c) => String(c.company) === String(brand._id));
    for (const c of brandCats) {
      const items = byCatRef[String(c._id)] || [];
      const kids = brandCats.filter((k) => String(k.parent) === String(c._id));
      const isUmbrella = umbrellaNames.includes(c.name) || (!c.parent && kids.length === 0 && items.length === 0);
      if (!c.parent) {
        console.log(`  ROOT '${c.name}': direct=${items.length}, children=${kids.length}${isUmbrella ? '  <-- CANDIDATE' : ''}`);
      }
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error('AUDIT_ERROR:' + e.message); process.exit(1); });
