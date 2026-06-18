const Category = require('../models/Category');
const Product = require('../models/Product');
const Company = require('../models/Company');
const { transliterateToHindi } = require('../services/hindiTransliterationService');
const { paginate, formatPaginationResponse } = require('../utils/helpers');
const { PRODUCT_STATUS } = require('../utils/constants');
const { normalizeImageObject } = require('../utils/mediaUrls');
const {
  applyCategoryAccessToProductQuery,
  filterCategoriesForUser,
} = require('../utils/categoryAccess');

async function getProductCountMap(categories = [], user = null) {
  if (categories.length === 0) return new Map();

  const categoryNames = [...new Set(categories.flatMap((category) => [
    category.name,
    category.slug,
  ]).filter(Boolean))];

  const match = applyCategoryAccessToProductQuery({
    category: { $in: categoryNames },
    status: { $ne: PRODUCT_STATUS.ARCHIVED },
  }, user);

  const companyIds = categories
    .map((category) => category.company?._id || category.company)
    .filter(Boolean);
  if (companyIds.length > 0) {
    match.company = { $in: companyIds };
  }

  const counts = await Product.aggregate([
    { $match: match },
    {
      $group: {
        _id: { company: '$company', category: '$category' },
        count: { $sum: 1 },
      },
    },
  ]);

  const countsByKey = new Map();
  counts.forEach((item) => {
    countsByKey.set(`${String(item._id.company || '')}:${item._id.category}`, item.count);
  });
  return countsByKey;
}

async function resolveCompanyId(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const query = raw.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: raw }
    : { $or: [{ slug: raw }, { name: { $regex: new RegExp(`^${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }] };

  const company = await Company.findOne(query).select('_id');
  return company?._id || null;
}

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const { parent, active, search, company, brand } = req.query;
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const query = {};

    // Filter by parent (null for root categories)
    if (parent === 'root') {
      query.parent = null;
    } else if (parent) {
      query.parent = parent;
    }

    // Filter by active status
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const companyFilter = await resolveCompanyId(company || brand);
    if (company || brand) {
      if (!companyFilter) {
        return res.json({
          success: true,
          ...formatPaginationResponse([], 0, page, limit),
        });
      }
      query.company = companyFilter;
    }

    const [categories, total] = await Promise.all([
      Category.find(query)
        .populate('parent', 'name nameHindi slug')
        .populate('company', 'name slug logo')
        .sort({ order: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Category.countDocuments(query),
    ]);

    const visibleCategories = filterCategoriesForUser(categories, req.user);
    const countsByKey = await getProductCountMap(visibleCategories, req.user);
    const categoriesWithCounts = visibleCategories.map((category) => ({
      ...category,
      image: normalizeImageObject(category.image, req),
      productCount:
        countsByKey.get(`${String(category.company?._id || category.company || '')}:${category.name}`) ??
        countsByKey.get(`${String(category.company?._id || category.company || '')}:${category.slug}`) ??
        0,
    }));

    res.json({
      success: true,
      ...formatPaginationResponse(categoriesWithCounts, categoriesWithCounts.length, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name nameHindi slug')
      .populate('company', 'name slug logo')
      .populate('subcategories');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const categoryData = category.toObject();
    categoryData.image = normalizeImageObject(categoryData.image, req);
    categoryData.productCount = await Product.countDocuments({
      category: { $in: [category.name, category.slug].filter(Boolean) },
      company: category.company,
      status: { $ne: PRODUCT_STATUS.ARCHIVED },
    });

    res.json({
      success: true,
      data: categoryData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { name, nameHindi, description, image, parent, order, isActive, company } = req.body;

    const companyId = await resolveCompanyId(company);
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Brand is required for category',
      });
    }

    // Check if category with same name exists inside this brand.
    const existingCategory = await Category.findOne({ 
      company: companyId,
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists for this brand',
      });
    }

    // If parent is specified, verify it exists
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found',
        });
      }
    }

    const category = await Category.create({
      name,
      company: companyId,
      nameHindi: typeof nameHindi === 'string' ? nameHindi.trim() : '',
      description,
      image,
      parent: parent || null,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, nameHindi, description, image, parent, order, isActive, company } = req.body;

    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const nextCompanyId = company !== undefined
      ? await resolveCompanyId(company)
      : category.company;

    if (!nextCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Brand is required for category',
      });
    }

    // Check for duplicate name in same brand (excluding current category)
    if ((name && name !== category.name) || String(nextCompanyId) !== String(category.company)) {
      const existingCategory = await Category.findOne({ 
        company: nextCompanyId,
        name: { $regex: new RegExp(`^${(name || category.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists for this brand',
        });
      }
    }

    // Prevent category from being its own parent
    if (parent && parent === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Category cannot be its own parent',
      });
    }

    // If parent is specified, verify it exists
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found',
        });
      }
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name || category.name,
        company: nextCompanyId,
        nameHindi: nameHindi !== undefined ? String(nameHindi || '').trim() : category.nameHindi,
        description: description !== undefined ? description : category.description,
        image: image !== undefined ? image : category.image,
        parent: parent !== undefined ? (parent || null) : category.parent,
        order: order !== undefined ? order : category.order,
        isActive: isActive !== undefined ? isActive : category.isActive,
      },
      { new: true, runValidators: true }
    ).populate('parent', 'name nameHindi slug').populate('company', 'name slug logo');

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category has subcategories
    const subcategories = await Category.countDocuments({ parent: req.params.id });
    if (subcategories > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete subcategories first.',
      });
    }

    // Check if category has products
    const products = await Product.countDocuments({
      category: { $in: [category.name, category.slug].filter(Boolean) },
      company: category.company,
      status: { $ne: PRODUCT_STATUS.ARCHIVED },
    });
    if (products > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${products} product(s). Reassign products first.`,
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product count for category
// @route   Internal use
exports.updateProductCount = async (categorySlug, companyId = null) => {
  try {
    const query = { 
      category: categorySlug,
      status: { $ne: PRODUCT_STATUS.ARCHIVED }
    };
    if (companyId) query.company = companyId;
    const count = await Product.countDocuments(query);
    
    const categoryQuery = { slug: categorySlug };
    if (companyId) categoryQuery.company = companyId;
    await Category.findOneAndUpdate(
      categoryQuery,
      { productCount: count }
    );
  } catch (error) {
    console.error('Error updating category product count:', error);
  }
};

// @desc    Generate missing Hindi names for categories
// @route   POST /api/v1/categories/hindi-names/generate-missing
// @access  Private/Admin
exports.generateMissingHindiNames = async (req, res, next) => {
  try {
    const requestedBatchSize = Number(req.body?.batchSize ?? req.query.batchSize ?? 0);
    const batchSize = Number.isFinite(requestedBatchSize) && requestedBatchSize > 0
      ? Math.min(requestedBatchSize, 5000)
      : 0;

    const query = {
      $or: [
        { nameHindi: { $exists: false } },
        { nameHindi: null },
        { nameHindi: '' },
      ],
    };

    let finder = Category.find(query).select('_id name nameHindi').sort({ createdAt: 1 }).lean();
    if (batchSize > 0) {
      finder = finder.limit(batchSize);
    }

    const categories = await finder;
    if (categories.length === 0) {
      return res.json({
        success: true,
        message: 'No categories require Hindi name conversion',
        data: {
          processed: 0,
          updated: 0,
          skipped: 0,
          failed: 0,
          failedCategories: [],
        },
      });
    }

    const updates = [];
    const failedCategories = [];
    let skipped = 0;

    const processCategory = async (category) => {
      const englishName = (category.name || '').trim();
      if (!englishName) {
        skipped += 1;
        failedCategories.push({
          id: category._id.toString(),
          reason: 'Missing English category name',
        });
        return;
      }

      try {
        const hindiName = await transliterateToHindi(englishName);
        if (!hindiName || !hindiName.trim() || hindiName.trim() === englishName) {
          skipped += 1;
          return;
        }

        updates.push({
          updateOne: {
            filter: { _id: category._id },
            update: { $set: { nameHindi: hindiName.trim() } },
          },
        });
      } catch (error) {
        skipped += 1;
        failedCategories.push({
          id: category._id.toString(),
          name: englishName,
          reason: error.message || 'Transliteration failed',
        });
      }
    };

    const concurrency = 5;
    for (let i = 0; i < categories.length; i += concurrency) {
      const chunk = categories.slice(i, i + concurrency);
      await Promise.all(chunk.map(processCategory));
    }

    if (updates.length > 0) {
      await Category.bulkWrite(updates, { ordered: false });
    }

    res.json({
      success: true,
      message: `Hindi name conversion completed. Updated ${updates.length} categories.`,
      data: {
        processed: categories.length,
        updated: updates.length,
        skipped,
        failed: failedCategories.length,
        failedCategories: failedCategories.slice(0, 20),
      },
    });
  } catch (error) {
    next(error);
  }
};
