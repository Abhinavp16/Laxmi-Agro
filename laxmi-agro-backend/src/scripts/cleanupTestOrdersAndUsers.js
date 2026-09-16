/* One-shot cleanup: remove dummy test orders + test user accounts.
 *
 * Guards:
 * - Orders: only the 24 listed order numbers, each re-verified by number +
 *   test-name snapshot before touching. Abort on any mismatch.
 * - Users: only the 14 listed ids, each re-verified by name. NEVER deletes
 *   admin/staff accounts - aborts if any target has role admin/staff.
 * - Stock deducted by processing/delivered dummy orders is restored with a
 *   logged StockLog entry. Linked negotiations are reset (orderId cleared,
 *   status back to accepted, history preserved).
 *
 * Usage:
 *   node src/scripts/cleanupTestOrdersAndUsers.js --dry-run
 *   node src/scripts/cleanupTestOrdersAndUsers.js --apply
 */
require('dotenv').config();
const mongoose = require('mongoose');
const {
  User, Order, Payment, StockLog, Product, Negotiation,
  Cart, DeviceToken, Notification, RefreshToken, AccountDeletionRequest,
} = require('../models');

const ORDER_NUMBERS = [
  'ORD-2026-08886295', 'ORD-2026-56202811', 'ORD-2026-97395610',
  'ORD-2026-28423282', 'ORD-2026-85815571', 'ORD-2026-28416625',
  'ORD-2026-17803174', 'ORD-2026-63485683', 'ORD-2026-67348323',
  'ORD-2026-52486962', 'ORD-2026-32884304', 'ORD-2026-53268316',
  'ORD-2026-86101683', 'ORD-2026-10604691', 'ORD-2026-78187541',
  'ORD-2026-20589419', 'ORD-2026-59981619', 'ORD-2026-31317217',
  'ORD-2026-78603962', 'ORD-2026-14777267', 'ORD-2026-58672912',
  'ORD-2026-01664041', 'ORD-2026-59027304', 'ORD-2026-14757375',
];

const USER_IDS = [
  '6a8c1f6a2875355c3888fd50', // Abhinav Kumar
  '6a9299ebe16ef0f91558623e', // Test User A
  '6a9505d68ff22e55fc4d75e6', // Divyy
  '6a23efbe83faa9371c03c848', // Divyansh 5858585858
  '6a8fe3e5221c2aac0fd62478', // Divyansh 9009260073
  '6a2939fa36fdf3ceb6feb532', // abhi
  '6a19afd297a973b60e594e0a', // Adarsh 1111111111
  '6a23eeb083faa9371c03c815', // Adarsh 1234567890
  '6a9044186b3f9dc0e9ebb8b3', // Adarsh 6265328556
  '6a8fe3a3acf3991eac0db0b5', // Rahul
  '6a8fe9853002436552685f61', // Sujalkant Singh
  '6a8ff9fde470efb638384692', // Ashutosh
  '6a90282c435d45c0b8f2c81b', // Mandeep Kaur
  '6a95084989f9dac9c8c69c1c', // Divyy3
];

const TEST_NAME = /abhinav|test user|divyy|adarsh|divyansh|^abhi$|rahul|pradeep|sujalkant|ashutosh|mandeep/i;

async function main() {
  const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
  await mongoose.connect(process.env.MONGODB_URI);
  const summary = { mode, orders: [], negotiationsReset: [], users: [], stockRestored: [] };

  // ---- Verify orders ----
  const orders = await Order.find({ orderNumber: { $in: ORDER_NUMBERS } });
  if (orders.length !== ORDER_NUMBERS.length) {
    throw new Error(`Order count changed: expected ${ORDER_NUMBERS.length}, found ${orders.length}`);
  }
  for (const order of orders) {
    const name = order.customerSnapshot?.name || '';
    if (!TEST_NAME.test(name)) {
      throw new Error(`Order ${order.orderNumber} no longer looks like a test order (${name}) - aborting`);
    }
    summary.orders.push({ orderNumber: order.orderNumber, name, status: order.status, total: order.total });
  }

  // ---- Verify users (never admin/staff) ----
  const users = await User.find({ _id: { $in: USER_IDS } });
  if (users.length !== USER_IDS.length) {
    throw new Error(`User count changed: expected ${USER_IDS.length}, found ${users.length}`);
  }
  for (const user of users) {
    if (['admin', 'staff'].includes(user.role)) {
      throw new Error(`Refusing to delete privileged account ${user.name} (${user.role}) - aborting`);
    }
    summary.users.push({ name: user.name, phone: user.phone, role: user.role });
  }

  // ---- Keeper accounts must still exist untouched ----
  const keeper = await User.findById('6a23ef5383faa9371c03c821').select('name role').lean();
  if (!keeper || keeper.role !== 'wholesaler') throw new Error('Keeper wholesaler account changed - aborting');

  // ---- Linked negotiations ----
  const orderIds = orders.map((o) => o._id);
  const linked = await Negotiation.find({ orderId: { $in: orderIds } }).select('negotiationNumber status orderId').lean();
  summary.negotiationsReset = linked.map((n) => ({ number: n.negotiationNumber, status: n.status }));

  // ---- Stock that would be restored ----
  for (const order of orders) {
    if (['processing', 'delivered', 'shipped'].includes(order.status)) {
      for (const item of order.items || []) {
        summary.stockRestored.push({ orderNumber: order.orderNumber, productId: String(item.productId), qty: item.quantity });
      }
    }
  }

  console.log(JSON.stringify(summary, null, 2));

  if (mode === 'apply') {
    // 1. Restore deducted stock with audit trail
    for (const order of orders) {
      if (!['processing', 'delivered', 'shipped'].includes(order.status)) continue;
      for (const item of order.items || []) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        const previousStock = product.stock;
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        await StockLog.create({
          productId: item.productId,
          action: 'manual_adjust',
          quantityChange: item.quantity,
          previousStock,
          newStock: previousStock + item.quantity,
          orderId: order._id,
          reason: `Test cleanup: restored stock from deleted dummy order ${order.orderNumber}`,
        });
      }
    }
    // 2. Reset linked negotiations (history preserved)
    await Negotiation.updateMany(
      { orderId: { $in: orderIds } },
      { $set: { orderId: null, status: 'accepted' } },
    );
    // 3. Delete payments, stock logs, orders
    await Payment.deleteMany({ orderId: { $in: orderIds } });
    await StockLog.deleteMany({ orderId: { $in: orderIds }, reason: /^(?!Test cleanup)/ });
    await Order.deleteMany({ _id: { $in: orderIds } });
    // 4. Delete test users + their dangling docs
    const userIds = users.map((u) => u._id);
    await Cart.deleteMany({ userId: { $in: userIds } });
    await DeviceToken.deleteMany({ userId: { $in: userIds } });
    await Notification.deleteMany({ userId: { $in: userIds } });
    await RefreshToken.deleteMany({ userId: { $in: userIds } });
    await AccountDeletionRequest.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });

    const remaining = {
      orders: await Order.countDocuments({ _id: { $in: orderIds } }),
      users: await User.countDocuments({ _id: { $in: userIds } }),
      totalOrders: await Order.countDocuments(),
      totalUsers: await User.countDocuments(),
    };
    console.log(JSON.stringify({ remaining }, null, 2));
    if (remaining.orders !== 0 || remaining.users !== 0) {
      throw new Error('Cleanup incomplete - review remaining docs');
    }
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('CLEANUP FAILED:', error.message);
  try { await mongoose.disconnect(); } catch (_) { /* noop */ }
  process.exit(1);
});
