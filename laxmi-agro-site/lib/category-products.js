import { getApiBaseUrl } from '@/lib/api-base';
import { normalizeWebsiteImageUrl } from '@/lib/media-url';

const productCardFallbackImage = 'https://placehold.co/800x520/f3f4f6/94a3b8?text=Product';

const defaultProductCategories = [
    {
        name: 'Rice Mills & Mini Rice Mills',
        description: 'High-capacity grain processing machines for commercial and local processing needs.',
        image: 'https://images.unsplash.com/photo-1687709644237-ca3ef4127cc2?w=600&h=400&fit=crop&q=80',
        products: ['6W200 Combined Mill', '6N40 Mini Rice Mill', 'Rice Mill with Petrol Engine'],
    },
    {
        name: 'Brush Cutters & Trimmers',
        description: 'Professional vegetation control with side pack and backpack options.',
        image: 'https://images.unsplash.com/photo-1635329864278-ebf9947f6745?w=600&h=400&fit=crop&q=80',
        products: ['52cc Side Pack', '35cc Brush Cutter', '31cc Backpack'],
    },
    {
        name: 'Welding Machines',
        description: 'Industrial-grade arc welding machines ensuring strong and durable joints.',
        image: 'https://images.unsplash.com/photo-1502450529557-4509ae211488?w=600&h=400&fit=crop&q=80',
        products: ['350 Arc Welder', '250 Arc Welder', '200 Arc Welder'],
    },
    {
        name: 'Air Compressors',
        description: 'High-performance oil-free electric air compressors for workshops and factories.',
        image: 'https://images.pexels.com/photos/31257317/pexels-photo-31257317.jpeg?w=600&h=400&fit=crop',
        products: ['50L Oil Free', '30L - 1 HP', 'Compressor Oil'],
    },
    {
        name: 'Water Pumps',
        description: 'Petrol and electric water pumps for reliable agricultural and industrial use.',
        image: 'https://images.pexels.com/photos/34935520/pexels-photo-34935520.jpeg?w=600&h=400&fit=crop',
        products: ['3-Inch Petrol Pump', '2-Inch Petrol Pump', '1.5 Inch Water Pump'],
    },
    {
        name: 'Construction Power Tools',
        description: 'Essential tools for construction including cutters, grinders, and vibrators.',
        image: 'https://images.unsplash.com/photo-1540655037529-adec98fb635e?w=600&h=400&fit=crop&q=80',
        products: ['Marble Cutter Machine', 'Angle Grinder', 'Needle Vibrator', 'Drill Machines', 'Paint Mixers'],
    },
    {
        name: 'Power Weeders & Tillers',
        description: 'Efficient soil cultivation and weed control machines for optimal farming.',
        image: 'https://images.unsplash.com/photo-1592397126868-ed477d7f7fa2?w=600&h=400&fit=crop&q=80',
        products: ['Power Weeder', 'Mini Tiller', 'Cultivator'],
    },
    {
        name: 'Sprayers & Washers',
        description: 'Versatile equipment for agricultural spraying and high-pressure cleaning.',
        image: 'https://images.unsplash.com/photo-1622383563227-0440114a8721?w=600&h=400&fit=crop&q=80',
        products: ['Agricultural Sprayer', 'High Pressure Washer', 'Blower Machine'],
    },
    {
        name: 'Chainsaws & Forestry',
        description: 'Powerful petrol chainsaws for tree felling and wood processing.',
        image: 'https://images.unsplash.com/photo-1589379895082-f5f84ce2729a?w=600&h=400&fit=crop&q=80',
        products: ['Petrol Chain Saw', 'Tree Cutting Saw', 'Forestry Tools'],
    },
    {
        name: 'Earth Augers',
        description: 'Heavy-duty earth augers for drilling precise holes for fencing and planting.',
        image: 'https://images.unsplash.com/photo-1558434778-9e1e2d142177?w=600&h=400&fit=crop&q=80',
        products: ['Earth Auger', 'Post Hole Digger', 'Soil Drill'],
    },
];

export function slugifyCategoryName(name = '') {
    return encodeURIComponent(String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
}

export function slugifyProductName(product = {}) {
    const explicitSlug = String(product?.slug || '').trim();
    if (explicitSlug) {
        return slugifyCategoryName(explicitSlug);
    }

    return slugifyCategoryName(product?.name || '');
}

export function normalizeCategoryProduct(product, index) {
    if (typeof product === 'string') {
        return {
            name: product.trim(),
            shortDescription: '',
            description: '',
            image: '',
            images: [],
            slug: '',
            productId: '',
            sku: '',
            stock: 0,
            retailPrice: 0,
            wholesalePrice: 0,
            mrp: 0,
            variants: [],
            order: index,
        };
    }

    const images = Array.isArray(product?.images)
        ? product.images.map((image) => String(image || '').trim()).filter(Boolean)
        : [];

    return {
        name: String(product?.name || '').trim(),
        shortDescription: String(product?.shortDescription || '').trim(),
        description: String(product?.description || '').trim(),
        image: String(product?.image || images[0] || '').trim(),
        images,
        slug: String(product?.slug || '').trim(),
        productId: String(product?.productId || '').trim(),
        sku: String(product?.sku || '').trim(),
        stock: Number(product?.stock) || 0,
        retailPrice: Number(product?.retailPrice) || 0,
        wholesalePrice: Number(product?.wholesalePrice) || 0,
        mrp: Number(product?.mrp) || 0,
        variants: normalizeProductVariants(product?.variants || []),
        order: Number.isFinite(product?.order) ? product.order : index,
    };
}

export function normalizeProductVariants(variants = []) {
    if (!Array.isArray(variants)) return [];

    return variants
        .map((variant, index) => ({
            id: String(variant?.id || variant?._id || '').trim(),
            name: String(variant?.name || '').trim(),
            displayName: String(variant?.displayName || variant?.name || '').trim(),
            sku: String(variant?.sku || '').trim(),
            attributes: Array.isArray(variant?.attributes)
                ? variant.attributes
                    .map((attribute) => ({
                        key: String(attribute?.key || '').trim(),
                        value: String(attribute?.value || '').trim(),
                    }))
                    .filter((attribute) => attribute.key && attribute.value)
                : [],
            mrp: Number(variant?.mrp) || 0,
            retailPrice: Number(variant?.retailPrice) || 0,
            wholesalePrice: Number(variant?.wholesalePrice) || 0,
            stock: Number(variant?.stock) || 0,
            minOrderQuantity: Number(variant?.minOrderQuantity) || 1,
            priceUnit: String(variant?.priceUnit || '').trim(),
            packing: String(variant?.packing || '').trim(),
            isActive: variant?.isActive !== false,
            order: Number.isFinite(variant?.order) ? variant.order : index,
        }))
        .filter((variant) => (variant.name || variant.sku) && variant.isActive)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getVariantSummary(product = {}) {
    const variants = normalizeProductVariants(product?.variants || []);
    if (variants.length === 0) return null;

    const prices = variants
        .map((variant) => variant.retailPrice || variant.wholesalePrice || variant.mrp)
        .filter((price) => price > 0);
    const fromPrice = prices.length > 0 ? Math.min(...prices) : 0;

    return {
        count: variants.length,
        fromPrice,
        labels: variants.slice(0, 3).map((variant) => variant.name),
    };
}

export function getCategoryProducts(category) {
    const productDetails = Array.isArray(category?.productDetails)
        ? category.productDetails.map((product, index) => normalizeCategoryProduct(product, index)).filter((product) => product.name)
        : [];

    if (productDetails.length > 0) {
        return productDetails.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return Array.isArray(category?.products)
        ? category.products.map((product, index) => normalizeCategoryProduct(product, index)).filter((product) => product.name)
        : [];
}

export function formatPrice(value) {
    if (!Number.isFinite(value) || value <= 0) {
        return '';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

export function buildProductInquiryDetails(product) {
    const details = [];

    if (product.shortDescription) {
        details.push(product.shortDescription);
    } else if (product.description) {
        details.push(product.description);
    }

    if (product.sku) {
        details.push(`SKU: ${product.sku}`);
    }

    if (product.stock > 0) {
        details.push(`Stock: ${product.stock}`);
    }

    if (Array.isArray(product.variants) && product.variants.length > 0) {
        details.push(`${product.variants.length} variants available`);
    }

    return details;
}

export function getProductHighlights(product) {
    const baseText = product.shortDescription || product.description || '';

    return baseText
        .split(/\r?\n|[|.]/)
        .map((item) => item.replace(/^[\s\-\u2022.]+/, '').trim())
        .filter(Boolean)
        .slice(0, 4);
}

export async function getCategories() {
    const apiBase = getApiBaseUrl();

    try {
        const response = await fetch(`${apiBase}/settings/website-content`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return defaultProductCategories;
        }

        const json = await response.json();
        const productCategories = Array.isArray(json?.data?.productCategories) && json.data.productCategories.length > 0
            ? json.data.productCategories
            : defaultProductCategories;

        return productCategories.map((category) => ({
            ...category,
            image: normalizeWebsiteImageUrl(category?.image),
            productDetails: Array.isArray(category?.productDetails)
                ? category.productDetails.map((product) => ({
                    ...product,
                    image: normalizeWebsiteImageUrl(product?.image),
                    images: Array.isArray(product?.images) ? product.images.map(normalizeWebsiteImageUrl) : product?.images,
                }))
                : category?.productDetails,
        }));
    } catch {
        return defaultProductCategories;
    }
}

export function findCategoryBySlug(categories, slug) {
    return categories.find((category) => slugifyCategoryName(category.name) === slug);
}

export function findProductBySlug(category, productSlug) {
    return getCategoryProducts(category).find((product) => slugifyProductName(product) === productSlug);
}

export { defaultProductCategories, productCardFallbackImage };
