const { Negotiation, Product, Settings } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { paginate, formatPaginationResponse } = require('../utils/helpers');
const { NEGOTIATION_STATUS, NEGOTIATION_ACTIONS } = require('../utils/constants');
const {
  getVariantById,
  getPriceForUser,
} = require('../utils/productVariants');

exports.getMyNegotiations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const query = { wholesalerId: req.user._id };
    if (status) query.status = status;

    const [negotiations, total] = await Promise.all([
      Negotiation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Negotiation.countDocuments(query),
    ]);

    const formatted = negotiations.map((negotiation) => ({
      id: negotiation._id,
      negotiationNumber: negotiation.negotiationNumber,
      product: {
        id: negotiation.productId,
        variantId: negotiation.variantId || null,
        name: negotiation.productSnapshot.variantDisplayName || negotiation.productSnapshot.name,
        image: negotiation.productSnapshot.image,
        currentPrice: negotiation.productSnapshot.price,
      },
      requestedQuantity: negotiation.requestedQuantity,
      requestedPricePerUnit: negotiation.requestedPricePerUnit,
      requestedTotalPrice: negotiation.requestedTotalPrice,
      currentPricePerUnit: negotiation.currentPricePerUnit,
      currentTotalPrice: negotiation.currentTotalPrice,
      status: negotiation.status,
      currentOfferBy: negotiation.currentOfferBy,
      expiresAt: negotiation.expiresAt,
      canPay: negotiation.status === NEGOTIATION_STATUS.ACCEPTED && !negotiation.orderId,
      createdAt: negotiation.createdAt,
    }));

    res.json({
      success: true,
      ...formatPaginationResponse(formatted, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.createNegotiation = async (req, res, next) => {
  try {
    const { productId, quantity, pricePerUnit, message } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    if (!product.negotiationEnabled) {
      throw new BadRequestError('Negotiation is not enabled for this product', 'NEGOTIATION_DISABLED');
    }

    const resolved = getVariantById(product, null);
    if (!resolved) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const pricing = getPriceForUser(product, req.user.role, resolved.variant);
    const settings = await Settings.getSettings();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + settings.negotiationExpiryDays);

    const totalPrice = quantity * pricePerUnit;

    const negotiation = await Negotiation.create({
      wholesalerId: req.user._id,
      productId,
      variantId: null,
      productSnapshot: {
        name: product.name,
        variantName: '',
        variantDisplayName: product.name,
        price: pricing.price,
        image: product.primaryImage,
        sku: product.sku,
        variantSku: '',
      },
      requestedQuantity: quantity,
      requestedPricePerUnit: pricePerUnit,
      requestedTotalPrice: totalPrice,
      message,
      history: [{
        action: NEGOTIATION_ACTIONS.REQUESTED,
        by: 'wholesaler',
        pricePerUnit,
        totalPrice,
        message: message || 'Initial request',
      }],
      currentOfferBy: 'wholesaler',
      currentPricePerUnit: pricePerUnit,
      currentTotalPrice: totalPrice,
      expiresAt,
    });

    await Product.findByIdAndUpdate(productId, { $inc: { negotiationCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Negotiation request submitted',
      data: {
        id: negotiation._id,
        negotiationNumber: negotiation.negotiationNumber,
        status: negotiation.status,
        expiresAt: negotiation.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getNegotiationById = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findOne({
      _id: req.params.id,
      wholesalerId: req.user._id,
    });

    if (!negotiation) {
      throw new NotFoundError('Negotiation not found', 'NEGOTIATION_NOT_FOUND');
    }

    const data = negotiation.toObject();
    data.canPay = negotiation.status === NEGOTIATION_STATUS.ACCEPTED && !negotiation.orderId;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.counterOffer = async (req, res, next) => {
  try {
    const { pricePerUnit, message } = req.body;

    const negotiation = await Negotiation.findOne({
      _id: req.params.id,
      wholesalerId: req.user._id,
    });

    if (!negotiation) {
      throw new NotFoundError('Negotiation not found', 'NEGOTIATION_NOT_FOUND');
    }

    if (negotiation.status !== NEGOTIATION_STATUS.COUNTERED) {
      throw new BadRequestError('Cannot counter in current status', 'INVALID_NEGOTIATION_STATUS');
    }

    if (negotiation.currentOfferBy !== 'admin') {
      throw new BadRequestError('Waiting for admin response', 'WAITING_FOR_ADMIN');
    }

    const totalPrice = negotiation.requestedQuantity * pricePerUnit;

    negotiation.history.push({
      action: NEGOTIATION_ACTIONS.COUNTERED,
      by: 'wholesaler',
      pricePerUnit,
      totalPrice,
      message,
    });

    negotiation.status = NEGOTIATION_STATUS.PENDING;
    negotiation.currentOfferBy = 'wholesaler';
    negotiation.currentPricePerUnit = pricePerUnit;
    negotiation.currentTotalPrice = totalPrice;

    await negotiation.save();

    res.json({
      success: true,
      message: 'Counter offer submitted',
      data: {
        status: negotiation.status,
        currentPricePerUnit: negotiation.currentPricePerUnit,
        currentTotalPrice: negotiation.currentTotalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.acceptOffer = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findOne({
      _id: req.params.id,
      wholesalerId: req.user._id,
    });

    if (!negotiation) {
      throw new NotFoundError('Negotiation not found', 'NEGOTIATION_NOT_FOUND');
    }

    if (![NEGOTIATION_STATUS.COUNTERED, NEGOTIATION_STATUS.PENDING].includes(negotiation.status)) {
      throw new BadRequestError('Cannot accept in current status', 'INVALID_NEGOTIATION_STATUS');
    }

    negotiation.history.push({
      action: NEGOTIATION_ACTIONS.ACCEPTED,
      by: 'wholesaler',
      pricePerUnit: negotiation.currentPricePerUnit,
      totalPrice: negotiation.currentTotalPrice,
    });

    negotiation.status = NEGOTIATION_STATUS.ACCEPTED;
    negotiation.finalPricePerUnit = negotiation.currentPricePerUnit;
    negotiation.finalTotalPrice = negotiation.currentTotalPrice;

    await negotiation.save();

    res.json({
      success: true,
      message: 'Offer accepted. You can now continue through WhatsApp checkout.',
      data: {
        negotiationId: negotiation._id,
        finalPricePerUnit: negotiation.finalPricePerUnit,
        finalTotalPrice: negotiation.finalTotalPrice,
        canPay: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectNegotiation = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findOne({
      _id: req.params.id,
      wholesalerId: req.user._id,
    });

    if (!negotiation) {
      throw new NotFoundError('Negotiation not found', 'NEGOTIATION_NOT_FOUND');
    }

    if ([NEGOTIATION_STATUS.REJECTED, NEGOTIATION_STATUS.CONVERTED].includes(negotiation.status)) {
      throw new BadRequestError('Cannot reject in current status', 'INVALID_NEGOTIATION_STATUS');
    }

    negotiation.history.push({
      action: NEGOTIATION_ACTIONS.REJECTED,
      by: 'wholesaler',
    });

    negotiation.status = NEGOTIATION_STATUS.REJECTED;
    await negotiation.save();

    res.json({
      success: true,
      message: 'Negotiation cancelled',
    });
  } catch (error) {
    next(error);
  }
};
