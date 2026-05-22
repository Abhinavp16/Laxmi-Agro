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

            <section className="py-24 px-6 max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-16">
                    <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">Dealer Benefits</h2>
                    <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">Why Partner With Us?</h3>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {dealerBenefits.map((benefit, i) => (
                        <ScrollReveal key={i} delay={i * 100}>
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-full">
                                <h4 className="text-xl font-bold text-text-primary mb-4">{benefit.title}</h4>
                                <p className="text-text-secondary leading-relaxed">{benefit.description}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-5xl font-primary font-bold text-text-primary mb-8 leading-tight">Apply for Dealership</h2>
                        <p className="text-text-secondary text-lg leading-relaxed">
                            Use this form to connect with the Laxmi Agro team for dealership, reseller, and territory discussions. Our team will continue the conversation on WhatsApp from Raipur.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <input name="name" type="text" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-gray-900" placeholder="Rakesh Gupta" required />
                                    <input name="phone" type="tel" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-gray-900" placeholder="+91 98261 45870" required />
                                </div>
                                <input name="shopName" type="text" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-gray-900" placeholder="Gupta Agro Tools" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
