import Link from 'next/link';

export default function BannersSection() {
    return (
        <section className="bg-[#dfe8d3] px-4 py-10 sm:px-6 sm:py-14 lg:px-7">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="home-kicker">Field Programs</div>
                        <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.022em] text-text-primary sm:text-4xl lg:text-5xl">
                            Dealer support and app-first ordering for modern agriculture supply.
                        </h2>
                    </div>
                    <p className="max-w-md text-sm leading-6 text-text-secondary sm:text-base">
                        Quick access to dealership programs, bulk support, and mobile-first product discovery.
                    </p>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
                    <Link href="/dealership" className="group relative min-h-[320px] overflow-hidden rounded-[2rem] border border-[#0b3b1f]/10 bg-[#eef4e8] p-6 shadow-[0_20px_55px_rgba(8,36,18,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.14)] sm:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(255,255,255,0.95),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.82)_0%,rgba(238,244,232,0.66)_52%,rgba(206,221,193,0.78)_100%)]" />
                        <div className="premium-orb absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#d5e1ca]" />
                        <div className="absolute bottom-5 right-5 hidden w-[46%] max-w-[300px] sm:block">
                            <div className="relative h-44 rounded-[1.8rem] border border-[#17351d]/10 bg-white/55 p-5 shadow-[0_18px_42px_rgba(8,36,18,0.12)] backdrop-blur-sm">
                                <div className="absolute -left-8 bottom-5 h-16 w-28 rounded-2xl bg-[#0d4b8f] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.12)]" />
                                <div className="absolute left-6 bottom-16 h-20 w-24 rounded-t-[1.4rem] bg-[#184f8d] shadow-[inset_0_-12px_18px_rgba(0,0,0,0.12)]" />
                                <div className="absolute left-10 top-10 h-16 w-16 rounded-full border-[10px] border-[#0f355f] bg-[#dfe8d3]" />
                                <div className="absolute right-10 top-8 h-20 w-20 rounded-full border-[12px] border-[#d88930] bg-[#fff8ee]" />
                                <div className="absolute right-3 bottom-6 h-24 w-10 rounded-full bg-[#f37c21] shadow-[inset_0_-8px_12px_rgba(0,0,0,0.16)]" />
                                <div className="absolute right-14 bottom-5 h-8 w-24 rounded-full bg-[#17351d]" />
                            </div>
                        </div>
                        <div className="relative z-10 max-w-md">
                            <span className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#17351d] shadow-sm">Dealer Network</span>
                            <h3 className="mt-7 text-4xl font-semibold leading-[0.98] tracking-[-0.03em] text-[#122316] sm:text-5xl">
                                Become a <span className="text-[#0d4b8f]">Dealer</span>
                            </h3>
                            <p className="mt-5 max-w-sm text-base leading-7 text-[#4f6248]">
                                Join our India-wide supply network, access genuine products, and grow a profitable agriculture business.
                            </p>
                            <span className="mt-8 inline-flex items-center gap-4 rounded-full bg-[#0d4b8f] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(13,75,143,0.24)]">
                                Become Dealer
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0d4b8f]">→</span>
                            </span>
                        </div>
                    </Link>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <Link href="#" className="group relative min-h-[150px] overflow-hidden rounded-[2rem] border border-[#0b3b1f]/10 bg-[#edf3e6] p-6 shadow-[0_20px_55px_rgba(8,36,18,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.14)]">
                            <div className="premium-orb premium-orb-delay absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#b8d8c2]" />
                            <div className="absolute bottom-4 right-5 flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-white/75 text-[#17351d] shadow-lg backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M7.2 8.05a.65.65 0 0 0-.65.65v6.35c0 .74.6 1.34 1.34 1.34h.48v1.58a1.03 1.03 0 1 0 2.06 0v-1.58h3.14v1.58a1.03 1.03 0 1 0 2.06 0v-1.58h.48c.74 0 1.34-.6 1.34-1.34V8.7a.65.65 0 0 0-.65-.65H7.2Zm2.16-3.2-.9-1.55a.43.43 0 0 1 .74-.43l.95 1.65a5.03 5.03 0 0 1 3.7 0l.95-1.65a.43.43 0 1 1 .74.43l-.9 1.55a4.55 4.55 0 0 1 2.21 3.03H7.15a4.55 4.55 0 0 1 2.21-3.03Zm-.67 5.92a.65.65 0 1 0 0-1.3.65.65 0 0 0 0 1.3Zm6.62 0a.65.65 0 1 0 0-1.3.65.65 0 0 0 0 1.3ZM4.04 8.82c-.57 0-1.04.46-1.04 1.04v4.3a1.04 1.04 0 1 0 2.08 0v-4.3c0-.58-.46-1.04-1.04-1.04Zm15.92 0c-.58 0-1.04.46-1.04 1.04v4.3a1.04 1.04 0 1 0 2.08 0v-4.3c0-.58-.46-1.04-1.04-1.04Z" />
                                </svg>
                            </div>
                            <div className="relative z-10 max-w-[14rem]">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#557044]">Download App</p>
                                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#17351d]">Get it on Google Play</h3>
                                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#17351d] px-4 py-2 text-xs font-black text-white">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M3 2.5v19l9.2-9.5L3 2.5z" fill="#00D4FF" />
                                        <path d="M12.2 12L3 2.5l13.2 7.2-4 2.3z" fill="#00A94F" />
                                        <path d="M3 21.5l9.2-9.5 4 2.3L3 21.5z" fill="#FFAA00" />
                                        <path d="M16.2 9.7l4.8 2.6c.7.4.7 1.4 0 1.8l-4.8 2.7L12.2 12l4-2.3z" fill="#FF3B30" />
                                    </svg>
                                    Play Store
                                </span>
                            </div>
                        </Link>

                        <Link href="#" className="group relative min-h-[150px] overflow-hidden rounded-[2rem] border border-[#0b3b1f]/10 bg-[#102313] p-6 text-white shadow-[0_20px_55px_rgba(8,36,18,0.12)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.18)]">
                            <div className="premium-orb premium-orb-slow absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
                            <div className="absolute bottom-4 right-5 flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-white/10 text-white backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M16.36 12.82c-.02-2.24 1.84-3.32 1.92-3.37-1.05-1.53-2.67-1.74-3.24-1.76-1.38-.14-2.68.8-3.38.8-.7 0-1.78-.78-2.93-.76-1.51.02-2.9.88-3.68 2.23-1.57 2.72-.4 6.75 1.13 8.95.75 1.08 1.64 2.3 2.81 2.25 1.13-.05 1.56-.73 2.92-.73 1.36 0 1.75.73 2.94.7 1.21-.02 1.98-1.1 2.72-2.18.86-1.26 1.22-2.48 1.24-2.54-.03-.02-2.38-.91-2.41-3.59ZM14.14 6.23c.62-.75 1.04-1.8.92-2.84-.89.04-1.97.59-2.61 1.34-.57.66-1.07 1.72-.94 2.74.99.08 2-.5 2.63-1.24Z" />
                                </svg>
                            </div>
                            <div className="relative z-10 max-w-[14rem]">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Download App</p>
                                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white">Download on App Store</h3>
                                <span className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-[#17351d]">App Store</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
