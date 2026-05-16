const featuredProductFallbackImage = 'https://placehold.co/800x800/f8fafc/94a3b8?text=Product';

const defaultFeaturedProducts = [
    {
        name: 'Oxon 67cc Petrol Chain Saw',
        price: 'Request Quote',
        image: 'https://images.unsplash.com/photo-1738965028578-e901ba424677?w=600&h=600&fit=crop&q=80',
        badge: 'Best Seller',
        specs: ['Bar Length: 22 inch', '2-Stroke Engine', '67cc Displacement'],
    },
    {
        name: 'Oxon 6W200 Combined Mill',
        price: 'Request Quote',
        image: 'https://images.unsplash.com/photo-1687709644237-ca3ef4127cc2?w=600&h=600&fit=crop&q=80',
        badge: 'New Arrival',
        specs: ['Combined Rice & Flour Mill', 'Capacity: 200-300 kg/hr'],
    },
    {
        name: 'Oxon Earth Auger 68cc',
        price: 'Request Quote',
        image: 'https://images.unsplash.com/photo-1738964847538-54f067b996cf?w=600&h=600&fit=crop&q=80',
        specs: ['68cc Engine', 'Heavy Duty Bit', 'Diameter: 12 inch'],
    },
    {
        name: 'Oxon 3-Inch Petrol Water Pump',
        price: 'Request Quote',
        image: 'https://images.pexels.com/photos/11116153/pexels-photo-11116153.jpeg?w=600&h=600&fit=crop',
        badge: 'High Performance',
        specs: ['3-Inch Discharge', '6.5 HP Engine', 'Portable Frame'],
    },
    {
        name: 'Oxon 350 Arc Welder',
        price: 'Request Quote',
        image: 'https://images.unsplash.com/photo-1727098730153-6408da60d89d?w=600&h=600&fit=crop&q=80',
        specs: ['350 Amp Output', 'Industrial Grade', 'Copper Winding'],
    },
];

function extractSpecs(product) {
    if (Array.isArray(product?.specs) && product.specs.length > 0) {
        return product.specs.map((spec) => String(spec || '').trim()).filter(Boolean);
    }

    const sourceText = String(product?.description || product?.shortDescription || '').trim();
    if (!sourceText) {
        return [];
    }

    return sourceText
        .split(/\r?\n|[|.]/)
        .map((item) => item.replace(/^[\s\-\u2022.]+/, '').trim())
        .filter(Boolean);
}

export function slugifyFeaturedProduct(product = {}) {
    const base = typeof product === 'string' ? product : product?.slug || product?.name || '';
    return encodeURIComponent(String(base).toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
}

export function normalizeFeaturedProduct(product, index = 0) {
    const specs = extractSpecs(product);

    const images = Array.isArray(product?.images)
        ? product.images.map((image) => String(image || '').trim()).filter(Boolean)
        : [];

    return {
        name: String(product?.name || `Product ${index + 1}`).trim(),
        price: String(product?.price || 'Request Quote').trim(),
        image: String(product?.image || images[0] || featuredProductFallbackImage).trim(),
        images,
        badge: String(product?.badge || '').trim(),
        badgeStyle: String(product?.badgeStyle || '').trim(),
        description: String(product?.description || '').trim(),
        shortDescription: String(product?.shortDescription || '').trim(),
        specs,
        slug: String(product?.slug || '').trim(),
    };
}

export function getFeaturedDescription(product) {
    if (product.description) {
        return product.description;
    }

    if (product.shortDescription) {
        return product.shortDescription;
    }

    if (product.specs.length > 0) {
        return product.specs.join('. ');
    }

    return `Get complete specifications, pricing, and dealer support for ${product.name}.`;
}

export function buildFeaturedProductInquiryProps(product) {
    return {
        productName: product.name,
        price: product.price,
        details: product.specs.slice(0, 4),
    };
}

export async function getFeaturedProducts() {
    const rawBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.API_BASE_URL ||
        process.env.NEXT_PUBLIC_WEBSITE_API_BASE_URL ||
        'https://veepee-backend.vercel.app/api/v1';
    const apiBase = rawBase.replace(/\/+$/, '');

    try {
        const response = await fetch(`${apiBase}/settings/website-content`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return defaultFeaturedProducts.map((product, index) => normalizeFeaturedProduct(product, index));
        }

        const json = await response.json();
        const source = Array.isArray(json?.data?.featuredProducts) && json.data.featuredProducts.length > 0
            ? json.data.featuredProducts
            : defaultFeaturedProducts;

        return source.map((product, index) => normalizeFeaturedProduct(product, index));
    } catch {
        return defaultFeaturedProducts.map((product, index) => normalizeFeaturedProduct(product, index));
    }
}

export function findFeaturedProductBySlug(products, slug) {
    return products.find((product) => slugifyFeaturedProduct(product) === slug);
}

export { defaultFeaturedProducts, featuredProductFallbackImage };
