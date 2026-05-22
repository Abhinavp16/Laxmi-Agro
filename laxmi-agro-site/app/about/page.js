import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'About Us - Laxmi Agro',
    description: 'Learn about Laxmi Agro and Ashirvad Marketing, serving Raipur with agriculture, irrigation, cable, and pump supply products.',
};

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

export default function AboutPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="About Us"
                subtitle="Laxmi Agro connects buyers with irrigation, pump, cable, pipe, and allied agriculture supply products."
                breadcrumbItems={['About Us']}
            />

            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <ScrollReveal>
                        <div className="w-12 h-1 bg-brand-primary mb-6" />
                        <h2 className="text-4xl md:text-5xl font-primary font-bold text-text-primary mb-8 leading-tight">
                            Built Around Practical Field Supply
                        </h2>
                        <p className="text-text-secondary text-lg mb-6 leading-relaxed">
                            Laxmi Agro operates through Ashirvad Marketing to serve retailers, dealers, and end buyers with a practical catalogue of agriculture and equipment products.
                        </p>
                        <p className="text-text-secondary text-lg mb-6 leading-relaxed">
                            The current catalogue includes service wire, submersible cable, PVC column pipes, GI pipes, sprinkler sets, jhatka machines, control panels, pump sets, and related supply items.
                        </p>
                        <div className="mt-10 p-6 bg-neutral-surface rounded-2xl border border-gray-100">
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
                                src="/images/about/front.jpeg"
                                className="rounded-2xl shadow-lg w-full h-auto object-contain object-center"
                                alt="Equipment storefront"
                            />
                            <img
                                src="/images/about/godown.png"
                                className="rounded-2xl shadow-lg w-full h-auto object-contain object-center"
                                alt="Warehouse"
                            />
                            <div className="bg-brand-primary p-6 rounded-2xl text-white sm:col-span-2">
                                <p className="text-3xl font-bold italic mb-1">W.E.F. 20/04/2026</p>
                                <p className="text-xs uppercase tracking-tighter opacity-80">Current catalogue and rate structure effective date</p>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="py-24 bg-neutral-surface">
                <div className="max-w-7xl mx-auto px-6">
                    <ScrollReveal className="text-center mb-16">
                        <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">What Drives Us</h2>
                        <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">Platform Principles</h3>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {values.map((value, i) => (
                            <ScrollReveal key={i} delay={i * 100}>
                                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all h-full">
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
