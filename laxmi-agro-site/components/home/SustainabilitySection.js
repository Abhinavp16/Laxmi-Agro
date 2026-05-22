import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export default function SustainabilitySection() {
    return (
        <section className="py-14 px-4 sm:px-6 sm:py-24 max-w-7xl mx-auto overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
                <ScrollReveal>
                    <div className="relative h-[250px] sm:h-[380px] lg:h-[500px] rounded-[1.75rem] sm:rounded-3xl overflow-hidden group">
                        <img
                            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop&q=80"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            alt="Sustainable Agriculture"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8">
                            <span className="inline-block px-3 py-1.5 bg-brand-primary/90 text-white text-[10px] sm:text-xs font-bold uppercase rounded-full mb-2 sm:mb-3">
                                Cutting-Edge Machinery
                            </span>
                            <p className="text-[15px] sm:text-lg font-medium leading-6 sm:leading-normal max-w-[18ch] sm:max-w-none">
                                Elevate your farming methods with our cutting-edge machinery
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal>
                    <div className="inline-block px-4 py-2 border border-brand-primary/30 rounded-lg text-brand-primary font-bold text-xs sm:text-sm mb-5 sm:mb-6 uppercase tracking-[0.24em] sm:tracking-widest">
                        Sustainability
                    </div>
                    <h2 className="max-w-[10ch] text-[2rem] sm:text-4xl md:text-5xl font-primary font-bold text-text-primary mb-5 sm:mb-8 leading-[1.04] sm:leading-tight break-words">
                        Sustainable Agriculture In Your Community
                    </h2>
                    <p className="text-text-secondary text-[15px] sm:text-lg mb-5 sm:mb-8 leading-7 sm:leading-relaxed">
                        At Laxmi Agro, we focus on practical equipment selection that supports efficient operations, better resource use, and dependable field performance.
                    </p>
                    <p className="text-text-secondary text-[15px] sm:text-lg mb-7 sm:mb-10 leading-7 sm:leading-relaxed">
                        Build a stronger local distribution network in your community with reliable products, service support, and a scalable dealer workflow.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
                        <Link
                            href="/dealership"
                            className="w-full sm:w-auto justify-center px-6 py-3.5 sm:px-8 sm:py-4 bg-brand-primary text-white rounded-full font-bold text-sm sm:text-base hover:bg-brand-secondary transition-all shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] flex items-center gap-3 group"
                        >
                            Join as a Dealer
                            <svg className="group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </Link>
                        <Link
                            href="/#products"
                            className="w-full sm:w-auto text-center px-6 py-3.5 sm:px-8 sm:py-4 bg-white border border-gray-200 text-text-primary rounded-full font-bold text-sm sm:text-base hover:border-brand-primary hover:text-brand-primary transition-all"
                        >
                            Buy Machines Now
                        </Link>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
