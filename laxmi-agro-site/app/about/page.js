import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';
import { getWebsiteContent } from '@/lib/website-content';

export const metadata = {
    title: 'About Us - Laxmi Agro Enterprises',
    description: 'Learn about Laxmi Agro and Ashirvad Marketing, serving Raipur with agriculture, irrigation, cable, and pump supply products.',
};

export const dynamic = 'force-dynamic';

const values = [
    {
        title: 'Regional Supply Focus',
        description: 'We support agriculture and industrial supply needs with practical product availability, dealer support, and direct buyer coordination from Raipur.',
    },
    {
        title: 'Practical Operations',
        description: 'The business covers product discovery, bulk enquiries, payment coordination, and dispatch handling for pumps, cable, pipes, and related equipment.',
    },
    {
        title: 'Dealer-Friendly Distribution',
        description: 'From retail supply to wholesale fulfilment, the focus is on dependable commercial handling, advance payments, and dealer network growth.',
    },
];

export default async function AboutPage() {
    const { productCategories, featuredProducts } = await getWebsiteContent();
    const productImages = [productCategories?.[0]?.image, featuredProducts?.[0]?.image].filter(Boolean);

    return (
        <div className="page-transition">
            <PageHero
                title="About Us"
                subtitle="Laxmi Agro connects buyers with irrigation, pump, cable, pipe, and allied agriculture supply products."
                breadcrumbItems={['About Us']}
            />

            <section className="px-6 py-10 sm:py-24 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-center">
                    <ScrollReveal>
                        <div className="mb-4 h-1 w-12 bg-brand-primary sm:mb-6" />
                        <h2 className="mb-5 text-3xl font-primary font-bold leading-tight text-text-primary sm:mb-8 md:text-5xl">
                            Built Around Practical Field Supply
                        </h2>
                        <p className="mb-4 text-base leading-relaxed text-text-secondary sm:mb-6 sm:text-lg">
                            Laxmi Agro operates through Ashirvad Marketing to serve retailers, dealers, and end buyers with a practical catalogue of agriculture and equipment products.
                        </p>
                        <p className="mb-4 text-base leading-relaxed text-text-secondary sm:mb-6 sm:text-lg">
                            The current catalogue includes service wire, submersible cable, PVC column pipes, GI pipes, sprinkler sets, jhatka machines, control panels, pump sets, and related supply items.
                        </p>
                        <div className="mt-6 rounded-2xl border border-gray-100 bg-neutral-surface p-5 sm:mt-10 sm:p-6">
                            <h3 className="text-xl font-bold text-text-primary mb-4">Business Snapshot</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <p className="text-text-secondary"><span className="font-semibold text-text-primary">Brand:</span> Laxmi Agro</p>
                                <p className="text-text-secondary"><span className="font-semibold text-text-primary">Trade Desk:</span> Ashirvad Marketing</p>
                                <p className="text-text-secondary sm:col-span-2"><span className="font-semibold text-text-primary">Address:</span> Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.)</p>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal className="relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <img
                                src={productImages[0] || '/images/products/brush cutter.webp'}
                                className="h-72 w-full rounded-2xl object-cover object-center shadow-lg"
                                alt="Laxmi Agro product"
                            />
                            <img
                                src={productImages[1] || productImages[0] || '/images/Banner/3.jpg'}
                                className="h-72 w-full rounded-2xl object-cover object-center shadow-lg"
                                alt="Laxmi Agro equipment"
                            />
                            <div className="bg-brand-primary p-6 rounded-2xl text-white sm:col-span-2">
                                <p className="text-3xl font-bold italic mb-1">W.E.F. 20/04/2026</p>
                                <p className="text-xs uppercase tracking-tighter opacity-80">Current catalogue and rate structure effective date</p>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="bg-neutral-surface py-12 sm:py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <ScrollReveal className="mb-10 text-center sm:mb-16">
                        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-brand-primary sm:mb-4 sm:text-sm sm:tracking-[0.3em]">What Drives Us</h2>
                        <h3 className="text-3xl font-primary font-bold text-text-primary md:text-5xl">Platform Principles</h3>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-8">
                        {values.map((value, i) => (
                            <ScrollReveal key={i} delay={i * 100}>
                                <div className="h-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl sm:p-8">
                                    <h4 className="text-xl font-bold text-text-primary mb-4">{value.title}</h4>
                                    <p className="text-text-secondary leading-relaxed">{value.description}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
