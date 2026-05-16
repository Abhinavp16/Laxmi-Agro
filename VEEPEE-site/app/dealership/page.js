'use client';
import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';
import { buildDealershipApplicationMessage, buildWhatsAppUrl } from '@/lib/inquiry';

const dealerBenefits = [
    {
        title: 'Exclusive Territory Rights',
        description: 'Secure your market with dedicated territory allocation. Be the sole authorized dealer in your region.',
        icon: '🗺️',
    },
    {
        title: 'Higher Profit Margins',
        description: 'Enjoy industry-leading margins with our competitive wholesale pricing structure and volume discounts.',
        icon: '📈',
    },
    {
        title: 'Marketing Support',
        description: 'Free marketing materials, banners, and digital assets to boost your sales. We support your growth.',
        icon: '🎯',
    },
    {
        title: 'Training & Certification',
        description: 'Comprehensive product training for you and your team. Become a certified Oxon dealer.',
        icon: '🎓',
    },
    {
        title: 'After-Sales Support',
        description: 'Dedicated support team for warranty claims, spare parts, and technical assistance.',
        icon: '🔧',
    },
    {
        title: 'Growth Opportunities',
        description: 'Annual dealer meets, incentive programs, and expansion opportunities as you grow with us.',
        icon: '🚀',
    },
];

const steps = [
    {
        step: '1',
        title: 'Submit Application',
        description: 'Fill out the dealership application form with your business details and preferred territory.',
    },
    {
        step: '2',
        title: 'Evaluation & Approval',
        description: 'Our team evaluates your application based on location, infrastructure, and market potential.',
    },
    {
        step: '3',
        title: 'Agreement & Training',
        description: 'Sign the dealership agreement and attend comprehensive product training sessions.',
    },
    {
        step: '4',
        title: 'Launch & Support',
        description: 'Start selling with full marketing support, initial stock, and a dedicated account manager.',
    },
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
                subtitle="Join our rapidly growing dealer network across India. Sell genuine Oxon™ products and build a profitable business."
                breadcrumbItems={['Dealership']}
            />

            {/* Why Become a Dealer */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-16">
                    <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">
                        Dealer Benefits
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">
                        Why Partner with Veepee Impex?
                    </h3>
                    <p className="text-text-secondary mt-6 max-w-2xl mx-auto">
                        As a Veepee Impex dealer, you&apos;ll be part of a network committed to transforming farming practices across the nation.
                    </p>
                    <div className="w-24 h-1.5 bg-brand-primary mx-auto mt-6 rounded-full" />
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {dealerBenefits.map((benefit, i) => (
                        <ScrollReveal key={i} delay={i * 100}>
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-primary/30 transition-all h-full group">
                                <div className="text-4xl mb-6">{benefit.icon}</div>
                                <h4 className="text-xl font-bold text-text-primary mb-4 group-hover:text-brand-primary transition-colors">
                                    {benefit.title}
                                </h4>
                                <p className="text-text-secondary leading-relaxed">{benefit.description}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </section>

            {/* How It Works - Steps inspired by HeavyTech */}
            <section className="py-24 bg-gray-900 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px]" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <ScrollReveal className="text-center mb-16">
                        <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">
                            Simple Process
                        </h2>
                        <h3 className="text-4xl md:text-5xl font-primary font-bold text-white">
                            How to Become a Dealer
                        </h3>
                        <div className="w-24 h-1.5 bg-brand-primary mx-auto mt-6 rounded-full" />
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, i) => (
                            <ScrollReveal key={i} delay={i * 150}>
                                <div className="relative h-full min-h-[300px] p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all text-center group flex flex-col">
                                    <span className="text-6xl font-black text-brand-primary opacity-30 absolute top-4 right-6 group-hover:opacity-60 transition-opacity">
                                        {step.step}
                                    </span>
                                    <div className="relative z-10 flex flex-1 flex-col pt-18">
                                        <h4 className="min-h-[56px] text-xl font-bold text-white mb-3 flex items-center justify-center">{step.title}</h4>
                                        <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dealership Application Form */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    <ScrollReveal>
                        <div className="w-12 h-1 bg-brand-primary mb-6" />
                        <h2 className="text-4xl md:text-5xl font-primary font-bold text-text-primary mb-8 leading-tight">
                            Apply for Dealership
                        </h2>
                        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                            Ready to take the next step? Fill out the application form and our team will evaluate your profile within 3 business days. We&apos;re looking for motivated partners across all states of India.
                        </p>

                        <div className="space-y-6">
                            <div className="flex gap-4 p-5 rounded-2xl bg-brand-light/50 border border-brand-primary/10">
                                <div className="shrink-0 text-brand-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-primary">Minimum Investment</h4>
                                    <p className="text-sm text-text-secondary">Starting dealership packages from ₹50,000</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 rounded-2xl bg-brand-light/50 border border-brand-primary/10">
                                <div className="shrink-0 text-brand-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-primary">No Franchise Fee</h4>
                                    <p className="text-sm text-text-secondary">Zero franchise charges. Pay only for your initial stock.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 rounded-2xl bg-brand-light/50 border border-brand-primary/10">
                                <div className="shrink-0 text-brand-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-primary">Pan India Opportunities</h4>
                                    <p className="text-sm text-text-secondary">Dealer openings available across all 28 states and 8 UTs.</p>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
                            <h3 className="text-2xl font-bold text-text-primary mb-2">Dealership Application</h3>
                            <p className="text-text-secondary mb-8 text-sm">
                                All fields marked with * are required.
                            </p>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name *</label>
                                        <input name="name" type="text" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900" placeholder="Rakesh Gupta" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone *</label>
                                        <input name="phone" type="tel" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900" placeholder="+91 98261 45870" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Shop Name</label>
                                    <input name="shopName" type="text" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900" placeholder="Gupta Agro Tools" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">State *</label>
                                        <input name="state" type="text" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900" placeholder="Chhattisgarh" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">City *</label>
                                        <input name="city" type="text" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900" placeholder="Raipur" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Business Description</label>
                                    <textarea name="businessDescription" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900 min-h-[120px]" placeholder="We run an agricultural equipment shop in Raipur and want to expand into Oxon products for nearby dealers and farmers." />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-5 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-secondary transition-all shadow-lg active:scale-[0.98]"
                                >
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
