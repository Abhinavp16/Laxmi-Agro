const assert = require('assert');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function readSource(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

function testAnalyticsConversionWindow() {
  const source = readSource('src/controllers/admin/analyticsController.js');
  assert.ok(
    source.includes('const SIX_HOURS_MS = 6 * 60 * 60 * 1000;'),
    'potential-customer window must be six hours',
  );
  assert.ok(
    !source.includes('revert to 6 * 60 * 60 * 1000 after testing'),
    'testing TODO must not remain',
  );
}

function testAdminNegotiationSearch() {
  const source = readSource('src/controllers/admin/negotiationController.js');
  assert.ok(source.includes('query.$or = or;'), 'admin search must apply to the query');
  assert.ok(source.includes('negotiationNumber'), 'search must cover negotiation numbers');
  assert.ok(source.includes('productSnapshot.name'), 'search must cover product names');
  assert.ok(
    source.includes('wholesalerId: { $in:'),
    'search must resolve wholesaler names via User lookup',
  );
}

function testReviewSearchFields() {
  const source = readSource('src/controllers/admin/reviewController.js');
  assert.ok(source.includes('{ name:'), 'review search must query names');
  assert.ok(source.includes('{ role:'), 'review search must query roles');
  assert.ok(source.includes('{ review:'), 'review search must query review text');
  assert.ok(!source.includes('comment:'), 'review search must not use dead fields');
}

async function testPublicHindiWriteIsRemoved() {
  const productRoutes = require('../src/routes/productRoutes');
  const exposed = productRoutes.stack.some((layer) => (
    layer.route?.path === '/:id/hindi-name' && layer.route.methods.patch
  ));
  assert.strictEqual(exposed, false, 'public Hindi-name PATCH must not be registered');
}

function testNegotiationOrderIndexIsUnique() {
  const Order = require('../src/models/Order');
  const index = Order.schema.indexes().find(([fields]) => fields.negotiationId === 1);
  assert.ok(index, 'negotiationId index must exist');
  assert.strictEqual(index[1].unique, true, 'negotiationId index must be unique');
  assert.deepStrictEqual(
    index[1].partialFilterExpression,
    { negotiationId: { $type: 'objectId' } },
    'negotiationId index must exclude null values',
  );
}

async function testMissingSmtpFailsWithoutLoggingSecrets() {
  const originalEnv = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
  };
  const originalLog = console.log;
  const logs = [];
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  console.log = (...args) => logs.push(args.join(' '));

  try {
    const { sendMagicLinkEmail } = require('../src/services/emailService');
    await assert.rejects(
      sendMagicLinkEmail('admin@example.com', 'https://admin.example/login?token=secret-token'),
      (error) => error.statusCode === 503 && error.code === 'MAGIC_LINK_EMAIL_UNAVAILABLE',
    );
    assert.ok(!logs.join('\n').includes('secret-token'), 'magic token must never be logged');
    assert.ok(!logs.join('\n').includes('admin@example.com'), 'fallback must not log recipient data');
  } finally {
    console.log = originalLog;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

async function testMagicLinkTokenLifecycle() {
  const { consumeMagicLink, issueMagicLink, hashMagicToken } = require('../src/services/magicLinkService');
  const records = [{ _id: 'old', email: 'admin@example.com', used: false, createdAt: new Date(1) }];
  const deleted = [];
  const tokenStore = {
    async create(data) {
      const record = { ...data, _id: `new-${records.length}`, used: false, createdAt: new Date(2) };
      records.push(record);
      return record;
    },
    async deleteOne(query) {
      deleted.push(query._id);
    },
    async updateOne(query, update) {
      assert.strictEqual(query._id, 'new-1');
      assert.ok(update.$set.deliveredAt instanceof Date);
    },
    async deleteMany(query) {
      assert.strictEqual(query.email, 'admin@example.com');
      assert.strictEqual(query._id.$lt, 'new-1');
      assert.deepStrictEqual(query.deliveredAt, { $ne: null });
    },
  };

  let deliveredLink = '';
  const candidate = await issueMagicLink({
    email: 'admin@example.com',
    panelUrl: 'https://admin.example',
    expiryMinutes: 5,
    tokenStore,
    randomBytes: () => Buffer.from('raw-token'),
    sendEmail: async (_email, link) => { deliveredLink = link; },
  });
  assert.ok(deliveredLink.endsWith('token=7261772d746f6b656e'));
  assert.strictEqual(candidate.tokenHash, hashMagicToken('7261772d746f6b656e'));
  assert.ok(!JSON.stringify(candidate).includes('token=') && !JSON.stringify(candidate).includes('raw-token'));
  assert.ok(candidate.deliveredAt instanceof Date);
  assert.deepStrictEqual(deleted, []);

  await assert.rejects(
    issueMagicLink({
      email: 'admin@example.com',
      panelUrl: 'https://admin.example',
      expiryMinutes: 5,
      tokenStore: {
        ...tokenStore,
        async updateOne() {
          throw new Error('delivery failure must not mark a token delivered');
        },
      },
      randomBytes: () => Buffer.from('failed-token'),
      sendEmail: async () => { throw new Error('mail unavailable'); },
    }),
    /mail unavailable/,
  );
  assert.deepStrictEqual(deleted, ['new-2'], 'failed candidate must be removed without deleting old tokens');

  let consumable = { _id: 'single-use-token' };
  const consumableStore = {
    async findOneAndDelete() {
      const claimed = consumable;
      consumable = null;
      return claimed;
    },
  };
  const claims = await Promise.all([
    consumeMagicLink('one-time-token', consumableStore),
    consumeMagicLink('one-time-token', consumableStore),
  ]);
  assert.strictEqual(claims.filter(Boolean).length, 1, 'a magic link can only be claimed once');
}

async function testNegotiationAcceptanceStatesAndIdempotency() {
  const models = require('../src/models');
  const auditService = require('../src/services/auditService');
  const notificationService = require('../src/services/notificationService');
  const originals = {
    negotiationFindById: models.Negotiation.findById,
    negotiationFindOneAndUpdate: models.Negotiation.findOneAndUpdate,
    negotiationUpdateOne: models.Negotiation.updateOne,
    orderFindById: models.Order.findById,
    orderFindOne: models.Order.findOne,
    orderCreate: models.Order.create,
    orderDeleteOne: models.Order.deleteOne,
    productFindById: models.Product.findById,
    productFindByIdAndUpdate: models.Product.findByIdAndUpdate,
    userFindById: models.User.findById,
    recordAudit: auditService.recordAudit,
    sendToUser: notificationService.sendToUser,
  };
  let sideEffectCount = 0;
  auditService.recordAudit = async () => { sideEffectCount += 1; };
  notificationService.sendToUser = async () => {};
  const servicePath = require.resolve('../src/services/negotiationOrderService');
  delete require.cache[servicePath];
  const { acceptNegotiationAndCreateOrder } = require(servicePath);

  const ids = {
    negotiation: new mongoose.Types.ObjectId(),
    product: new mongoose.Types.ObjectId(),
    wholesaler: new mongoose.Types.ObjectId(),
    actor: new mongoose.Types.ObjectId(),
  };
  const address = {
    fullName: 'Test Buyer',
    phone: '9135724680',
    addressLine1: '1 Test Road',
    city: 'Raipur',
    state: 'Chhattisgarh',
    pincode: '492001',
  };

  function configure(status, currentOfferBy = 'wholesaler', expiresAt = new Date(Date.now() + 60000)) {
    let order = null;
    let orderCreates = 0;
    let finalized = false;
    const negotiation = {
      _id: ids.negotiation,
      negotiationNumber: 'NEG-TEST',
      wholesalerId: ids.wholesaler,
      productId: ids.product,
      productSnapshot: { name: 'Test Product' },
      requestedQuantity: 5,
      currentOfferBy,
      currentPricePerUnit: 90,
      currentTotalPrice: 450,
      status,
      expiresAt,
      orderId: null,
    };
    const product = {
      _id: ids.product,
      name: 'Test Product',
      sku: 'TEST-1',
      stock: 50,
      minWholesaleQuantity: 1,
    };
    const wholesaler = {
      _id: ids.wholesaler,
      name: 'Test Buyer',
      email: 'buyer@example.com',
      phone: '9135724680',
      businessInfo: {},
    };

    models.Negotiation.findById = async () => negotiation;
    models.Negotiation.updateOne = async () => {
      negotiation.status = 'expired';
    };
    models.Negotiation.findOneAndUpdate = async (_query, update) => {
      if (finalized || !['pending', 'countered'].includes(negotiation.status) || negotiation.orderId) return null;
      finalized = true;
      Object.assign(negotiation, update.$set);
      return negotiation;
    };
    models.Order.findOne = () => ({ lean: async () => order });
    models.Order.findById = () => ({ lean: async () => order });
    models.Order.create = async (payload) => {
      if (order) {
        const duplicate = new Error('duplicate negotiation order');
        duplicate.code = 11000;
        throw duplicate;
      }
      orderCreates += 1;
      order = { ...payload, _id: new mongoose.Types.ObjectId(), orderNumber: 'ORD-TEST' };
      return order;
    };
    models.Order.deleteOne = async () => {};
    models.Product.findById = async () => product;
    models.Product.findByIdAndUpdate = async () => product;
    models.User.findById = async () => wholesaler;
    return { negotiation, getOrderCreates: () => orderCreates };
  }

  const request = {
    negotiationId: ids.negotiation,
    actor: { id: ids.actor, role: 'admin', name: 'Test Admin' },
    shippingAddress: address,
  };

  try {
    for (const [status, offerBy] of [['pending', 'wholesaler'], ['countered', 'admin']]) {
      sideEffectCount = 0;
      const state = configure(status, offerBy);
      const first = await acceptNegotiationAndCreateOrder(request);
      const second = await acceptNegotiationAndCreateOrder(request);
      assert.strictEqual(first.negotiation.status, 'converted');
      assert.strictEqual(first.order.statusHistory[0].status, 'pending_payment');
      assert.strictEqual(second.alreadyConverted, true);
      assert.strictEqual(state.getOrderCreates(), 1, `${status} acceptance must create one order`);
      assert.strictEqual(sideEffectCount, 1, `${status} acceptance side effects must run once`);
    }

    for (const status of ['converted', 'rejected', 'expired']) {
      configure(status);
      await assert.rejects(
        acceptNegotiationAndCreateOrder(request),
        (error) => error.code === 'INVALID_NEGOTIATION_STATUS',
      );
    }

    configure('pending', 'admin', new Date(Date.now() - 1000));
    await assert.rejects(
      acceptNegotiationAndCreateOrder(request),
      (error) => error.code === 'NEGOTIATION_EXPIRED',
    );

    configure('countered', 'admin');
    await assert.rejects(
      acceptNegotiationAndCreateOrder({
        ...request,
        actor: { id: ids.actor, role: 'staff', name: 'Test Staff' },
        minimumPrice: 95,
      }),
      (error) => error.code === 'STAFF_NEGOTIATION_PRICE_LIMIT',
    );

    sideEffectCount = 0;
    const concurrent = configure('countered', 'admin');
    const results = await Promise.all([
      acceptNegotiationAndCreateOrder(request),
      acceptNegotiationAndCreateOrder(request),
    ]);
    assert.strictEqual(concurrent.getOrderCreates(), 1);
    assert.strictEqual(results.filter((result) => result.alreadyConverted === false).length, 1);
    assert.strictEqual(sideEffectCount, 1);
  } finally {
    models.Negotiation.findById = originals.negotiationFindById;
    models.Negotiation.findOneAndUpdate = originals.negotiationFindOneAndUpdate;
    models.Negotiation.updateOne = originals.negotiationUpdateOne;
    models.Order.findById = originals.orderFindById;
    models.Order.findOne = originals.orderFindOne;
    models.Order.create = originals.orderCreate;
    models.Order.deleteOne = originals.orderDeleteOne;
    models.Product.findById = originals.productFindById;
    models.Product.findByIdAndUpdate = originals.productFindByIdAndUpdate;
    models.User.findById = originals.userFindById;
    auditService.recordAudit = originals.recordAudit;
    notificationService.sendToUser = originals.sendToUser;
  }
}

async function run() {
  await testPublicHindiWriteIsRemoved();
  testNegotiationOrderIndexIsUnique();
  await testMissingSmtpFailsWithoutLoggingSecrets();
  await testMagicLinkTokenLifecycle();
  await testNegotiationAcceptanceStatesAndIdempotency();
  testAnalyticsConversionWindow();
  testAdminNegotiationSearch();
  testReviewSearchFields();
  console.log('Production critical regression tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
