const { Order, Product, User, Negotiation } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { ORDER_STATUS, ORDER_TYPES, NEGOTIATION_STATUS, NEGOTIATION_ACTIONS } = require('../utils/constants');
const { getVariantById, buildVariantSnapshot } = require('../utils/productVariants');
const { recordAudit } = require('./auditService');
const notificationService = require('./notificationService');

const getMinimumWholesaleQuantity = (product) => Number(
  product?.minWholesaleQuantity ?? 10,
);

const REQUIRED_ADDRESS_FIELDS = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];

/**
 * Resolve the shipping address for an admin/staff-created negotiation order.
 * Priority: explicit address in request body -> wholesaler's most recent
 * order address -> profile-derived address. Throws BadRequestError listing
 * missing fields when nothing complete is available.
 */
async function resolveAcceptAddress({ bodyAddress, wholesaler }) {
  if (bodyAddress && REQUIRED_ADDRESS_FIELDS.every((f) => String(bodyAddress[f] || '').trim())) {
    return { shippingAddress: bodyAddress, source: 'provided' };
  }

  const lastOrder = await Order.findOne({ userId: wholesaler._id })
    .sort({ createdAt: -1 })
    .select('shippingAddress')
    .lean();
  if (lastOrder?.shippingAddress && REQUIRED_ADDRESS_FIELDS.every((f) => String(lastOrder.shippingAddress[f] || '').trim())) {
    return { shippingAddress: lastOrder.shippingAddress, source: 'last_order' };
  }

  const profileAddress = {
    fullName: wholesaler.name,
    phone: wholesaler.phone,
    addressLine1: wholesaler.address || wholesaler.businessInfo?.businessAddress || '',
    addressLine2: wholesaler.businessInfo?.businessName || '',
    city: '',
    state: '',
    pincode: '',
  };
  const missing = REQUIRED_ADDRESS_FIELDS.filter((f) => !String(profileAddress[f] || '').trim());
  if (missing.length === 0) {
    return { shippingAddress: profileAddress, source: 'profile' };
  }
  throw new BadRequestError(
    `Wholesaler address is incomplete (missing: ${missing.join(', ')}). Enter the full shipping address to confirm this order.`,
    'ADDRESS_INCOMPLETE',
  );
}

function emitToNegotiationRoom(io, negotiationId, event, payload) {
  try {
    const instance = io || null;
    if (instance) instance.to(`negotiation-${negotiationId}`).emit(event, payload);
  } catch (err) {
    console.error(`Failed to emit ${event} for negotiation ${negotiationId}:`, err.message);
  }
}

async function notifyWholesaler(userId, notification, data) {
  try {
    await notificationService.sendToUser(userId, notification, data);
  } catch (err) {
    console.error('Failed to send negotiation order notification:', err.message);
  }
}

/**
 * Accept a negotiation (admin or staff) AND create the confirmed order.
 * Idempotent: if the negotiation already has an order, returns it.
 */
async function acceptNegotiationAndCreateOrder({
  negotiationId,
  actor,
  message,
  shippingAddress: bodyAddress,
  customerNote,
  io,
}) {
  const negotiation = await Negotiation.findById(negotiationId);
  if (!negotiation) {
    throw new NotFoundError('Negotiation not found', 'NEGOTIATION_NOT_FOUND');
  }

  if (negotiation.orderId) {
    const existingOrder = await Order.findById(negotiation.orderId).lean();
    return { negotiation, order: existingOrder, alreadyConverted: true };
  }

  if (
    ![NEGOTIATION_STATUS.PENDING, NEGOTIATION_STATUS.COUNTERED].includes(negotiation.status) ||
    negotiation.currentOfferBy !== 'wholesaler'
  ) {
    throw new BadRequestError(
      'Cannot accept until the wholesaler submits an offer',
      'INVALID_NEGOTIATION_STATUS',
    );
  }

  const product = await Product.findById(negotiation.productId);
  if (!product) {
    throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
  }

  const resolved = getVariantById(product, null);
  if (!resolved) {
    throw new BadRequestError('Negotiated product no longer exists', 'PRODUCT_NOT_FOUND');
  }
  if (resolved.variant.stock < negotiation.requestedQuantity) {
    throw new BadRequestError('Insufficient stock', 'INSUFFICIENT_STOCK');
  }
  const minimumQuantity = getMinimumWholesaleQuantity(product);
  if (negotiation.requestedQuantity < minimumQuantity) {
    throw new BadRequestError(
      `Minimum wholesale quantity for ${product.name} is ${minimumQuantity}`,
      'MIN_WHOLESALE_QUANTITY_NOT_MET',
    );
  }

  const wholesaler = await User.findById(negotiation.wholesalerId);
  if (!wholesaler) {
    throw new NotFoundError('Wholesaler not found', 'USER_NOT_FOUND');
  }

  const { shippingAddress, source } = await resolveAcceptAddress({
    bodyAddress,
    wholesaler,
  });

  const subtotal = negotiation.currentTotalPrice;
  const orderItems = [{
    productId: product._id,
    variantId: null,
    productSnapshot: {
      name: product.name,
      sku: product.sku,
      image: product.primaryImage,
    },
    variantSnapshot: buildVariantSnapshot(product, resolved.variant),
    quantity: negotiation.requestedQuantity,
    pricePerUnit: negotiation.currentPricePerUnit,
    totalPrice: negotiation.currentTotalPrice,
  }];

  const actorLabel = actor.role === 'staff' ? `Staff ${actor.name}` : `Admin ${actor.name}`;
  const order = await Order.create({
    userId: wholesaler._id,
    customerSnapshot: {
      name: wholesaler.name,
      email: wholesaler.email,
      phone: wholesaler.phone,
      businessName: wholesaler.businessInfo?.businessName,
    },
    orderType: ORDER_TYPES.WHOLESALE,
    negotiationId: negotiation._id,
    items: orderItems,
    subtotal,
    discount: 0,
    total: subtotal,
    shippingAddress,
    customerNote,
    adminNote: `Negotiation ${negotiation.negotiationNumber} accepted by ${actorLabel} — order confirmed from negotiation chat.`,
    statusHistory: [{
      status: ORDER_STATUS.PENDING_PAYMENT,
      note: `Negotiation ${negotiation.negotiationNumber} accepted by ${actorLabel} — order confirmed`,
      updatedBy: actor.id,
    }],
  });

  negotiation.history.push({
    action: NEGOTIATION_ACTIONS.ACCEPTED,
    by: 'admin',
    actorId: actor.id,
    actorRole: actor.role,
    pricePerUnit: negotiation.currentPricePerUnit,
    totalPrice: negotiation.currentTotalPrice,
    message: message || `Accepted by ${actorLabel}`,
  });
  negotiation.status = NEGOTIATION_STATUS.CONVERTED;
  negotiation.finalPricePerUnit = negotiation.currentPricePerUnit;
  negotiation.finalTotalPrice = negotiation.currentTotalPrice;
  negotiation.orderId = order._id;
  await negotiation.save();

  await Product.findByIdAndUpdate(product._id, { $inc: { orderCount: 1 } });
  await recordAudit({
    actorId: actor.id,
    action: 'negotiation.accepted_with_order',
    entityType: 'negotiation',
    entityId: negotiation._id,
    metadata: {
      pricePerUnit: negotiation.finalPricePerUnit,
      orderId: String(order._id),
      orderNumber: order.orderNumber,
    },
  });

  await notifyWholesaler(wholesaler._id, {
    title: 'Negotiation Accepted! ✅',
    body: `Your offer for ${negotiation.productSnapshot.name} was accepted at ₹${negotiation.finalPricePerUnit}/unit. Order ${order.orderNumber} confirmed.`,
  }, {
    type: 'negotiation_accepted',
    negotiationId: negotiation._id.toString(),
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
  });

  emitToNegotiationRoom(io, negotiation._id.toString(), 'negotiation-accepted', {
    negotiationId: negotiation._id.toString(),
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    finalPricePerUnit: negotiation.finalPricePerUnit,
    finalTotalPrice: negotiation.finalTotalPrice,
    acceptedBy: actorLabel,
    timestamp: new Date(),
  });

  return { negotiation, order, alreadyConverted: false, addressSource: source };
}

module.exports = {
  acceptNegotiationAndCreateOrder,
  resolveAcceptAddress,
  emitToNegotiationRoom,
  notifyWholesaler,
};
