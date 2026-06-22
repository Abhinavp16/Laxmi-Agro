require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const { Product } = require('../models');

const APPLY_FLAG = '--apply';
const shouldApply = process.argv.includes(APPLY_FLAG);

const PUMP_CATEGORY_BY_BRAND = {
  'sub-v-3-13-feet': {
    SHIVNATH: 'Shivnath Sub V-3 13 Feet',
    MOURYA: 'Mourya Sub V-3 13 Feet',
    'AQUA GOLDEN': 'Aqua Golden',
  },
  'sub-v-4-20-feet': {
    SHIVNATH: 'Shivnath Sub V-4 20 Feet',
    MOURYA: 'Mourya Sub V-4 20 Feet',
    'AQUA GOLDEN': 'Aqua Golden',
  },
  'sub-v-4-20-feet-lota-body': {
    SHIVNATH: 'Shivnath Sub V-4 20 Feet Lota Body',
    MOURYA: 'Mourya Sub V-4 20 Feet Lota Body',
  },
  'sub-v-5-25-feet': {
    SHIVNATH: 'Shivnath Sub V-5 25 Feet',
    MOURYA: 'Mourya Sub V-5 25 Feet',
  },
  'sub-v-6-30-feet': {
    SHIVNATH: 'Shivnath Sub V-6 30 Feet',
    MOURYA: 'Mourya Sub V-6 30 Feet',
    'MAYUR PANKH': 'Aqua Golden',
  },
  'sub-v-6-50-feet': {
    SHIVNATH: 'Shivnath Sub V-6 50 Feet',
    MOURYA: 'Mourya Sub V-6 50 Feet',
  },
};

const AQUA_GOLDEN_NAME_PREFIX_BY_OLD_CATEGORY = {
  'sub-v-3-13-feet': 'Golden Sub V-3 13 Feet',
  'sub-v-4-20-feet': 'Sub V-4 20 Feet',
  'sub-v-6-30-feet': 'Sub V-6 30 Feet',
};

const normalizeKey = (value = '') => String(value).trim().toLowerCase();

const normalizeBrand = (value = '') => {
  const brand = String(value).trim().toUpperCase();
  if (brand.includes('SHIVNATH')) return 'SHIVNATH';
  if (brand.includes('MOURYA') || brand.includes('MAURYA')) return 'MOURYA';
  if (brand.includes('MAYUR')) return 'MAYUR PANKH';
  if (brand.includes('AQUA') || brand.includes('GOLDEN')) return 'AQUA GOLDEN';
  return brand;
};

const normalizeSpaces = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const toTitleCase = (value = '') => normalizeSpaces(value)
  .split(' ')
  .filter(Boolean)
  .map((word) => {
    const upper = word.toUpperCase();
    if (['HP', 'S.P.', 'T.P.'].includes(upper)) return upper;
    return word[0].toUpperCase() + word.slice(1).toLowerCase();
  })
  .join(' ');

const formatAquaModel = (value = '') => {
  const model = normalizeSpaces(value).toUpperCase();
  if (model === 'AQUAGOLD') return 'Aqua Gold';
  if (model === 'AQUA') return 'Aqua';
  if (model === 'MAYUR PANKH') return 'Mayur Pankh';
  return toTitleCase(value);
};

const cleanAquaGoldenName = (product, oldCategory) => {
  const name = normalizeSpaces(product.name || '');
  const prefix = AQUA_GOLDEN_NAME_PREFIX_BY_OLD_CATEGORY[oldCategory];
  if (!prefix) return name;

  if (oldCategory === 'sub-v-6-30-feet') {
    return normalizeSpaces(`${prefix} ${name.replace(/^MAYUR\s+PANKH\s+/i, '')}`);
  }

  if (oldCategory === 'sub-v-3-13-feet') {
    const goldenMatch = name.match(/^GOLDEN\s+(.+)$/i);
    if (goldenMatch) return normalizeSpaces(`${prefix} ${goldenMatch[1]}`);
  }

  if (oldCategory === 'sub-v-4-20-feet') {
    const modelMatch = name.match(/^(AQUAGOLD|AQUA|MAYUR PANKH)\s+(.+)$/i);
    if (modelMatch) {
      if (modelMatch[1].toUpperCase() === 'MAYUR PANKH') {
        return normalizeSpaces(`${prefix} ${modelMatch[2]}`);
      }
      return normalizeSpaces(`${formatAquaModel(modelMatch[1])} ${prefix} ${modelMatch[2]}`);
    }
  }

  if (name.toLowerCase().startsWith(prefix.toLowerCase())) return name;
  return normalizeSpaces(`${prefix} ${name}`);
};

const getNextCategory = (product) => {
  const category = normalizeKey(product.category);
  const brand = normalizeBrand(product.brand);
  return PUMP_CATEGORY_BY_BRAND[category]?.[brand] || null;
};

const getNextName = (product, nextCategory) => {
  if (nextCategory !== 'Aqua Golden') return normalizeSpaces(product.name || '');
  return cleanAquaGoldenName(product, normalizeKey(product.category));
};

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  const products = await Product.find({
    category: { $in: Object.keys(PUMP_CATEGORY_BY_BRAND) },
  })
    .select('_id name category brand slug sku')
    .sort({ category: 1, brand: 1, retailPrice: 1, name: 1 })
    .lean();

  const changes = products
    .map((product) => {
      const nextCategory = getNextCategory(product);
      if (!nextCategory) return null;
      const nextName = getNextName(product, nextCategory);
      return {
        id: String(product._id),
        sku: product.sku || '',
        brand: product.brand || '',
        slug: product.slug || '',
        oldCategory: product.category || '',
        newCategory: nextCategory,
        oldName: product.name || '',
        newName: nextName,
      };
    })
    .filter(Boolean)
    .filter((change) => change.oldCategory !== change.newCategory || change.oldName !== change.newName);

  console.log(`Products scanned: ${products.length}`);
  console.log(`Products to update: ${changes.length}`);

  for (const change of changes) {
    console.log(`[${change.brand}] ${change.oldCategory} -> ${change.newCategory} | ${change.oldName} -> ${change.newName}`);
  }

  const backupPath = path.join(
    os.tmpdir(),
    `laxmi-agro-pump-category-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(backupPath, JSON.stringify(changes, null, 2));
  console.log(`Backup written: ${backupPath}`);

  if (!shouldApply) {
    console.log(`Dry run only. Re-run with ${APPLY_FLAG} to update database categories.`);
    return;
  }

  if (changes.length > 0) {
    await Product.bulkWrite(
      changes.map((change) => ({
        updateOne: {
          filter: { _id: change.id },
          update: {
            $set: {
              category: change.newCategory,
              name: change.newName,
            },
          },
        },
      }))
    );
  }

  console.log('Pump categories updated. Product slugs were left unchanged.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
