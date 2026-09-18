/*
 * Idempotent PRIMATE CPVC catalog import for the existing FITTINGS brand.
 *
 * The source sheet contains one price, so it is applied to MRP, retail, and
 * wholesale pricing. The 1 litre solvent row is intentionally excluded because
 * its price is not visible in the source.
 *
 * Usage:
 *   npm run catalog:cpvc -- --dry-run
 *   npm run catalog:cpvc -- --apply
 */
require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

const Company = require('../models/Company');
const Category = require('../models/Category');
const Product = require('../models/Product');

const BRAND_SLUG = 'fittings';
const ROOT_NAME = 'CPVC Pipes and Fittings';
const ROOT_SLUG = 'cpvc-pipes-and-fittings';
const SOURCE = 'PRIMATE price list effective 01-06-2020';
const INITIAL_STOCK = 100;
const EXPECTED_SUBCATEGORIES = 24;
const EXPECTED_PRODUCTS = 155;

const CATEGORY_DEFINITIONS = [
  { key: 'pipes', name: 'Pipes', code: 'PIPE', label: 'Pipe', purpose: 'pressure water supply and plumbing lines', connection: 'Plain pipe' },
  { key: 'elbow', name: 'Elbow', code: 'ELB', label: 'Elbow', purpose: 'making a 90-degree change in pipe direction', connection: 'Socket' },
  { key: 'coupler', name: 'Coupler', code: 'COUP', label: 'Coupler', purpose: 'joining two straight CPVC pipe sections', connection: 'Socket' },
  { key: 'union', name: 'Union', code: 'UNION', label: 'Union', purpose: 'creating a detachable pipe joint for service and maintenance', connection: 'Union socket' },
  { key: 'tee', name: 'Tee', code: 'TEE', label: 'Tee', purpose: 'creating a branch connection in a CPVC pipe line', connection: 'Socket' },
  { key: 'tank-nipple', name: 'Tank Nipple', code: 'TNIP', label: 'Tank Nipple', purpose: 'connecting CPVC pipework to a water tank outlet', connection: 'Tank outlet' },
  { key: 'end-cap', name: 'End Cap', code: 'ECAP', label: 'End Cap', purpose: 'closing the end of a CPVC pipe line', connection: 'Socket cap' },
  { key: 'socket-tank-nipple', name: 'Socket Tank Nipple', code: 'STNIP', label: 'Socket Tank Nipple', purpose: 'connecting a socket pipe line to a water tank outlet', connection: 'Socket tank outlet' },
  { key: 'elbow-45', name: 'Elbow 45°', code: 'ELB45', label: 'Elbow 45°', purpose: 'making a 45-degree change in pipe direction', connection: 'Socket' },
  { key: 'mixer-adaptor', name: '3-in-1 Mixer Adaptor', code: 'MIX3', label: '3-in-1 Mixer Adaptor', purpose: 'connecting CPVC plumbing to a wall mixer installation', connection: 'Mixer adaptor' },
  { key: 'mta-plastic', name: 'MTA (Plastic)', code: 'MTAP', label: 'MTA Plastic', purpose: 'joining CPVC pipe to a male threaded connection', connection: 'Male threaded adaptor' },
  { key: 'fta-plastic', name: 'FTA (Plastic)', code: 'FTAP', label: 'FTA Plastic', purpose: 'joining CPVC pipe to a female threaded connection', connection: 'Female threaded adaptor' },
  { key: 'mta-brass', name: 'MTA (Brass)', code: 'MTAB', label: 'MTA Brass', purpose: 'joining CPVC pipe to a durable brass male threaded connection', connection: 'Brass male threaded adaptor', material: 'CPVC with brass insert' },
  { key: 'fta-brass', name: 'FTA (Brass)', code: 'FTAB', label: 'FTA Brass', purpose: 'joining CPVC pipe to a durable brass female threaded connection', connection: 'Brass female threaded adaptor', material: 'CPVC with brass insert' },
  { key: 'elbow-brass', name: 'Elbow (Brass)', code: 'ELBB', label: 'Elbow Brass', purpose: 'changing pipe direction at a brass threaded fixture', connection: 'Socket and brass thread', material: 'CPVC with brass insert' },
  { key: 'tee-brass', name: 'Tee (Brass)', code: 'TEEB', label: 'Tee Brass', purpose: 'creating a branch connection with a brass threaded outlet', connection: 'Socket and brass thread', material: 'CPVC with brass insert' },
  { key: 'reducing-bush', name: 'Reducing Bush', code: 'RBUSH', label: 'Reducing Bush', purpose: 'adapting a larger CPVC fitting to a smaller pipe size', connection: 'Reducing socket' },
  { key: 'reducer-coupler', name: 'Reducer Coupler', code: 'RCOUP', label: 'Reducer Coupler', purpose: 'joining CPVC pipes of two different sizes', connection: 'Reducing socket' },
  { key: 'reducer-tee', name: 'Reducer Tee', code: 'RTEE', label: 'Reducer Tee', purpose: 'creating a reduced branch connection in a CPVC pipe line', connection: 'Reducing tee socket' },
  { key: 'ball-valve', name: 'Ball Valve', code: 'BVAL', label: 'Ball Valve', purpose: 'controlling water flow through a CPVC pipe line', connection: 'Socket valve' },
  { key: 'reducer-elbow', name: 'Reducer Elbow', code: 'RELB', label: 'Reducer Elbow', purpose: 'changing direction while connecting two different pipe sizes', connection: 'Reducing elbow socket' },
  { key: 'step-over-bend', name: 'Step Over Bend', code: 'SOB', label: 'Step Over Bend', purpose: 'routing a CPVC pipe line over an obstruction', connection: 'Socket bend' },
  { key: 'cross-tee', name: 'Cross Tee', code: 'CTEE', label: 'Cross Tee', purpose: 'creating multiple branch connections from a CPVC pipe line', connection: 'Cross socket' },
  { key: 'solvent', name: 'Solvent', code: 'SOLV', label: 'Solvent', purpose: 'bonding CPVC pipes and fittings into a sealed joint', connection: 'Solvent cement', material: 'CPVC solvent cement' },
];

const SERIES = {
  elbow: [
    ['1/2 inch', '12', 50, 2000, 9.3], ['3/4 inch', '34', 50, 900, 13.2],
    ['1 inch', '1', 50, 400, 28], ['1 1/4 inch', '114', 25, 250, 58.2],
    ['1 1/2 inch', '112', 25, 150, 81], ['2 inch', '2', 10, 50, 213],
    ['2 1/2 inch', '212', 5, 35, 378], ['3 inch', '3', 2, 20, 542],
  ],
  coupler: [
    ['1/2 inch', '12', 50, 3000, 7], ['3/4 inch', '34', 50, 1500, 9.75],
    ['1 inch', '1', 50, 600, 18.2], ['1 1/4 inch', '114', 25, 400, 33.8],
    ['1 1/2 inch', '112', 25, 250, 56], ['2 inch', '2', 10, 100, 125],
    ['2 1/2 inch', '212', 5, 50, 223], ['3 inch', '3', 5, 30, 308],
  ],
  union: [
    ['1/2 inch', '12', 50, 900, 48], ['3/4 inch', '34', 50, 500, 57],
    ['1 inch', '1', 50, 300, 87], ['1 1/4 inch', '114', 25, 175, 119],
    ['1 1/2 inch', '112', 20, 120, 212], ['2 inch', '2', 10, 60, 341],
  ],
  tee: [
    ['1/2 inch', '12', 50, 1600, 13.6], ['3/4 inch', '34', 50, 600, 20],
    ['1 inch', '1', 50, 300, 38.4], ['1 1/4 inch', '114', 25, 150, 74.3],
    ['1 1/2 inch', '112', 15, 90, 122], ['2 inch', '2', 5, 50, 257],
    ['2 1/2 inch', '212', 5, 20, 521], ['3 inch', '3', 2, 12, 718],
  ],
  'tank-nipple': [
    ['1/2 inch', '12', 50, 600, 43.5], ['3/4 inch', '34', 50, 400, 48],
    ['1 inch', '1', 25, 225, 80], ['1 1/4 inch', '114', 25, 150, 115],
    ['1 1/2 inch', '112', 25, 100, 125], ['2 inch', '2', 10, 80, 211],
  ],
  'end-cap': [
    ['1/2 inch', '12', 50, 4000, 6.7], ['3/4 inch', '34', 50, 2500, 10],
    ['1 inch', '1', 50, 1200, 14.75], ['1 1/4 inch', '114', 50, 700, 25],
    ['1 1/2 inch', '112', 25, 400, 42], ['2 inch', '2', 10, 200, 91.5],
    ['2 1/2 inch', '212', 5, 100, 176], ['3 inch', '3', 2, 60, 248],
  ],
  'socket-tank-nipple': [
    ['3/4 inch', '34', 50, 500, 44], ['1 inch', '1', 25, 250, 66],
    ['1 1/4 inch', '114', 25, 150, 135],
  ],
  'elbow-45': [
    ['1/2 inch', '12', 50, 2500, 15.15], ['3/4 inch', '34', 50, 1000, 15.7],
    ['1 inch', '1', 50, 600, 32.6], ['1 1/4 inch', '114', 25, null, 48.5],
    ['1 1/2 inch', '112', 25, null, 78],
  ],
  'mta-plastic': [
    ['1/2 inch', '12', 50, 2500, 10.2], ['3/4 inch', '34', 50, 1200, 14.9],
    ['1 inch', '1', 50, 700, 22.6], ['1 1/4 inch', '114', 25, 400, 41],
    ['1 1/2 inch', '112', 25, 250, 62], ['2 inch', '2', 10, 130, 129],
    ['3/4 x 1/2 inch', '34X12', 50, 1500, 15.2],
    ['1 x 1/2 inch', '1X12', 25, null, 25], ['1 x 3/4 inch', '1X34', 25, null, 27.5],
  ],
  'fta-plastic': [
    ['1/2 inch', '12', 50, 2000, 13], ['3/4 inch', '34', 50, 1200, 16],
    ['1 inch', '1', 50, 600, 28.5], ['1 1/4 inch', '114', 25, 300, 53],
    ['1 1/2 inch', '112', 25, 200, 76.3], ['2 inch', '2', 10, 100, 154],
    ['3/4 x 1/2 inch', '34X12', 50, 1200, 16.6],
    ['1 x 1/2 inch', '1X12', 25, null, 24], ['1 x 3/4 inch', '1X34', 25, null, 24.4],
  ],
  'mta-brass': [
    ['1/2 inch', '12', 25, 200, 63.5], ['3/4 inch', '34', 25, 150, 108],
    ['1 inch', '1', 25, 75, 171], ['1 1/4 inch', '114', 5, 50, 287],
    ['1 1/2 inch', '112', 5, null, 456.7], ['2 inch', '2', 5, null, 577],
    ['3/4 x 1/2 inch', '34X12', 25, 200, 71.3],
    ['1 x 1/2 inch', '1X12', 25, 200, 88.5], ['1 x 3/4 inch', '1X34', 25, 125, 122.4],
  ],
  'fta-brass': [
    ['1/2 inch', '12', 25, 250, 49], ['3/4 inch', '34', 25, 200, 87],
    ['1 inch', '1', 25, 125, 134.5], ['1 1/4 inch', '114', 5, 60, 241.5],
    ['1 1/2 inch', '112', 5, null, 375], ['2 inch', '2', 5, null, 483],
    ['3/4 x 1/2 inch', '34X12', 25, 250, 54.65],
    ['1 x 1/2 inch', '1X12', 25, 200, 69], ['1 x 3/4 inch', '1X34', 25, 150, 100.3],
  ],
  'elbow-brass': [
    ['1/2 inch', '12', 25, 150, 51], ['3/4 inch', '34', 25, 150, 80],
    ['1 inch', '1', 25, 75, 185], ['3/4 x 1/2 inch', '34X12', 25, 175, 59],
    ['1 x 1/2 inch', '1X12', 25, 125, 81.2], ['1 x 3/4 inch', '1X34', 25, 100, 104.4],
  ],
  'tee-brass': [
    ['1/2 inch', '12', 25, 150, 56.5], ['3/4 inch', '34', 25, 125, 84],
    ['1 inch', '1', 25, 75, 217], ['3/4 x 1/2 inch', '34X12', 25, 150, 65],
    ['1 x 1/2 inch', '1X12', 25, 100, 88],
  ],
  'reducing-bush': [
    ['1 x 3/4 inch', '1X34', 50, 1500, 13], ['1 1/4 x 1 inch', '114X1', 50, 900, 22],
    ['1 1/2 x 1 inch', '112X1', 25, 500, 42],
    ['1 1/2 x 1 1/4 inch', '112X114', 25, 500, 39],
    ['2 x 1 inch', '2X1', 10, 250, 83.5], ['2 x 1 1/2 inch', '2X112', 10, 250, 90.4],
  ],
  'reducer-coupler': [
    ['1 x 3/4 inch', '1X34', 50, 1000, 18.2],
    ['1 1/4 x 3/4 inch', '114X34', 50, 600, 36.5],
    ['1 1/4 x 1 inch', '114X1', 50, 500, 38],
    ['1 1/2 x 1 inch', '112X1', 25, 350, 60],
    ['1 1/2 x 1 1/4 inch', '112X114', 25, 300, 63],
    ['2 x 1 inch', '2X1', 10, 150, 129], ['2 x 1 1/4 inch', '2X114', 10, 150, 134],
    ['2 x 1 1/2 inch', '2X112', 10, 150, 146],
  ],
  'reducer-tee': [
    ['1 x 3/4 inch', '1X34', 50, 400, 40.3],
    ['1 1/4 x 3/4 inch', '114X34', 25, 200, 76.4],
    ['1 1/4 x 1 inch', '114X1', 25, 200, 72.7],
    ['1 1/2 x 3/4 inch', '112X34', 25, 100, 138.5],
    ['1 1/2 x 1 inch', '112X1', 15, 120, 137],
    ['1 1/2 x 1 1/4 inch', '112X114', 15, 90, 145],
    ['2 x 1 inch', '2X1', 10, 50, 247], ['2 x 1 1/4 inch', '2X114', 10, 50, 256],
    ['2 x 1 1/2 inch', '2X112', 10, 50, 270],
  ],
  'ball-valve': [
    ['1/2 inch', '12', 1, null, 120], ['3/4 inch', '34', 1, null, 170],
    ['1 inch', '1', 1, null, 232], ['1 1/4 inch', '114', 1, null, 469],
    ['1 1/2 inch', '112', 1, null, 760], ['2 inch', '2', 1, null, 1080],
  ],
  'step-over-bend': [
    ['1/2 inch', '12', 25, 400, 60], ['3/4 inch', '34', 25, 250, 83.7],
    ['1 inch', '1', 25, 125, 123], ['1 1/4 inch', '114', 20, 80, 176.5],
  ],
  'cross-tee': [
    ['3/4 inch', '34', 50, 450, 31], ['1 inch', '1', 25, 200, 60.4],
    ['1 1/4 inch', '114', 15, 120, 104],
  ],
  solvent: [
    ['10 ml', '10ML', 100, null, 29], ['25 ml', '25ML', 100, null, 50],
    ['50 ml', '50ML', 30, null, 100], ['118 ml', '118ML', 24, null, 172],
    ['237 ml', '237ML', 15, null, 315], ['500 ml', '500ML', 12, null, 575],
  ],
};

const CUSTOM_PRODUCTS = [
  { key: 'mixer-adaptor', size: '3/4 x 1/2 inch', sizeCode: '34X12', bagQty: 1, boxQty: 50, price: 314 },
  { key: 'reducer-elbow', size: '1 x 3/4 inch', sizeCode: '1X34', bagQty: 50, boxQty: 500, price: 32.6 },
];

const PIPE_ROWS = [
  ['1/2 inch', '12', 75, 148, 172], ['3/4 inch', '34', 50, 266, 305],
  ['1 inch', '1', 30, 418, 497], ['1 1/4 inch', '114', 25, 630, 724],
  ['1 1/2 inch', '112', 15, 861, 1034], ['2 inch', '2', 10, 1427, 1674],
];

function packingText(product) {
  if (product.key === 'pipes') {
    return `3 m length; ${product.bagQty} pcs/standard pack`;
  }
  if (product.key === 'solvent') {
    return `${product.bagQty} bottles/pack`;
  }
  const parts = [`${product.bagQty} pcs/bag`];
  if (product.boxQty) parts.push(`${product.boxQty} pcs/box`);
  return parts.join('; ');
}

function buildCopy(product, category) {
  const material = category.material || 'CPVC';
  const unit = product.key === 'solvent' ? 'bottle' : 'piece';
  const description =
    `${product.name} is a ${material} product designed for ${category.purpose}. ` +
    `Its ${product.size} configuration is suitable for compatible CPVC plumbing, water-supply, and agricultural installations. ` +
    `The product is listed in the ${SOURCE} and is priced per ${unit}.`;
  const shortDescription =
    `${product.size} ${category.label} for ${category.purpose}; priced per ${unit}.`;
  return { description, shortDescription };
}

function buildSpecifications(product, category) {
  const specifications = [
    { key: 'Product Type', value: category.name },
    { key: 'Material', value: category.material || 'CPVC' },
    { key: product.key === 'solvent' ? 'Volume' : 'Size', value: product.size },
    { key: 'Connection Type', value: category.connection },
    { key: 'Application', value: category.purpose },
    { key: 'Pack Quantity', value: product.key === 'solvent' ? `${product.bagQty} bottles` : `${product.bagQty} pieces` },
  ];
  if (product.boxQty) specifications.push({ key: 'Box Quantity', value: `${product.boxQty} pieces` });
  if (product.sdr) specifications.push({ key: 'SDR Rating', value: product.sdr });
  if (product.key === 'pipes') specifications.push({ key: 'Length', value: '3 meters' });
  specifications.push({ key: 'Source', value: SOURCE });
  return specifications;
}

function buildProducts() {
  const categoryByKey = new Map(CATEGORY_DEFINITIONS.map((category) => [category.key, category]));
  const products = [];

  for (const [size, sizeCode, standardQty, sdr135Price, sdr11Price] of PIPE_ROWS) {
    for (const [sdr, sdrCode, price] of [['13.5', 'SDR135', sdr135Price], ['11', 'SDR11', sdr11Price]]) {
      products.push({
        key: 'pipes',
        name: `CPVC Pipe ${size} - SDR ${sdr}`,
        sku: `CPVC-PIPE-${sizeCode}-${sdrCode}`,
        size,
        sizeCode,
        sdr,
        bagQty: standardQty,
        boxQty: null,
        price,
      });
    }
  }

  for (const category of CATEGORY_DEFINITIONS) {
    for (const row of SERIES[category.key] || []) {
      const [size, sizeCode, bagQty, boxQty, price] = row;
      products.push({
        key: category.key,
        name: `CPVC ${category.label} ${size}`,
        sku: `CPVC-${category.code}-${sizeCode}`,
        size,
        sizeCode,
        bagQty,
        boxQty,
        price,
      });
    }
  }

  for (const product of CUSTOM_PRODUCTS) {
    const category = categoryByKey.get(product.key);
    products.push({
      ...product,
      name: `CPVC ${category.label} ${product.size}`,
      sku: `CPVC-${category.code}-${product.sizeCode}`,
    });
  }

  for (const product of products) {
    const category = categoryByKey.get(product.key);
    Object.assign(product, buildCopy(product, category));
    product.specifications = buildSpecifications(product, category);
    product.packing = packingText(product);
    product.priceUnit = product.key === 'solvent' ? 'Bottle' : 'Piece';
    product.tags = [
      'cpvc',
      'fittings',
      'primate',
      category.name.toLowerCase(),
      product.size.toLowerCase(),
      ...(product.sdr ? [`sdr ${product.sdr}`] : []),
    ];
  }

  return products;
}

function assertSourceData(products) {
  if (CATEGORY_DEFINITIONS.length !== EXPECTED_SUBCATEGORIES) {
    throw new Error(`Expected ${EXPECTED_SUBCATEGORIES} subcategories, found ${CATEGORY_DEFINITIONS.length}`);
  }
  if (products.length !== EXPECTED_PRODUCTS) {
    throw new Error(`Expected ${EXPECTED_PRODUCTS} products, found ${products.length}`);
  }
  const duplicateSkus = products.filter((product, index) => products.findIndex((item) => item.sku === product.sku) !== index);
  const duplicateSlugs = products.filter((product, index) => {
    const slug = slugify(product.name, { lower: true, strict: true });
    return products.findIndex((item) => slugify(item.name, { lower: true, strict: true }) === slug) !== index;
  });
  if (duplicateSkus.length || duplicateSlugs.length) {
    throw new Error(`Source contains duplicate SKUs (${duplicateSkus.length}) or slugs (${duplicateSlugs.length})`);
  }
  for (const product of products) {
    if (!Number.isFinite(product.price) || product.price < 0) {
      throw new Error(`Invalid price for ${product.name}`);
    }
  }
}

async function resolveCategory({ companyId, parentId, name, slug, description, order, mode }) {
  let category = await Category.findOne({ company: companyId, parent: parentId, slug });
  if (!category) {
    const sibling = await Category.findOne({ company: companyId, parent: parentId, name });
    if (sibling && sibling.slug !== slug) {
      const slugOwner = await Category.findOne({ company: companyId, slug });
      if (slugOwner && !slugOwner._id.equals(sibling._id)) {
        throw new Error(`Cannot assign slug ${slug}; it is already used by ${slugOwner.name}`);
      }
      category = sibling;
    }
  }

  if (mode === 'dry-run') {
    return { category, action: category ? 'update' : 'create' };
  }

  const now = new Date();
  if (!category) {
    category = await Category.findOneAndUpdate(
      { company: companyId, parent: parentId, slug },
      {
        $setOnInsert: { createdAt: now, productCount: 0 },
        $set: { name, slug, description, order, isActive: true, showOnWebsite: true, updatedAt: now },
      },
      { new: true, upsert: true, runValidators: true },
    );
    return { category, action: 'create' };
  }

  category = await Category.findByIdAndUpdate(
    category._id,
    { $set: { name, slug, description, order, isActive: true, showOnWebsite: true } },
    { new: true, runValidators: true },
  );
  return { category, action: 'update' };
}

function productFields(product, category, companyId) {
  return {
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    category: category.slug,
    categoryRef: category._id,
    subCategory: category.slug,
    company: companyId,
    brand: 'FITTINGS',
    tags: product.tags,
    mrp: product.price,
    retailPrice: product.price,
    wholesalePrice: product.price,
    minWholesaleQuantity: product.bagQty || 1,
    negotiationEnabled: true,
    priceUnit: product.priceUnit,
    packing: product.packing,
    specifications: product.specifications,
    status: 'active',
    showOnWebsite: true,
    isFeatured: false,
    isHot: false,
    trackInventory: true,
    variants: [],
  };
}

async function main() {
  const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
  const products = buildProducts();
  assertSourceData(products);

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);

  const company = await Company.findOne({ slug: BRAND_SLUG });
  if (!company || company.name !== 'FITTINGS') {
    throw new Error('Active FITTINGS brand with slug "fittings" was not found');
  }

  const existingRootOrders = await Category.find({ company: company._id, parent: null }).select('order').lean();
  const rootOrder = existingRootOrders.length
    ? Math.max(...existingRootOrders.map((category) => Number(category.order) || 0)) + 1
    : 0;
  const rootResult = await resolveCategory({
    companyId: company._id,
    parentId: null,
    name: ROOT_NAME,
    slug: ROOT_SLUG,
    description: 'PRIMATE CPVC pipes, plumbing fittings, threaded adaptors, valves, and solvent for water-supply installations.',
    order: rootOrder,
    mode,
  });

  const categoryActions = { create: rootResult.action === 'create' ? 1 : 0, update: rootResult.action === 'update' ? 1 : 0 };
  const categories = new Map();
  const parentId = rootResult.category?._id || new mongoose.Types.ObjectId();

  for (const [index, definition] of CATEGORY_DEFINITIONS.entries()) {
    const result = await resolveCategory({
      companyId: company._id,
      parentId,
      name: definition.name,
      slug: `${ROOT_SLUG}-${slugify(definition.name, { lower: true, strict: true })}`,
      description: `CPVC ${definition.name.toLowerCase()} products for ${definition.purpose}. Source: ${SOURCE}.`,
      order: index,
      mode,
    });
    categoryActions[result.action] += 1;
    if (result.category) categories.set(definition.key, result.category);
  }

  const productActions = { create: 0, update: 0, unchanged: 0, conflicts: [] };
  for (const product of products) {
    const existing = await Product.findOne({ sku: product.sku });
    const expectedSlug = slugify(product.name, { lower: true, strict: true });
    const slugOwner = await Product.findOne({ slug: expectedSlug }).select('sku name');
    if (slugOwner && slugOwner.sku !== product.sku) {
      productActions.conflicts.push(`${product.sku}: slug belongs to ${slugOwner.sku}`);
      continue;
    }
    if (existing && existing.name !== product.name) {
      productActions.conflicts.push(`${product.sku}: existing name is "${existing.name}"`);
      continue;
    }

    if (mode === 'dry-run') {
      productActions[existing ? 'update' : 'create'] += 1;
      continue;
    }

    const category = categories.get(product.key);
    if (!category) throw new Error(`Category was not resolved for ${product.key}`);
    const fields = productFields(product, category, company._id);
    if (!existing) {
      await Product.create({ ...fields, sku: product.sku, stock: INITIAL_STOCK, lowStockThreshold: 5 });
      productActions.create += 1;
    } else {
      existing.set(fields);
      await existing.save();
      productActions.update += 1;
    }
  }

  if (productActions.conflicts.length) {
    throw new Error(`Product conflicts detected:\n${productActions.conflicts.join('\n')}`);
  }

  if (mode === 'apply') {
    for (const category of categories.values()) {
      const productCount = await Product.countDocuments({ categoryRef: category._id, status: 'active' });
      await Category.updateOne({ _id: category._id }, { $set: { productCount } });
    }
    const childIds = [...categories.values()].map((category) => category._id);
    const rootProductCount = await Product.countDocuments({ categoryRef: { $in: childIds }, status: 'active' });
    await Category.updateOne({ _id: rootResult.category._id }, { $set: { productCount: rootProductCount } });
    const companyProductCount = await Product.countDocuments({ company: company._id, status: 'active' });
    await Company.updateOne({ _id: company._id }, { $set: { productCount: companyProductCount } });

    const importedCount = await Product.countDocuments({ sku: { $in: products.map((product) => product.sku) } });
    const linkedCount = await Product.countDocuments({
      sku: { $in: products.map((product) => product.sku) },
      categoryRef: { $in: childIds },
      company: company._id,
      status: 'active',
    });
    if (importedCount !== EXPECTED_PRODUCTS || linkedCount !== EXPECTED_PRODUCTS || rootProductCount < EXPECTED_PRODUCTS) {
      throw new Error(`Verification failed: imported=${importedCount}, linked=${linkedCount}, root=${rootProductCount}`);
    }
  }

  console.log(JSON.stringify({
    mode,
    brand: company.name,
    rootCategory: ROOT_NAME,
    sourceSubcategories: CATEGORY_DEFINITIONS.length,
    sourceProducts: products.length,
    skipped: [{ name: 'CPVC Solvent 1 liter', reason: 'Price is not visible in the source sheet' }],
    categoryActions,
    productActions: { ...productActions, conflicts: productActions.conflicts.length },
    pricePolicy: 'Source price copied to MRP, retail price, and wholesale price',
    initialStockForNewProducts: INITIAL_STOCK,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('CPVC IMPORT FAILED:', error.message);
  try { await mongoose.disconnect(); } catch (_) { /* noop */ }
  process.exit(1);
});
