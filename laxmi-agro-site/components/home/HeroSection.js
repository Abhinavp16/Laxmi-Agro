'use client';
import Link from 'next/link';
import { useState } from 'react';
import ContactMorphButton from '@/components/ContactMorphButton';

const referenceHeroImage = '/images/hero-rice-terraces.jpg';
const defaultHeroImages = [referenceHeroImage, '/images/Banner/1.jpg', '/images/Banner/2.jpg', '/images/Banner/3.jpg', '/images/Banner/4.jpg', '/images/Banner/5.jpg'];

const navLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/products', label: 'Products' },
    { href: '/dealership', label: 'Dealership' },
];

const partnerLogos = [
    { label: 'Laxmi Agro' },
    { label: 'Green Valley' },
    { label: 'Harit' },
    { label: 'Shivnath' },
];

export default function HeroSection({ heroImages: initialHeroImages = defaultHeroImages }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const heroImages = Array.isArray(initialHeroImages) ? initialHeroImages : defaultHeroImages;
    const heroImage = heroImages[0] || '';

    return (
        <section className="relative w-full bg-[#dfe8d3] px-4 pb-10 pt-4 sm:px-6 sm:pb-14 sm:pt-6 lg:px-7 lg:pb-20 lg:pt-7">
            <div className="relative w-full">
                <div className="relative min-h-[520px] w-full overflow-visible rounded-[2rem] bg-[linear-gradient(135deg,#17351d_0%,#0f2a16_48%,#dfe8d3_160%)] sm:min-h-[660px] sm:rounded-[2.4rem] lg:min-h-[690px] lg:rounded-[2.65rem]">
                    {heroImage && (
                        <div
                            className="absolute inset-0 rounded-[inherit] bg-cover bg-center"
                            style={{ backgroundImage: `url('${heroImage}')` }}
                        />
                    )}
                    <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(2,18,7,0.62)_0%,rgba(4,28,12,0.38)_30%,rgba(3,22,9,0.30)_54%,rgba(2,15,7,0.72)_100%)]" />
                    <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_58%,rgba(210,152,72,0.34),transparent_26%),radial-gradient(circle_at_50%_6%,rgba(255,255,255,0.14),transparent_26%)]" />

                    <nav className="relative z-20 flex items-center justify-between px-5 py-6 text-white sm:px-8 lg:px-10 lg:py-8">
                        <Link href="/" className="group flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f8f5e9] text-[#123b1f] shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:h-14 sm:w-14">
                                <img src="/favicon-rounded.png" alt="Laxmi Agro" className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11" />
                            </span>
                            <span className="text-xl font-semibold tracking-[-0.04em] text-white sm:text-2xl">Laxmi Agro</span>
                        </Link>

                        <div className="hidden items-center gap-8 text-[15px] font-medium text-white/95 lg:flex">
                            {[...navLinks, { href: '/contact', label: 'Contact Us' }].map((link) => (
                                <Link key={`${link.href}-${link.label}`} href={link.href} className="transition-colors hover:text-[#dfe8d3]">
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className="hidden items-center lg:flex">
                            <ContactMorphButton />
                        </div>

                        <button
                            type="button"
                            onClick={() => setMobileOpen((open) => !open)}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#17351d] shadow-[0_16px_36px_rgba(0,0,0,0.18)] lg:hidden"
                            aria-label="Toggle menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                            </svg>
                        </button>
                    </nav>

                    {mobileOpen && (
                        <div className="absolute left-6 right-6 top-24 z-30 rounded-[1.6rem] border border-white/20 bg-[#f7faf2]/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
                            {[...navLinks, { href: '/contact', label: 'Contact Us' }].map((link) => (
                                <Link key={`${link.href}-${link.label}-mobile`} href={link.href} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#17351d] hover:bg-[#dfe8d3]">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="relative z-10 mx-auto flex min-h-[345px] max-w-6xl flex-col items-center justify-center px-5 pb-28 pt-10 text-center sm:min-h-[470px] sm:px-8 sm:pb-32 lg:min-h-[485px] lg:pb-28 lg:pt-12">
                        <h1 className="max-w-[12.5ch] text-[clamp(3rem,8vw,6.2rem)] font-medium leading-[0.96] tracking-[-0.028em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.32)] sm:max-w-[15ch]">
                            The Next Generation of Farming is Here
                        </h1>
                    </div>

                    <div className="absolute -bottom-10 left-1/2 z-20 flex h-28 w-28 -translate-x-1/2 items-center justify-center rounded-full bg-[#06120a]/92 text-white shadow-[0_24px_60px_rgba(0,0,0,0.34)] sm:-bottom-14 sm:h-36 sm:w-36">
                        <svg className="absolute inset-0 h-full w-full animate-spin-slow" viewBox="0 0 140 140" aria-hidden="true">
                            <defs>
                                <path id="hero-scroll-text" d="M70,70 m-53,0 a53,53 0 1,1 106,0 a53,53 0 1,1 -106,0" />
                            </defs>
                            <text className="fill-white text-[12px] font-medium uppercase tracking-[0.22em]">
                                <textPath href="#hero-scroll-text">Smart Farming Explore More About</textPath>
                            </text>
                        </svg>
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f8f5e9] shadow-[0_10px_26px_rgba(0,0,0,0.25)] sm:h-16 sm:w-16">
                            <img src="/favicon-rounded.png" alt="Laxmi Agro" className="h-10 w-10 rounded-full object-contain sm:h-12 sm:w-12" />
                        </div>
                    </div>
                </div>

                <div className="pt-20 sm:pt-24 lg:pt-28">
                    <div className="relative mx-auto max-w-6xl overflow-hidden text-[#122516] [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
                        <div className="brand-marquee-track flex w-max items-center gap-10 sm:gap-14 lg:gap-18">
                            {[...partnerLogos, ...partnerLogos].map((partner, index) => (
                                <div key={`${partner.label}-${index}`} className="shrink-0 rounded-full bg-[#edf3e6]/60 px-6 py-3 text-[#17351d]/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                                    <span className="whitespace-nowrap text-xl font-black tracking-[-0.018em] sm:text-2xl">{partner.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="mt-7 text-center text-xl font-medium tracking-[-0.018em] text-[#17351d] sm:text-2xl">
                        Our Trusted Brands
                    </p>
                </div>
            </div>
        </section>
    );
}
