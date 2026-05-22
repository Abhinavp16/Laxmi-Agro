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
        name: 'Service Wire',
        description: 'Aluminium service cable and allied electrical line products',
        image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/1.jpg',
    },
    {
        name: 'Submersible Cable',
        description: 'Copper cable, 3 layer cable, and jointing solutions',
        image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/2.jpg',
    },
    {
        name: 'PVC Column Pipes',
        description: 'Column pipes, roll pipe, and bore fittings',
        image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/3.jpg',
    },
    {
        name: 'GI Pipes',
        description: 'Dependable piping supply for irrigation and installation work',
        image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/4.jpg',
    },
    {
        name: 'Pump & Irrigation',
        description: 'Sprinkler sets, pump sets, control panels, and starter oil',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/5.jpg',
    },
    {
        name: 'Workshop & Utility',
        description: 'Jhatka machines, column adopters, and allied utility products',
        image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/1.jpg',
    },
];

const defaultCategoriesSection = {
    eyebrow: 'PRODUCT CATEGORIES',
    title: 'Our Expertise Areas',
    description: 'Explore practical categories covering service wire, submersible cable, pipes, irrigation systems, pumps, and utility products.',
    buttonText: 'View Products',
};

const defaultFeaturedSection = {
    eyebrow: 'PRECISION ENGINEERING',
    title: 'Our Popular Products',
    sideText: 'Featured agriculture supply products selected from the current Laxmi Agro catalogue.',
    buttonText: 'Get Quote',
};

export async function getWebsiteContent() {
    const rawBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.API_BASE_URL ||
        process.env.NEXT_PUBLIC_WEBSITE_API_BASE_URL ||
        'http://localhost:5000/api/v1';
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
