'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/products', label: 'Products' },
    { href: '/dealership', label: 'Dealership' },
    { href: '/contact', label: 'Contact' },
];

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileHidden, setMobileHidden] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const isMobileViewport = window.innerWidth < 768;

            setScrolled(currentScrollY > 10);

            if (!isMobileViewport || mobileOpen) {
                setMobileHidden(false);
                lastScrollY = currentScrollY;
                return;
            }

            if (currentScrollY <= 140) {
                setMobileHidden(false);
            } else if (currentScrollY > lastScrollY + 8) {
                setMobileHidden(true);
            } else if (currentScrollY < lastScrollY - 8) {
                setMobileHidden(false);
            }

            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [mobileOpen]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    return (
        <header
            className={`fixed top-4 left-0 right-0 z-50 px-4 md:px-8 transition-transform duration-300 ${mobileHidden ? '-translate-y-[140%] md:translate-y-0' : 'translate-y-0'}`}
        >
            <nav
                className={`flex items-center justify-between px-4 py-3 sm:px-6 max-w-7xl mx-auto w-full transition-all duration-500 rounded-2xl ${scrolled
                    ? 'bg-white/80 backdrop-blur-md border border-white/20 ring-1 ring-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] py-2.5'
                    : 'bg-white border border-gray-100/80 ring-4 ring-gray-50/50 shadow-sm py-4'
                    }`}
            >
                {/* Logo */}
                <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3 group">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl flex items-center justify-center shadow-cta transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <img
                            src="/images/veepeee logo.png"
                            alt="Veepee Impex Logo"
                            className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                        />
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-lg sm:text-xl font-bold tracking-tight text-text-primary leading-none group-hover:text-brand-primary transition-colors">
                            Veepee Impex
                        </span>
                        <span className="mt-1 hidden text-[10px] uppercase tracking-[0.2em] text-brand-primary font-bold sm:block">
                            Pan India Importer & Manufacturer
                        </span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-2 p-1 bg-gray-50/50 rounded-full border border-gray-100/50">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative group overflow-hidden ${pathname === link.href
                                ? 'text-white bg-brand-primary shadow-sm'
                                : 'text-text-secondary hover:text-brand-primary hover:bg-white'
                                }`}
                        >
                            <span className="relative z-10">{link.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <a
                        href="https://wa.me/917828832346"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Chat on WhatsApp"
                        className="w-11 h-11 rounded-full border border-gray-200 text-[#25D366] hover:border-[#25D366] hover:bg-[#25D366] hover:text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group bg-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12.04 2C6.52 2 2.04 6.48 2.04 12c0 1.77.46 3.43 1.26 4.88L2 22l5.27-1.28A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10S17.56 2 12.04 2Zm0 18.18c-1.53 0-3.03-.4-4.35-1.16l-.31-.18-3.13.76.84-3.05-.2-.32A8.11 8.11 0 1 1 12.04 20.18Zm4.45-6.08c-.24-.12-1.4-.69-1.62-.76-.22-.08-.38-.12-.54.12-.16.24-.62.76-.76.92-.14.16-.28.18-.52.06a6.63 6.63 0 0 1-1.95-1.2 7.32 7.32 0 0 1-1.35-1.68c-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z" />
                        </svg>
                    </a>
                    <Link
                        href="#"
                        className="relative px-7 py-3 rounded-full bg-gradient-to-b from-[#ffa43c] via-[#f5821f] to-[#e96a10] border border-[#ffbf7f] text-white text-[15px] font-extrabold tracking-tight hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group shadow-[0_10px_26px_rgba(233,106,16,0.35),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(186,78,9,0.45)]"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M3 2.5v19l9.2-9.5L3 2.5z" fill="#00D4FF" />
                                <path d="M12.2 12L3 2.5l13.2 7.2-4 2.3z" fill="#00A94F" />
                                <path d="M3 21.5l9.2-9.5 4 2.3L3 21.5z" fill="#FFAA00" />
                                <path d="M16.2 9.7l4.8 2.6c.7.4.7 1.4 0 1.8l-4.8 2.7L12.2 12l4-2.3z" fill="#FF3B30" />
                            </svg>
                            Get OXON App
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-text-primary hover:bg-brand-light transition-colors border border-gray-100"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" x2="20" y1="12" y2="12" />
                            <line x1="4" x2="20" y1="6" y2="6" />
                            <line x1="4" x2="20" y1="18" y2="18" />
                        </svg>
                    )}
                </button>

                {/* Mobile Dropdown */}
                <div
                    className={`${mobileOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-10 opacity-0 pointer-events-none'
                        } absolute top-[calc(100%+12px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-gray-100 p-6 flex flex-col gap-3 rounded-2xl shadow-2xl z-50 transition-all duration-300 md:hidden`}
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-base font-bold px-4 py-3 rounded-xl transition-all ${pathname === link.href
                                ? 'bg-brand-primary text-white shadow-md'
                                : 'text-text-primary hover:bg-brand-light hover:text-brand-primary'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        {/* WhatsApp Icon Button */}
                        <a
                            href="https://wa.me/917828832346"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-14 h-14 shrink-0 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm active:scale-95 transition-all"
                            aria-label="Contact on WhatsApp"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#25D366">
                                <path d="M12.04 2C6.52 2 2.04 6.48 2.04 12c0 1.77.46 3.43 1.26 4.88L2 22l5.27-1.28A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10S17.56 2 12.04 2Zm0 18.18c-1.53 0-3.03-.4-4.35-1.16l-.31-.18-3.13.76.84-3.05-.2-.32A8.11 8.11 0 1 1 12.04 20.18Zm4.45-6.08c-.24-.12-1.4-.69-1.62-.76-.22-.08-.38-.12-.54.12-.16.24-.62.76-.76.92-.14.16-.28.18-.52.06a6.63 6.63 0 0 1-1.95-1.2 7.32 7.32 0 0 1-1.35-1.68c-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z" />
                            </svg>
                        </a>

                        {/* Get OXON App Button */}
                        <Link
                            href="#"
                            className="flex-1 relative flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-gradient-to-b from-[#ffa43c] via-[#f5821f] to-[#e96a10] border border-[#ffbf7f] text-white text-base font-extrabold tracking-tight shadow-[0_10px_26px_rgba(233,106,16,0.3)] overflow-hidden active:scale-[0.98] transition-all"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M3 2.5v19l9.2-9.5L3 2.5z" fill="#00D4FF" />
                                    <path d="M12.2 12L3 2.5l13.2 7.2-4 2.3z" fill="#00A94F" />
                                    <path d="M3 21.5l9.2-9.5 4 2.3L3 21.5z" fill="#FFAA00" />
                                    <path d="M16.2 9.7l4.8 2.6c.7.4.7 1.4 0 1.8l-4.8 2.7L12.2 12l4-2.3z" fill="#FF3B30" />
                                </svg>
                                Get OXON App
                            </span>
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}
