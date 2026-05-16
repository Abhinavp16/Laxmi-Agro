import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';
import FeaturedProductCard from '@/components/products/FeaturedProductCard';
import {
    defaultFeaturedProducts as sharedDefaultFeaturedProducts,
    normalizeFeaturedProduct,
} from '@/lib/featured-products';

export const metadata = {
    title: 'Products - Veepee Impex',
    description: 'Browse our complete range of Oxon agricultural machinery, power tools, pumps, welding equipment, and more. Pan India distribution and best wholesale prices.',
};

const defaultProductCategories = [
    {
        name: 'Rice Mills & Mini Rice Mills',
        description: 'High-capacity grain processing machines including Oxon 6N40 and 6W200 models.',
        image: 'https://images.unsplash.com/photo-1687709644237-ca3ef4127cc2?w=600&h=400&fit=crop&q=80',
        products: ['Oxon 6W200 Combined Mill', 'Oxon 6N40 Mini Rice Mill', 'Rice Mill with Petrol Engine'],
    },
    {
        name: 'Brush Cutters & Trimmers',
        description: 'Professional vegetation control with side pack and backpack options.',
        image: 'https://images.unsplash.com/photo-1635329864278-ebf9947f6745?w=600&h=400&fit=crop&q=80',
        products: ['Oxon 52cc Side Pack', 'Oxon 35cc Brush Cutter', 'Oxon 31cc Backpack'],
    },
    {
        name: 'Welding Machines',
        description: 'Industrial-grade arc welding machines ensuring strong and durable joints.',
        image: 'https://images.unsplash.com/photo-1502450529557-4509ae211488?w=600&h=400&fit=crop&q=80',
        products: ['Oxon 350 Arc Welder', 'Oxon 250 Arc Welder', 'Oxon 200 Arc Welder'],
    },
    {
        name: 'Air Compressors',
        description: 'High-performance oil-free electric air compressors for workshops and factories.',
        image: 'https://images.pexels.com/photos/31257317/pexels-photo-31257317.jpeg?w=600&h=400&fit=crop',
        products: ['Oxon 50L Oil Free', 'Oxon 30L - 1 HP', 'Compressor Oil'],
    },
    {
        name: 'Water Pumps',
        description: 'Petrol and electric water pumps for reliable agricultural and industrial use.',
        image: 'https://images.pexels.com/photos/34935520/pexels-photo-34935520.jpeg?w=600&h=400&fit=crop',
        products: ['Oxon 3-Inch Petrol Pump', 'Oxon 2-Inch Petrol Pump', '1.5 Inch Water Pump'],
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
        products: ['Oxon Petrol Chain Saw', 'Tree Cutting Saw', 'Forestry Tools'],
    },
    {
        name: 'Earth Augers',
        description: 'Heavy-duty earth augers for drilling precise holes for fencing and planting.',
        image: 'https://images.unsplash.com/photo-1558434778-9e1e2d142177?w=600&h=400&fit=crop&q=80',
        products: ['Oxon Earth Auger', 'Post Hole Digger', 'Soil Drill'],
    },
];

const defaultFeaturedProducts = [
    {
        name: 'Oxon 67cc Petrol Chain Saw',
        price: '₹ 7,500/Piece',
        image: 'https://images.unsplash.com/photo-1738965028578-e901ba424677?w=400&h=400&fit=crop&q=80',
        badge: 'Best Seller',
        specs: ['Bar Length: 22 inch', '2-Stroke Engine', '67cc Displacement'],
    },
    {
        name: 'Oxon 6W200 Combined Mill',
        price: '₹ 28,000/Piece',
        image: 'https://images.unsplash.com/photo-1687709644237-ca3ef4127cc2?w=400&h=400&fit=crop&q=80',
        specs: ['Capacity: 200-300 kg/hr', 'Combined Rice & Flour'],
    },
    {
        name: 'Oxon 350 Arc Welder',
        price: '₹ 6,400/Piece',
        image: 'https://images.unsplash.com/photo-1727098730153-6408da60d89d?w=400&h=400&fit=crop&q=80',
        specs: ['Output: 350 Amp', 'Copper Winding'],
    },
    {
        name: 'Oxon Earth Auger 68cc',
        price: '₹ 9,500/Piece',
        image: 'https://images.unsplash.com/photo-1738964847538-54f067b996cf?w=400&h=400&fit=crop&q=80',
        specs: ['Diameter: 12 inch', 'Gas Powered'],
    },
    {
        name: 'Oxon 3-Inch Water Pump',
        price: '₹ 14,200/Piece',
        image: 'https://images.pexels.com/photos/11116153/pexels-photo-11116153.jpeg?w=400&h=400&fit=crop',
        badge: 'Bulk Only',
        badgeStyle: 'bg-brand-primary text-white',
        specs: ['Power: 6.5 HP', '3-Inch Discharge'],
    },
    {
        name: 'Oxon 2HP Induction Motor',
        price: '₹ 8,900/Piece',
        image: 'https://images.unsplash.com/photo-1651530065437-9d961dc5e8d9?w=400&h=400&fit=crop&q=80',
        specs: ['Single Phase / 100% Copper', 'ISI Certified'],
    },
];

const defaultCategoriesSection = {
    eyebrow: 'Product Categories',
    title: 'The Heart of Modern Farming',
    description: 'Our diverse range of agriculture and industrial machines stands at the core of modern farming practices. Each piece of equipment is designed with utmost precision.',
    buttonText: 'View All products',
};

const defaultFeaturedSection = {
    eyebrow: 'Precision Engineering',
    title: 'Our Popular Product',
    sideText: 'Genuine Oxon products engineered for durability, performance, and maximum ROI.',
    buttonText: 'Get Quote',
};

const categoryCardFallbackImage = 'https://placehold.co/800x500/e5e7eb/94a3b8?text=Category';

function slugifyCategoryName(name = '') {
    return encodeURIComponent(String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
}

function normalizeCategoryProduct(product, index) {
    if (typeof product === 'string') {
        return {
            name: product.trim(),
            shortDescription: '',
            description: '',
            image: '',
            images: [],
            slug: '',
            productId: '',
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
        order: Number.isFinite(product?.order) ? product.order : index,
    };
}

function getCategoryProducts(category) {
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

async function getWebsiteContent() {
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
            return {
                productCategories: defaultProductCategories,
                featuredProducts: sharedDefaultFeaturedProducts.map((product, index) => normalizeFeaturedProduct(product, index)),
                categoriesSection: defaultCategoriesSection,
                featuredSection: defaultFeaturedSection,
            };
        }

        const json = await response.json();
        const productCategories = Array.isArray(json?.data?.productCategories) && json.data.productCategories.length > 0
            ? json.data.productCategories
            : defaultProductCategories;
        const featuredProducts = (Array.isArray(json?.data?.featuredProducts) && json.data.featuredProducts.length > 0
            ? json.data.featuredProducts
            : sharedDefaultFeaturedProducts).map((product, index) => normalizeFeaturedProduct(product, index));
        const categoriesSection = json?.data?.categoriesSection
            ? { ...defaultCategoriesSection, ...json.data.categoriesSection }
            : defaultCategoriesSection;
        const featuredSection = json?.data?.featuredSection
            ? { ...defaultFeaturedSection, ...json.data.featuredSection }
            : defaultFeaturedSection;

        return { productCategories, featuredProducts, categoriesSection, featuredSection };
    } catch {
        return {
            productCategories: defaultProductCategories,
            featuredProducts: sharedDefaultFeaturedProducts.map((product, index) => normalizeFeaturedProduct(product, index)),
            categoriesSection: defaultCategoriesSection,
            featuredSection: defaultFeaturedSection,
        };
    }
}

export default async function ProductsPage() {
    const { productCategories, featuredProducts, categoriesSection, featuredSection } = await getWebsiteContent();
    return (
        <div className="page-transition">
            <PageHero
                title="Our Products"
                subtitle="Genuine Oxon™ machinery engineered for durability, performance, and maximum ROI. Pan India distribution with competitive wholesale pricing."
                breadcrumbItems={['Products']}
            />

            {/* Brands Navbar */}
            <section className="px-6 pt-10">
                <ScrollReveal className="max-w-7xl mx-auto">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm overflow-x-auto custom-scrollbar">
                        <div className="flex w-max min-w-full items-center justify-start md:justify-center gap-8 md:gap-12 lg:gap-16 px-2">
                            <div className="flex items-center justify-center transition-all h-10 md:h-12 w-auto shrink-0">
                                <img src="/images/oxon.jpeg" alt="OXON™" className="h-full object-contain" />
                            </div>
                            <div className="flex items-center justify-center transition-all h-10 md:h-12 w-auto shrink-0">
                                <img src="/images/ecotech.jpeg" alt="Ecotech" className="h-full object-contain" />
                            </div>
                            <div className="flex items-center justify-center transition-all h-10 md:h-12 w-auto shrink-0">
                                <img src="/images/kargill.jpeg" alt="Kargill" className="h-full object-contain" />
                            </div>
                            <div className="flex items-center gap-3 transition-all shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                <span className="text-xl font-bold text-gray-700">AgriPlus</span>
                            </div>
                            <div className="flex items-center gap-3 transition-all shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.77 10-10 10Z" />
                                    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
                                </svg>
                                <span className="text-xl font-bold text-gray-700">V-Flow</span>
                            </div>
                            <div className="flex items-center gap-3 transition-all shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                </svg>
                                <span className="text-xl font-bold text-gray-700">HeavyDuty</span>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            {/* Product Categories Grid - Like HeavyTech's category layout */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-16">
                    <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">
                        {categoriesSection.eyebrow}
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">
                        {categoriesSection.title}
                    </h3>
                    <p className="text-text-secondary mt-6 max-w-2xl mx-auto">
                        {categoriesSection.description}
                    </p>
                    <div className="w-24 h-1.5 bg-brand-primary mx-auto mt-6 rounded-full" />
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {productCategories.map((cat, i) => {
                        return (
                            <ScrollReveal key={i} delay={i * 80}>
                                <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 h-full flex flex-col">
                                    <div className="h-56 overflow-hidden bg-white p-4 flex items-center justify-center">
                                        <img
                                            src={cat.image || categoryCardFallbackImage}
                                            className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                                            alt={cat.name}
                                        />
                                    </div>
                                    <div className="p-6 flex-grow flex flex-col items-center justify-between">
                                        <div className="flex flex-col items-center">
                                            <div className="mb-4 h-1 w-11 rounded-full bg-brand-primary/80" />
                                            <h4 className="text-center text-text-primary font-bold text-[1.75rem] leading-tight">
                                                {cat.name}
                                            </h4>
                                        </div>
                                        <Link
                                            href={`/category/${slugifyCategoryName(cat.name)}`}
                                            className="mt-8 w-full py-3 bg-brand-primary text-white shadow-cta hover:bg-text-primary hover:text-white hover:shadow-xl rounded-2xl text-center text-sm font-bold transition-all duration-300 inline-block cursor-pointer"
                                        >
                                        {categoriesSection.buttonText || 'View All products'}
                                        </Link>
                                    </div>
                                </div>
                            </ScrollReveal>
                        );
                    })}
                </div>
            </section>

            {/* Featured Products - Original product cards */}
            <section className="py-16 sm:py-24 bg-neutral-surface">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <ScrollReveal className="mb-10 sm:mb-16 flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="mb-3 text-center text-xs sm:text-sm font-bold text-brand-primary uppercase tracking-[0.24em] sm:tracking-[0.3em] md:text-left">{featuredSection.eyebrow}</h2>
                            <h3 className="max-w-[12ch] text-center text-[2rem] sm:text-4xl md:text-5xl font-primary font-bold text-text-primary leading-[1.08] md:text-left">{featuredSection.title}</h3>
                        </div>
                        <p className="max-w-sm text-center text-[15px] sm:text-base leading-7 sm:leading-relaxed text-text-secondary md:text-left">
                            {featuredSection.sideText}
                        </p>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 justify-items-center">
                        {featuredProducts.map((product, i) => (
                            <ScrollReveal key={i} delay={i * 100}>
                                <FeaturedProductCard product={product} />
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-brand-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[120px]" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-5xl font-primary font-bold text-white mb-6">
                            Need Bulk Orders?
                        </h2>
                        <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
                            Get the best wholesale prices for your business. We offer competitive pricing for retailers and dealers across India.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/contact"
                                className="px-8 py-4 bg-white text-brand-primary rounded-full font-bold hover:bg-gray-100 transition-all flex items-center gap-3"
                            >
                                Request Bulk Quote
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </Link>
                            <a
                                href="tel:7828832346"
                                className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold hover:bg-white/20 transition-all"
                            >
                                Call: 7828832346
                            </a>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}

