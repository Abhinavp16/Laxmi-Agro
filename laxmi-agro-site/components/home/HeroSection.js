'use client';
import Link from 'next/link';
import { useState } from 'react';

const referenceHeroImage = '/images/hero-rice-terraces.jpg';
const defaultHeroImages = [referenceHeroImage, '/images/Banner/1.jpg', '/images/Banner/2.jpg', '/images/Banner/3.jpg', '/images/Banner/4.jpg', '/images/Banner/5.jpg'];

const navLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/about', label: 'Who We Are' },
    { href: '/products', label: 'Products' },
    { href: '/dealership', label: 'Dealership' },
];

const partnerLogos = [
    { label: 'Laxmi Agro', image: '/favicon-rounded.svg' },
    { label: 'Ecotech', image: '/images/ecotech.jpeg' },
    { label: 'Kargill', image: '/images/kargill.jpeg' },
    { label: 'Green Valley' },
    { label: 'Harit' },
    { label: 'Shivnath' },
];

export default function HeroSection({ heroImages: initialHeroImages = defaultHeroImages }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const heroImage = referenceHeroImage;

    return (
        <section className="relative w-full bg-[#dfe8d3] px-4 pb-10 pt-4 sm:px-6 sm:pb-14 sm:pt-6 lg:px-7 lg:pb-20 lg:pt-7">
            <div className="relative w-full">
                <div className="relative min-h-[520px] w-full overflow-visible rounded-[2rem] bg-[#102313] sm:min-h-[660px] sm:rounded-[2.4rem] lg:min-h-[690px] lg:rounded-[2.65rem]">
                    <div
                        className="absolute inset-0 rounded-[inherit] bg-cover bg-center transition-transform duration-700"
                        style={{ backgroundImage: `url('${heroImage}')` }}
                    />
                    <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(2,18,7,0.62)_0%,rgba(4,28,12,0.38)_30%,rgba(3,22,9,0.30)_54%,rgba(2,15,7,0.72)_100%)]" />
                    <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_58%,rgba(210,152,72,0.34),transparent_26%),radial-gradient(circle_at_50%_6%,rgba(255,255,255,0.14),transparent_26%)]" />

                    <nav className="relative z-20 flex items-center justify-between px-5 py-6 text-white sm:px-8 lg:px-10 lg:py-8">
                        <Link href="/" className="group flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#123b1f] shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:h-14 sm:w-14">
                                <img src="/favicon-rounded.svg" alt="Laxmi Agro" className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
                            </span>
                            <span className="text-xl font-semibold tracking-[-0.04em] text-white sm:text-2xl">Laxmi Agro</span>
                        </Link>

                        <div className="hidden items-center gap-8 text-[15px] font-medium text-white/95 lg:flex">
                            {navLinks.map((link) => (
                                <Link key={`${link.href}-${link.label}`} href={link.href} className="transition-colors hover:text-[#dfe8d3]">
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className="hidden items-center lg:flex">
                            <Link href="/contact" className="group flex items-center rounded-full bg-white p-1 pl-6 text-[15px] font-medium text-[#172315] shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5">
                                Contact Us
                                <span className="ml-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#17351d]/20 bg-[#f7faf2] text-[#17351d] transition-colors group-hover:bg-[#17351d] group-hover:text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14" />
                                        <path d="M13 6l6 6-6 6" />
                                    </svg>
                                </span>
                            </Link>
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
                        <h1 className="max-w-[12.5ch] text-[clamp(3rem,8vw,6.2rem)] font-medium leading-[0.96] tracking-[-0.075em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.32)] sm:max-w-[15ch]">
                            The Next Generation of Farming is Here
                        </h1>
                    </div>

                    <div className="absolute -bottom-10 left-1/2 z-20 flex h-28 w-28 -translate-x-1/2 items-center justify-center rounded-full bg-[#06120a] text-white shadow-[0_24px_60px_rgba(0,0,0,0.34)] sm:-bottom-14 sm:h-36 sm:w-36">
                        <svg className="absolute inset-0 h-full w-full animate-spin-slow" viewBox="0 0 140 140" aria-hidden="true">
                            <defs>
                                <path id="hero-scroll-text" d="M70,70 m-53,0 a53,53 0 1,1 106,0 a53,53 0 1,1 -106,0" />
                            </defs>
                            <text className="fill-white text-[12px] font-medium uppercase tracking-[0.22em]">
                                <textPath href="#hero-scroll-text">Smart Farming Explore More About</textPath>
                            </text>
                        </svg>
                        <div className="flex h-9 w-6 items-start justify-center rounded-full border border-white/60 pt-2 sm:h-11 sm:w-7">
                            <span className="h-2 w-px rounded-full bg-white/80" />
                        </div>
                    </div>
                </div>

                <div className="pt-24 sm:pt-28 lg:pt-32">
                    <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#0f341d]/10 bg-[#ecf2e5]/70 px-5 py-3 text-sm font-medium text-[#18351d] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                        <img src="/favicon-rounded.svg" alt="" className="h-6 w-6 object-contain" />
                        Trusted by Agriculture Dealers
                    </div>

                    <div className="mx-auto mt-16 flex max-w-6xl items-center justify-center gap-9 overflow-hidden text-[#122516] sm:gap-12 lg:gap-16">
                        {partnerLogos.map((partner, index) => (
                            <div key={`${partner.label}-${index}`} className={`flex shrink-0 items-center gap-2 ${index === 0 || index === partnerLogos.length - 1 ? 'opacity-20' : 'opacity-80'}`}>
                                {partner.image ? (
                                    <img src={partner.image} alt={partner.label} className="h-8 w-8 rounded-full object-contain grayscale" />
                                ) : (
                                    <span className="h-7 w-7 rounded-full border-2 border-current opacity-70" />
                                )}
                                <span className="whitespace-nowrap text-xl font-black tracking-[-0.06em] sm:text-2xl">{partner.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
