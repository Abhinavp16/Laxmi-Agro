/*
 * Idempotent ISKCON GI pipe catalog import for the existing GI PIPES brand.
 *
 * Source: handwritten per-feet rate list (GST inclusive).
 * Pricing rule: base = perFeetRate x 20 (6 mtr pipe).
 *   retailPrice (customer) = base + 10%
 *   wholesalePrice (dealer) = base + 5%
 *   mrp = base + 20%
 *
 * Usage:
 *   node scripts/seedIskconGiPipes.js --dry-run
 *   node scripts/seedIskconGiPipes.js --apply
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Company = require('../src/models/Company');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const BRAND_NAME = 'GI PIPES';
const ROOT_NAME = 'Iskcon GI Pipe';
const INITIAL_STOCK = 100;
const EXPECTED_SUBCATEGORIES = 9;
const EXPECTED_PRODUCTS = 24;

const round2 = (n) => Number(Number(n).toFixed(2));

// sizeLabel is display text, sizeCode is the SKU fragment.
const SUBS = [
  { name: '0.5 inch Iskcon GI Pipe', sizeLabel: '0.5 inch', sizeCode: '05', order: 0 },
  { name: '0.75 inch Iskcon GI Pipe', sizeLabel: '0.75 inch', sizeCode: '075', order: 1 },
  { name: '1 inch Iskcon GI Pipe', sizeLabel: '1 inch', sizeCode: '10', order: 2 },
  { name: '1.25 inch Iskcon GI Pipe', sizeLabel: '1.25 inch', sizeCode: '125', order: 3 },
  { name: '1.5 inch Iskcon GI Pipe', sizeLabel: '1.5 inch', sizeCode: '15', order: 4 },
  { name: '2 inch Iskcon GI Pipe', sizeLabel: '2 inch', sizeCode: '20', order: 5 },
  { name: '2.5 inch Iskcon GI Pipe', sizeLabel: '2.5 inch', sizeCode: '25', order: 6 },
  { name: '3 inch Iskcon GI Pipe', sizeLabel: '3 inch', sizeCode: '30', order: 7 },
  { name: '4 inch Iskcon GI Pipe', sizeLabel: '4 inch', sizeCode: '40', order: 8 },
];

// perFeetRate transcribed from the handwritten list.
const ROWS = [
  // [subIndex, thicknessMm, thicknessCode, perFeetRate]
  [0, '1.4', '14', 27],
  [0, '2.0', '20', 33],
  [1, '1.4', '14', 32.5],
  [1, '1.6', '16', 34.5],
  [2, '1.4', '14', 37.5],
  [2, '1.6', '16', 40.5],
  [2, '2.0', '20', 47],
  [3, '1.6', '16', 50.5],
  [3, '2.0', '20', 59],
  [3, '2.2', '22', 64],
  [4, '1.6', '16', 59],
  [4, '2.0', '20', 68],
  [4, '2.5', '25', 81],
  [5, '1.6', '16', 74],
  [5, '2.0', '20', 86],
  [5, '2.5', '25', 102],
  [6, '2.0', '20', 108.5],
  [6, '2.5', '25', 132],
  [7, '1.6', '16', 113],
  [7, '2.0', '20', 128],
  [7, '2.5', '25', 153.5],
  [8, '1.6', '16', 162],
  [8, '2.0', '20', 192],
  [8, '2.5', '25', 243],
];

// Customer-facing text. Pricing stays out of descriptions.
function wallText(thicknessMm) {
  const mm = Number(thicknessMm);
  if (mm >= 2.5) return 'A heavy wall, suited to high-pressure lines and tough outdoor or borewell use.';
  if (mm >= 2.0) return 'A medium wall, suited to regular water supply and pump delivery lines.';
  return 'A lighter wall, suited to household plumbing and low-pressure water lines.';
}

function descriptionFor(sizeLabel, thicknessMm) {
  return `${sizeLabel} Iskcon GI (galvanised iron) pipe with ${thicknessMm}mm wall thickness, ` +
    `6 metre (about 20 feet) long. ${wallText(thicknessMm)} ` +
    'The zinc coating protects against rust, so it lasts in water supply, plumbing, ' +
    'irrigation and farm installations. Works with standard threaded GI fittings. Sold per piece.';
}

function shortDescriptionFor(sizeLabel, thicknessMm) {
  return `${sizeLabel} Iskcon GI pipe, ${thicknessMm}mm wall, 6 metre length.`;
}

function pricesFor(rate) {
  const base = rate * 20;
  return {
    mrp: round2(base * 1.2),
    retailPrice: round2(base * 1.1),
    wholesalePrice: round2(base * 1.05),
  };
}

function productDoc(sub, thicknessMm, thicknessCode, rate, company, subCat, brandName) {
  const { mrp, retailPrice, wholesalePrice } = pricesFor(rate);
  const name = `${sub.sizeLabel} ${thicknessMm}mm 6mtr Iskcon GI Pipe`;
  const sku = `GI-ISK-${sub.sizeCode}-${thicknessCode}-6M`.toUpperCase();
  const shortDescription = shortDescriptionFor(sub.sizeLabel, thicknessMm);
  return {
    name,
    category: subCat.slug,
    categoryRef: subCat._id,
    company: company._id,
    brand: brandName,
    subCategory: subCat.slug,
    mrp,
    retailPrice,
    wholesalePrice,
    sku,
    stock: INITIAL_STOCK,
    minWholesaleQuantity: 10,
    negotiationEnabled: true,
    status: 'active',
    showOnWebsite: true,
    priceUnit: 'piece',
    packing: 'Per piece',
    description: descriptionFor(sub.sizeLabel, thicknessMm),
    shortDescription,
    tags: ['gi', 'gi-pipes', 'iskcon', 'gi-pipe', sub.sizeLabel, `${thicknessMm}mm`, '6mtr'],
    specifications: [
      { key: 'Brand', value: 'Iskcon' },
      { key: 'Size', value: sub.sizeLabel },
      { key: 'Wall Thickness', value: `${thicknessMm}mm` },
      { key: 'Length', value: '6 metre' },
      { key: 'Material', value: 'GI (Galvanised Iron)' },
      { key: 'Sold As', value: 'Per piece' },
      { key: 'GST', value: 'Inclusive' },
    ],
  };
}

module.exports = { SUBS, ROWS, descriptionFor, shortDescriptionFor };

async function main() {
  const apply = process.argv.includes('--apply');
  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`ISKCON GI pipe import [${mode}]`);

  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log('Connected to MongoDB');

  const company =
    (await Company.findOne({ name: BRAND_NAME }).lean()) ||
    (await Company.findOne({ name: new RegExp(`^${BRAND_NAME}$`, 'i') }).lean());
  if (!company) {
    console.error(`Company "${BRAND_NAME}" not found. Create the GI PIPES brand first.`);
    process.exit(1);
  }
  console.log(`Brand: ${company.name} (${company._id}) slug=${company.slug}`);
  const brandName = company.name;

  let root = await Category.findOne({ company: company._id, parent: null, name: ROOT_NAME });
  if (!root && !apply) {
    console.log(`[dry-run] would create root category "${ROOT_NAME}"`);
  } else if (!root) {
    root = await Category.create({
      name: ROOT_NAME,
      company: company._id,
      parent: null,
      description: 'Iskcon GI (galvanised iron) pipes in 6 metre lengths for water supply, plumbing and irrigation.',
      order: 0,
      isActive: true,
      showOnWebsite: true,
    });
    console.log(`Created root: ${root.name}`);
  } else {
    console.log(`Root: ${root.name} (${root._id})`);
    if (apply && (root.isActive === false || root.showOnWebsite === false)) {
      await Category.updateOne(
        { _id: root._id },
        { $set: { isActive: true, showOnWebsite: true } },
      );
      console.log('Root set to active + visible.');
    }
  }

  let createdSubs = 0;
  let createdProducts = 0;
  let updatedProducts = 0;
  const subIds = [];

  for (const sub of SUBS) {
    let subCat = root
      ? await Category.findOne({ company: company._id, parent: root._id, name: sub.name })
      : null;
    if (!subCat && !apply) {
      console.log(`[dry-run] would create subcategory "${sub.name}"`);
      continue;
    }
    if (!subCat) {
      subCat = await Category.create({
        name: sub.name,
        company: company._id,
        parent: root._id,
        description: `${sub.sizeLabel} Iskcon GI pipes in 6 metre lengths, in a choice of wall thicknesses.`,
        order: sub.order,
        isActive: true,
        showOnWebsite: true,
      });
      createdSubs += 1;
      console.log(`Created sub: ${sub.name}`);
    } else if (apply && (subCat.isActive === false || subCat.showOnWebsite === false)) {
      await Category.updateOne(
        { _id: subCat._id },
        { $set: { isActive: true, showOnWebsite: true } },
      );
    }
    subIds.push(subCat._id);

    const rows = ROWS.map((r, idx) => ({ idx, row: r })).filter(({ row }) => row[0] === SUBS.indexOf(sub));
    for (const { row } of rows) {
      const [, thicknessMm, thicknessCode, rate] = row;
      const doc = productDoc(sub, thicknessMm, thicknessCode, rate, company, subCat, brandName);
      const existing = await Product.findOne({ sku: doc.sku });
      if (!existing) {
        if (!apply) {
          console.log(
            `[dry-run] would create ${doc.sku} | ${doc.name} | mrp=${doc.mrp} retail=${doc.retailPrice} wholesale=${doc.wholesalePrice}`,
          );
          continue;
        }
        await Product.create(doc);
        createdProducts += 1;
      } else {
        const needsUpdate =
          existing.name !== doc.name ||
          String(existing.categoryRef) !== String(subCat._id) ||
          String(existing.company) !== String(company._id) ||
          existing.mrp !== doc.mrp ||
          existing.retailPrice !== doc.retailPrice ||
          existing.wholesalePrice !== doc.wholesalePrice ||
          existing.status !== 'active' ||
          existing.showOnWebsite !== true;
        if (needsUpdate) {
          if (!apply) {
            console.log(`[dry-run] would update ${doc.sku} prices/links/visibility`);
            continue;
          }
          await Product.updateOne(
            { _id: existing._id },
            {
              $set: {
                ...doc,
                pendingRetailPrice: null,
                pendingWholesalePrice: null,
                priceChangeScheduledAt: null,
                priceChangeEffectiveAt: null,
              },
            },
          );
          updatedProducts += 1;
        }
      }
    }

    if (apply) {
      const count = await Product.countDocuments({ categoryRef: subCat._id, status: { $ne: 'archived' } });
      await Category.updateOne({ _id: subCat._id }, { $set: { productCount: count } });
      console.log(`  ${sub.name}: ${count} products`);
    }
  }

  if (apply) {
    const total = await Product.countDocuments({
      categoryRef: { $in: subIds },
      status: { $ne: 'archived' },
    });
    await Category.updateOne({ _id: root._id }, { $set: { productCount: total } });
    await Company.updateOne(
      { _id: company._id },
      {
        $set: {
          productCount: await Product.countDocuments({
            company: company._id,
            status: { $ne: 'archived' },
          }),
        },
      },
    );
    console.log(`\nNew subs: ${createdSubs}, new products: ${createdProducts}, updated: ${updatedProducts}, ISKCON total: ${total}`);
    if (subIds.length !== EXPECTED_SUBCATEGORIES || total !== EXPECTED_PRODUCTS) {
      console.error(`WARNING: expected ${EXPECTED_SUBCATEGORIES} subs / ${EXPECTED_PRODUCTS} products.`);
      process.exit(2);
    }
  } else {
    console.log(`\n[dry-run] planned subs: ${EXPECTED_SUBCATEGORIES}, planned products: ${EXPECTED_PRODUCTS}. Re-run with --apply.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
