import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white pt-12 pb-6 px-6 overflow-hidden relative border-t border-gray-800/50">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-5 blur-[120px]" />
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10 border-b border-gray-800/30 pb-10">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-primary font-semibold mb-4 leading-tight">
                            Empowering Indian Agriculture with Heavy Machinery
                        </h2>
                        <div className="mt-6 space-y-4">
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">GST-22AAXFV7313A1Z8</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                                            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                                            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">IEC-AAXFV7313A</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">7828832346 / 8962732346</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="20" height="16" x="2" y="4" rx="2" />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">vepemisc@gmail.com</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-400 text-base leading-relaxed max-w-lg">
                            Veepee Impex: Your trusted partner for cutting-edge power tools and irrigation systems. Delivering quality across India.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="mailto:vepemisc@gmail.com"
                                className="px-5 py-2.5 bg-white/5 hover:bg-white text-white hover:text-black rounded-full text-sm font-semibold transition-all duration-300 border border-white/10 flex items-center gap-2"
                            >
                                Email Us
                            </a>
                            <a
                                href="tel:7828832346"
                                className="px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-brand-primary/20"
                            >
                                Call Now
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    {/* Follow Us Section */}
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Follow Us</span>
                        <div className="flex gap-5">
                            {[
                                { name: 'facebook', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z', href: 'https://www.facebook.com/people/Veepee-Impex/61579229665820' },
                                { name: 'instagram', icon: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z', href: 'https://www.instagram.com/veepeeimpex_oxon?igsh=MTZtenV0aW15dWdvbA%3D%3D&utm_source=qr' },
                                { name: 'youtube', icon: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17', href: 'http://www.youtube.com/@Veepee-Impex' }
                            ].map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-brand-primary hover:border-brand-primary hover:text-white text-gray-400 transition-all duration-300 cursor-pointer group hover:-translate-y-1.5 shadow-lg hover:shadow-brand-primary/20"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d={social.icon} />
                                        {social.name === 'instagram' && (
                                            <>
                                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                            </>
                                        )}
                                        {social.name === 'youtube' && <path d="m10 15 5-3-5-3z" />}
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="w-full flex flex-col lg:flex-row justify-between items-center gap-6 border-t border-gray-800/20 pt-8 mt-2">
                        <div className="flex flex-col items-center lg:items-start">
                            <span className="text-xl font-bold tracking-tight text-white mb-1">Veepee <span className="text-brand-primary">Impex</span></span>
                            <p className="text-[10px] text-gray-500 font-medium tracking-wide">
                                C-15/16, Sector-4, Devendra Nagar, Raipur, Chhattisgarh - 492001
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] md:text-[11px] text-gray-500 font-semibold uppercase tracking-widest whitespace-nowrap">
                            {[
                                { name: 'Terms', href: '/terms' },
                                { name: 'Privacy', href: '/privacy' },
                                { name: 'Shipping', href: '/shipping' },
                                { name: 'Refund', href: '/refund' },
                                { name: 'Warranty', href: '/warranty' },
                                { name: 'Dealer', href: '/dealer-agreement' },
                                { name: 'Pricing', href: '/dealer-pricing' }
                            ].map((item) => (
                                <Link key={item.name} href={item.href} className="hover:text-brand-primary transition-colors">
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center text-[10px] text-gray-600 font-medium">
                    <p suppressHydrationWarning>© {new Date().getFullYear()} Veepee Impex. All rights reserved. GST: 22AAXFV7313A1Z8</p>
                </div>
            </div>
        </footer>
    );
}
