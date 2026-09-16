require('dotenv').config();
/* ============================================================
 * Plain-HP rename: strip parent prefix from HP subcategory
 * display names ("V6 30 Ft 3 HP" -> "3 HP") for Mourya +
 * Shivnath (+ any Aqua stragglers). Slugs untouched, so
 * product links are unaffected. Sibling-collision checked.
 * DEFAULT = DRY RUN. Run with --apply to execute.
 * ============================================================ */
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  require('../src/models/Company');
  const Category = require('../src/models/Category');
  const Company = mongoose.model('Company');

  const say = (s) => console.log(s);
  const brands = await Company.find({ name: { $in: ['MOURYA', 'SHIVNATH', 'AQUA GOLDEN'] } });
  let renamed = 0;
  let skipped = 0;
  for (const brand of brands) {
    say(`\n--- ${brand.name} ---`);
    const roots = await Category.find({ company: brand._id, parent: null });
    for (const root of roots) {
      const kids = await Category.find({ parent: root._id }).sort({ order: 1 });
      if (!kids.length) continue;
      const prefix = root.name + ' ';
      // sibling collision check on proposed names
      const proposed = new Map();
      let clash = false;
      for (const k of kids) {
        if (!k.name.startsWith(prefix)) continue;
        const next = k.name.slice(prefix.length);
        if (proposed.has(next)) { clash = true; break; }
        proposed.set(next, k);
      }
      // also clash against kids that do NOT carry the prefix (already plain)
      for (const k of kids) {
        if (k.name.startsWith(prefix)) continue;
        if (proposed.has(k.name)) { clash = true; break; }
      }
      if (clash) {
        say(`  ROOT '${root.name}': CLASH — skipping renames here, needs ruling`);
        skipped += kids.length;
        continue;
      }
      for (const k of kids) {
        if (!k.name.startsWith(prefix)) continue;
        const next = k.name.slice(prefix.length);
        say(`  '${k.name}' -> '${next}'`);
        renamed += 1;
        if (APPLY) {
          // updateOne bypasses the slug-regenerating pre-save hook:
          // slugs stay parent-scoped, only display names change.
          await Category.updateOne({ _id: k._id }, { $set: { name: next } });
        }
      }
    }
  }
  say(`\nTOTAL rename=${renamed} skipped=${skipped} ${APPLY ? '(APPLIED)' : '(DRY RUN)'}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error('RENAME_ERROR:' + e.message); process.exit(1); });
