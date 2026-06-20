const { Product, Analytics, WebsiteSettings, Company } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { paginate, formatPaginationResponse } = require('../utils/helpers');
const { PRODUCT_STATUS, ANALYTICS_EVENTS } = require('../utils/constants');
const mongoose = require('mongoose');
const {
  getPriceForUser,
  getPendingPriceChangeForUser,
  getProductStockTotal,
} = require('../utils/productVariants');
const { normalizeMediaUrl, normalizeImageObject } = require('../utils/mediaUrls');
const Category = require('../models/Category');
const {
  applyCategoryAccessToProductQuery,
  filterCategoriesForUser,
  isCategoryExcludedForUser,
} = require('../utils/categoryAccess');

const formatProductCard = (product, userRole, req) => {
  const pricing = getPriceForUser(product, userRole);
  const stock = getProductStockTotal(product);

  return {
    id: product._id,
    name: product.name,
    nameHindi: product.nameHindi,
    slug: product.slug,
    shortDescription: product.shortDescription,
    category: product.category,
    brand: product.brand || product.company?.name || '',
    ...pricing,
    stock,
    inStock: stock > 0,
    priceUnit: product.priceUnit || '',
    packing: product.packing || '',
    primaryImage: normalizeMediaUrl(
      product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url,
      req
    ),
    isFeatured: product.isFeatured,
    isHot: product.isHot,
    isNew: product.isNew,
    rating: product.rating,
    purchaseCountMin: product.purchaseCountMin,
    purchaseCountMax: product.purchaseCountMax,
    pendingPriceChange: getPendingPriceChangeForUser(product, userRole),
  };
};

exports.getProducts = async (req, res, next) => {
  try {
    const { category, brand, minPrice, maxPrice, inStock, featured, hot, sort } = req.query;
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const userRole = req.user?.role || 'guest';

    console.log('getProducts request - category:', category, 'brand:', brand);

    const query = { status: PRODUCT_STATUS.ACTIVE };

    // Price filter based on user role
    const priceField = userRole === 'wholesaler' ? 'wholesalePrice' : 'retailPrice';
    
    if (category) {
      const rawCategory = String(category).trim();
      const normalizedCategory = rawCategory.replace(/[-_]+/g, ' ').trim();
      query.category = {
        $in: [...new Set([rawCategory, normalizedCategory])].map(
          (value) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        ),
      };
    }
    
    // Filter by brand (checks both product.brand and product.company)
    if (brand) {
      const matchingCompanies = await Company.find({
        name: { $regex: new RegExp(brand, 'i') }
      }).select('_id');
      const companyIds = matchingCompanies.map(c => c._id);
      
      query.$or = [
        { brand: { $regex: new RegExp(brand, 'i') } },
        { company: { $in: companyIds } }
      ];
    }
    
    if (minPrice) query[priceField] = { ...query[priceField], $gte: Number(minPrice) };
    if (maxPrice) query[priceField] = { ...query[priceField], $lte: Number(maxPrice) };
    if (inStock === 'true') query.stock = { $gt: 0 };
    if (featured === 'true') query.isFeatured = true;
    if (hot === 'true') query.isHot = true;

    applyCategoryAccessToProductQuery(query, req.user);

    console.log('getProducts final query:', JSON.stringify(query));

    let sortOption = { createdAt: -1 };
    if (sort) {
      let sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      // Map 'price' to appropriate field based on role
      if (sortField === 'price') sortField = priceField;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      sortOption = { [sortField]: sortOrder };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name nameHindi slug shortDescription category brand mrp retailPrice wholesalePrice pendingRetailPrice pendingWholesalePrice priceChangeScheduledAt priceChangeEffectiveAt minWholesaleQuantity negotiationEnabled stock priceUnit packing images isFeatured isHot isNew rating purchaseCountMin purchaseCountMax company')
        .populate('company', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const formattedProducts = products.map(p => formatProductCard(p, userRole, req));

    res.json({
      success: true,
      ...formatPaginationResponse(formattedProducts, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductBySlug = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'guest';
    const param = req.params.slug;

    // Try public lookup by active slug first.
    let product = await Product.findOne({
      slug: param,
      status: PRODUCT_STATUS.ACTIVE,
    }).lean();

    // If opened from cart/order history, ID may point to a non-active product.
    // Allow ID lookup regardless of status so users can still view item details.
    if (!product && param.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(param).lean();
    }

    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    if (isCategoryExcludedForUser(req.user, product.category)) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    // Build response with role-based pricing
    const pricing = getPriceForUser(product, userRole);
    let resolvedLabels = [];
    if (Array.isArray(product.labelIds) && product.labelIds.length > 0) {
      const settings = await WebsiteSettings.getSettings();
      const labelMap = new Map(
        (settings.labels || []).map((label) => [
          String(label?.id || ''),
          {
            id: String(label?.id || ''),
            title: String(label?.title || '').trim(),
            sourceType: label?.sourceType === 'image' ? 'image' : 'icon',
            image: String(label?.image || '').trim(),
            icon: String(label?.icon || '').trim(),
            order: Number.isFinite(label?.order) ? label.order : 0,
          },
        ])
      );

      const labelsByTitle = new Map(
        (settings.labels || []).map((label) => [
          String(label?.title || '').trim(),
          {
            id: String(label?.id || ''),
            title: String(label?.title || '').trim(),
            sourceType: label?.sourceType === 'image' ? 'image' : 'icon',
            image: String(label?.image || '').trim(),
            icon: String(label?.icon || '').trim(),
            order: Number.isFinite(label?.order) ? label.order : 0,
          },
        ])
      );

      resolvedLabels = product.labelIds
        .map((labelId) => {
          const value = String(labelId || '').trim();
          return labelMap.get(value) || labelsByTitle.get(value);
        })
        .filter(Boolean);
    }

    const responseData = {
      ...product,
      id: product._id,
      primaryImage: normalizeMediaUrl(product.primaryImage, req),
      images: Array.isArray(product.images)
        ? product.images.map((image) => normalizeImageObject(image, req))
        : [],
      ...pricing,
      labels: resolvedLabels,
      stock: getProductStockTotal(product),
      pendingPriceChange: getPendingPriceChangeForUser(product, userRole),
    };

    // Remove raw price fields for non-admin users, but keep for wholesalers so they can see customer price
    if (userRole !== 'admin' && userRole !== 'wholesaler') {
      delete responseData.retailPrice;
      delete responseData.wholesalePrice;
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categoryMatch = applyCategoryAccessToProductQuery({ status: PRODUCT_STATUS.ACTIVE }, req.user);
    const categories = await Product.aggregate([
      { $match: categoryMatch },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          subCategories: { $addToSet: '$subCategory' },
        },
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          subCategories: {
            $filter: {
              input: '$subCategories',
              cond: { $ne: ['$$this', null] },
            },
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    const categoryNames = categories
      .map((category) => category.name?.toString().trim())
      .filter(Boolean);
    const normalizedNames = categoryNames.map((name) => name.replace(/[-_]+/g, ' ').trim());
    const slugs = categoryNames
      .map((name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
      .filter(Boolean);

    const categoryDocs = await Category.find({
      $or: [
        { name: { $in: categoryNames } },
        { name: { $in: normalizedNames } },
        { slug: { $in: slugs } },
      ],
    })
      .select('name nameHindi slug')
      .lean();

    const categoryLookup = new Map();
    const registerCategoryDoc = (key, doc) => {
      if (!key) return;
      categoryLookup.set(key.trim().toLowerCase(), doc);
    };

    for (const doc of categoryDocs) {
      registerCategoryDoc(doc.name, doc);
      registerCategoryDoc(doc.slug, doc);
      registerCategoryDoc((doc.name || '').replace(/[-_]+/g, ' '), doc);
      registerCategoryDoc((doc.slug || '').replace(/[-_]+/g, ' '), doc);
    }

    const enrichedCategories = filterCategoriesForUser(categories.map((category) => {
      const lookupKey = category.name?.toString().trim().toLowerCase() ?? '';
      const normalizedLookupKey = category.name?.toString().replace(/[-_]+/g, ' ').trim().toLowerCase() ?? '';
      const doc = categoryLookup.get(lookupKey) || categoryLookup.get(normalizedLookupKey);

      return {
        ...category,
        nameHindi: doc?.nameHindi || '',
        slug: doc?.slug || '',
      };
    }), req.user);

    res.json({
      success: true,
      data: enrichedCategories,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'guest';

    const query = applyCategoryAccessToProductQuery({
      status: PRODUCT_STATUS.ACTIVE,
      isFeatured: true,
    }, req.user);

    const products = await Product.find(query)
      .select('name slug shortDescription category mrp retailPrice wholesalePrice pendingRetailPrice pendingWholesalePrice priceChangeScheduledAt priceChangeEffectiveAt minWholesaleQuantity negotiationEnabled stock priceUnit packing images isFeatured isHot isNew rating purchaseCountMin purchaseCountMax')
      .limit(10)
      .lean();

    const formattedProducts = products.map(p => formatProductCard(p, userRole, req));

    res.json({
      success: true,
      data: formattedProducts,
    });
  } catch (error) {
    next(error);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q, category, brand } = req.query;
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const userRole = req.user?.role || 'guest';

    console.log('Search request - q:', q, 'category:', category, 'brand:', brand);

    // Build base query
    const query = { status: PRODUCT_STATUS.ACTIVE };

    // Use $and if we have multiple major conditions (q, category, brand)
    const andConditions = [];

    // Search query condition
    if (q && q.trim().length > 0) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const words = escaped.trim().split(/\s+/).filter(Boolean);
      const regexPattern = words.map(w => `(?=.*${w})`).join('') + '.*';
      const regex = new RegExp(regexPattern, 'i');

      andConditions.push({
        $or: [
          { name: regex },
          { description: regex },
          { shortDescription: regex },
          { category: regex },
          { tags: { $in: [new RegExp(escaped, 'i')] } },
          { sku: regex },
        ]
      });
    }

    // Category condition
    if (category) {
      andConditions.push({ category: { $regex: new RegExp(category, 'i') } });
    }
    
    // Brand condition (checks both product.brand and product.company)
    if (brand) {
      const matchingCompanies = await Company.find({
        name: { $regex: new RegExp(brand, 'i') }
      }).select('_id');
      const companyIds = matchingCompanies.map(c => c._id);
      
      andConditions.push({
        $or: [
          { brand: { $regex: new RegExp(brand, 'i') } },
          { company: { $in: companyIds } }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    applyCategoryAccessToProductQuery(query, req.user);

    console.log('Final search query:', JSON.stringify(query));

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name nameHindi slug shortDescription category brand mrp retailPrice wholesalePrice pendingRetailPrice pendingWholesalePrice priceChangeScheduledAt priceChangeEffectiveAt minWholesaleQuantity negotiationEnabled stock priceUnit packing images isHot isNew rating purchaseCountMin purchaseCountMax company')
        .populate('company', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const formattedProducts = products.map(p => formatProductCard(p, userRole, req));

    res.json({
      success: true,
      ...formatPaginationResponse(formattedProducts, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.trackProductView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { source, sessionId } = req.body;

    await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    await Analytics.create({
      productId: id,
      userId: req.user?._id || null,
      eventType: ANALYTICS_EVENTS.VIEW,
      source: source || 'direct',
      sessionId,
      deviceInfo: {
        platform: req.headers['x-platform'],
        appVersion: req.headers['x-app-version'],
      },
    });

    res.json({
      success: true,
      message: 'View tracked',
    });
  } catch (error) {
    next(error);
  }
};

exports.trackProductEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { event, source, sessionId } = req.body;

    const allowedEvents = [ANALYTICS_EVENTS.CART_ADD, ANALYTICS_EVENTS.WISHLIST_ADD, ANALYTICS_EVENTS.SHARE];
    if (!allowedEvents.includes(event)) {
      return res.status(400).json({ success: false, message: 'Invalid event type' });
    }

    await Analytics.create({
      productId: id,
      userId: req.user?._id || null,
      eventType: event,
      source: source || 'direct',
      sessionId,
      deviceInfo: {
        platform: req.headers['x-platform'],
        appVersion: req.headers['x-app-version'],
      },
    });

    res.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    next(error);
  }
};

exports.updateProductNameHindi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nameHindi } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product id',
        code: 'INVALID_PRODUCT_ID',
      });
    }

    if (!nameHindi) {
      return res.status(400).json({ success: false, message: 'nameHindi is required' });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { nameHindi },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: product._id,
        name: product.name,
        nameHindi: product.nameHindi,
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || 'guest';
    const limit = parseInt(req.query.limit) || 8;

    const isObjectId = require('mongoose').Types.ObjectId.isValid(id);
    let productQuery = { status: 'active' };
    if (isObjectId && id.length === 24) {
      productQuery._id = id;
    } else {
      productQuery.slug = id;
    }

    const currentProduct = await Product.findOne(productQuery).select('category _id');
    if (!currentProduct) return res.json({ success: true, data: [] });
    if (isCategoryExcludedForUser(req.user, currentProduct.category)) {
      return res.json({ success: true, data: [] });
    }

    const relatedQuery = applyCategoryAccessToProductQuery({
      status: 'active',
      category: currentProduct.category,
      _id: { $ne: currentProduct._id }
    }, req.user);

    const relatedProducts = await Product.find(relatedQuery)
      .select('name nameHindi slug shortDescription category brand mrp retailPrice wholesalePrice pendingRetailPrice pendingWholesalePrice priceChangeScheduledAt priceChangeEffectiveAt minWholesaleQuantity negotiationEnabled stock priceUnit packing images rating isFeatured isHot isNew purchaseCountMin purchaseCountMax company')
      .populate('company', 'name')
      .limit(limit)
      .lean();

    const formattedProducts = relatedProducts.map(p => formatProductCard(p, userRole, req));

    res.json({ success: true, data: formattedProducts });
  } catch (error) {
    next(error);
  }
};
