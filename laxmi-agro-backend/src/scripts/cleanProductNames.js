require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const { Product } = require('../models');

const APPLY_FLAG = '--apply';
const shouldApply = process.argv.includes(APPLY_FLAG);

const normalizeSpaces = (value = '') => String(value)
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.)])/g, '$1')
  .trim();

const normalizeCategory = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[-_]+/g, ' ')
  .replace(/\s+/g, ' ');

const trimTrailingZeroes = (value = '') => {
  const normalized = String(value);
  if (!normalized.includes('.')) return normalized;
  return normalized.replace(/\.?0+$/, '');
};

const extractSize = (value = '') => {
  const directMmMatch = String(value).match(/(\d+(?:\.\d+)?)\s*(?:sq\.?\s*)?mm/i);
  if (directMmMatch) return trimTrailingZeroes(directMmMatch[1]);

  const buildMatch = String(value).match(/(\d+(?:\.\d+)?)\s*x\s*\d+/i);
  if (buildMatch) return trimTrailingZeroes(buildMatch[1]);

  return null;
};

const getServiceWireBrand = (product = {}) => {
  const source = `${product.name || ''} ${product.brand || ''}`.toLowerCase();
  if (source.includes('shivnath')) return 'Shivnath';
  if (source.includes('mourya') || source.includes('maurya')) return 'Maurya';
  if (source.includes('ideal')) return 'Ideal';
  return normalizeSpaces(product.brand || '').split(' ')[0] || 'Service Wire';
};

const cleanServiceWireName = (product) => {
  const size = extractSize(product.name);
  const brand = getServiceWireBrand(product);
  return size ? `${brand} ${size}mm` : brand;
};

const cleanServiceCableName = (product) => {
  const size = extractSize(product.name);
  const coreMatch = String(product.name || '').match(/(\d+)\s*core/i);
  const core = coreMatch?.[1];
  const parts = ['Maurya'];
  if (/premium/i.test(product.name || '')) parts.push('Premium');
  if (/supreme/i.test(product.name || '')) parts.push('Supreme');
  if (core) parts.push(core, 'Core');
  if (size) parts.push(`${size}mm`);
  return parts.join(' ');
};

const cleanJointingSolutionName = (product) => {
  const cleaned = removePhrasesEverywhere(product.name || '', ['Jointing Solution']);
  return cleaned || normalizeSpaces(product.name || '');
};

const cleanRollPipeName = (product) => {
  const source = `${product.name || ''} ${product.brand || ''}`;
  const brand = /green\s*valley/i.test(source) ? 'Green Valley' : normalizeSpaces(product.brand || '').split(' ')[0];
  const sizeMatch = String(product.name || '').match(/(\d+(?:\.\d+)?)\s*inch/i);

  if (brand && sizeMatch) {
    return `${brand} ${trimTrailingZeroes(sizeMatch[1])} Inch`;
  }

  return removePhrasesEverywhere(product.name || '', ['Roll Pipe']);
};

const cleanStarterOilName = (product) => {
  const source = String(product.name || '');
  const ltrMatch = source.match(/(\d+(?:\.\d+)?)\s*ltr/i);
  const gmMatch = source.match(/(\d+(?:\.\d+)?)\s*gm/i);
  const mlMatch = source.match(/(\d+(?:\.\d+)?)\s*ml/i);

  if (ltrMatch && gmMatch && mlMatch) {
    return `Oil ${trimTrailingZeroes(ltrMatch[1])} ltr ${trimTrailingZeroes(gmMatch[1])}gm (${trimTrailingZeroes(mlMatch[1])} ml)`;
  }

  const knownMlLabels = {
    800: 'Oil 1 ltr 700gm (800 ml)',
    1200: 'Oil 1.5 ltr 950gm (1200 ml)',
    1300: 'Oil 1.5 ltr 1050gm (1300 ml)',
    1450: 'Oil 1.5 ltr 1150gm (1450 ml)',
  };
  const knownLabel = knownMlLabels[trimTrailingZeroes(mlMatch?.[1] || '')];
  if (knownLabel) return knownLabel;

  return normalizeSpaces(product.name || '');
};

const removeLeadingPhrases = (name, phrases) => {
  let next = name;
  for (const phrase of phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    next = next.replace(new RegExp(`^${escaped}\\s*[-:]*\\s*`, 'i'), '');
  }
  return normalizeSpaces(next);
};

const removePhrasesEverywhere = (name, phrases) => {
  let next = name;
  for (const phrase of phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    next = next.replace(new RegExp(`\\b${escaped}\\b`, 'ig'), '');
  }
  return normalizeSpaces(next);
};

const cleanGenericName = (product) => {
  const category = normalizeCategory(product.category);
  let name = normalizeSpaces(product.name || '');

  const categoryRules = [
    { match: ['column adopter'], remove: ['Column Adopter'] },
    { match: ['control panels'], remove: ['Control Panels', 'Control Panel'] },
    { match: ['gi pipes'], remove: ['GI Pipes', 'GI Pipe'] },
    { match: ['harit sprinkler set'], remove: ['Harit Sprinkler Set', 'Sprinkler Set'], anywhere: ['Sprinkler Set'] },
    { match: ['jhatka machine'], remove: ['Jhatka Machine'] },
    { match: ['jointing solution'], remove: ['Jointing Solution'] },
    { match: ['open well ci body'], remove: ['Open Well CI Body', 'Open Well Ci Body'] },
    { match: ['open well ss body'], remove: ['Open Well SS Body', 'Open Well Ss Body'] },
    { match: ['pvc column pipes'], remove: ['PVC Column Pipes', 'PVC Column Pipe'] },
    { match: ['roll pipe'], remove: ['Roll Pipe'], anywhere: ['Roll Pipe'] },
    { match: ['starter oil'], remove: ['Starter Oil'] },
    { match: ['submersible cable'], remove: ['Submersible Cable'], anywhere: ['Submersible Cable'] },
  ];

  for (const rule of categoryRules) {
    if (rule.match.some((item) => category.includes(item))) {
      name = removeLeadingPhrases(name, rule.remove);
      if (rule.anywhere) {
        name = removePhrasesEverywhere(name, rule.anywhere);
      }
      break;
    }
  }

  if (!name) name = product.name;
  return normalizeSpaces(name);
};

const cleanProductName = (product) => {
  const category = normalizeCategory(product.category);
  if (category.includes('service wire')) return cleanServiceWireName(product);
  if (category.includes('service cable')) return cleanServiceCableName(product);
  if (category.includes('jointing solution')) return cleanJointingSolutionName(product);
  if (category.includes('roll pipe')) return cleanRollPipeName(product);
  if (category.includes('starter oil')) return cleanStarterOilName(product);
  return cleanGenericName(product);
};

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  const products = await Product.find({})
    .select('_id name category brand slug sku')
    .sort({ category: 1, retailPrice: 1, name: 1 })
    .lean();

  const changes = products
    .map((product) => {
      const nextName = cleanProductName(product);
      return {
        id: String(product._id),
        sku: product.sku || '',
        category: product.category || '',
        brand: product.brand || '',
        slug: product.slug || '',
        oldName: product.name || '',
        newName: nextName,
      };
    })
    .filter((change) => change.oldName !== change.newName);

  console.log(`Products scanned: ${products.length}`);
  console.log(`Products to rename: ${changes.length}`);

  for (const change of changes) {
    console.log(`[${change.category}] ${change.oldName} -> ${change.newName}`);
  }

  const backupPath = path.join(
    os.tmpdir(),
    `laxmi-agro-product-name-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(backupPath, JSON.stringify(changes, null, 2));
  console.log(`Backup written: ${backupPath}`);

  if (!shouldApply) {
    console.log(`Dry run only. Re-run with ${APPLY_FLAG} to update database names.`);
    return;
  }

  if (changes.length > 0) {
    await Product.bulkWrite(
      changes.map((change) => ({
        updateOne: {
          filter: { _id: change.id },
          update: { $set: { name: change.newName } },
        },
      }))
    );
  }

  console.log('Database product names updated. Slugs were left unchanged.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
