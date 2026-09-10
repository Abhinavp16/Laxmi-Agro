const { Order, Product, User, Negotiation } = require('../models');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/errors');
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
  minimumPrice = null,
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

  const orphanedOrder = await Order.findOne({ negotiationId: negotiation._id }).lean();
  if (orphanedOrder) {
    const recoveredNegotiation = await finalizeNegotiation({
      negotiation,
      order: orphanedOrder,
      actor,
      message,
      recoverExisting: true,
    });
    if (recoveredNegotiation) {
      const [product, wholesaler] = await Promise.all([
        Product.findById(negotiation.productId),
        User.findById(negotiation.wholesalerId),
      ]);
      await runPostConversionEffects({
        negotiation: recoveredNegotiation,
        order: orphanedOrder,
        actor,
        product,
        wholesaler,
        io,
      });
      return {
        negotiation: recoveredNegotiation,
        order: orphanedOrder,
        alreadyConverted: true,
        addressSource: 'existing_order',
      };
    }
    throw new BadRequestError(
      'An existing order could not be linked in the current negotiation status',
      'NEGOTIATION_ORDER_CONFLICT',
    );
  }

  if (![NEGOTIATION_STATUS.PENDING, NEGOTIATION_STATUS.COUNTERED].includes(negotiation.status)) {
    throw new BadRequestError(
      'Cannot accept in the current negotiation status',
      'INVALID_NEGOTIATION_STATUS',
    );
  }

  if (negotiation.expiresAt <= new Date()) {
    await Negotiation.updateOne(
      { _id: negotiation._id, status: { $in: [NEGOTIATION_STATUS.PENDING, NEGOTIATION_STATUS.COUNTERED] } },
      { $set: { status: NEGOTIATION_STATUS.EXPIRED } },
    );
    throw new BadRequestError('Negotiation has expired', 'NEGOTIATION_EXPIRED');
  }

  if (actor.role === 'staff' && Number(negotiation.currentPricePerUnit) < Number(minimumPrice)) {
    throw new ForbiddenError(
      `Staff cannot accept below the configured minimum price of ₹${minimumPrice}`,
      'STAFF_NEGOTIATION_PRICE_LIMIT',
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
  let order;
  let createdOrder = false;
  try {
    order = await Order.create({
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
    createdOrder = true;
  } catch (error) {
    if (error?.code !== 11000) throw error;
    order = await Order.findOne({ negotiationId: negotiation._id }).lean();
    if (!order) throw error;
  }

  const finalizedNegotiation = await finalizeNegotiation({ negotiation, order, actor, message });
  if (!finalizedNegotiation) {
    const currentNegotiation = await Negotiation.findById(negotiation._id);
    if (!currentNegotiation?.orderId) {
      if (createdOrder) {
        await Order.deleteOne({ _id: order._id, negotiationId: negotiation._id });
      }
      throw new ConflictError(
        'Negotiation changed while the order was being confirmed. Review it and try again.',
        'NEGOTIATION_CHANGED',
      );
    }
    const currentOrder = currentNegotiation?.orderId
      ? await Order.findById(currentNegotiation.orderId).lean()
      : order;
    return {
      negotiation: currentNegotiation || negotiation,
      order: currentOrder,
      alreadyConverted: true,
      addressSource: createdOrder ? source : 'existing_order',
    };
  }

  await runPostConversionEffects({
    negotiation: finalizedNegotiation,
    order,
    actor,
    product,
    wholesaler,
    io,
  });

  return {
    negotiation: finalizedNegotiation,
    order,
    alreadyConverted: false,
    addressSource: createdOrder ? source : 'existing_order',
  };
}

async function runPostConversionEffects({ negotiation, order, actor, product, wholesaler, io }) {
  const actorLabel = actor.role === 'staff' ? `Staff ${actor.name}` : `Admin ${actor.name}`;
  if (product) {
    await Product.findByIdAndUpdate(product._id, { $inc: { orderCount: 1 } });
  }
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

  if (wholesaler) {
    await notifyWholesaler(wholesaler._id, {
      title: 'Negotiation Accepted! ✅',
      body: `Your negotiated price for ${negotiation.productSnapshot.name} was confirmed at ₹${negotiation.finalPricePerUnit}/unit. Order ${order.orderNumber} confirmed.`,
    }, {
      type: 'negotiation_accepted',
      negotiationId: negotiation._id.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    });
  }

  emitToNegotiationRoom(io, negotiation._id.toString(), 'negotiation-accepted', {
    negotiationId: negotiation._id.toString(),
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    finalPricePerUnit: negotiation.finalPricePerUnit,
    finalTotalPrice: negotiation.finalTotalPrice,
    acceptedBy: actorLabel,
    timestamp: new Date(),
  });
}

async function finalizeNegotiation({ negotiation, order, actor, message, recoverExisting = false }) {
  const actorLabel = actor.role === 'staff' ? `Staff ${actor.name}` : `Admin ${actor.name}`;
  return Negotiation.findOneAndUpdate(
    {
      _id: negotiation._id,
      orderId: null,
      status: negotiation.status,
      currentOfferBy: negotiation.currentOfferBy,
      currentPricePerUnit: negotiation.currentPricePerUnit,
      currentTotalPrice: negotiation.currentTotalPrice,
      ...(recoverExisting ? {} : { expiresAt: { $gt: new Date() } }),
    },
    {
      $push: {
        history: {
          action: NEGOTIATION_ACTIONS.ACCEPTED,
          by: 'admin',
          actorId: actor.id,
          actorRole: actor.role,
          pricePerUnit: negotiation.currentPricePerUnit,
          totalPrice: negotiation.currentTotalPrice,
          message: message || `Accepted by ${actorLabel}`,
        },
      },
      $set: {
        status: NEGOTIATION_STATUS.CONVERTED,
        finalPricePerUnit: negotiation.currentPricePerUnit,
        finalTotalPrice: negotiation.currentTotalPrice,
        orderId: order._id,
      },
    },
    { new: true, runValidators: true },
  );
}

module.exports = {
  acceptNegotiationAndCreateOrder,
  resolveAcceptAddress,
  emitToNegotiationRoom,
  notifyWholesaler,
};
