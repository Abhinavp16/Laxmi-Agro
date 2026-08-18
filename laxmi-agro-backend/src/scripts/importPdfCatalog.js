require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const slugify = require('slugify');

const Product = require('../models/Product');
const Category = require('../models/Category');
const Company = require('../models/Company');
const Settings = require('../models/Settings');
const WebsiteSettings = require('../models/WebsiteSettings');

const COMPANY_NAME = 'Ashirvad Marketing';
const COMPANY_DESCRIPTION = 'Ashirvad Marketing C/O Laxmi Agro Enterprises, Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.)';
const PDF_PAGE_DIR = path.resolve(__dirname, '..', '..', '..', '.local', 'pdf-catalog-pages');
const PUBLIC_UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'catalog');
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

const SHIPPING_TERMS = [
  'Delivery, payment, and return arrangements depend on the product, order, and location.',
  'Contact Laxmi Agro to confirm the applicable terms before payment or dispatch.',
].join('\n\n');

const categories = [
  'Service Wire Aluminium',
  'Submersible Cable Copper',
  'PVC Column Pipes Green Valley',
  'Jhatka Machine and fencing accessories',
  'GI Pipes',
  'Column Adapter',
  'Harit Sprinkler Set',
  'Service Cable 2 Core / 3 Core / 4 Core',
  'Jointing Solution',
  'Roll Pipe Green Valley HDPE',
  'Starter Oil / Oil Starter',
  'Shivnath Control Panels',
  'Aqua Golden Pump Sets',
  'Mayur Pankh Pump Sets',
  'Golden Pump Sets',
];

const featuredProductNames = new Set([
  'Ideal Service Wire Aluminium',
  'PVC Column Pipes Green Valley',
  'Service Cable',
  'Aqua Golden Sub V-4 20 Feet Pump Sets',
  'Mayur Pankh Sub V-6 30 Feet Pump Sets',
  'Golden Sub V-3 13 Feet Pump Sets',
  'Submersible Cable Copper',
  'GI Pipes',
]);

const hotProductNames = new Set([
  'Jhatka Machine',
  'Harit Raingun Set',
  'Starter Oil',
  'Bentex Oil Starter',
  'Shivnath MCB Panel',
  'Shivnath BCH Contactor With Digital Meter',
  'Column Adapter',
  'Roll Pipe Green Valley HDPE',
]);

const sampleSkusToRemove = [
  'LAX-SWA-001',
  'LAX-SCC-001',
  'LAX-PVC-001',
  'LAX-HSS-001',
  'LAX-AGP-001',
];

function slug(value) {
  return slugify(String(value || ''), { lower: true, strict: true });
}

function toAttributes(attributes = {}) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ({ key, value: String(value) }));
}

function variant(sku, name, rate, attributes = {}, extra = {}) {
  return {
    sku,
    name,
    mrp: Number(rate),
    retailPrice: Number(rate),
    wholesalePrice: Number(rate),
    stock: extra.stock ?? 100,
    lowStockThreshold: extra.lowStockThreshold ?? 5,
    minOrderQuantity: extra.minOrderQuantity ?? 1,
    priceUnit: extra.priceUnit || '',
    packing: extra.packing || '',
    isActive: true,
    order: extra.order ?? 0,
    attributes: toAttributes(attributes),
  };
}

function pageImage(pageNumber) {
  const source = path.join(PDF_PAGE_DIR, `page-${pageNumber}.png`);
  if (!fs.existsSync(source)) {
    return null;
  }

  fs.mkdirSync(PUBLIC_UPLOAD_DIR, { recursive: true });
  const filename = `catalog-page-${String(pageNumber).padStart(2, '0')}.png`;
  const target = path.join(PUBLIC_UPLOAD_DIR, filename);
  fs.copyFileSync(source, target);

  return {
    url: `${PUBLIC_BASE_URL}/uploads/catalog/${filename}`,
    publicId: `catalog-page-${String(pageNumber).padStart(2, '0')}`,
    isPrimary: true,
    order: 0,
  };
}

const productDefinitions = [
  {
    name: 'Ideal Service Wire Aluminium',
    category: 'Service Wire Aluminium',
    brand: 'Ideal',
    sku: 'PDF-SWA-IDEAL',
    page: 2,
    shortDescription: '300 meter double coated LD XLPE aluminium service wire.',
    description: 'Catalogue-listed Ideal aluminium service wire with 300 meter length and double coated LD XLPE finish.',
    tags: ['service wire', 'aluminium', 'ideal', '300 meter'],
    specifications: [
      ['Make', 'Ideal'],
      ['Length', '300 meter'],
      ['Coating', 'Double Coated LD - XLPE'],
    ],
    variants: [
      variant('PDF-SWA-IDEAL-8MM', '8 mm / 70 No.', 2000, { Size: '8 mm', Gauge: '70 No.' }, { packing: '300 meter coil', priceUnit: 'coil', order: 0 }),
      variant('PDF-SWA-IDEAL-10MM', '10 mm / 80 No.', 2400, { Size: '10 mm', Gauge: '80 No.' }, { packing: '300 meter coil', priceUnit: 'coil', order: 1 }),
      variant('PDF-SWA-IDEAL-12MM', '12 mm / 90 No.', 2800, { Size: '12 mm', Gauge: '90 No.' }, { packing: '300 meter coil', priceUnit: 'coil', order: 2 }),
      variant('PDF-SWA-IDEAL-14MM', '14 mm / 100 No.', 3200, { Size: '14 mm', Gauge: '100 No.' }, { packing: '300 meter coil', priceUnit: 'coil', order: 3 }),
    ],
  },
  {
    name: 'Shivnath Service Wire Aluminium',
    category: 'Service Wire Aluminium',
    brand: 'Shivnath',
    sku: 'PDF-SWA-SHIVNATH',
    page: 2,
    shortDescription: '400 meter fresh PVC aluminium service wire.',
    description: 'Catalogue-listed Shivnath aluminium service wire with 400 meter length and fresh PVC finish.',
    tags: ['service wire', 'aluminium', 'shivnath', '400 meter'],
    specifications: [
      ['Make', 'Shivnath'],
      ['Length', '400 meter'],
      ['Coating', 'Fresh PVC'],
    ],
    variants: [
      variant('PDF-SWA-SHIV-10MM', '10 mm / 100 No.', 3100, { Size: '10 mm', Gauge: '100 No.' }, { packing: '400 meter coil', priceUnit: 'coil', order: 0 }),
      variant('PDF-SWA-SHIV-12MM', '12 mm / 115 No.', 3800, { Size: '12 mm', Gauge: '115 No.' }, { packing: '400 meter coil', priceUnit: 'coil', order: 1 }),
      variant('PDF-SWA-SHIV-14MM', '14 mm / 125 No.', 4500, { Size: '14 mm', Gauge: '125 No.' }, { packing: '400 meter coil', priceUnit: 'coil', order: 2 }),
    ],
  },
  {
    name: 'Mourya Service Wire Aluminium',
    category: 'Service Wire Aluminium',
    brand: 'Mourya',
    sku: 'PDF-SWA-MOURYA',
    page: 2,
    shortDescription: '400 meter crystal transparent aluminium service wire.',
    description: 'Catalogue-listed Mourya aluminium service wire with 400 meter length and crystal transparent finish.',
    tags: ['service wire', 'aluminium', 'mourya', '400 meter'],
    specifications: [
      ['Make', 'Mourya'],
      ['Length', '400 meter'],
      ['Coating', 'Crystal Transparent'],
    ],
    variants: [
      variant('PDF-SWA-MOUR-10MM', '10 mm / 90 No.', 2950, { Size: '10 mm', Gauge: '90 No.' }, { packing: '400 meter coil', priceUnit: 'coil', order: 0 }),
      variant('PDF-SWA-MOUR-12MM', '12 mm / 100 No.', 3500, { Size: '12 mm', Gauge: '100 No.' }, { packing: '400 meter coil', priceUnit: 'coil', order: 1 }),
    ],
  },
  {
    name: 'Submersible Cable Copper',
    category: 'Submersible Cable Copper',
    brand: '',
    sku: 'PDF-SCC-MIXED',
    page: 3,
    shortDescription: '3 layer LDP coated copper submersible cable range.',
    description: 'All submersible copper cables from the catalogue with LDP coating and 3 layer construction.',
    tags: ['submersible cable', 'copper', 'ldp coating', '3 layer'],
    specifications: [
      ['Conductor', 'Copper'],
      ['Coating', 'LDP'],
      ['Construction', '3 Layer Cable'],
    ],
    variants: [
      variant('PDF-SCC-MP-15', 'Mourya Premium 22 x 9.5 Black 1.5 Sq. mm', 50, { Make: 'Mourya Premium', Size: '1.5 Sq. mm', Build: '22 x 9.5', Color: 'Black' }, { packing: 'Per unit', priceUnit: 'unit', order: 0 }),
      variant('PDF-SCC-MP-25', 'Mourya Premium 22 x 9.5 Black 2.5 Sq. mm', 52, { Make: 'Mourya Premium', Size: '2.5 Sq. mm', Build: '22 x 9.5', Color: 'Black' }, { packing: 'Per unit', priceUnit: 'unit', order: 1 }),
      variant('PDF-SCC-MM-35X8', 'Mourya Metro 35 x 8 Black', 60, { Make: 'Mourya Metro', Build: '35 x 8', Color: 'Black' }, { packing: 'Per unit', priceUnit: 'unit', order: 2 }),
      variant('PDF-SCC-MP-35X9', 'Mourya Premium 35 x 9 Black', 74, { Make: 'Mourya Premium', Build: '35 x 9', Color: 'Black' }, { packing: 'Per unit', priceUnit: 'unit', order: 3 }),
      variant('PDF-SCC-MS-35X10', 'Mourya Supreme 35 x 10 Black', 86, { Make: 'Mourya Supreme', Build: '35 x 10', Color: 'Black' }, { packing: 'Per unit', priceUnit: 'unit', order: 4 }),
      variant('PDF-SCC-MT-55X9', 'Mourya Turbo 55 x 9 Blue', 93, { Make: 'Mourya Turbo', Build: '55 x 9', Color: 'Blue' }, { packing: 'Per unit', priceUnit: 'unit', order: 5 }),
      variant('PDF-SCC-OP-4MM', 'Opilex 4 mm 35 x 11 Blue', 108, { Make: 'Opilex', Size: '4 mm', Build: '35 x 11', Color: 'Blue' }, { packing: 'Per unit', priceUnit: 'unit', order: 6 }),
      variant('PDF-SCC-OP-25', 'Actual 2.5 mm Opilex 36 x 11 Black', 102, { Make: 'Opilex', Size: '2.5 mm', Build: '36 x 11', Color: 'Black' }, { packing: 'Per unit', priceUnit: 'unit', order: 7 }),
      variant('PDF-SCC-FC-BLUE', 'Field Cab 55 x 10 Blue', 126, { Make: 'Field Cab', Build: '55 x 10', Color: 'Blue' }, { packing: 'Per unit', priceUnit: 'unit', order: 8 }),
      variant('PDF-SCC-FC-BLACK', 'Field Cab Printed 6 mm 55 x 10 Black', 123, { Make: 'Field Cab', Size: '6 mm', Build: '55 x 10', Color: 'Black' }, { packing: 'Per unit', priceUnit: 'unit', order: 9 }),
      variant('PDF-SCC-6MM-PREM', '6 mm Premium 83 x 9 Black', 155, { Make: 'Premium', Size: '6 mm', Build: '83 x 9', Color: 'Black' }, { packing: 'Per unit', priceUnit: 'unit', order: 10 }),
    ],
  },
  {
    name: 'PVC Column Pipes Green Valley',
    category: 'PVC Column Pipes Green Valley',
    brand: 'Green Valley',
    sku: 'PDF-PVC-GV',
    page: 4,
    shortDescription: 'Green Valley PVC column pipes with multiple weight options.',
    description: 'Catalogue-listed Green Valley PVC column pipes for submersible and irrigation applications.',
    tags: ['pvc column pipe', 'green valley', 'pipe'],
    specifications: [
      ['Brand', 'Green Valley'],
      ['Material', 'PVC'],
    ],
    variants: [
      variant('PDF-PVC-1-15', '1 inch - 15 Kg', 210, { Size: '1 inch', Weight: '15 Kg', Packing: '25' }, { packing: '25 pcs', priceUnit: 'piece', order: 0 }),
      variant('PDF-PVC-125-15', '1.25 inch - 15 Kg', 305, { Size: '1.25 inch', Weight: '15 Kg', Packing: '20' }, { packing: '20 pcs', priceUnit: 'piece', order: 1 }),
      variant('PDF-PVC-150-15', '1.5 inch - 15 Kg', 360, { Size: '1.5 inch', Weight: '15 Kg', Packing: '20' }, { packing: '20 pcs', priceUnit: 'piece', order: 2 }),
      variant('PDF-PVC-2-15', '2 inch - 15 Kg', 450, { Size: '2 inch', Weight: '15 Kg', Packing: '15' }, { packing: '15 pcs', priceUnit: 'piece', order: 3 }),
      variant('PDF-PVC-2-18', '2 inch - 18 Kg', 520, { Size: '2 inch', Weight: '18 Kg', Packing: '15' }, { packing: '15 pcs', priceUnit: 'piece', order: 4 }),
      variant('PDF-PVC-2-21', '2 inch - 21 Kg', 620, { Size: '2 inch', Weight: '21 Kg', Packing: '15' }, { packing: '15 pcs', priceUnit: 'piece', order: 5 }),
      variant('PDF-PVC-2-28', '2 inch - 28 Kg', 720, { Size: '2 inch', Weight: '28 Kg', Packing: '15' }, { packing: '15 pcs', priceUnit: 'piece', order: 6 }),
      variant('PDF-PVC-250-16', '2.5 inch - 16 Kg', 800, { Size: '2.5 inch', Weight: '16 Kg', Packing: '10' }, { packing: '10 pcs', priceUnit: 'piece', order: 7 }),
    ],
  },
  {
    name: 'Jhatka Machine',
    category: 'Jhatka Machine and fencing accessories',
    brand: '',
    sku: 'PDF-JHATKA-MACHINE',
    page: 5,
    shortDescription: 'Electric fencing jhatka machine range.',
    description: 'Catalogue-listed jhatka machine capacities for fencing systems.',
    tags: ['jhatka machine', 'fencing', 'electric fencing'],
    specifications: [
      ['Product Type', 'Jhatka Machine'],
    ],
    variants: [
      variant('PDF-JM-8KV', '8 KV', 1950, { Capacity: '8 KV' }, { packing: 'Per piece', priceUnit: 'piece', order: 0 }),
      variant('PDF-JM-12KV', '12 KV', 2150, { Capacity: '12 KV' }, { packing: 'Per piece', priceUnit: 'piece', order: 1 }),
      variant('PDF-JM-15KV', '15 KV', 2350, { Capacity: '15 KV' }, { packing: 'Per piece', priceUnit: 'piece', order: 2 }),
      variant('PDF-JM-18KV', '18 KV', 2550, { Capacity: '18 KV' }, { packing: 'Per piece', priceUnit: 'piece', order: 3 }),
    ],
  },
  {
    name: 'Battery 12 x 12',
    category: 'Jhatka Machine and fencing accessories',
    brand: '',
    sku: 'PDF-JM-BATTERY',
    page: 5,
    shortDescription: 'Battery for jhatka and fencing systems.',
    description: '12 x 12 battery from the fencing catalogue.',
    tags: ['battery', 'jhatka', 'fencing'],
    specifications: [
      ['Product Type', 'Battery'],
    ],
    variants: [
      variant('PDF-JM-BAT-12X12', 'Battery 12 x 12', 900, { Size: '12 x 12' }, { packing: 'Per piece', priceUnit: 'piece' }),
    ],
  },
  {
    name: 'White Insulator',
    category: 'Jhatka Machine and fencing accessories',
    brand: '',
    sku: 'PDF-JM-INSULATOR',
    page: 5,
    shortDescription: 'White insulator for fencing lines.',
    description: 'White insulator from the fencing accessories catalogue.',
    tags: ['insulator', 'fencing'],
    specifications: [
      ['Color', 'White'],
    ],
    variants: [
      variant('PDF-JM-INS-WHITE', 'White Insulator', 1.7, { Color: 'White' }, { packing: 'Per piece', priceUnit: 'piece' }),
    ],
  },
  {
    name: 'Solar Plate',
    category: 'Jhatka Machine and fencing accessories',
    brand: '',
    sku: 'PDF-JM-SOLAR',
    page: 5,
    shortDescription: 'Solar plate options for jhatka systems.',
    description: 'Solar plate variants from the fencing catalogue.',
    tags: ['solar plate', 'fencing', 'solar'],
    specifications: [
      ['Product Type', 'Solar Plate'],
    ],
    variants: [
      variant('PDF-JM-SP-20', '20 Watt', 1050, { Power: '20 Watt' }, { packing: 'Per piece', priceUnit: 'piece', order: 0 }),
      variant('PDF-JM-SP-30', '30 Watt', 1250, { Power: '30 Watt' }, { packing: 'Per piece', priceUnit: 'piece', order: 1 }),
      variant('PDF-JM-SP-40', '40 Watt', 1400, { Power: '40 Watt' }, { packing: 'Per piece', priceUnit: 'piece', order: 2 }),
    ],
  },
  {
    name: 'Jhatka Clutch Wire',
    category: 'Jhatka Machine and fencing accessories',
    brand: '',
    sku: 'PDF-JM-CLUTCH-WIRE',
    page: 5,
    shortDescription: 'Jhatka clutch wire spool.',
    description: '10 Kg / 1000 meter jhatka clutch wire from the fencing catalogue.',
    tags: ['clutch wire', 'jhatka', 'fencing wire'],
    specifications: [
      ['Length', '1000 meter'],
      ['Weight', '10 Kg'],
    ],
    variants: [
      variant('PDF-JM-CW-10KG', '10 Kg / 1000 meter', 1120, { Weight: '10 Kg', Length: '1000 meter' }, { packing: '1 spool', priceUnit: 'spool' }),
    ],
  },
  {
    name: 'Rassi',
    category: 'Jhatka Machine and fencing accessories',
    brand: '',
    sku: 'PDF-JM-RASSI',
    page: 5,
    shortDescription: 'Fencing rassi roll.',
    description: '600 meter rassi from the fencing catalogue.',
    tags: ['rassi', 'fencing'],
    specifications: [
      ['Length', '600 meter'],
    ],
    variants: [
      variant('PDF-JM-RASSI-600', '600 meter', 660, { Length: '600 meter' }, { packing: '1 roll', priceUnit: 'roll' }),
    ],
  },
  {
    name: 'FRP Fencing Stick',
    category: 'Jhatka Machine and fencing accessories',
    brand: '',
    sku: 'PDF-JM-FRP-STICK',
    page: 5,
    shortDescription: 'FRP fencing stick with 5 ft length.',
    description: 'FRP fencing stick variants with fixed 5 ft length.',
    tags: ['frp stick', 'fencing stick', 'fencing'],
    specifications: [
      ['Length', '5 ft'],
    ],
    variants: [
      variant('PDF-JM-FRP-12', '12 mm', 90, { Size: '12 mm', Length: '5 ft' }, { packing: 'Per piece', priceUnit: 'piece', order: 0 }),
      variant('PDF-JM-FRP-16', '16 mm', 120, { Size: '16 mm', Length: '5 ft' }, { packing: 'Per piece', priceUnit: 'piece', order: 1 }),
    ],
  },
  {
    name: 'GI Pipes',
    category: 'GI Pipes',
    brand: '',
    sku: 'PDF-GI-PIPES',
    page: 6,
    shortDescription: 'GI pipe range from Iskcon and Jindal.',
    description: 'GI pipes with size, length, weight, and brand variations from the catalogue.',
    tags: ['gi pipe', 'iskcon', 'jindal'],
    specifications: [
      ['Policy', 'Strictly No Credit Policy'],
    ],
    variants: [
      variant('PDF-GI-ISK-2-10', '2 inch / 10 ft / 10.7 Kg / Iskcon', 990, { Size: '2 inch', Length: '10 ft', Weight: '10.7 Kg', Brand: 'Iskcon' }, { packing: 'Per piece', priceUnit: 'piece', order: 0 }),
      variant('PDF-GI-ISK-2-5', '2 inch / 5 ft / 5.5 Kg / Iskcon', 600, { Size: '2 inch', Length: '5 ft', Weight: '5.5 Kg', Brand: 'Iskcon' }, { packing: 'Per piece', priceUnit: 'piece', order: 1 }),
      variant('PDF-GI-JIN-2-10', '2 inch / 10 ft / 12.8 Kg / Jindal', 1220, { Size: '2 inch', Length: '10 ft', Weight: '12.8 Kg', Brand: 'Jindal' }, { packing: 'Per piece', priceUnit: 'piece', order: 2 }),
      variant('PDF-GI-JIN-25-10', '2.5 inch / 10 ft / 16.0 Kg / Jindal', 1560, { Size: '2.5 inch', Length: '10 ft', Weight: '16.0 Kg', Brand: 'Jindal' }, { packing: 'Per piece', priceUnit: 'piece', order: 3 }),
    ],
  },
  {
    name: 'Column Adapter',
    category: 'Column Adapter',
    brand: '',
    sku: 'PDF-COLUMN-ADAPTER',
    page: 7,
    shortDescription: 'Column adapter for submersible column pipe.',
    description: 'Column adapter sizes and box quantities for submersible column pipe systems.',
    tags: ['column adapter', 'submersible'],
    specifications: [
      ['Use', 'For Submersible Column Pipe'],
    ],
    variants: [
      variant('PDF-CA-10', '1.0 inch', 155, { Size: '1.0 inch', 'Pieces per Box': '30' }, { packing: '30 pcs/box', priceUnit: 'piece', order: 0 }),
      variant('PDF-CA-125', '1.25 inch', 175, { Size: '1.25 inch', 'Pieces per Box': '25' }, { packing: '25 pcs/box', priceUnit: 'piece', order: 1 }),
      variant('PDF-CA-125X10', '1.25 x 1.0 inch', 195, { Size: '1.25 x 1.0 inch', 'Pieces per Box': '25' }, { packing: '25 pcs/box', priceUnit: 'piece', order: 2 }),
      variant('PDF-CA-15', '1.5 inch', 230, { Size: '1.5 inch', 'Pieces per Box': '20' }, { packing: '20 pcs/box', priceUnit: 'piece', order: 3 }),
      variant('PDF-CA-20', '2.0 inch', 330, { Size: '2.0 inch', 'Pieces per Box': '10' }, { packing: '10 pcs/box', priceUnit: 'piece', order: 4 }),
      variant('PDF-CA-20X15', '2.0 x 1.5 inch', 390, { Size: '2.0 x 1.5 inch', 'Pieces per Box': '10' }, { packing: '10 pcs/box', priceUnit: 'piece', order: 5 }),
      variant('PDF-CA-25', '2.5 inch', 490, { Size: '2.5 inch', 'Pieces per Box': '8' }, { packing: '8 pcs/box', priceUnit: 'piece', order: 6 }),
      variant('PDF-CA-25X20', '2.5 x 2.0 inch', 540, { Size: '2.5 x 2.0 inch', 'Pieces per Box': '10' }, { packing: '10 pcs/box', priceUnit: 'piece', order: 7 }),
    ],
  },
  {
    name: 'Harit Sprinkler Balwan',
    category: 'Harit Sprinkler Set',
    brand: 'Harit',
    sku: 'PDF-HARIT-BALWAN',
    page: 8,
    shortDescription: 'Balwan sprinkler head.',
    description: 'Harit Balwan sprinkler set from the catalogue.',
    tags: ['harit', 'sprinkler', 'balwan'],
    specifications: [
      ['Box Size', '50 pcs'],
    ],
    variants: [
      variant('PDF-HARIT-BALWAN-275', 'Balwan', 275, { BoxSize: '50 pcs' }, { packing: '50 pcs box', priceUnit: 'piece' }),
    ],
  },
  {
    name: 'Harit Sprinkler Garud',
    category: 'Harit Sprinkler Set',
    brand: 'Harit',
    sku: 'PDF-HARIT-GARUD',
    page: 8,
    shortDescription: 'Garud sprinkler head.',
    description: 'Harit Garud sprinkler set from the catalogue.',
    tags: ['harit', 'sprinkler', 'garud'],
    specifications: [
      ['Box Size', '50 pcs'],
    ],
    variants: [
      variant('PDF-HARIT-GARUD-212', 'Garud', 212, { BoxSize: '50 pcs' }, { packing: '50 pcs box', priceUnit: 'piece' }),
    ],
  },
  {
    name: 'Harit Sprinkler Narmada',
    category: 'Harit Sprinkler Set',
    brand: 'Harit',
    sku: 'PDF-HARIT-NARMADA',
    page: 8,
    shortDescription: 'Narmada sprinkler head.',
    description: 'Harit Narmada sprinkler set from the catalogue.',
    tags: ['harit', 'sprinkler', 'narmada'],
    specifications: [
      ['Box Size', '30 pcs'],
    ],
    variants: [
      variant('PDF-HARIT-NARMADA-420', 'Narmada', 420, { BoxSize: '30 pcs' }, { packing: '30 pcs box', priceUnit: 'piece' }),
    ],
  },
  {
    name: 'Harit Sprinkler Saaras',
    category: 'Harit Sprinkler Set',
    brand: 'Harit',
    sku: 'PDF-HARIT-SAARAS',
    page: 8,
    shortDescription: 'Saaras sprinkler head.',
    description: 'Harit Saaras sprinkler set from the catalogue.',
    tags: ['harit', 'sprinkler', 'saaras'],
    specifications: [
      ['Box Size', '100 pcs'],
    ],
    variants: [
      variant('PDF-HARIT-SAARAS-73', 'Saaras', 73, { BoxSize: '100 pcs' }, { packing: '100 pcs box', priceUnit: 'piece' }),
    ],
  },
  {
    name: 'Harit Sprinkler Saaras Brass Nut',
    category: 'Harit Sprinkler Set',
    brand: 'Harit',
    sku: 'PDF-HARIT-SAARAS-BN',
    page: 8,
    shortDescription: 'Saaras brass nut sprinkler head.',
    description: 'Harit Saaras Brass Nut sprinkler set from the catalogue.',
    tags: ['harit', 'sprinkler', 'saaras', 'brass nut'],
    specifications: [
      ['Box Size', '80 pcs'],
    ],
    variants: [
      variant('PDF-HARIT-SAARAS-BN-102', 'Saaras Brass Nut', 102, { BoxSize: '80 pcs' }, { packing: '80 pcs box', priceUnit: 'piece' }),
    ],
  },
  {
    name: 'Harit Raingun Set',
    category: 'Harit Sprinkler Set',
    brand: 'Harit',
    sku: 'PDF-HARIT-RAINGUN-SET',
    page: 8,
    shortDescription: 'Complete raingun set.',
    description: 'Harit raingun set sizes from the catalogue.',
    tags: ['harit', 'raingun', 'sprinkler'],
    specifications: [
      ['Product Type', 'Raingun Set'],
    ],
    variants: [
      variant('PDF-HARIT-RS-125', '1.25 inch Raingun Set', 3500, { Size: '1.25 inch' }, { packing: 'Per set', priceUnit: 'set', order: 0 }),
      variant('PDF-HARIT-RS-150', '1.5 inch Raingun Set', 5300, { Size: '1.5 inch' }, { packing: 'Per set', priceUnit: 'set', order: 1 }),
    ],
  },
  {
    name: 'Harit Raingun',
    category: 'Harit Sprinkler Set',
    brand: 'Harit',
    sku: 'PDF-HARIT-RAINGUN',
    page: 8,
    shortDescription: 'Standalone raingun options.',
    description: 'Harit raingun sizes from the catalogue.',
    tags: ['harit', 'raingun', 'sprinkler'],
    specifications: [
      ['Product Type', 'Raingun'],
    ],
    variants: [
      variant('PDF-HARIT-RG-1', '1 inch Raingun', 1450, { Size: '1 inch', BoxSize: '10 pcs' }, { packing: '10 pcs box', priceUnit: 'piece', order: 0 }),
      variant('PDF-HARIT-RG-125', '1.25 inch Raingun', 1970, { Size: '1.25 inch', BoxSize: '8 pcs' }, { packing: '8 pcs box', priceUnit: 'piece', order: 1 }),
      variant('PDF-HARIT-RG-150', '1.5 inch Raingun', 3400, { Size: '1.5 inch', BoxSize: '6 pcs' }, { packing: '6 pcs box', priceUnit: 'piece', order: 2 }),
    ],
  },
  {
    name: 'Service Cable',
    category: 'Service Cable 2 Core / 3 Core / 4 Core',
    brand: 'Mourya',
    sku: 'PDF-SERVICE-CABLE',
    page: 9,
    shortDescription: 'Mourya double coated service cable in 2 core, 3 core, and 4 core variants.',
    description: '500 meter Mourya double coated service cable catalogue with 2 core, 3 core, and 4 core options.',
    tags: ['service cable', 'mourya', '2 core', '3 core', '4 core'],
    specifications: [
      ['Make', 'Mourya'],
      ['Coating', 'Double Coated'],
      ['Length', '500 meter'],
    ],
    variants: [
      variant('PDF-SC-10X2-PREM', '2 Core - 10x2 Premium / 100 No.', 25, { Core: '2', Size: '10x2', Grade: 'Premium', Gauge: '100 No.' }, { packing: '500 meter coil', priceUnit: 'unit', order: 0 }),
      variant('PDF-SC-10X2-SUP', '2 Core - 10x2 Supreme / 110 No.', 35.5, { Core: '2', Size: '10x2', Grade: 'Supreme', Gauge: '110 No.' }, { packing: '500 meter coil', priceUnit: 'unit', order: 1 }),
      variant('PDF-SC-12X2-MOUR', '2 Core - 12x2 Mourya / 130 No.', 43, { Core: '2', Size: '12x2', Grade: 'Mourya', Gauge: '130 No.' }, { packing: '500 meter coil', priceUnit: 'unit', order: 2 }),
      variant('PDF-SC-10X3-PREM', '3 Core - 10x3 Premium / 105 No.', 39, { Core: '3', Size: '10x3', Grade: 'Premium', Gauge: '105 No.' }, { packing: '500 meter coil', priceUnit: 'unit', order: 3 }),
      variant('PDF-SC-10X3-SUP', '3 Core - 10x3 Supreme / 115 No.', 44, { Core: '3', Size: '10x3', Grade: 'Supreme', Gauge: '115 No.' }, { packing: '500 meter coil', priceUnit: 'unit', order: 4 }),
      variant('PDF-SC-12X3-MOUR', '3 Core - 12x3 Mourya / 130 No.', 62, { Core: '3', Size: '12x3', Grade: 'Mourya', Gauge: '130 No.' }, { packing: '500 meter coil', priceUnit: 'unit', order: 5 }),
      variant('PDF-SC-10X4-PREM', '4 Core - 10x4 Premium / 105 No.', 49, { Core: '4', Size: '10x4', Grade: 'Premium', Gauge: '105 No.' }, { packing: '500 meter coil', priceUnit: 'unit', order: 6 }),
      variant('PDF-SC-10X4-SUP', '4 Core - 10x4 Supreme / 115 No.', 55, { Core: '4', Size: '10x4', Grade: 'Supreme', Gauge: '115 No.' }, { packing: '500 meter coil', priceUnit: 'unit', order: 7 }),
      variant('PDF-SC-12X4-MOUR', '4 Core - 12x4 Mourya / 130 No.', 67.5, { Core: '4', Size: '12x4', Grade: 'Mourya', Gauge: '130 No.' }, { packing: '500 meter coil', priceUnit: 'unit', order: 8 }),
    ],
  },
  {
    name: 'Jointing Solution for Submersible Cable',
    category: 'Jointing Solution',
    brand: '',
    sku: 'PDF-JOINTING-SOLUTION',
    page: 10,
    shortDescription: 'Jointing consumables for submersible cable.',
    description: 'Submersible cable jointing solution items from the catalogue.',
    tags: ['jointing solution', 'submersible cable'],
    specifications: [
      ['Use', 'For Submersible Cable'],
    ],
    variants: [
      variant('PDF-JS-KR', 'Kachha Rubber', 7.2, { 'Box Qty': '1000 nos.' }, { packing: '1000 nos box', priceUnit: 'piece', order: 0 }),
      variant('PDF-JS-TAPE', 'Tape', 7.0, { 'Box Qty': '1000 nos.' }, { packing: '1000 nos box', priceUnit: 'piece', order: 1 }),
    ],
  },
  {
    name: 'Roll Pipe Green Valley HDPE',
    category: 'Roll Pipe Green Valley HDPE',
    brand: 'Green Valley',
    sku: 'PDF-ROLL-PIPE',
    page: 11,
    shortDescription: 'Green Valley submersible black and white HDPE roll pipe.',
    description: 'HDPE roll pipe bundle sizes and rates from the catalogue.',
    tags: ['roll pipe', 'hdpe', 'green valley'],
    specifications: [
      ['Type', 'Submersible Black & White HDPE Pipe'],
      ['Brand', 'Green Valley'],
    ],
    variants: [
      variant('PDF-RP-05', '0.5 inch', 125, { Size: '0.5 inch', Weight: '49-52 Kg', Length: '500 meter' }, { packing: '500 meter bundle', priceUnit: 'kg', order: 0 }),
      variant('PDF-RP-075', '0.75 inch', 125, { Size: '0.75 inch', Weight: '69-72 Kg', Length: '500 meter' }, { packing: '500 meter bundle', priceUnit: 'kg', order: 1 }),
      variant('PDF-RP-10-125', '1.0 inch / 500 meter / 125 rate', 125, { Size: '1.0 inch', Weight: '130-135 Kg', Length: '500 meter' }, { packing: '500 meter bundle', priceUnit: 'kg', order: 2 }),
      variant('PDF-RP-10-145', '1.0 inch / 500 meter / 145 rate', 145, { Size: '1.0 inch', Weight: '130-135 Kg', Length: '500 meter' }, { packing: '500 meter bundle', priceUnit: 'kg', order: 3 }),
      variant('PDF-RP-125', '1.25 inch', 145, { Size: '1.25 inch', Weight: '130-135 Kg', Length: '300 meter' }, { packing: '300 meter bundle', priceUnit: 'kg', order: 4 }),
      variant('PDF-RP-15', '1.5 inch', 145, { Size: '1.5 inch', Weight: '175-185 Kg', Length: '300 meter' }, { packing: '300 meter bundle', priceUnit: 'kg', order: 5 }),
      variant('PDF-RP-20', '2.0 inch', 145, { Size: '2.0 inch', Weight: '150-155 Kg', Length: '200 meter' }, { packing: '200 meter bundle', priceUnit: 'kg', order: 6 }),
    ],
  },
  {
    name: 'Starter Oil',
    category: 'Starter Oil / Oil Starter',
    brand: '',
    sku: 'PDF-STARTER-OIL',
    page: 12,
    shortDescription: 'Starter oil bottle sizes.',
    description: 'Starter oil bottle variants listed in the catalogue.',
    tags: ['starter oil', 'oil'],
    specifications: [
      ['Product Type', 'Starter Oil'],
    ],
    variants: [
      variant('PDF-SO-15-950', 'Oil 1.5 ltr / 950 gm (1200 ml)', 180, { Volume: '1200 ml', Weight: '950 gm' }, { packing: 'Per bottle', priceUnit: 'bottle', order: 0 }),
      variant('PDF-SO-15-1050', 'Oil 1.5 ltr / 1050 gm (1300 ml)', 195, { Volume: '1300 ml', Weight: '1050 gm' }, { packing: 'Per bottle', priceUnit: 'bottle', order: 1 }),
      variant('PDF-SO-15-1150', 'Oil 1.5 ltr / 1150 gm (1450 ml)', 210, { Volume: '1450 ml', Weight: '1150 gm' }, { packing: 'Per bottle', priceUnit: 'bottle', order: 2 }),
      variant('PDF-SO-1-700', 'Oil 1 ltr / 700 gm (800 ml)', 135, { Volume: '800 ml', Weight: '700 gm' }, { packing: 'Per bottle', priceUnit: 'bottle', order: 3 }),
    ],
  },
  {
    name: 'Bentex Oil Starter',
    category: 'Starter Oil / Oil Starter',
    brand: 'Bentex',
    sku: 'PDF-BENTEX-OIL-STARTER',
    page: 12,
    shortDescription: 'Bentex oil starter range.',
    description: 'Bentex oil starter models from the catalogue.',
    tags: ['bentex', 'oil starter'],
    specifications: [
      ['Brand', 'Bentex'],
    ],
    variants: [
      variant('PDF-BOS-SKBD15', 'SK-BD-15 / 7.5 HP', 1150, { Model: 'SK-BD-15', HP: '7.5' }, { packing: 'Per piece', priceUnit: 'piece', order: 0 }),
      variant('PDF-BOS-SKN', 'SKN / 7.5 HP', 1320, { Model: 'SKN', HP: '7.5' }, { packing: 'Per piece', priceUnit: 'piece', order: 1 }),
    ],
  },
  {
    name: 'Shivnath MCB Panel',
    category: 'Shivnath Control Panels',
    brand: 'Shivnath',
    sku: 'PDF-SHIV-MCB-PANEL',
    page: 13,
    shortDescription: 'MCB panel options by HP.',
    description: 'Shivnath MCB panel catalogue entries with running condenser, starting capacitor, and MCB range.',
    tags: ['shivnath', 'mcb panel', 'control panel'],
    specifications: [
      ['Brand', 'Shivnath'],
      ['Panel Type', 'MCB Panel'],
    ],
    variants: [
      variant('PDF-SHIV-MCB-1HP', '1 HP', 650, { HP: '1', 'Running Condenser': '50', 'Starting Capacitor': '120/150', 'MCB Range': '16' }, { packing: 'Per piece', priceUnit: 'piece', order: 0 }),
      variant('PDF-SHIV-MCB-15HP', '1.5 HP', 780, { HP: '1.5', 'Running Condenser': '36+36', 'Starting Capacitor': '150/200', 'MCB Range': '20' }, { packing: 'Per piece', priceUnit: 'piece', order: 1 }),
      variant('PDF-SHIV-MCB-2HP', '2 HP', 900, { HP: '2', 'Running Condenser': '36+50', 'Starting Capacitor': '200/250', 'MCB Range': '25' }, { packing: 'Per piece', priceUnit: 'piece', order: 2 }),
    ],
  },
  {
    name: 'Shivnath BCH Contactor With Digital Meter',
    category: 'Shivnath Control Panels',
    brand: 'Shivnath',
    sku: 'PDF-SHIV-BCH-DIGI',
    page: 13,
    shortDescription: 'BCH contactor with digital meter.',
    description: 'Shivnath BCH contactor with digital meter in multiple HP configurations.',
    tags: ['shivnath', 'bch contactor', 'digital meter'],
    specifications: [
      ['Brand', 'Shivnath'],
      ['Panel Type', 'BCH Contactor with Digital Meter'],
    ],
    variants: [
      variant('PDF-SHIV-BCH-1HP', '1 HP', 1150, { HP: '1', 'Running Condenser': '50', 'Starting Capacitor': '120/150', 'MCB Range': '16' }, { packing: 'Per piece', priceUnit: 'piece', order: 0 }),
      variant('PDF-SHIV-BCH-15HP', '1.5 HP', 1380, { HP: '1.5', 'Running Condenser': '36+36', 'Starting Capacitor': '150/200', 'MCB Range': '20' }, { packing: 'Per piece', priceUnit: 'piece', order: 1 }),
      variant('PDF-SHIV-BCH-2HP', '2 HP', 1500, { HP: '2', 'Running Condenser': '36+50', 'Starting Capacitor': '200/250', 'MCB Range': '25' }, { packing: 'Per piece', priceUnit: 'piece', order: 2 }),
    ],
  },
  {
    name: 'Shivnath Relay Contactor With Analog Meter',
    category: 'Shivnath Control Panels',
    brand: 'Shivnath',
    sku: 'PDF-SHIV-RELAY-ANALOG',
    page: 13,
    shortDescription: 'Relay contactor with analog meter.',
    description: 'Shivnath relay contactor with analog meter in multiple HP configurations.',
    tags: ['shivnath', 'relay contactor', 'analog meter'],
    specifications: [
      ['Brand', 'Shivnath'],
      ['Panel Type', 'Relay Contactor with Analog Meter'],
    ],
    variants: [
      variant('PDF-SHIV-RCA-1HP', '1 HP', 1250, { HP: '1', 'Running Condenser': '50', 'Starting Capacitor': '120/150', 'Relay Range': '9-14' }, { packing: 'Per piece', priceUnit: 'piece', order: 0 }),
      variant('PDF-SHIV-RCA-15HP', '1.5 HP', 1450, { HP: '1.5', 'Running Condenser': '36+36', 'Starting Capacitor': '120/150', 'Relay Range': '9-14' }, { packing: 'Per piece', priceUnit: 'piece', order: 1 }),
      variant('PDF-SHIV-RCA-2HP', '2 HP', 1580, { HP: '2', 'Running Condenser': '36+50', 'Starting Capacitor': '120/150', 'Relay Range': '13-21' }, { packing: 'Per piece', priceUnit: 'piece', order: 2 }),
    ],
  },
  {
    name: 'Aqua Golden Sub V-4 20 Feet Pump Sets',
    category: 'Aqua Golden Pump Sets',
    brand: 'Aqua Golden',
    sku: 'PDF-AQUA-GOLDEN',
    page: 14,
    shortDescription: 'Eco range sub V-4 20 feet pump sets.',
    description: 'Aqua Golden eco range for 5 inch (110 mm) bore, based on the 2026 catalogue.',
    tags: ['pump set', 'aqua golden', 'submersible'],
    specifications: [
      ['Series', 'Sub V-4 20 Feet Pump Sets'],
      ['Suitable Bore', '5 inch (110 mm)'],
      ['Phase', 'Catalogue contains S.P. and T.P. variants'],
    ],
    variants: [
      variant('PDF-AG-AQUA-05-10-SP', 'Aqua / 0.5 HP / 10 Stage / 1.25 inch / S.P.', 5800, { Model: 'Aqua', HP: '0.5', Stage: '10', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 0 }),
      variant('PDF-AG-AQUA-075-15-SP', 'Aqua / 0.75 HP / 15 Stage / 1.25 inch / S.P.', 6500, { Model: 'Aqua', HP: '0.75', Stage: '15', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 1 }),
      variant('PDF-AG-MP-075-10-SP', 'Mayur Pankh / 0.75 HP / 10 Stage / 1.25 inch / S.P.', 6000, { Model: 'Mayur Pankh', HP: '0.75', Stage: '10', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 2 }),
      variant('PDF-AG-MP-075-15-SP', 'Mayur Pankh / 0.75 HP / 15 Stage / 1.25 inch / S.P.', 6500, { Model: 'Mayur Pankh', HP: '0.75', Stage: '15', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 3 }),
      variant('PDF-AG-AG-1-10-SP', 'AquaGold / 1 HP Actual / 10 Stage / 1.25 inch / S.P.', 7200, { Model: 'AquaGold', HP: '1 Actual', Stage: '10', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 4 }),
      variant('PDF-AG-AG-1-15-SP', 'AquaGold / 1 HP Actual / 15 Stage / 1.25 inch / S.P.', 7400, { Model: 'AquaGold', HP: '1 Actual', Stage: '15', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 5 }),
      variant('PDF-AG-AQUA-1-20-SP', 'Aqua / 1 HP Actual / 20 Stage / 1.25 inch / S.P.', 7500, { Model: 'Aqua', HP: '1 Actual', Stage: '20', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 6 }),
      variant('PDF-AG-AQUA-15-8-SP', 'Aqua / 1.5 HP / 8 Stage / 2.00 inch / S.P.', 8500, { Model: 'Aqua', HP: '1.5', Stage: '8', Size: '2.00 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 7 }),
      variant('PDF-AG-AQUA-15-10-SP', 'Aqua / 1.5 HP / 10 Stage / 2.00 inch / S.P.', 8200, { Model: 'Aqua', HP: '1.5', Stage: '10', Size: '2.00 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 8 }),
      variant('PDF-AG-AQUA-15-10-TP', 'Aqua / 1.5 HP / 10 Stage / 2.00 inch / T.P.', 8800, { Model: 'Aqua', HP: '1.5', Stage: '10', Size: '2.00 inch', Phase: 'Three Phase' }, { packing: 'Per set', priceUnit: 'set', order: 9 }),
      variant('PDF-AG-AQUA-15-15-SP', 'Aqua / 1.5 HP / 15 Stage / 1.25 inch / S.P.', 8500, { Model: 'Aqua', HP: '1.5', Stage: '15', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 10 }),
      variant('PDF-AG-AQUA-15-20-SP', 'Aqua / 1.5 HP / 20 Stage / 1.25 inch / S.P.', 8500, { Model: 'Aqua', HP: '1.5', Stage: '20', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 11 }),
      variant('PDF-AG-AQUA-15-25-SP', 'Aqua / 1.5 HP / 25 Stage / 1.25 inch / S.P.', 9000, { Model: 'Aqua', HP: '1.5', Stage: '25', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 12 }),
      variant('PDF-AG-AQUA-2-10-SP', 'Aqua / 2 HP / 10 Stage / 2.00 inch / S.P.', 9800, { Model: 'Aqua', HP: '2', Stage: '10', Size: '2.00 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 13 }),
      variant('PDF-AG-AQUA-2-10-TP', 'Aqua / 2 HP / 10 Stage / 2.00 inch / T.P.', 10000, { Model: 'Aqua', HP: '2', Stage: '10', Size: '2.00 inch', Phase: 'Three Phase' }, { packing: 'Per set', priceUnit: 'set', order: 14 }),
      variant('PDF-AG-AQUA-2-15-SP', 'Aqua / 2 HP / 15 Stage / 1.50 inch / S.P.', 10000, { Model: 'Aqua', HP: '2', Stage: '15', Size: '1.50 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 15 }),
      variant('PDF-AG-AQUA-2-15-TP', 'Aqua / 2 HP / 15 Stage / 1.50 inch / T.P.', 10400, { Model: 'Aqua', HP: '2', Stage: '15', Size: '1.50 inch', Phase: 'Three Phase' }, { packing: 'Per set', priceUnit: 'set', order: 16 }),
      variant('PDF-AG-AQUA-2-25-SP', 'Aqua / 2 HP / 25 Stage / 1.25 inch / S.P.', 10500, { Model: 'Aqua', HP: '2', Stage: '25', Size: '1.25 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 17 }),
      variant('PDF-AG-AQUA-3-8-TP', 'Aqua / 3 HP / 8 Stage / 2.00 inch / T.P.', 11000, { Model: 'Aqua', HP: '3', Stage: '8', Size: '2.00 inch', Phase: 'Three Phase' }, { packing: 'Per set', priceUnit: 'set', order: 18 }),
      variant('PDF-AG-AQUA-3-10-TP', 'Aqua / 3 HP / 10 Stage / 2.00 inch / T.P.', 11500, { Model: 'Aqua', HP: '3', Stage: '10', Size: '2.00 inch', Phase: 'Three Phase' }, { packing: 'Per set', priceUnit: 'set', order: 19 }),
      variant('PDF-AG-AQUA-3-12-TP', 'Aqua / 3 HP / 12 Stage / 2.00 inch / T.P.', 11800, { Model: 'Aqua', HP: '3', Stage: '12', Size: '2.00 inch', Phase: 'Three Phase' }, { packing: 'Per set', priceUnit: 'set', order: 20 }),
      variant('PDF-AG-AQUA-3-15-TP', 'Aqua / 3 HP / 15 Stage / 2.00 inch / T.P.', 12000, { Model: 'Aqua', HP: '3', Stage: '15', Size: '2.00 inch', Phase: 'Three Phase' }, { packing: 'Per set', priceUnit: 'set', order: 21 }),
      variant('PDF-AG-AQUA-5-15-TP', 'Aqua / 5 HP / 15 Stage / 2.00 inch / T.P.', 15500, { Model: 'Aqua', HP: '5', Stage: '15', Size: '2.00 inch', Phase: 'Three Phase' }, { packing: 'Per set', priceUnit: 'set', order: 22 }),
    ],
  },
  {
    name: 'Mayur Pankh Sub V-6 30 Feet Pump Sets',
    category: 'Mayur Pankh Pump Sets',
    brand: 'Mayur Pankh',
    sku: 'PDF-MAYUR-PANKH',
    page: 15,
    shortDescription: 'Eco range Sub V-6 30 feet pump sets.',
    description: 'Mayur Pankh eco range for 6 inch (150 mm) bore, based on the 2026 catalogue.',
    tags: ['pump set', 'mayur pankh', 'submersible'],
    specifications: [
      ['Series', 'Sub V-6 30 Feet Pump Sets'],
      ['Suitable Bore', '6 inch (150 mm)'],
      ['Rate Type', 'Without GST'],
    ],
    variants: [
      variant('PDF-MP-3-3-65', '3 HP / 3 Stage / 65 MM Delivery', 13900, { HP: '3', Stage: '3', Delivery: '65 MM' }, { packing: 'Per set', priceUnit: 'set', order: 0 }),
      variant('PDF-MP-3-4-50', '3 HP / 4 Stage / 50 MM Delivery', 13600, { HP: '3', Stage: '4', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 1 }),
      variant('PDF-MP-3-5-50', '3 HP / 5 Stage / 50 MM Delivery', 14000, { HP: '3', Stage: '5', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 2 }),
      variant('PDF-MP-3-6-50', '3 HP / 6 Stage / 50 MM Delivery', 14500, { HP: '3', Stage: '6', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 3 }),
      variant('PDF-MP-3-8-50', '3 HP / 8 Stage / 50 MM Delivery', 15700, { HP: '3', Stage: '8', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 4 }),
      variant('PDF-MP-4-4-65', '4 HP / 4 Stage / 65 MM Delivery', 14700, { HP: '4', Stage: '4', Delivery: '65 MM' }, { packing: 'Per set', priceUnit: 'set', order: 5 }),
      variant('PDF-MP-5-4-65', '5 HP / 4 Stage / 65 MM Delivery', 15800, { HP: '5', Stage: '4', Delivery: '65 MM' }, { packing: 'Per set', priceUnit: 'set', order: 6 }),
      variant('PDF-MP-5-5-50', '5 HP / 5 Stage / 50 MM Delivery', 15600, { HP: '5', Stage: '5', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 7 }),
      variant('PDF-MP-5-5-65', '5 HP / 5 Stage / 65 MM Delivery', 17200, { HP: '5', Stage: '5', Delivery: '65 MM' }, { packing: 'Per set', priceUnit: 'set', order: 8 }),
      variant('PDF-MP-5-6-50', '5 HP / 6 Stage / 50 MM Delivery', 16200, { HP: '5', Stage: '6', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 9 }),
      variant('PDF-MP-5-8-50', '5 HP / 8 Stage / 50 MM Delivery', 16900, { HP: '5', Stage: '8', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 10 }),
      variant('PDF-MP-5-10-50', '5 HP / 10 Stage / 50 MM Delivery', 18400, { HP: '5', Stage: '10', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 11 }),
      variant('PDF-MP-6-6-65', '6 HP / 6 Stage / 65 MM Delivery', 18800, { HP: '6', Stage: '6', Delivery: '65 MM' }, { packing: 'Per set', priceUnit: 'set', order: 12 }),
      variant('PDF-MP-6-8-50', '6 HP / 8 Stage / 50 MM Delivery', 19000, { HP: '6', Stage: '8', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 13 }),
      variant('PDF-MP-75-8-65', '7.5 HP / 8 Stage / 65 MM Delivery', 22000, { HP: '7.5', Stage: '8', Delivery: '65 MM' }, { packing: 'Per set', priceUnit: 'set', order: 14 }),
      variant('PDF-MP-75-10-50', '7.5 HP / 10 Stage / 50 MM Delivery', 23000, { HP: '7.5', Stage: '10', Delivery: '50 MM' }, { packing: 'Per set', priceUnit: 'set', order: 15 }),
    ],
  },
  {
    name: 'Golden Sub V-3 13 Feet Pump Sets',
    category: 'Golden Pump Sets',
    brand: 'Golden',
    sku: 'PDF-GOLDEN-PUMP',
    page: 16,
    shortDescription: 'Golden eco range Sub V-3 13 feet pump sets.',
    description: 'Golden eco range for 3 inch (80 mm) bore, based on the 2026 catalogue.',
    tags: ['pump set', 'golden', 'submersible'],
    specifications: [
      ['Series', 'Sub V-3 13 Feet Pump Sets'],
      ['Suitable Bore', '3 inch (80 mm)'],
      ['Rate Type', 'Rate S.P.'],
    ],
    variants: [
      variant('PDF-GOLD-05-10', '0.5 HP / 10 Stage / 1 inch', 5400, { HP: '0.5', Stage: '10', Size: '1 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 0 }),
      variant('PDF-GOLD-1-10', '1 HP / 10 Stage / 1 inch', 6600, { HP: '1', Stage: '10', Size: '1 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 1 }),
      variant('PDF-GOLD-1-15', '1 HP / 15 Stage / 1 inch', 7000, { HP: '1', Stage: '15', Size: '1 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 2 }),
      variant('PDF-GOLD-1-20', '1 HP / 20 Stage / 1 inch', 7800, { HP: '1', Stage: '20', Size: '1 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 3 }),
      variant('PDF-GOLD-15-25', '1.5 HP / 25 Stage / 1 inch', 9500, { HP: '1.5', Stage: '25', Size: '1 inch', Phase: 'Single Phase' }, { packing: 'Per set', priceUnit: 'set', order: 4 }),
    ],
  },
];

function buildProduct(definition, companyId) {
  const image = pageImage(definition.page);
  const variants = definition.variants.map((item, index) => ({
    ...item,
    order: index,
  }));

  return {
    name: definition.name,
    nameHindi: '',
    description: definition.description,
    shortDescription: definition.shortDescription,
    category: definition.category,
    brand: definition.brand,
    subCategory: '',
    tags: definition.tags,
    mrp: variants[0].mrp,
    retailPrice: variants[0].retailPrice,
    wholesalePrice: variants[0].wholesalePrice,
    minWholesaleQuantity: 1,
    negotiationEnabled: true,
    sku: definition.sku,
    stock: variants.reduce((sum, item) => sum + (item.stock || 0), 0),
    lowStockThreshold: 5,
    trackInventory: false,
    images: image ? [image] : [],
    specifications: definition.specifications.map(([key, value]) => ({ key, value })),
    shippingTerms: SHIPPING_TERMS,
    status: 'active',
    isFeatured: featuredProductNames.has(definition.name),
    isHot: hotProductNames.has(definition.name),
    company: companyId,
    variants,
  };
}

async function upsertCategories() {
  for (let index = 0; index < categories.length; index += 1) {
    const name = categories[index];
    let category = await Category.findOne({ name });
    if (!category) {
      category = new Category({ name, slug: slug(name) });
    }
    const firstProduct = productDefinitions.find((item) => item.category === name);
    const imageUrl = firstProduct
      ? `${PUBLIC_BASE_URL}/uploads/catalog/catalog-page-${String(firstProduct.page).padStart(2, '0')}.png`
      : null;
    category.description = `${name} from the Ashirvad Marketing 2026 catalogue.`;
    category.isActive = true;
    category.order = index;
    category.image = {
      url: imageUrl,
      publicId: imageUrl ? `catalog-page-${String(firstProduct.page).padStart(2, '0')}` : null,
      blurHash: null,
    };
    await category.save();
  }
}

async function syncWebsiteSettings() {
  const websiteSettings = await WebsiteSettings.getSettings();
  websiteSettings.productCategories = categories.slice(0, 8).map((name, index) => {
    const relatedProducts = productDefinitions.filter((item) => item.category === name).slice(0, 4);
    return {
      name,
      description: `${name} from the Ashirvad Marketing 2026 catalogue.`,
      image: relatedProducts[0] ? `${PUBLIC_BASE_URL}/uploads/catalog/catalog-page-${String(relatedProducts[0].page).padStart(2, '0')}.png` : '',
      products: relatedProducts.map((item) => item.name),
      productDetails: relatedProducts.map((item) => ({
        name: item.name,
        shortDescription: item.shortDescription,
      })),
      isActive: true,
      order: index,
    };
  });

  websiteSettings.featuredProducts = [
    'Ideal Service Wire Aluminium',
    'PVC Column Pipes Green Valley',
    'Service Cable',
    'Aqua Golden Sub V-4 20 Feet Pump Sets',
  ].map((name, index) => {
    const product = productDefinitions.find((item) => item.name === name);
    const firstRate = product?.variants?.[0]?.retailPrice ?? '';
    return {
      name,
      price: firstRate ? `Rs. ${firstRate}` : '',
      image: product ? `${PUBLIC_BASE_URL}/uploads/catalog/catalog-page-${String(product.page).padStart(2, '0')}.png` : '',
      badge: index === 0 ? 'Catalogue 2026' : 'Featured',
      specs: (product?.specifications || []).slice(0, 3).map(([key, value]) => `${key}: ${value}`),
      shortDescription: product?.shortDescription || '',
      isActive: true,
      order: index,
    };
  });

  websiteSettings.categoriesSection = {
    eyebrow: 'CATALOGUE 2026',
    title: 'Ashirvad Marketing Product Categories',
    description: 'Real catalogue products imported from the Ashirvad Marketing C/O Laxmi Agro Enterprises PDF.',
    buttonText: 'View Products',
  };
  websiteSettings.featuredSection = {
    eyebrow: 'REAL PRODUCTS',
    title: 'Featured Catalogue Products',
    sideText: 'These products are imported directly from the current Ashirvad Marketing catalogue and are visible in the app, admin, and website.',
    buttonText: 'Get Quote',
  };

  await websiteSettings.save();
}

async function syncSettings() {
  const settings = await Settings.getSettings();
  settings.businessName = COMPANY_NAME;
  settings.businessPhone = '+91 9179110159';
  settings.businessEmail = 'ashirvadmarketing62@gmail.com';
  settings.businessAddress = 'Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.)';
  settings.defaultBulkMinQuantity = 1;
  settings.lowStockThreshold = 5;
  settings.socialLinks = {
    ...(settings.socialLinks || {}),
    whatsapp: '9179110159',
  };
  settings.checkout = {
    ...(settings.checkout || {}),
    mode: 'whatsapp',
    orderWhatsappNumber: '9179110159',
    requireLoginForCheckout: true,
    createOrderBeforeRedirect: true,
    allowNegotiationCheckout: true,
  };
  settings.heroBanners = [
    {
      title: 'Ashirvad Marketing 2026 Catalogue',
      subtitle: 'Service wire, cables, pipes, control panels, pump sets, and irrigation supplies.',
      tag: 'Imported From PDF',
      imageUrl: '',
      linkUrl: '/products',
      buttonText: 'View Products',
      buttonIcon: 'ArrowRight',
      isActive: true,
      order: 0,
    },
  ];
  settings.promoBanners = [
    {
      title: 'WhatsApp Order Flow Active',
      subtitle: 'Catalogue products are now available across admin, app, and website.',
      tag: 'Live Catalogue',
      imageUrl: '',
      linkUrl: '/products',
      buttonText: 'Browse Catalogue',
      buttonIcon: 'ArrowRight',
      isActive: true,
      order: 0,
    },
  ];
  await settings.save();
}

async function importCatalog() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    let company = await Company.findOne({ name: COMPANY_NAME });
    if (!company) {
      company = new Company({ name: COMPANY_NAME, slug: slug(COMPANY_NAME) });
    }
    company.description = COMPANY_DESCRIPTION;
    company.isActive = true;
    await company.save();

    await upsertCategories();

    await Product.deleteMany({
      $or: [
        { sku: { $in: sampleSkusToRemove } },
        { sku: /^PDF-/ },
      ],
    });

    for (const definition of productDefinitions) {
      const productData = buildProduct(definition, company._id);
      const product = new Product(productData);
      await product.save();
    }

    await Company.updateOne({ _id: company._id }, { $set: { productCount: productDefinitions.length } });
    for (const name of categories) {
      const productCount = await Product.countDocuments({ category: name, status: 'active' });
      await Category.updateOne({ name }, { $set: { productCount } });
    }

    await syncSettings();
    await syncWebsiteSettings();

    console.log(`Imported ${productDefinitions.length} real catalogue products from PDF.`);
  } catch (error) {
    console.error('Failed to import PDF catalogue:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

importCatalog();
