'use client';
import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';
import { buildDealershipApplicationMessage, buildWhatsAppUrl } from '@/lib/inquiry';

const dealerBenefits = [
    { title: 'Territory Planning', description: 'Structured regional expansion with practical dealer and reseller coordination.' },
    { title: 'Commercial Flexibility', description: 'Support for retail, wholesale, advance-payment, and negotiated order flows.' },
    { title: 'Category Breadth', description: 'Pumps, pipes, cables, sprinkler sets, and allied field supply categories under one desk.' },
];

export default function DealershipPage() {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const message = buildDealershipApplicationMessage({
            name: formData.get('name')?.toString().trim() || '',
            phone: formData.get('phone')?.toString().trim() || '',
            shopName: formData.get('shopName')?.toString().trim() || '',
            state: formData.get('state')?.toString().trim() || '',
            city: formData.get('city')?.toString().trim() || '',
            businessDescription: formData.get('businessDescription')?.toString().trim() || '',
        });
        window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
        e.currentTarget.reset();
    };

    return (
        <div className="page-transition">
            <PageHero
                title="Become a Dealer"
                subtitle="Join the platform as a regional partner, distributor, or dealer."
                breadcrumbItems={['Dealership']}
            />

            <section className="px-6 py-10 sm:py-24 max-w-7xl mx-auto">
                <ScrollReveal className="mb-10 text-center sm:mb-16">
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-brand-primary sm:mb-4 sm:text-sm sm:tracking-[0.3em]">Dealer Benefits</h2>
                    <h3 className="text-3xl font-primary font-bold text-text-primary md:text-5xl">Why Partner With Us?</h3>
                </ScrollReveal>

                <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-8 sm:mb-20">
                    {dealerBenefits.map((benefit, i) => (
                        <ScrollReveal key={i} delay={i * 100}>
                            <div className="h-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                                <h4 className="text-xl font-bold text-text-primary mb-4">{benefit.title}</h4>
                                <p className="text-text-secondary leading-relaxed">{benefit.description}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
                    <ScrollReveal>
                        <h2 className="mb-5 text-3xl font-primary font-bold leading-tight text-text-primary sm:mb-8 md:text-5xl">Apply for Dealership</h2>
                        <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
                            Use this form to connect with the Laxmi Agro team for dealership, reseller, and territory discussions. Our team will continue the conversation on WhatsApp from Raipur.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-2xl sm:rounded-[3rem] sm:p-10">
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                    <input name="name" type="text" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-gray-900" placeholder="Rakesh Gupta" required />
                                    <input name="phone" type="tel" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-gray-900" placeholder="+91 98261 45870" required />
                                </div>
                                <input name="shopName" type="text" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-gray-900" placeholder="Gupta Agro Tools" />
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                    <input name="state" type="text" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-gray-900" placeholder="Madhya Pradesh" required />
                                    <input name="city" type="text" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-gray-900" placeholder="Indore" required />
                                </div>
                                <textarea name="businessDescription" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-gray-900 min-h-[120px]" placeholder="We run an equipment business and want to expand our regional distribution network." />
                                <button type="submit" className="w-full py-5 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-secondary transition-all">
                                    Submit Application
                                </button>
                            </form>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}
