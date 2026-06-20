'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api-base';
import { normalizeWebsiteImageUrl } from '@/lib/media-url';

const defaultPageHeroImages = [];

function getPageHeroIndex(pathname = '') {
    if (pathname === '/about') return 1;
    if (pathname === '/products' || pathname.startsWith('/products/') || pathname.startsWith('/category/')) return 2;
    if (pathname === '/dealership' || pathname === '/dealer-agreement' || pathname === '/dealer-pricing') return 3;
    if (pathname === '/contact') return 4;
    return 4;
}

export default function PageHero({ title, subtitle, showBackButton = true, backHref = '/', heroImages: initialHeroImages = defaultPageHeroImages }) {
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
        <section className="relative w-full bg-[#dfe8d3] px-4 pb-4 pt-4 sm:px-6 sm:pb-14 sm:pt-6 lg:px-7">
            <div className="relative min-h-[205px] w-full overflow-visible rounded-[1.55rem] bg-[linear-gradient(135deg,#17351d_0%,#0f2a16_48%,#dfe8d3_160%)] sm:min-h-[500px] sm:rounded-[2.4rem] lg:min-h-[560px] lg:rounded-[2.65rem]">
                {heroImage && (
                    <div
                        className="absolute inset-0 hidden rounded-[inherit] bg-cover bg-center md:block"
                        style={{ backgroundImage: `url('${heroImage}')` }}
                    />
                )}
                <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(2,18,7,0.70)_0%,rgba(4,28,12,0.46)_36%,rgba(2,15,7,0.82)_100%)]" />
                <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_38%,rgba(210,152,72,0.24),transparent_30%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.13),transparent_28%)]" />

                <div className="relative z-10 mx-auto flex min-h-[205px] max-w-5xl flex-col items-center justify-center px-5 pb-8 pt-24 text-center sm:min-h-[500px] sm:px-8 sm:pb-20 sm:pt-32 lg:min-h-[560px] lg:pb-24 lg:pt-36">
                    <h1 className="max-w-[12ch] break-words text-[clamp(1.9rem,9vw,2.45rem)] font-medium leading-[0.98] tracking-[-0.028em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.32)] sm:text-[clamp(3rem,8vw,6rem)]">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-3 max-w-[19rem] text-xs leading-5 text-white/76 sm:mt-6 sm:max-w-2xl sm:text-lg sm:leading-relaxed md:text-xl">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
