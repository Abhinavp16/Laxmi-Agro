import ScrollReveal from '@/components/ScrollReveal';

export default function AboutSection() {
    return (
        <section id="about" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <ScrollReveal>
                    <div className="w-12 h-1 bg-brand-primary mb-6" />
                    <h2 className="text-4xl md:text-5xl font-primary font-bold text-text-primary mb-8 leading-tight">
                        Comprehensive <br /> Distribution Solutions
                    </h2>
                    <p className="text-text-secondary text-lg mb-10 leading-relaxed">
                        Laxmi Agro, operated through Ashirvad Marketing, serves retailers, dealers, and bulk buyers with pumps, cables, column pipes, GI pipes, sprinkler systems, and workshop essentials from Raipur.
                    </p>

                    <div className="space-y-6">
                        <div className="flex gap-4 p-4 rounded-2xl bg-neutral-surface border border-gray-100 hover:border-brand-primary transition-colors">
                            <div className="w-12 h-12 shrink-0 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-primary font-bold">
                                D2B
                            </div>
                            <div>
                                <h4 className="font-bold text-text-primary">Bulk Wholesaling</h4>
                                <p className="text-sm text-text-secondary">Competitive supply for retailers, dealers, and resellers across agriculture hardware categories.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-2xl bg-neutral-surface border border-gray-100 hover:border-brand-primary transition-colors">
                            <div className="w-12 h-12 shrink-0 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-primary font-bold">
                                D2C
                            </div>
                            <div>
                                <h4 className="font-bold text-text-primary">Direct Retail</h4>
                                <p className="text-sm text-text-secondary">Reliable access to irrigation, cable, piping, and motor-related products for direct buyers.</p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal className="relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 min-h-0 sm:min-h-[620px]">
                        <div className="space-y-4">
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-1">Pan India Reach</p>
                                <p className="text-sm font-semibold text-text-primary">Trusted supply support for Raipur and surrounding regional demand.</p>
                            </div>
                            <img
                                src="/images/about/front.jpeg"
                                className="rounded-2xl shadow-lg w-full h-auto object-contain object-center"
                                alt="Laxmi Agro storefront"
                            />
                            <div className="bg-brand-primary p-6 rounded-2xl text-white">
                                <p className="text-3xl font-bold italic mb-1">20 Apr 2026</p>
                                <p className="text-xs uppercase tracking-tighter opacity-80">Current Rate List Effective Date</p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-1">Fast Dispatch</p>
                                <p className="text-sm font-semibold text-text-primary">Advance-payment dispatch support for dealers, retailers, and bulk buyers.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-900 p-8 rounded-2xl text-white text-center">
                                <p className="text-4xl font-bold mb-2">4.9+</p>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Industry Rating</p>
                            </div>
                            <img
                                src="/images/about/godown.png"
                                className="rounded-2xl shadow-lg w-full h-auto sm:h-[300px] object-contain object-center sm:object-cover"
                                alt="Warehouse"
                            />
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-1">Core Team</p>
                                <p className="text-sm font-semibold text-text-primary">Focused on practical field supply, service coordination, and dependable order handling.</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -z-10 -bottom-10 -right-10 w-48 h-48 bg-brand-light rounded-full blur-3xl" />
                </ScrollReveal>
            </div>
        </section>
    );
}
