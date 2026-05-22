import ScrollReveal from '@/components/ScrollReveal';
import FeaturedProductCard from '@/components/products/FeaturedProductCard';
import { normalizeFeaturedProduct } from '@/lib/featured-products';

const defaultProducts = [
    {
        name: 'Service Cable',
        price: 'Request Quote',
        image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=600&fit=crop&q=80',
        badge: 'Best Seller',
        specs: ['2 Core / 3 Core / 4 Core', '500 mtr options', 'Suitable for field supply demand'],
    },
    {
        name: 'Submersible Cable',
        price: 'Request Quote',
        image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&h=600&fit=crop&q=80',
        badge: 'New Arrival',
        specs: ['Copper variants', '3 Layer options', 'Pump installation use'],
    },
    {
        name: 'Green Valley PVC Column Pipe',
        price: 'Request Quote',
        image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=600&fit=crop&q=80',
        specs: ['Column pipe supply', 'Irrigation and bore use', 'Green Valley line'],
    },
    {
        name: 'Harit Sprinkler Set',
        price: 'Request Quote',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=600&fit=crop&q=80',
        badge: 'High Performance',
        specs: ['Irrigation support', 'Field-ready components', 'Dealer supply available'],
    },
    {
        name: 'Shivnath Control Panel',
        price: 'Request Quote',
        image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=600&fit=crop&q=80',
        specs: ['Pump control support', 'Electrical panel category', 'Suitable for field installations'],
    },
];

const defaultFeaturedSection = {
    eyebrow: 'PRECISION ENGINEERING',
    title: 'Our Popular Products',
    sideText: 'Featured agriculture supply products selected from the current Laxmi Agro catalogue.',
    buttonText: 'Get Quote',
};

export default function ProductsSection({
    products = defaultProducts,
    section = defaultFeaturedSection,
}) {
    return (
        <section id="products" className="py-16 sm:py-24 bg-neutral-surface">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
                <div className="mb-10 sm:mb-12 flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
                    <ScrollReveal>
                        <h2 className="mb-3 text-center text-xs sm:text-sm font-bold text-brand-primary uppercase tracking-[0.24em] sm:tracking-[0.3em] md:text-left">{section.eyebrow}</h2>
                        <h3 className="max-w-[12ch] text-center text-[2rem] sm:text-3xl md:text-4xl font-primary font-bold text-text-primary leading-[1.08] md:text-left">
                            {section.title}
                        </h3>
                    </ScrollReveal>
                    <ScrollReveal>
                        <p className="max-w-sm text-center text-[15px] sm:text-sm leading-7 sm:leading-6 text-text-secondary md:text-left">
                            {section.sideText}
                        </p>
                    </ScrollReveal>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {products.map((product, i) => (
                        <ScrollReveal key={i} delay={i * 50}>
                            <FeaturedProductCard product={normalizeFeaturedProduct(product, i)} />
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
