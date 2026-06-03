'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ContactMorphButton from '@/components/ContactMorphButton';
import { getApiBaseUrl } from '@/lib/api-base';
import { normalizeWebsiteImageUrl } from '@/lib/media-url';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/products', label: 'Products' },
    { href: '/dealership', label: 'Dealership' },
    { href: '/contact', label: 'Contact Us' },
];

const defaultPageHeroImages = [];

function getPageHeroIndex(pathname = '') {
    if (pathname === '/about') return 1;
    if (pathname === '/products' || pathname.startsWith('/products/') || pathname.startsWith('/category/')) return 2;
    if (pathname === '/dealership' || pathname === '/dealer-agreement' || pathname === '/dealer-pricing') return 3;
    if (pathname === '/contact') return 4;
    return 4;
}

export default function PageHero({ title, subtitle, showBackButton = true, backHref = '/', heroImages: initialHeroImages = defaultPageHeroImages }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const [heroImages, setHeroImages] = useState(Array.isArray(initialHeroImages) ? initialHeroImages : defaultPageHeroImages);
    const heroIndex = heroImages.length > 0 ? Math.min(getPageHeroIndex(pathname), heroImages.length - 1) : 0;
    const heroImage = heroImages[heroIndex] || '';

    useEffect(() => {
        let cancelled = false;

        async function loadHeroImages() {
            try {
                const response = await fetch(`${getApiBaseUrl()}/settings/website-content`, { cache: 'no-store' });
                if (!response.ok) return;

                const json = await response.json();
                const uploadedImages = Array.isArray(json?.data?.heroCards)
                    ? json.data.heroCards
                        .map((card) => normalizeWebsiteImageUrl(card?.image))
                    : [];

                if (!cancelled && uploadedImages.length > 0) {
                    setHeroImages(uploadedImages);
                }
            } catch {
                // Keep the local fallback when hosted content is unavailable.
            }
        }

        loadHeroImages();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className="relative w-full bg-[#dfe8d3] px-4 pb-10 pt-4 sm:px-6 sm:pb-14 sm:pt-6 lg:px-7">
            <div className="relative min-h-[430px] w-full overflow-visible rounded-[2rem] bg-[linear-gradient(135deg,#17351d_0%,#0f2a16_48%,#dfe8d3_160%)] sm:min-h-[500px] sm:rounded-[2.4rem] lg:min-h-[560px] lg:rounded-[2.65rem]">
                {heroImage && (
                    <div
                        className="absolute inset-0 rounded-[inherit] bg-cover bg-center"
                        style={{ backgroundImage: `url('${heroImage}')` }}
                    />
                )}
                <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(2,18,7,0.70)_0%,rgba(4,28,12,0.46)_36%,rgba(2,15,7,0.82)_100%)]" />
                <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_38%,rgba(210,152,72,0.24),transparent_30%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.13),transparent_28%)]" />

                <nav className="relative z-20 flex items-center justify-between px-5 py-6 text-white sm:px-8 lg:px-10 lg:py-8">
                    <Link href="/" className="group flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f8f5e9] text-[#123b1f] shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:h-14 sm:w-14">
                            <img src="/favicon-rounded.png" alt="Laxmi Agro" className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11" />
                        </span>
                        <span className="text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">Laxmi Agro</span>
                    </Link>

                    <div className="hidden items-center gap-8 text-[15px] font-medium text-white/95 lg:flex">
                        {navLinks.map((link) => (
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
                        {navLinks.map((link) => (
                            <Link key={`${link.href}-${link.label}-mobile`} href={link.href} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#17351d] hover:bg-[#dfe8d3]">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}

                <div className="relative z-10 mx-auto flex min-h-[265px] max-w-5xl flex-col items-center justify-center px-5 pb-16 pt-6 text-center sm:min-h-[330px] sm:px-8 sm:pb-20 lg:min-h-[365px] lg:pb-24">
                    <h1 className="max-w-[12ch] break-words text-[clamp(3rem,8vw,6rem)] font-medium leading-[0.98] tracking-[-0.028em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.32)]">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-6 max-w-2xl text-base leading-7 text-white/76 sm:text-lg sm:leading-relaxed md:text-xl">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
