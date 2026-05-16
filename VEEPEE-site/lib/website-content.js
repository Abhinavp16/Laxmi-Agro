import {
    defaultFeaturedProducts,
    normalizeFeaturedProduct,
} from '@/lib/featured-products';

const defaultHeroImages = [
    '/images/Banner/1.jpg',
    '/images/Banner/2.jpg',
    '/images/Banner/3.jpg',
    '/images/Banner/4.jpg',
    '/images/Banner/5.jpg',
];

const defaultProductCategories = [
    {
        name: 'Rice Mill Machinery',
        description: 'Commercial & Domestic Units',
        image: 'https://images.unsplash.com/photo-1687709644237-ca3ef4127cc2?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/1.jpg',
    },
    {
        name: 'Brush Cutters',
        description: 'Backpack & Side Pack Models',
        image: '/images/products/brush cutter.webp',
        fallback: '/images/products/brush cutter.webp',
    },
    {
        name: 'Water Pumps',
        description: 'Petrol & Electric Pumps',
        image: 'https://images.pexels.com/photos/34935520/pexels-photo-34935520.jpeg?w=1200&h=800&fit=crop',
        fallback: '/images/Banner/3.jpg',
    },
    {
        name: 'Welding Machines',
        description: 'Arc & MIG Welders',
        image: 'https://images.unsplash.com/photo-1759847552281-60e45956124d?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/4.jpg',
    },
    {
        name: 'Air Compressors',
        description: 'Oil-Free & Industrial',
        image: 'https://images.pexels.com/photos/31257317/pexels-photo-31257317.jpeg?w=1200&h=800&fit=crop',
        fallback: '/images/Banner/5.jpg',
    },
    {
        name: 'Power Tools',
        description: 'Drills, Grinders & More',
        image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/1.jpg',
    },
];

const defaultCategoriesSection = {
    eyebrow: 'PRODUCT CATEGORIES',
    title: 'Our Expertise Areas',
    description: 'Explore our core machinery categories for agriculture, fabrication, irrigation, and workshop use.',
    buttonText: 'View Products',
};

const defaultFeaturedSection = {
    eyebrow: 'PRECISION ENGINEERING',
    title: 'Our Popular Products',
    sideText: 'Genuine Oxon products engineered for durability, performance, and maximum ROI.',
    buttonText: 'Get Quote',
};

export async function getWebsiteContent() {
    const rawBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.API_BASE_URL ||
        process.env.NEXT_PUBLIC_WEBSITE_API_BASE_URL ||
        'https://veepee-backend.vercel.app/api/v1';
    const apiBase = rawBase.replace(/\/+$/, '');

    try {
        const response = await fetch(`${apiBase}/settings/website-content`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load website content: ${response.status}`);
        }

        const json = await response.json();
        const heroImages = Array.isArray(json?.data?.heroCards) && json.data.heroCards.length > 0
            ? json.data.heroCards.map((card, index) => card?.image || defaultHeroImages[index]).filter(Boolean)
            : defaultHeroImages;
        const featuredProducts = (Array.isArray(json?.data?.featuredProducts) && json.data.featuredProducts.length > 0
            ? json.data.featuredProducts
            : defaultFeaturedProducts).map((product, index) => normalizeFeaturedProduct(product, index));
        const productCategories = Array.isArray(json?.data?.productCategories) && json.data.productCategories.length > 0
            ? json.data.productCategories.map((category, index) => ({
                name: category?.name || defaultProductCategories[index]?.name || '',
                description: category?.description || '',
                image: category?.image || defaultProductCategories[index]?.image || defaultHeroImages[0],
                fallback: category?.image || defaultProductCategories[index]?.fallback || defaultHeroImages[0],
            }))
            : defaultProductCategories;
        const featuredSection = json?.data?.featuredSection
            ? { ...defaultFeaturedSection, ...json.data.featuredSection }
            : defaultFeaturedSection;
        const categoriesSection = json?.data?.categoriesSection
            ? { ...defaultCategoriesSection, ...json.data.categoriesSection }
            : defaultCategoriesSection;

        return {
            heroImages,
            featuredProducts,
            productCategories,
            featuredSection,
            categoriesSection,
        };
    } catch (error) {
        console.error('Error fetching website content:', error);
        return {
            heroImages: defaultHeroImages,
            featuredProducts: defaultFeaturedProducts.map((product, index) => normalizeFeaturedProduct(product, index)),
            productCategories: defaultProductCategories,
            featuredSection: defaultFeaturedSection,
            categoriesSection: defaultCategoriesSection,
        };
    }
}
