/*
 * Rewrites the Iskcon GI pipe product and category descriptions, which the
 * original import filled with internal pricing notes. Only descriptions
 * change: names, prices, stock and specifications are left as they are.
 *
 * Usage:
 *   node scripts/fixIskconGiDescriptions.js            (dry run: prints the changes)
 *   node scripts/fixIskconGiDescriptions.js --apply    (writes them)
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { SUBS, descriptionFor, shortDescriptionFor } = require('./seedIskconGiPipes');

const ROOT_NAME = 'Iskcon GI Pipe';
const ROOT_DESCRIPTION = 'Iskcon GI (galvanised iron) pipes in 6 metre lengths for water supply, plumbing and irrigation.';

// "0.5 inch 1.4mm 6mtr Iskcon GI Pipe" -> { size: '0.5 inch', thickness: '1.4' }
function parseName(name) {
  const match = /^(\d+(?:\.\d+)?\s*inch)\s+(\d+(?:\.\d+)?)mm\s+6mtr\s+Iskcon GI Pipe$/i.exec(String(name).trim());
  return match ? { size: match[1].replace(/\s+/g, ' '), thickness: match[2] } : null;
}

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`Iskcon GI pipe descriptions [${apply ? 'APPLY' : 'DRY-RUN'}]`);
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });

  const products = await Product.find({ sku: /^GI-ISK-/ }).select('name sku description shortDescription').lean();
  const productUpdates = [];
  const skipped = [];
  for (const product of products) {
    const parsed = parseName(product.name);
    if (!parsed) { skipped.push(product.name); continue; }
    const description = descriptionFor(parsed.size, parsed.thickness);
    const shortDescription = shortDescriptionFor(parsed.size, parsed.thickness);
    if (product.description === description && product.shortDescription === shortDescription) continue;
    productUpdates.push({ _id: product._id, name: product.name, before: product.description, description, shortDescription });
  }

  const categoryUpdates = [];
  const root = await Category.findOne({ name: ROOT_NAME, parent: null }).select('name description').lean();
  if (root) {
    if (root.description !== ROOT_DESCRIPTION) categoryUpdates.push({ _id: root._id, name: root.name, description: ROOT_DESCRIPTION });
    for (const sub of SUBS) {
      const cat = await Category.findOne({ name: sub.name, parent: root._id }).select('name description').lean();
      const description = `${sub.sizeLabel} Iskcon GI pipes in 6 metre lengths, in a choice of wall thicknesses.`;
      if (cat && cat.description !== description) categoryUpdates.push({ _id: cat._id, name: cat.name, description });
    }
  }

  console.log(`Products found: ${products.length}, to update: ${productUpdates.length}, skipped (name not recognised): ${skipped.length}`);
  skipped.forEach((name) => console.log(`  skipped: ${name}`));
  for (const update of productUpdates) {
    console.log(`\n${update.name}\n  OLD: ${update.before}\n  NEW: ${update.description}\n  SHORT: ${update.shortDescription}`);
  }
  console.log(`\nCategories to update: ${categoryUpdates.length}`);
  categoryUpdates.forEach((update) => console.log(`  ${update.name}: ${update.description}`));

  if (apply) {
    for (const update of productUpdates) {
      await Product.updateOne({ _id: update._id }, { $set: { description: update.description, shortDescription: update.shortDescription } });
    }
    for (const update of categoryUpdates) {
      await Category.updateOne({ _id: update._id }, { $set: { description: update.description } });
    }
    console.log(`\nUpdated ${productUpdates.length} products and ${categoryUpdates.length} categories.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
