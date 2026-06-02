import ScrollReveal from '@/components/ScrollReveal';

export default function AboutSection() {
    return (
        <section id="about" className="overflow-hidden bg-[#dfe8d3] px-4 py-16 sm:px-6 sm:py-24 lg:px-7">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
                <ScrollReveal>
                    <div className="home-kicker">Who We Are</div>
                    <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.065em] text-text-primary sm:text-5xl lg:text-6xl">
                        Comprehensive <br /> Distribution Solutions
                    </h2>
                    <p className="mt-7 max-w-xl text-base leading-8 text-text-secondary sm:text-lg">
                        Laxmi Agro, operated through Ashirvad Marketing, serves retailers, dealers, and bulk buyers with pumps, cables, column pipes, GI pipes, sprinkler systems, and workshop essentials from Raipur.
                    </p>

                    <div className="mt-10 space-y-4">
                        <div className="flex gap-4 rounded-[1.6rem] border border-[#0b3b1f]/10 bg-[#edf3e6]/70 p-5 shadow-[0_18px_50px_rgba(8,36,18,0.06)] transition-colors hover:border-[#0b3b1f]/25">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b3b1f] text-sm font-bold text-white shadow-sm">
                                D2B
                            </div>
                            <div>
                                <h4 className="font-bold tracking-[-0.02em] text-text-primary">Bulk Wholesaling</h4>
                                <p className="mt-1 text-sm leading-6 text-text-secondary">Competitive supply for retailers, dealers, and resellers across agriculture hardware categories.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 rounded-[1.6rem] border border-[#0b3b1f]/10 bg-[#edf3e6]/70 p-5 shadow-[0_18px_50px_rgba(8,36,18,0.06)] transition-colors hover:border-[#0b3b1f]/25">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b3b1f] text-sm font-bold text-white shadow-sm">
                                D2C
                            </div>
                            <div>
                                <h4 className="font-bold tracking-[-0.02em] text-text-primary">Direct Retail</h4>
                                <p className="mt-1 text-sm leading-6 text-text-secondary">Reliable access to irrigation, cable, piping, and motor-related products for direct buyers.</p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal className="relative">
                    <div className="grid min-h-0 grid-cols-1 gap-4 sm:min-h-[620px] sm:grid-cols-2 sm:gap-5">
                        <div className="space-y-4 sm:pt-12">
                            <div className="rounded-[1.6rem] border border-[#0b3b1f]/10 bg-[#edf3e6]/80 p-5 shadow-sm">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary">Regional Reach</p>
                                <p className="text-sm font-semibold leading-6 text-text-primary">Trusted supply support for Raipur and surrounding regional demand.</p>
                            </div>
                            <img
                                src="/images/about/front.jpeg"
                                className="h-auto w-full rounded-[2rem] object-contain object-center shadow-[0_24px_70px_rgba(8,36,18,0.12)]"
                                alt="Laxmi Agro storefront"
                            />
                            <div className="rounded-[1.6rem] bg-brand-primary p-6 text-white">
                                <p className="mb-1 text-3xl font-semibold tracking-[-0.05em]">20 Apr 2026</p>
                                <p className="text-xs uppercase tracking-[0.14em] text-white/70">Current Rate List Effective Date</p>
                            </div>
                            <div className="rounded-[1.6rem] border border-[#0b3b1f]/10 bg-[#edf3e6]/80 p-5 shadow-sm">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary">Fast Dispatch</p>
                                <p className="text-sm font-semibold leading-6 text-text-primary">Advance-payment dispatch support for dealers, retailers, and bulk buyers.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="rounded-[2rem] bg-[#062712] p-8 text-center text-white">
                                <p className="mb-2 text-5xl font-semibold tracking-[-0.06em]">4.9+</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Industry Rating</p>
                            </div>
                            <img
                                src="/images/about/godown.png"
                                className="h-auto w-full rounded-[2rem] object-contain object-center shadow-[0_24px_70px_rgba(8,36,18,0.12)] sm:h-[300px] sm:object-cover"
                                alt="Warehouse"
                            />
                            <div className="rounded-[1.6rem] border border-[#0b3b1f]/10 bg-[#edf3e6]/80 p-5 shadow-sm">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary">Core Team</p>
                                <p className="text-sm font-semibold leading-6 text-text-primary">Focused on practical field supply, service coordination, and dependable order handling.</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 -z-10 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
                </ScrollReveal>
            </div>
        </section>
    );
}
