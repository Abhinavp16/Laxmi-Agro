/* One-shot backfill: generate description + shortDescription for GI fitting
 * products that have blank/trial copy.
 *
 * Guards:
 * - description is written ONLY when blank.
 * - shortDescription is written ONLY when blank or a "(trial)" placeholder.
 * - only products in the known GI fitting category slugs are touched.
 *
 * Usage:
 *   node src/scripts/backfillGiFittingCopy.js --dry-run
 *   node src/scripts/backfillGiFittingCopy.js --apply
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../models');

const TYPE_LABELS = {
  elbows: '90° elbow',
  tees: 'equal tee',
  sockets: 'socket',
  unions: 'union',
  nipples: 'nipple',
  crosses: 'cross',
  '3-way-elbows': '3-way elbow',
  'short-bends': 'short bend',
  'tank-nipples': 'tank nipple',
  'check-nuts': 'check nut',
  relbows: 'reducing elbow',
  rtees: 'reducing tee',
  rsockets: 'reducing socket',
};

const isBlank = (value) => !value || !String(value).trim();
// Import-artifact placeholders, e.g. "Elbows 1/2 inch - GI fitting (trial)/(PRIMATE)".
const isPlaceholder = (value) => isBlank(value) || /\((trial|primate)\)/i.test(String(value || ''));

function extractSize(name) {
  const match = String(name || '').match(/(\d[\d./]*\s*inch)/i);
  return match ? match[1].replace(/\s+/g, ' ') : '';
}

function buildCopy(category, name) {
  const label = TYPE_LABELS[category];
  if (!label) return null;
  const size = extractSize(name);
  const title = label.charAt(0).toUpperCase() + label.slice(1);
  return {
    description:
      `Galvanized Iron ${label}, ${size}. ` +
      'Heavy-duty rust-resistant fitting for water supply and agricultural pipe lines. ' +
      'Precision-cut threads ensure a strong, leak-proof joint. ' +
      'Suitable for high-pressure farm, domestic and irrigation water systems.',
    shortDescription: `${title} — ${size}. Rust-proof GI fitting for leak-proof pipe joints.`,
  };
}

async function main() {
  const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
  await mongoose.connect(process.env.MONGODB_URI);

  const candidates = await Product.find({
    status: { $ne: 'archived' },
    category: { $in: Object.keys(TYPE_LABELS) },
  }).select('name category description shortDescription').lean();

  const plan = [];
  for (const product of candidates) {
    const copy = buildCopy(product.category, product.name);
    if (!copy) continue;
    const update = {};
    if (isBlank(product.description)) update.description = copy.description;
    if (isPlaceholder(product.shortDescription)) {
      update.shortDescription = copy.shortDescription;
    }
    if (Object.keys(update).length > 0) {
      plan.push({ id: String(product._id), name: product.name, update });
    }
  }

  console.log(JSON.stringify({
    mode,
    candidates: candidates.length,
    toUpdate: plan.length,
    sample: plan.slice(0, 3),
  }, null, 2));

  if (mode === 'apply' && plan.length > 0) {
    const ops = plan.map((item) => ({
      updateOne: { filter: { _id: item.id }, update: { $set: item.update } },
    }));
    const result = await Product.bulkWrite(ops, { ordered: false });
    console.log(JSON.stringify({
      matched: result.matchedCount,
      modified: result.modifiedCount,
    }));
    if (result.matchedCount !== plan.length) {
      throw new Error('Match count changed during backfill - aborting as unsafe');
    }
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('BACKFILL FAILED:', error.message);
  try { await mongoose.disconnect(); } catch (_) { /* noop */ }
  process.exit(1);
});
