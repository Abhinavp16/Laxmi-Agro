require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');

const Product = require('../models/Product');
const Category = require('../models/Category');
const Company = require('../models/Company');
const Settings = require('../models/Settings');
const WebsiteSettings = require('../models/WebsiteSettings');

const companySeed = {
  name: 'Laxmi Agro',
  description: 'Ashirvad Marketing C/O Laxmi Agro Enterprises',
};

const categorySeeds = [
  'Service Wire Aluminium',
  'Submersible Cable Copper',
  'PVC Column Pipes Green Valley',
  'Jhatka Machine and fencing accessories',
  'GI Pipes',
  'Column Adapter',
  'Harit Sprinkler Set',
  'Service Cable 2 Core / 3 Core / 4 Core',
];

const productSeeds = [
  {
    name: 'Service Wire Aluminium',
    category: 'Service Wire Aluminium',
    sku: 'LAX-SWA-001',
    description: 'Durable aluminium service wire suitable for agricultural power distribution and pump installations.',
    shortDescription: 'Reliable aluminium service wire for field and pump setups.',
    tags: ['wire', 'aluminium', 'service cable'],
    specs: [
      ['Conductor', 'Aluminium'],
      ['Use', 'Agriculture power supply'],
    ],
    variants: [
      ['90 Mtr Coil', 'LAX-SWA-90', 2450, 2190, 2050, 30],
      ['180 Mtr Coil', 'LAX-SWA-180', 4690, 4250, 3990, 18],
    ],
  },
  {
    name: 'Submersible Cable Copper',
    category: 'Submersible Cable Copper',
    sku: 'LAX-SCC-001',
    description: 'Copper submersible cable built for long life in borewell and motor applications.',
    shortDescription: 'Copper cable for submersible motor installations.',
    tags: ['cable', 'copper', 'submersible'],
    specs: [
      ['Conductor', 'Copper'],
      ['Use', 'Submersible pump wiring'],
    ],
    variants: [
      ['1.5 Sqmm', 'LAX-SCC-15', 3850, 3490, 3250, 26],
      ['2.5 Sqmm', 'LAX-SCC-25', 5480, 4990, 4690, 20],
    ],
  },
  {
    name: 'PVC Column Pipe Green Valley',
    category: 'PVC Column Pipes Green Valley',
    sku: 'LAX-PVC-001',
    description: 'Strong and lightweight column pipe designed for borewell and irrigation pump systems.',
    shortDescription: 'PVC column pipe for borewell and irrigation use.',
    tags: ['pipe', 'pvc', 'green valley'],
    specs: [
      ['Material', 'PVC'],
      ['Brand', 'Green Valley'],
    ],
    variants: [
      ['1.5 Inch', 'LAX-PVC-15', 980, 890, 830, 60],
      ['2 Inch', 'LAX-PVC-20', 1290, 1175, 1090, 45],
    ],
  },
  {
    name: 'Harit Sprinkler Set',
    category: 'Harit Sprinkler Set',
    sku: 'LAX-HSS-001',
    description: 'Sprinkler set for uniform irrigation coverage across vegetable, wheat, and paddy fields.',
    shortDescription: 'Field-ready sprinkler set for irrigation.',
    tags: ['sprinkler', 'irrigation', 'harit'],
    specs: [
      ['Coverage', 'Uniform field spread'],
      ['Use', 'Irrigation'],
    ],
    variants: [
      ['6 Nozzle Kit', 'LAX-HSS-6', 3250, 2990, 2790, 22],
      ['12 Nozzle Kit', 'LAX-HSS-12', 5890, 5450, 5090, 14],
    ],
  },
  {
    name: 'Aqua Golden Pump Set',
    category: 'Golden Pump Sets',
    sku: 'LAX-AGP-001',
    description: 'Agriculture pump set for dependable water movement in irrigation and utility applications.',
    shortDescription: 'Dependable pump set for irrigation needs.',
    tags: ['pump', 'golden', 'aqua'],
    specs: [
      ['Application', 'Irrigation'],
      ['Duty', 'Continuous field usage'],
    ],
    variants: [
      ['1 HP', 'LAX-AGP-1HP', 11250, 10390, 9790, 9],
      ['1.5 HP', 'LAX-AGP-15HP', 13890, 12850, 12190, 7],
    ],
  },
];

function buildProduct({
  name,
  category,
  sku,
  description,
  shortDescription,
  tags,
  specs,
  variants,
}, companyId) {
  const normalizedVariants = variants.map(([variantName, variantSku, mrp, retailPrice, wholesalePrice, stock], index) => ({
    name: variantName,
    sku: variantSku,
    attributes: [{ key: 'Variant', value: variantName }],
    mrp,
    retailPrice,
    wholesalePrice,
    stock,
    lowStockThreshold: 3,
    minOrderQuantity: 1,
    priceUnit: 'piece',
    packing: variantName,
    isActive: true,
    order: index,
  }));

  return {
    name,
    description,
    shortDescription,
    category,
    brand: 'Laxmi Agro',
    tags,
    mrp: normalizedVariants[0].mrp,
    retailPrice: normalizedVariants[0].retailPrice,
    wholesalePrice: normalizedVariants[0].wholesalePrice,
    minWholesaleQuantity: 5,
    negotiationEnabled: true,
    sku,
    stock: normalizedVariants.reduce((sum, variant) => sum + variant.stock, 0),
    lowStockThreshold: 3,
    trackInventory: true,
    images: [
      {
        url: `https://placehold.co/800x800/png?text=${encodeURIComponent(name)}`,
        publicId: `local-${sku.toLowerCase()}`,
        isPrimary: true,
        order: 0,
      },
    ],
    specifications: specs.map(([key, value]) => ({ key, value })),
    status: 'active',
    isFeatured: true,
    isHot: false,
    company: companyId,
    variants: normalizedVariants,
  };
}

async function seedLocalCatalog() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    let company = await Company.findOne({ name: companySeed.name });
    if (!company) {
      company = new Company({
        name: companySeed.name,
        slug: slugify(companySeed.name, { lower: true, strict: true }),
      });
    }
    company.description = companySeed.description;
    company.isActive = true;
    await company.save();

    for (let index = 0; index < categorySeeds.length; index += 1) {
      const categoryName = categorySeeds[index];
      let category = await Category.findOne({ name: categoryName });
      if (!category) {
        category = new Category({
          name: categoryName,
          slug: slugify(categoryName, { lower: true, strict: true }),
        });
      }
      category.description = `${categoryName} supplied by Ashirvad Marketing C/O Laxmi Agro Enterprises.`;
      category.isActive = true;
      category.order = index;
      await category.save();
    }

    for (const productSeed of productSeeds) {
      const productData = buildProduct(productSeed, company._id);
      let product = await Product.findOne({ sku: productData.sku });
      if (!product) {
        product = new Product(productData);
      } else {
        product.set(productData);
      }
      await product.save();
    }

    await Company.updateOne({ _id: company._id }, { $set: { productCount: productSeeds.length } });

    for (const categoryName of categorySeeds) {
      const productCount = await Product.countDocuments({ category: categoryName, status: 'active' });
      await Category.updateOne({ name: categoryName }, { $set: { productCount } });
    }

    const settings = await Settings.getSettings();
    settings.businessName = 'Ashirvad Marketing';
    settings.businessPhone = '+91 9179110159';
    settings.businessEmail = 'ashirvadmarketing62@gmail.com';
    settings.businessAddress = 'Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.)';
    settings.socialLinks = {
      ...(settings.socialLinks || {}),
      whatsapp: '9179110159',
    };
    settings.heroBanners = [
      {
        title: 'Laxmi Agro Field Supplies',
        subtitle: 'Wires, cables, pump sets, pipes, and irrigation supplies for dealers and buyers.',
        tag: 'Catalogue 2026',
        imageUrl: 'https://placehold.co/1400x700/png?text=Laxmi+Agro+Banner+1',
        linkUrl: '/products',
        buttonText: 'View Products',
        order: 0,
        isActive: true,
      },
      {
        title: 'Wholesale and Retail Pricing',
        subtitle: 'Role-based pricing remains active for customers and verified wholesale buyers.',
        tag: 'Pricing',
        imageUrl: 'https://placehold.co/1400x700/png?text=Laxmi+Agro+Banner+2',
        linkUrl: '/products',
        buttonText: 'Shop Now',
        order: 1,
        isActive: true,
      },
    ];
    settings.promoBanners = [
      {
        title: 'WhatsApp Checkout Enabled',
        subtitle: 'Send your order instantly on WhatsApp from the app cart and buy-now flow.',
        tag: 'Checkout',
        imageUrl: 'https://placehold.co/1200x500/png?text=WhatsApp+Orders',
        linkUrl: '/contact',
        buttonText: 'Order Now',
        order: 0,
        isActive: true,
      },
    ];
    await settings.save();

    const websiteSettings = await WebsiteSettings.getSettings();
    websiteSettings.productCategories = categorySeeds.slice(0, 6).map((categoryName, index) => ({
      name: categoryName,
      description: `${categoryName} available from Ashirvad Marketing C/O Laxmi Agro Enterprises.`,
      image: `https://placehold.co/800x500/png?text=${encodeURIComponent(categoryName)}`,
      products: [],
      productDetails: [],
      isActive: true,
      order: index,
    }));
    websiteSettings.featuredProducts = productSeeds.slice(0, 4).map((productSeed, index) => ({
      name: productSeed.name,
      price: `From Rs. ${productSeed.variants[0][3]}`,
      image: `https://placehold.co/800x800/png?text=${encodeURIComponent(productSeed.name)}`,
      badge: index === 0 ? 'Best Seller' : 'Featured',
      specs: productSeed.specs.map((entry) => `${entry[0]}: ${entry[1]}`),
      shortDescription: productSeed.shortDescription,
      isActive: true,
      order: index,
    }));
    await websiteSettings.save();

    console.log('Local catalogue seeded successfully.');
  } catch (error) {
    console.error('Failed to seed local catalogue:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedLocalCatalog();
