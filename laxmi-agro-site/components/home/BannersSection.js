import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { AndroidIcon } from '@hugeicons/core-free-icons';

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
                        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#f2ad63]/65" />
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
                            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#b8d8c2]" />
                            <div className="absolute bottom-4 right-5 flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-white/75 text-[#17351d] shadow-lg backdrop-blur-sm">
                                <HugeiconsIcon icon={AndroidIcon} size={40} strokeWidth={1.8} />
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
                            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
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
