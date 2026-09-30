const assert = require('assert');
const { planMeterPack } = require('../src/scripts/convertMeterPacks');
const { getPackInfo } = require('../src/utils/packSize');

// Service wire: stock below one coil's length was typed in coils.
{
  const plan = planMeterPack({ name: '4 Core Premium 12mm', category: 'aluminium-cable-service-cable', priceUnit: 'Mtr', packing: '500 mtrs', stock: 100, minWholesaleQuantity: 500, lowStockThreshold: 5 });
  assert.deepStrictEqual(plan.set, { priceUnit: 'Coil', packing: '500 m', stock: 50000, minWholesaleQuantity: 1, lowStockThreshold: 500 });
  assert.deepStrictEqual(getPackInfo(plan.set), { size: 500, packUnit: 'coil', contentUnit: 'meter' });
}

// Cables / roll pipes become bundles; meter stock is kept; typos fixed.
{
  const cable = planMeterPack({ name: '4.0sqmm turbo blue', category: 'submersible-cable-40-sqmm', priceUnit: 'Mtr', packing: '500mtr', stock: 10000, minWholesaleQuantity: 500 });
  assert.deepStrictEqual(cable.set, { priceUnit: 'Bundle', packing: '500 m', stock: 10000, minWholesaleQuantity: 1, lowStockThreshold: 500 });
  const typo = planMeterPack({ name: '2 Core premium 12mm', category: 'aluminium-cable-service-cable', priceUnit: 'Mtr', packing: '500 mors', stock: 100, minWholesaleQuantity: 500 });
  assert.strictEqual(typo.set.packing, '500 m');
  const finolex = planMeterPack({ name: '1.25” FINOLEX Roll pipe', category: 'finolex-hdep-pipes-125-inch', priceUnit: 'Mtr', packing: '300', stock: 10, minWholesaleQuantity: 300 });
  assert.deepStrictEqual([finolex.set.priceUnit, finolex.set.stock, finolex.set.minWholesaleQuantity], ['Bundle', 3000, 1]);
  assert.ok(finolex.notes[0].includes('read as bundles'));
}

// Part bundles are reported (the rest is sold as cut length).
{
  const plan = planMeterPack({ name: 'Green Valley 1.5”', category: 'roll-pipe-roll-15-inch', priceUnit: 'Mtr', packing: '300', stock: 10000, minWholesaleQuantity: 300 });
  assert.strictEqual(plan.set.stock, 10000);
  assert.ok(plan.notes.some((note) => note.includes('33.3 bundles')));
}

// Anything else is left alone.
assert.strictEqual(planMeterPack({ priceUnit: 'Piece', packing: '20', stock: 100 }), null);
assert.strictEqual(planMeterPack({ priceUnit: 'Packet', packing: '15', stock: 2000 }), null);
assert.strictEqual(planMeterPack({ priceUnit: 'Mtr', packing: '', stock: 100 }), null);
assert.strictEqual(planMeterPack({ priceUnit: 'Coil', packing: '500 m', stock: 100 }), null);

console.log('meterPackMigration tests passed');
