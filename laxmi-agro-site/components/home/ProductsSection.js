import Link from 'next/link';
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
        <section id="products" className="bg-[#dfe8d3] px-4 pb-14 pt-8 sm:px-6 sm:py-24 lg:px-7">
            <div className="mx-auto max-w-7xl">
                <div className="mb-7 text-center sm:mb-12 lg:text-left">
                    <ScrollReveal>
                        <h3 className="mx-auto max-w-[15ch] text-[2.15rem] font-semibold leading-[1.05] tracking-[-0.024em] text-text-primary sm:max-w-[18ch] sm:text-5xl lg:mx-0 lg:text-6xl">
                            {section.title}
                        </h3>
                    </ScrollReveal>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                    {products.map((product, i) => (
                        <ScrollReveal key={i} delay={i * 50} className={i >= 4 ? 'hidden sm:block' : ''}>
                            <FeaturedProductCard product={normalizeFeaturedProduct(product, i)} />
                        </ScrollReveal>
                    ))}
                </div>

                <ScrollReveal className="mt-10 flex justify-center">
                    <Link href="/products/all" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0b3b1f]/15 bg-white/70 px-7 text-sm font-bold text-brand-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-[#062712] hover:text-white">
                        View All Products
                    </Link>
                </ScrollReveal>
            </div>
        </section>
    );
}
