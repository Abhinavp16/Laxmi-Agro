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
        <section id="products" className="bg-[#dfe8d3] px-4 py-16 sm:px-6 sm:py-24 lg:px-7">
            <div className="mx-auto max-w-[1480px]">
                <div className="mb-10 grid grid-cols-1 gap-6 lg:mb-12 lg:grid-cols-[0.72fr_1fr] lg:items-end">
                    <ScrollReveal>
                        <div className="home-kicker">{section.eyebrow}</div>
                        <h3 className="mt-5 max-w-[12ch] text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.065em] text-text-primary sm:text-5xl lg:text-6xl">
                            {section.title}
                        </h3>
                    </ScrollReveal>
                    <ScrollReveal className="lg:justify-self-end">
                        <p className="max-w-lg text-base leading-7 text-text-secondary">
                            {section.sideText}
                        </p>
                    </ScrollReveal>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
