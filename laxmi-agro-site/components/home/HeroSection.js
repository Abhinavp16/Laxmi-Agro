'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';

const defaultHeroImages = ['/images/Banner/1.jpg', '/images/Banner/2.jpg', '/images/Banner/3.jpg', '/images/Banner/4.jpg', '/images/Banner/5.jpg'];

export default function HeroSection({ heroImages: initialHeroImages = defaultHeroImages }) {
    const PLAY_STORE_URL = '#';
    const [heroImages] = useState(initialHeroImages.length > 0 ? initialHeroImages : defaultHeroImages);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setActiveImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
        }, 30000);

        return () => clearInterval(intervalId);
    }, [heroImages.length]);

    return (
        <section className="px-4 md:px-8 pb-10 md:pb-12 pt-8 md:pt-6 max-w-7xl mx-auto">
            <div className="relative w-full min-h-[460px] sm:min-h-[700px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
                {heroImages.map((image, index) => (
                    <div
                        key={`${image}-${index}`}
                        className={`absolute inset-0 bg-black bg-cover bg-center bg-no-repeat transition-all duration-1000 group-hover:scale-110 ${activeImageIndex === index ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            backgroundImage: `url('${image}')`,
                        }}
                    />
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-[1]" />

                <div className="relative min-h-[460px] sm:min-h-[700px] md:h-[600px] flex flex-col justify-start sm:justify-center p-6 sm:p-8 md:p-16 text-white z-10">
                    <ScrollReveal className="max-w-2xl">
                        <div className="inline-flex max-w-full items-center gap-2 mb-5 sm:mb-6 px-3.5 sm:px-4 py-1.5 bg-brand-primary/20 backdrop-blur-md rounded-full border border-brand-primary/30">
                            <span className="w-2 h-2 bg-brand-primary animate-pulse rounded-full" />
                            <span className="text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.18em] sm:tracking-wider text-brand-primary uppercase">
                                Local-First Agri Commerce
                            </span>
                        </div>
                        <h1 className="max-w-[8ch] text-[2.6rem] sm:text-5xl md:text-8xl font-primary font-bold leading-[1.02] sm:leading-[1.1] mb-3 sm:mb-6 break-words">
                            Laxmi <br />
                            <span className="text-brand-primary">Agro</span>
                        </h1>
                        <p className="hidden sm:block text-[15px] sm:text-lg md:text-xl text-gray-300 max-w-md sm:max-w-lg mb-7 md:mb-10 leading-7 sm:leading-relaxed font-light">
                            White-label agriculture commerce platform for machinery, tools, irrigation systems, and dealer-led growth.
                        </p>
                        <div className="hidden sm:flex sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
                            <Link
                                href="/products"
                                className="relative w-full sm:w-auto justify-center px-7 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-full font-bold hover:shadow-[0_8px_25px_rgba(249,115,22,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 group/btn overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    Explore Products
                                    <svg className="group-hover/btn:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14" />
                                        <path d="m12 5 7 7-7 7" />
                                    </svg>
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                            </Link>
                            <Link
                                href="/about"
                                className="hidden sm:block w-full sm:w-auto text-center px-7 sm:px-8 py-3.5 sm:py-4 bg-white/5 backdrop-blur-md border border-white/20 text-white rounded-full font-bold hover:bg-white hover:text-brand-primary hover:border-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                            >
                                Our Legacy
                            </Link>
                        </div>
                    </ScrollReveal>

                    {/* Realistic Floating App CTA */}
                    <div className="hidden sm:block relative mt-8 md:mt-0 md:absolute md:bottom-6 md:left-4 md:right-4 lg:bottom-10 lg:left-auto lg:right-10 animate-fade-in-up z-20">
                        <div className="group relative">
                            {/* Ambient Glow */}
                            <div className="absolute -inset-4 bg-brand-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                            <div className="relative max-w-[320px] sm:max-w-none backdrop-blur-xl bg-white/10 lg:bg-white/5 border border-white/20 lg:border-white/10 p-3 sm:p-4 lg:p-4 pl-4 lg:pl-6 rounded-2xl lg:rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between lg:justify-start gap-3 sm:gap-4 lg:gap-8 shadow-2xl overflow-hidden transition-all duration-500 hover:translate-y-[-5px] hover:bg-white/10">
                                {/* Lens Flare Effect */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rotate-45 translate-x-16 -translate-y-16 group-hover:translate-x-12 transition-transform duration-1000"></div>

                                <div className="flex flex-col relative z-10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_#f97316]"></div>
                                        <span className="text-[9px] lg:text-[10px] text-white/70 lg:text-white/50 font-black uppercase tracking-[0.2em] leading-none">Mobile App</span>
                                    </div>
                                    <h4 className="text-white font-bold text-base lg:text-lg tracking-tight leading-none">Laxmi Agro</h4>
                                    <p className="text-brand-primary/90 lg:text-brand-primary/80 text-[10px] lg:text-[11px] font-bold mt-1 tracking-wide leading-none font-secondary">Stay connected on the go</p>
                                </div>

                                <a
                                    href={PLAY_STORE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Get the Laxmi Agro app on Google Play"
                                    className="relative z-10 bg-white text-gray-900 w-full sm:w-auto px-4 sm:px-5 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl flex items-center justify-center gap-2 lg:gap-3 border border-gray-200 hover:bg-orange-50 transition-all hover:shadow-[0_10px_25px_rgba(255,255,255,0.2)] group/play"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] group-hover/play:scale-110 transition-transform duration-500">
                                        <path d="M3 2.5v19l9.2-9.5L3 2.5z" fill="#00D4FF" />
                                        <path d="M12.2 12L3 2.5l13.2 7.2-4 2.3z" fill="#00A94F" />
                                        <path d="M3 21.5l9.2-9.5 4 2.3L3 21.5z" fill="#FFAA00" />
                                        <path d="M16.2 9.7l4.8 2.6c.7.4.7 1.4 0 1.8l-4.8 2.7L12.2 12l4-2.3z" fill="#FF3B30" />
                                    </svg>
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-[9px] lg:text-[10px] text-gray-500 font-bold uppercase tracking-tight">Get it on</span>
                                        <span className="text-xs lg:text-sm font-black tracking-tight">Google Play</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sm:hidden mt-4 flex flex-col gap-4">
                <Link
                    href="/products"
                    className="relative w-full justify-center px-7 py-3.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-full font-bold hover:shadow-[0_8px_25px_rgba(249,115,22,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 group/btn overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        Explore Products
                        <svg className="group-hover/btn:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                </Link>

                <div className="group relative">
                    <div className="absolute -inset-4 bg-brand-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                    <div className="relative w-full backdrop-blur-xl bg-black/95 border border-white/10 p-3 pl-4 rounded-2xl flex flex-col items-stretch justify-between gap-3 shadow-2xl overflow-hidden transition-all duration-500 hover:translate-y-[-5px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rotate-45 translate-x-16 -translate-y-16 group-hover:translate-x-12 transition-transform duration-1000"></div>

                        <div className="flex flex-col relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_#f97316]"></div>
                                <span className="text-[9px] text-white/70 font-black uppercase tracking-[0.2em] leading-none">Mobile App</span>
                            </div>
                            <h4 className="text-white font-bold text-base tracking-tight leading-none">Laxmi Agro</h4>
                            <p className="text-brand-primary/90 text-[10px] font-bold mt-1 tracking-wide leading-none font-secondary">Stay connected on the go</p>
                        </div>

                        <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Get the Laxmi Agro app on Google Play"
                            className="relative z-10 bg-white text-gray-900 w-full px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 border border-gray-200 hover:bg-orange-50 transition-all hover:shadow-[0_10px_25px_rgba(255,255,255,0.2)] group/play"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] group-hover/play:scale-110 transition-transform duration-500">
                                <path d="M3 2.5v19l9.2-9.5L3 2.5z" fill="#00D4FF" />
                                <path d="M12.2 12L3 2.5l13.2 7.2-4 2.3z" fill="#00A94F" />
                                <path d="M3 21.5l9.2-9.5 4 2.3L3 21.5z" fill="#FFAA00" />
                                <path d="M16.2 9.7l4.8 2.6c.7.4.7 1.4 0 1.8l-4.8 2.7L12.2 12l4-2.3z" fill="#FF3B30" />
                            </svg>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Get it on</span>
                                <span className="text-xs font-black tracking-tight">Google Play</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
