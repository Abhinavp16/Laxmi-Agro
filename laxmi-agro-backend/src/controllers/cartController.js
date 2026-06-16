const { Cart, Product } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const {
  getVariantById,
  getPriceForUser,
  buildVariantSnapshot,
  getVariantDisplayName,
} = require('../utils/productVariants');

const buildCartItemKey = (productId, variantId) => `${productId}:${variantId || 'default'}`;

const resolveVariantForCart = (product, variantId) => {
  const resolved = getVariantById(product, variantId);
  if (!resolved) {
    throw new BadRequestError('Selected product was not found', 'PRODUCT_NOT_FOUND');
  }

  return resolved;
};

const buildProductMap = (products = []) => products.reduce((acc, product) => {
  acc[product._id.toString()] = product;
  return acc;
}, {});

const formatCartItem = (item, product, userRole) => {
  const resolved = getVariantById(product, null);
  if (!resolved) return null;

  const pricing = getPriceForUser(product, userRole, resolved.variant);
  const currentPrice = pricing.price;
  const productId = item.productId.toString();
  const variantId = null;

  return {
    productId: item.productId,
    variantId,
    cartItemKey: buildCartItemKey(productId, variantId),
    product: {
      id: product._id,
      name: product.name,
      nameHindi: product.nameHindi,
      slug: product.slug,
      price: pricing.price,
      retailPrice: pricing.retailPrice,
      wholesalePrice: pricing.wholesalePrice,
      stock: product.stock,
      image: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url,
      priceUnit: product.priceUnit || '',
      packing: product.packing || '',
    },
    variant: null,
    quantity: item.quantity,
    priceAtAdd: item.priceAtAdd,
    currentPrice,
    priceChanged: item.priceAtAdd !== currentPrice,
    itemTotal: item.quantity * currentPrice,
  };
};

const populateCartItems = async (cart, userRole = 'guest') => {
  const productIds = [...new Set(cart.items.map(item => item.productId.toString()))];
  const products = await Product.find({ _id: { $in: productIds } })
    .select('name nameHindi slug retailPrice wholesalePrice stock priceUnit packing images negotiationEnabled minWholesaleQuantity')
    .lean();

  const productMap = buildProductMap(products);

  const items = cart.items.map((item) => {
    const product = productMap[item.productId.toString()];
    if (!product) return null;
    return formatCartItem(item, product, userRole);
  }).filter(Boolean);

  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, subtotal, itemCount };
};

exports.getCart = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'guest';
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    const data = await populateCartItems(cart, userRole);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'guest';
    const { productId, variantId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const resolved = resolveVariantForCart(product, null);
    if (resolved.variant.stock < quantity) {
      throw new BadRequestError('Insufficient stock', 'INSUFFICIENT_STOCK');
    }

    const pricing = getPriceForUser(product, userRole, resolved.variant);
    const variantSnapshot = buildVariantSnapshot(product, resolved.variant);

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    cart.addItem(productId, null, quantity, pricing.price, variantSnapshot);
    await cart.save();

    const data = await populateCartItems(cart, userRole);
    res.json({
      success: true,
      message: 'Item added to cart',
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateItemQuantity = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'guest';
    const { productId } = req.params;
    const variantId = null;
    const { quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const resolved = resolveVariantForCart(product, variantId);
    if (resolved.variant.stock < quantity) {
      throw new BadRequestError('Insufficient stock', 'INSUFFICIENT_STOCK');
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      throw new NotFoundError('Cart not found', 'CART_NOT_FOUND');
    }

    cart.updateItemQuantity(productId, resolved.variantId, quantity);
    await cart.save();

    const data = await populateCartItems(cart, userRole);
    res.json({
      success: true,
      message: 'Cart updated',
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'guest';
    const { productId } = req.params;
    const variantId = null;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      throw new NotFoundError('Cart not found', 'CART_NOT_FOUND');
    }

    cart.removeItem(productId, variantId);
    await cart.save();

    const data = await populateCartItems(cart, userRole);
    res.json({
      success: true,
      message: 'Item removed from cart',
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.validateCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.json({ success: true, data: { valid: true, issues: [] } });
    }

    const productIds = [...new Set(cart.items.map(item => item.productId.toString()))];
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name stock retailPrice status')
      .lean();

    const productMap = buildProductMap(products);
    const issues = [];

    for (const item of cart.items) {
      const product = productMap[item.productId.toString()];
      const itemVariantId = null;

      if (!product) {
        issues.push({
          productId: item.productId.toString(),
          variantId: itemVariantId,
          cartItemKey: buildCartItemKey(item.productId.toString(), itemVariantId),
          type: 'unavailable',
          message: 'This product is no longer available',
          availableStock: 0,
          requestedQty: item.quantity,
        });
        continue;
      }

      if (product.status !== 'active') {
        issues.push({
          productId: item.productId.toString(),
          variantId: itemVariantId,
          cartItemKey: buildCartItemKey(item.productId.toString(), itemVariantId),
          name: product.name,
          type: 'unavailable',
          message: `${product.name} is currently unavailable`,
          availableStock: 0,
          requestedQty: item.quantity,
        });
        continue;
      }

      const resolved = getVariantById(product, null);
      if (!resolved) {
        issues.push({
          productId: item.productId.toString(),
          variantId: itemVariantId,
          cartItemKey: buildCartItemKey(item.productId.toString(), itemVariantId),
          name: product.name,
          type: 'unavailable',
          message: 'Selected product is no longer available',
          availableStock: 0,
          requestedQty: item.quantity,
        });
        continue;
      }

      const variantName = getVariantDisplayName(product, resolved.variant);
      if (resolved.variant.stock === 0) {
        issues.push({
          productId: item.productId.toString(),
          variantId: itemVariantId,
          cartItemKey: buildCartItemKey(item.productId.toString(), itemVariantId),
          name: variantName,
          type: 'out_of_stock',
          message: `${variantName} is out of stock`,
          availableStock: 0,
          requestedQty: item.quantity,
        });
      } else if (resolved.variant.stock < item.quantity) {
        issues.push({
          productId: item.productId.toString(),
          variantId: itemVariantId,
          cartItemKey: buildCartItemKey(item.productId.toString(), itemVariantId),
          name: variantName,
          type: 'insufficient_stock',
          message: `Only ${resolved.variant.stock} units of ${variantName} available`,
          availableStock: resolved.variant.stock,
          requestedQty: item.quantity,
        });
      }
    }

    res.json({
      success: true,
      data: {
        valid: issues.length === 0,
        issues,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.clearCart();
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
};
