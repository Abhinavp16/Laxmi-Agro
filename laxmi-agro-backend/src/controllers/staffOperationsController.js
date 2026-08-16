const mongoose = require('mongoose');
const Category = require('../models/Category');
const { Payment, Order, Negotiation, Settings, Product } = require('../models');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { paginate, formatPaginationResponse } = require('../utils/helpers');
const { PAYMENT_STATUS, ORDER_STATUS, NEGOTIATION_STATUS, NEGOTIATION_ACTIONS, PRODUCT_STATUS } = require('../utils/constants');
const { recordAudit } = require('../services/auditService');
const notificationService = require('../services/notificationService');

async function notifyWholesaler(userId, notification, data) {
  try {
    await notificationService.sendToUser(userId, notification, data);
  } catch (error) {
    console.error('Failed to send staff negotiation notification:', error.message);
  }
}

async function getStaffLimit(productId) {
  const settings = await Settings.getSettings();
  const limit = (settings.staffNegotiationMinPrices || []).find(
    (entry) => String(entry.productId) === String(productId)
  );
  return limit ? Number(limit.minPrice) : null;
}

exports.getProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const search = String(req.query.search || '').trim();
    const categoryId = String(req.query.categoryId || '').trim();
    const query = { status: { $ne: PRODUCT_STATUS.ARCHIVED } };
    const filters = [];

    if (categoryId) {
      if (!mongoose.isValidObjectId(categoryId)) {
        throw new BadRequestError('Invalid category ID', 'INVALID_CATEGORY_ID');
      }

      const category = await Category.findById(categoryId).select('_id name slug company').lean();
      if (!category) {
        throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
      }

      const legacyCategoryValues = [category.name, category.slug].filter(Boolean);
      filters.push({
        $or: [
          { categoryRef: category._id },
          { company: category.company, category: { $in: legacyCategoryValues } },
        ],
      });
    }

    if (search) {
      filters.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (filters.length > 0) query.$and = filters;

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name nameHindi sku category retailPrice wholesalePrice stock status priceUnit packing images.url images.isPrimary')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, ...formatPaginationResponse(products, total, page, limit) });
  } catch (error) {
    next(error);
  }
};

exports.ensurePendingUploadedPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment || payment.status !== PAYMENT_STATUS.PENDING || !payment.screenshotUrl) {
      throw new BadRequestError('Only uploaded pending payments can be approved', 'PAYMENT_NOT_REVIEWABLE');
    }

    const order = await Order.findById(payment.orderId);
    if (!order || order.status !== ORDER_STATUS.PAYMENT_UPLOADED) {
      throw new BadRequestError('Order is not ready for payment review', 'ORDER_NOT_READY_FOR_PAYMENT_REVIEW');
    }

    req.staffPayment = payment;
    next();
  } catch (error) {
    next(error);
  }
};

exports.holdPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment || payment.status !== PAYMENT_STATUS.PENDING || !payment.screenshotUrl) {
      throw new BadRequestError('Only uploaded pending payments can be held', 'PAYMENT_NOT_REVIEWABLE');
    }

    const order = await Order.findById(payment.orderId);
    if (!order || order.status !== ORDER_STATUS.PAYMENT_UPLOADED) {
      throw new BadRequestError('Order is not ready for payment review', 'ORDER_NOT_READY_FOR_PAYMENT_REVIEW');
    }

    payment.status = PAYMENT_STATUS.HELD;
    payment.holdReason = req.body.reason;
    payment.heldBy = req.user._id;
    payment.heldAt = new Date();
    await payment.save();

    order.statusHistory.push({
      status: order.status,
      note: `Payment held for admin review: ${req.body.reason}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });
    await order.save();

    await recordAudit({
      actorId: req.user._id,
      action: 'payment.held',
      entityType: 'payment',
      entityId: payment._id,
      metadata: { orderId: String(order._id), reason: req.body.reason },
    });

    res.json({ success: true, message: 'Payment placed on hold for admin review.', data: { paymentId: payment._id, status: payment.status } });
  } catch (error) {
    next(error);
  }
};

exports.getNegotiations = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const query = {};
    const now = new Date();

    if (status === 'expired') {
      query.expiresAt = { $lte: now };
    } else if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { negotiationNumber: { $regex: search, $options: 'i' } },
        { 'productSnapshot.name': { $regex: search, $options: 'i' } },
      ];
    }

    const [records, total, settings] = await Promise.all([
      Negotiation.find(query).populate('wholesalerId', 'name email phone businessInfo.businessName').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Negotiation.countDocuments(query),
      Settings.getSettings(),
    ]);
    const limits = new Map((settings.staffNegotiationMinPrices || []).map((entry) => [String(entry.productId), Number(entry.minPrice)]));

    const data = records.map((record) => ({
      ...record,
      isExpired: new Date(record.expiresAt) <= now,
      staffMinPrice: limits.get(String(record.productId)) ?? null,
    }));

    res.json({ success: true, ...formatPaginationResponse(data, total, page, limit) });
  } catch (error) {
    next(error);
  }
};

exports.getNegotiationById = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id)
      .populate('wholesalerId', 'name email phone businessInfo.businessName');
    if (!negotiation) throw new NotFoundError('Negotiation not found', 'NEGOTIATION_NOT_FOUND');

    const limit = await getStaffLimit(negotiation.productId);
    res.json({
      success: true,
      data: { ...negotiation.toObject(), isExpired: negotiation.expiresAt <= new Date(), staffMinPrice: limit },
    });
  } catch (error) {
    next(error);
  }
};

function assertStaffNegotiationAction(negotiation, minPrice) {
  if (negotiation.expiresAt <= new Date()) {
    throw new ForbiddenError('Expired negotiations can only be continued by a full admin', 'NEGOTIATION_EXPIRED');
  }
  if (negotiation.status !== NEGOTIATION_STATUS.PENDING || negotiation.currentOfferBy !== 'wholesaler') {
    throw new BadRequestError('Waiting for a wholesaler offer before acting', 'INVALID_NEGOTIATION_STATUS');
  }
  if (minPrice === null) {
    throw new ForbiddenError('A full admin must set this product’s staff minimum price first', 'STAFF_NEGOTIATION_LIMIT_NOT_CONFIGURED');
  }
}

exports.acceptNegotiation = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) throw new NotFoundError('Negotiation not found', 'NEGOTIATION_NOT_FOUND');
    const minPrice = await getStaffLimit(negotiation.productId);
    assertStaffNegotiationAction(negotiation, minPrice);
    if (Number(negotiation.currentPricePerUnit) < minPrice) {
      throw new ForbiddenError(`Staff cannot accept below the configured minimum price of ₹${minPrice}`, 'STAFF_NEGOTIATION_PRICE_LIMIT');
    }

    negotiation.history.push({
      action: NEGOTIATION_ACTIONS.ACCEPTED,
      by: 'admin',
      actorId: req.user._id,
      actorRole: 'staff',
      pricePerUnit: negotiation.currentPricePerUnit,
      totalPrice: negotiation.currentTotalPrice,
      message: req.body.message || 'Accepted by staff',
    });
    negotiation.status = NEGOTIATION_STATUS.ACCEPTED;
    negotiation.finalPricePerUnit = negotiation.currentPricePerUnit;
    negotiation.finalTotalPrice = negotiation.currentTotalPrice;
    await negotiation.save();

    await recordAudit({ actorId: req.user._id, action: 'negotiation.accepted', entityType: 'negotiation', entityId: negotiation._id, metadata: { pricePerUnit: negotiation.finalPricePerUnit } });
    await notifyWholesaler(negotiation.wholesalerId, {
      title: 'Negotiation Accepted!',
      body: `Your offer for ${negotiation.productSnapshot.name} was accepted at ₹${negotiation.finalPricePerUnit}/unit.`,
    }, { type: 'negotiation_accepted', negotiationId: negotiation._id.toString() });

    res.json({ success: true, message: 'Negotiation accepted', data: { status: negotiation.status, finalPricePerUnit: negotiation.finalPricePerUnit } });
  } catch (error) {
    next(error);
  }
};

exports.counterNegotiation = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) throw new NotFoundError('Negotiation not found', 'NEGOTIATION_NOT_FOUND');
    const minPrice = await getStaffLimit(negotiation.productId);
    assertStaffNegotiationAction(negotiation, minPrice);
    if (Number(req.body.pricePerUnit) < minPrice) {
      throw new ForbiddenError(`Staff cannot offer below the configured minimum price of ₹${minPrice}`, 'STAFF_NEGOTIATION_PRICE_LIMIT');
    }

    const totalPrice = negotiation.requestedQuantity * req.body.pricePerUnit;
    negotiation.history.push({
      action: NEGOTIATION_ACTIONS.COUNTERED,
      by: 'admin',
      actorId: req.user._id,
      actorRole: 'staff',
      pricePerUnit: req.body.pricePerUnit,
      totalPrice,
      message: req.body.message,
    });
    negotiation.status = NEGOTIATION_STATUS.COUNTERED;
    negotiation.currentOfferBy = 'admin';
    negotiation.currentPricePerUnit = req.body.pricePerUnit;
    negotiation.currentTotalPrice = totalPrice;
    await negotiation.save();

    await recordAudit({ actorId: req.user._id, action: 'negotiation.countered', entityType: 'negotiation', entityId: negotiation._id, metadata: { pricePerUnit: req.body.pricePerUnit } });
    await notifyWholesaler(negotiation.wholesalerId, {
      title: 'New Counter Offer',
      body: `We counter-offered ₹${req.body.pricePerUnit}/unit for ${negotiation.productSnapshot.name}. Review and respond.`,
    }, { type: 'negotiation_countered', negotiationId: negotiation._id.toString() });

    res.json({ success: true, message: 'Counter offer sent', data: { status: negotiation.status, currentPricePerUnit: negotiation.currentPricePerUnit } });
  } catch (error) {
    next(error);
  }
};
