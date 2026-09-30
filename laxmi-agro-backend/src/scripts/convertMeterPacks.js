// Converts meter-priced products to coils / bundles (see utils/packSize.js).
//
//   Service wire          -> Coil of N m
//   Cables and roll pipes -> Bundle of N m
//
// Price stays per meter. Packing becomes "N m", the wholesale minimum becomes
// packs (500 m -> 1) and stock is stored in meters. Stock smaller than one
// pack's length was typed in coils/bundles and is multiplied by the length.
//
// Reports only by default. Writes only with --apply, and only to products
// that haven't changed since they were read.
//
//   node src/scripts/convertMeterPacks.js           # report
//   node src/scripts/convertMeterPacks.js --apply   # convert
require('dotenv').config();

const mongoose = require('mongoose');

const METER_UNITS = new Set(['m', 'mtr', 'mtrs', 'meter', 'meters', 'metre', 'metres']);

const isMeterUnit = (unit) => METER_UNITS.has(String(unit ?? '').trim().toLowerCase().replace(/\./g, ''));

const packLength = (packing) => {
  const match = /^\s*(\d+)/.exec(String(packing ?? ''));
  const length = match ? Number.parseInt(match[1], 10) : null;
  return length && length > 1 ? length : null;
};

const isServiceWire = (product) => /service/i.test(`${product.category || ''} ${product.name || ''}`);

// Returns null when the product isn't a meter product with a pack length.
function planMeterPack(product) {
  if (!isMeterUnit(product.priceUnit)) return null;
  const length = packLength(product.packing);
  if (!length) return null;

  const packUnit = isServiceWire(product) ? 'Coil' : 'Bundle';
  const stock = Number(product.stock) || 0;
  const stockWasPacks = stock > 0 && stock < length;
  const stockMeters = stockWasPacks ? stock * length : stock;
  const currentMinimum = Number(product.minWholesaleQuantity) || 1;
  const minimumPacks = Math.max(1, Math.round(currentMinimum / length));
  const lowStock = Number(product.lowStockThreshold) || 0;

  return {
    set: {
      priceUnit: packUnit,
      packing: `${length} m`,
      stock: stockMeters,
      minWholesaleQuantity: minimumPacks,
      lowStockThreshold: Math.max(lowStock, length),
    },
    notes: [
      stockWasPacks ? `stock ${stock} read as ${packUnit.toLowerCase()}s` : `stock ${stock} read as meters`,
      stockMeters % length === 0 ? '' : `stock is ${(stockMeters / length).toFixed(1)} ${packUnit.toLowerCase()}s (rest sold as cut length)`,
      currentMinimum % length === 0 ? '' : `wholesale minimum ${currentMinimum} m is not whole ${packUnit.toLowerCase()}s`,
    ].filter(Boolean),
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const Product = require('../models/Product');
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await Product.find({})
    .select('name category priceUnit packing stock minWholesaleQuantity lowStockThreshold')
    .lean();

  const plans = products
    .map((product) => ({ product, plan: planMeterPack(product) }))
    .filter(({ plan }) => plan);

  console.log(`${apply ? 'Converting' : 'Report (no changes)'}: ${plans.length} meter products\n`);
  let updated = 0;
  let skipped = 0;
  for (const { product, plan } of plans) {
    const { set, notes } = plan;
    console.log([
      `${product.name}`.padEnd(40),
      `${product.priceUnit}/${product.packing} -> ${set.priceUnit}/${set.packing}`.padEnd(28),
      `stock ${product.stock} -> ${set.stock} m`.padEnd(24),
      `min ${product.minWholesaleQuantity} -> ${set.minWholesaleQuantity}`,
      notes.length ? `  [${notes.join('; ')}]` : '',
    ].join(' '));
    if (!apply) continue;
    const result = await Product.updateOne(
      {
        _id: product._id,
        priceUnit: product.priceUnit,
        packing: product.packing,
        stock: product.stock,
        minWholesaleQuantity: product.minWholesaleQuantity,
      },
      { $set: set },
    );
    if (result.modifiedCount > 0) updated += 1;
    else skipped += 1;
  }

  if (apply) console.log(`\nUpdated ${updated}, skipped ${skipped} (changed since read).`);
  else console.log('\nNothing was changed. Run with --apply to convert.');
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { planMeterPack };
