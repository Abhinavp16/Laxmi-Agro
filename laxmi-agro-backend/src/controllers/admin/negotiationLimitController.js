const { Settings, Product } = require('../../models');
const { NotFoundError } = require('../../utils/errors');
const { recordAudit } = require('../../services/auditService');

exports.getLimits = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    const limits = settings.staffNegotiationMinPrices || [];
    const productIds = limits.map((limit) => limit.productId);
    const products = await Product.find({ _id: { $in: productIds } }).select('name sku wholesalePrice').lean();
    const productsById = new Map(products.map((product) => [String(product._id), product]));

    res.json({
      success: true,
      data: limits.map((limit) => ({
        productId: String(limit.productId),
        minPrice: limit.minPrice,
        product: productsById.get(String(limit.productId)) || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.setLimit = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId).select('name');
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');

    const settings = await Settings.getSettings();
    const existing = settings.staffNegotiationMinPrices.find((limit) => String(limit.productId) === String(product._id));
    if (existing) existing.minPrice = req.body.minPrice;
    else settings.staffNegotiationMinPrices.push({ productId: product._id, minPrice: req.body.minPrice });
    await settings.save();

    await recordAudit({ actorId: req.user._id, action: 'negotiation.staff_min_price_set', entityType: 'product', entityId: product._id, metadata: { minPrice: req.body.minPrice } });
    res.json({ success: true, message: 'Staff negotiation minimum price saved.', data: { productId: product._id, minPrice: req.body.minPrice } });
  } catch (error) {
    next(error);
  }
};

exports.removeLimit = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    const before = settings.staffNegotiationMinPrices.length;
    settings.staffNegotiationMinPrices = settings.staffNegotiationMinPrices.filter((limit) => String(limit.productId) !== String(req.params.productId));
    if (settings.staffNegotiationMinPrices.length === before) throw new NotFoundError('Staff negotiation limit not found', 'NEGOTIATION_LIMIT_NOT_FOUND');
    await settings.save();

    await recordAudit({ actorId: req.user._id, action: 'negotiation.staff_min_price_removed', entityType: 'product', entityId: req.params.productId });
    res.json({ success: true, message: 'Staff negotiation minimum price removed.' });
  } catch (error) {
    next(error);
  }
};
