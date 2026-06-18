import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';
import FeaturedProductCard from '@/components/products/FeaturedProductCard';
import {
    defaultFeaturedProducts as sharedDefaultFeaturedProducts,
    normalizeFeaturedProduct,
} from '@/lib/featured-products';
import { getApiBaseUrl } from '@/lib/api-base';
import { normalizeWebsiteImageUrl } from '@/lib/media-url';
import { getWebsiteHomeCatalog } from '@/lib/catalog-api';

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

const partnerLogos = [
    { label: 'Laxmi Agro' },
    { label: 'Green Valley' },
    { label: 'Harit' },
    { label: 'Shivnath' },
];

function slugifyCategoryName(name = '') {
    return encodeURIComponent(String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
}

async function getWebsiteContent() {
    const apiBase = getApiBaseUrl();

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
        const liveCatalog = await getWebsiteHomeCatalog();
        return {
            productCategories: await getLiveProductCategories(defaultProductCategories),
            featuredProducts: (liveCatalog.featuredProducts.length > 0
                ? liveCatalog.featuredProducts
                : (Array.isArray(json?.data?.featuredProducts) && json.data.featuredProducts.length > 0 ? json.data.featuredProducts : sharedDefaultFeaturedProducts).map((product) => ({
                    ...product,
                    image: normalizeWebsiteImageUrl(product?.image),
                }))).map((product, index) => normalizeFeaturedProduct(product, index)),
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

async function getLiveProductCategories(fallbackCategories = defaultProductCategories) {
    const liveCatalog = await getWebsiteHomeCatalog();
    const liveCategories = [
        ...liveCatalog.brands.map((brand) => ({
            name: brand.name,
            description: brand.description || 'Explore brand categories and available products.',
            image: brand.image,
            href: brand.href,
            productCount: brand.productCount,
            products: [],
        })),
        ...liveCatalog.generalCategories.map((category) => ({
            name: category.name,
            description: category.description || 'Explore available products in this category.',
            image: category.image,
            href: category.href,
            productCount: category.productCount,
            products: [],
        })),
    ];
    return liveCategories.length > 0 ? liveCategories : fallbackCategories;
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

            <section className="px-6 pt-4 sm:pt-10">
                <ScrollReveal className="mx-auto max-w-7xl">
                    <div className="relative overflow-hidden text-[#122516] [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
                        <div className="brand-marquee-track flex w-max items-center gap-10 sm:gap-14 lg:gap-18">
                            {[...partnerLogos, ...partnerLogos].map((partner, index) => (
                                <div key={`${partner.label}-${index}`} className="shrink-0 rounded-full border border-[#17351d]/18 bg-[#edf3e6]/60 px-6 py-3 text-[#17351d]/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                                    <span className="whitespace-nowrap text-xl font-black tracking-[-0.018em] sm:text-2xl">{partner.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="mt-4 text-center text-lg font-medium tracking-[-0.018em] text-[#17351d] sm:mt-7 sm:text-2xl">
                        Our Trusted Brands
                    </p>
                </ScrollReveal>
            </section>

            <section className="px-6 pb-14 pt-6 sm:py-24">
                <div className="mx-auto max-w-7xl">
                <ScrollReveal className="mb-10 hidden text-center sm:mb-16 sm:block">
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-brand-primary sm:mb-4 sm:text-sm sm:tracking-[0.3em]">{categoriesSection.eyebrow}</h2>
                    <h3 className="text-3xl font-primary font-bold leading-tight text-text-primary md:text-5xl">{categoriesSection.title}</h3>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-text-secondary sm:mt-6 sm:text-base">{categoriesSection.description}</p>
                </ScrollReveal>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4">
                    {productCategories.map((cat, i) => (
                        <ScrollReveal key={i} delay={i * 80}>
                            <div className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#0b3b1f]/10 bg-[#edf3e6]/85 p-2 shadow-[0_16px_40px_rgba(8,36,18,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(8,36,18,0.14)]">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.2rem] bg-[#d6e0c9]">
                                    <img src={cat.image || categoryCardFallbackImage} className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105" alt={cat.name} />
                                    <div className="absolute inset-x-3 top-3 flex justify-end">
                                        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#17351d] shadow-sm backdrop-blur-sm">
                                            {Number.isFinite(cat.productCount) && cat.productCount > 0 ? `${cat.productCount} Items` : (Array.isArray(cat.products) && cat.products.length > 0 ? `${cat.products.length} Items` : 'Category')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex min-h-[100px] flex-grow flex-col px-1.5 py-3">
                                    <h4 className="text-text-primary text-sm font-semibold leading-tight tracking-[-0.018em] sm:text-base">{cat.name}</h4>
                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-secondary">{cat.description}</p>
                                    <Link href={cat.href || `/category/${slugifyCategoryName(cat.name)}`} className="mt-auto flex items-center justify-between border-t border-[#0b3b1f]/10 pt-2.5 text-[11px] font-semibold text-brand-primary">
                                        <span>{categoriesSection.buttonText || 'View Products'}</span>
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-[#17351d] transition-colors group-hover:bg-[#17351d] group-hover:text-white">→</span>
                                    </Link>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
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

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
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
