import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';
import FeaturedProductCard from '@/components/products/FeaturedProductCard';
import {
    defaultFeaturedProducts as sharedDefaultFeaturedProducts,
    normalizeFeaturedProduct,
} from '@/lib/featured-products';

export const metadata = {
    title: 'Products - Laxmi Agro',
    description: 'Browse service wire, submersible cable, pipes, sprinkler sets, control panels, pump sets, and allied agriculture products from Laxmi Agro.',
};

const defaultProductCategories = [
    { name: 'Service Wire', description: 'Aluminium service wire and allied electrical line products for field and utility use.', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=400&fit=crop&q=80', products: ['2 Core Service Cable', '3 Core Service Cable', '4 Core Service Cable'] },
    { name: 'Submersible Cable', description: 'Copper submersible cable and 3 layer cable options for pump installation work.', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&h=400&fit=crop&q=80', products: ['Copper Submersible Cable', '3 Layer Cable', 'Jointing Solution'] },
    { name: 'Pipes & Fittings', description: 'PVC column pipes, GI pipes, roll pipe, and column adopters for irrigation and bore setups.', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop&q=80', products: ['PVC Column Pipe', 'GI Pipe', 'Column Adopter'] },
    { name: 'Pump & Irrigation', description: 'Sprinkler sets, control panels, jhatka machines, starter oil, and pump set accessories.', image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop&q=80', products: ['Harit Sprinkler Set', 'Shivnath Control Panel', 'Aqua Golden Pump Set'] },
];

const defaultCategoriesSection = {
    eyebrow: 'Product Categories',
    title: 'Equipment For Modern Farming',
    description: 'Explore practical agriculture supply categories including cable, pipes, sprinkler equipment, pump sets, and allied field materials.',
    buttonText: 'View Products',
};

const defaultFeaturedSection = {
    eyebrow: 'Precision Engineering',
    title: 'Featured Products',
    sideText: 'Featured agriculture supply products selected from the current Laxmi Agro catalogue.',
    buttonText: 'Get Quote',
};

const categoryCardFallbackImage = 'https://placehold.co/800x500/e5e7eb/94a3b8?text=Category';

function slugifyCategoryName(name = '') {
    return encodeURIComponent(String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
}

async function getWebsiteContent() {
    const rawBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.API_BASE_URL ||
        process.env.NEXT_PUBLIC_WEBSITE_API_BASE_URL ||
        'http://localhost:5000/api/v1';
    const apiBase = rawBase.replace(/\/+$/, '');

    try {
        const response = await fetch(`${apiBase}/settings/website-content`, { cache: 'no-store' });
        if (!response.ok) {
            return {
                productCategories: defaultProductCategories,
                featuredProducts: sharedDefaultFeaturedProducts.map((product, index) => normalizeFeaturedProduct(product, index)),
                categoriesSection: defaultCategoriesSection,
                featuredSection: defaultFeaturedSection,
            };
        }

        const json = await response.json();
        return {
            productCategories: Array.isArray(json?.data?.productCategories) && json.data.productCategories.length > 0 ? json.data.productCategories : defaultProductCategories,
            featuredProducts: (Array.isArray(json?.data?.featuredProducts) && json.data.featuredProducts.length > 0 ? json.data.featuredProducts : sharedDefaultFeaturedProducts).map((product, index) => normalizeFeaturedProduct(product, index)),
            categoriesSection: json?.data?.categoriesSection ? { ...defaultCategoriesSection, ...json.data.categoriesSection } : defaultCategoriesSection,
            featuredSection: json?.data?.featuredSection ? { ...defaultFeaturedSection, ...json.data.featuredSection } : defaultFeaturedSection,
        };
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
                subtitle="Browse practical categories from the current Laxmi Agro catalogue."
                breadcrumbItems={['Products']}
            />

            <section className="px-6 pt-10">
                <ScrollReveal className="max-w-7xl mx-auto">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
                        <div className="flex items-center justify-center gap-10 lg:gap-16 flex-wrap">
                            <img src="/favicon-rounded.svg" alt="Laxmi Agro" className="h-10 md:h-12 object-contain" />
                            <img src="/images/ecotech.jpeg" alt="Ecotech" className="h-10 md:h-12 object-contain" />
                            <img src="/images/kargill.jpeg" alt="Kargill" className="h-10 md:h-12 object-contain" />
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            <section className="py-24 px-6 max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-16">
                    <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">{categoriesSection.eyebrow}</h2>
                    <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">{categoriesSection.title}</h3>
                    <p className="text-text-secondary mt-6 max-w-2xl mx-auto">{categoriesSection.description}</p>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {productCategories.map((cat, i) => (
                        <ScrollReveal key={i} delay={i * 80}>
                            <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 h-full flex flex-col">
                                <div className="h-56 overflow-hidden bg-white p-4 flex items-center justify-center">
                                    <img src={cat.image || categoryCardFallbackImage} className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500" alt={cat.name} />
                                </div>
                                <div className="p-6 flex-grow flex flex-col items-center justify-between">
                                    <h4 className="text-center text-text-primary font-bold text-[1.75rem] leading-tight">{cat.name}</h4>
                                    <Link href={`/category/${slugifyCategoryName(cat.name)}`} className="mt-8 w-full py-3 bg-brand-primary text-white rounded-2xl text-center text-sm font-bold transition-all duration-300 inline-block cursor-pointer">
                                        {categoriesSection.buttonText || 'View Products'}
                                    </Link>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </section>

            <section className="py-16 sm:py-24 bg-neutral-surface">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <ScrollReveal className="mb-10 sm:mb-16 flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="mb-3 text-center text-xs sm:text-sm font-bold text-brand-primary uppercase tracking-[0.24em] sm:tracking-[0.3em] md:text-left">{featuredSection.eyebrow}</h2>
                            <h3 className="max-w-[12ch] text-center text-[2rem] sm:text-4xl md:text-5xl font-primary font-bold text-text-primary leading-[1.08] md:text-left">{featuredSection.title}</h3>
                        </div>
                        <p className="max-w-sm text-center text-[15px] sm:text-base leading-7 sm:leading-relaxed text-text-secondary md:text-left">{featuredSection.sideText}</p>
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

            <section className="py-24 bg-brand-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[120px]" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-5xl font-primary font-bold text-white mb-6">Need Bulk Orders?</h2>
                        <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Get in touch for dealer pricing, commercial quantities, and regional distribution discussions.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/contact" className="px-8 py-4 bg-white text-brand-primary rounded-full font-bold hover:bg-gray-100 transition-all">
                                Request Bulk Quote
                            </Link>
                            <a href="tel:+919179110159" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold hover:bg-white/20 transition-all">
                                Call: +91 91791 10159
                            </a>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}
