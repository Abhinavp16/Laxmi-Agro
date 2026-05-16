import ScrollReveal from '@/components/ScrollReveal';
import FeaturedProductCard from '@/components/products/FeaturedProductCard';
import { normalizeFeaturedProduct } from '@/lib/featured-products';

const defaultProducts = [
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

const defaultFeaturedSection = {
    eyebrow: 'PRECISION ENGINEERING',
    title: 'Our Popular Products',
    sideText: 'Genuine Oxon products engineered for durability, performance, and maximum ROI.',
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
