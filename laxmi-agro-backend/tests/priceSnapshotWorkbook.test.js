const assert = require('assert');
const ExcelJS = require('exceljs');
const {
  CURRENCY_FORMAT,
  createPriceSnapshotWorkbookBuffer,
} = require('../src/utils/priceSnapshotWorkbook');

async function run() {
  const exportedAt = new Date('2026-08-10T10:30:00.000Z');
  const buffer = await createPriceSnapshotWorkbookBuffer({
    companyName: 'Laxmi Agro Enterprises',
    exportedAt,
    products: [
      {
        category: 'Pumps',
        name: 'Alpha Pump',
        sku: 'PUMP-001',
        retailPrice: 1250,
        wholesalePrice: 1100,
        pendingRetailPrice: 1300,
        pendingWholesalePrice: null,
        scheduleType: 'schedule_24h',
        effectiveAt: '2026-08-11T10:30:00.000Z',
      },
      {
        category: 'Valves',
        name: 'Beta Valve',
        sku: 'VALVE-001',
        retailPrice: 420,
        wholesalePrice: 360,
        pendingRetailPrice: null,
        pendingWholesalePrice: null,
        scheduleType: '',
        effectiveAt: null,
      },
    ],
  });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(buffer));
  const sheet = workbook.getWorksheet('Product Price Snapshot');

  assert.ok(sheet, 'snapshot worksheet should be present');
  assert.strictEqual(sheet.getCell('A1').value, 'Product Price Snapshot');
  assert.strictEqual(sheet.getCell('A2').value, 'Laxmi Agro Enterprises');
  assert.match(String(sheet.getCell('A3').value), /^Exported on \(IST\): /);
  assert.strictEqual(sheet.getCell('A5').value, 'S.No.');
  assert.strictEqual(sheet.getCell('K5').value, 'Pending Status');
  assert.strictEqual(sheet.getCell('A6').value, 'Pumps');
  assert.strictEqual(sheet.getCell('C7').value, 'Alpha Pump');
  assert.strictEqual(sheet.getCell('G7').value, 1300);
  assert.strictEqual(sheet.getCell('H7').value, null, 'an unchanged pending tier must stay blank');
  assert.strictEqual(sheet.getCell('I7').value, 'After 24 hours');
  assert.strictEqual(sheet.getCell('K7').value, 'Pending');
  assert.strictEqual(sheet.getCell('E7').numFmt, CURRENCY_FORMAT);
  assert.strictEqual(sheet.getCell('A8').value, 'Valves');
  assert.strictEqual(sheet.getCell('K9').value, 'No pending change');
  assert.strictEqual(sheet.getCell('G9').value, null);
  assert.strictEqual(sheet.getCell('H9').value, null);

  console.log('✓ price snapshot workbook formatting and pending-price behavior verified');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
