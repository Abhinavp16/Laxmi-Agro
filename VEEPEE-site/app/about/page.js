import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'About Us - Veepee Impex',
    description: 'Learn about Veepee Impex, a leading partnership firm based in Raipur, Chhattisgarh. Since 2023, empowering Indian farmers with Oxon heavy machinery and professional power tools.',
};

const values = [
    {
        title: 'Our Origin',
        description:
            'Our voyage commenced with a distinct and impactful vision: to fortify farmers with next-generation technology, elevating their efficiency, eco-friendliness, and profitability. This humble inception has transformed into a dynamic force, reshaping the agricultural landscape across India.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.77 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6" />
            </svg>
        ),
    },
    {
        title: 'Our Purpose',
        description:
            'At Veepee Impex, our mission is to equip farmers with the necessary tools, assisting them in confronting challenges and seizing prospects. We advocate a blend of ancestral knowledge with modern innovation, setting the stage for the zenith of agricultural potential.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 12-4-4-4 4" />
                <path d="M12 16V8" />
            </svg>
        ),
    },
    {
        title: 'Our Brigade',
        description:
            'Every masterpiece created is a testament to our passionate group of experts, dedicated to revolutionizing farming. From engineers to designers, from agricultural mavens to tech wizards, our diverse squad collaborates to conceive machinery that doesn\'t just meet but elevates industry benchmarks.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        title: 'Our Pledge',
        description:
            'Our dedication transcends mere machinery. We envision a fraternity of enlightened, empowered, and supported farmers. We aren\'t in the game merely to market machines; we aim to establish enduring bonds guided by our commitment to top-tier quality, unparalleled safety, and steadfast sustainability.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        ),
    },
    {
        title: 'Innovation at the Core',
        description:
            'Progressive and innovative thinking is at the heart of everything we do. We embrace the latest technologies to create machinery that optimizes resource utilization, minimizes environmental impact, and maximizes yields. By combining data-driven insights with traditional farming wisdom, we\'re ushering in a new era of precision and productivity.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4" />
                <path d="m6.8 15-3.5 2" />
                <path d="m20.7 7-3.5 2" />
                <path d="M6.8 9 3.3 7" />
                <path d="m20.7 17-3.5-2" />
                <circle cx="12" cy="12" r="4" />
            </svg>
        ),
    },
    {
        title: 'Embark with Us',
        description:
            'Journey with us into a transformative approach. Whether you\'re an agricultural virtuoso or a budding enthusiast, Veepee Impex stands by your ambitions. Our tools signify more than machinery — they represent progress. Let\'s collaboratively sow seeds for a flourishing future.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
        ),
    },
];

export default function AboutPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="About Us"
                subtitle="Your Partner in Agricultural Excellence — blending innovative technology with unwavering dedication to Indian farming."
                breadcrumbItems={['About Us']}
            />

            {/* Welcome Section */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <ScrollReveal>
                        <div className="w-12 h-1 bg-brand-primary mb-6" />
                        <h2 className="text-4xl md:text-5xl font-primary font-bold text-text-primary mb-8 leading-tight">
                            Welcome to Veepee Impex!
                        </h2>
                        <p className="text-text-secondary text-lg mb-6 leading-relaxed">
                            Veepee Impex isn&apos;t merely a brand; we&apos;re a devoted ally in your pursuit of agricultural brilliance, blending innovative technology with unwavering dedication.
                        </p>
                        <p className="text-text-secondary text-lg mb-6 leading-relaxed">
                            As we perceive the changing demands of contemporary farming, we emerge as trendsetters, redefining agricultural machinery methods. We are a leading Partnership firm based in Raipur, Chhattisgarh, established in 2023.
                        </p>
                        <p className="text-text-secondary text-lg leading-relaxed">
                            We have established ourselves as a powerhouse in the wholesale, distribution, and retail of essential Agriculture and Power tools machinery across Pan India.
                        </p>

                        <div className="mt-10 p-6 bg-neutral-surface rounded-2xl border border-gray-100">
                            <h3 className="text-xl font-bold text-text-primary mb-4">Business Snapshot</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <p className="text-text-secondary"><span className="font-semibold text-text-primary">Type:</span> Importer and Manufacturer</p>
                                <p className="text-text-secondary sm:col-span-2"><span className="font-semibold text-text-primary">Partners:</span> Pitambar Gupta, Jhanvi Gupta, Vaibhav Banka</p>
                                <p className="text-text-secondary sm:col-span-2"><span className="font-semibold text-text-primary">Address:</span> C-15/16, Sector-4, Devendra Nagar, Raipur, Chhattisgarh - 492001</p>
                            </div>
                        </div>

                        <div className="mt-10 flex items-center gap-6 p-6 bg-brand-light/50 rounded-2xl border border-brand-primary/10">
                            <div className="text-brand-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-text-primary">Business Hours</p>
                                <p className="text-sm text-text-secondary">Mon-Fri: 10:00 AM – 7:00 PM | Saturday: 10:00 AM – 6:00 PM</p>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal className="relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 min-h-0 sm:min-h-[620px]">
                            <div className="space-y-4">
                                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-1">Pan India Reach</p>
                                    <p className="text-sm font-semibold text-text-primary">Trusted supply network for retail and wholesale demand.</p>
                                </div>
                                <img
                                    src="/images/about/front.jpeg"
                                    className="rounded-2xl shadow-lg w-full h-auto object-contain object-center"
                                    alt="Industrial Tools"
                                />
                                <img
                                    src="/images/about/partners.jpeg"
                                    className="rounded-2xl shadow-lg w-full h-auto object-contain object-center"
                                    alt="Veepee Impex office"
                                />
                                <div className="bg-brand-primary p-6 rounded-2xl text-white">
                                    <p className="text-3xl font-bold italic mb-1">30 years + Experience</p>
                                </div>
                                <div className="bg-[#1d4ed8] p-6 rounded-2xl text-white">
                                    <p className="text-3xl font-bold italic mb-1">Fast Dispatch</p>
                                    <p className="text-xs uppercase tracking-tighter opacity-80">With in 24 hrs</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-gray-900 p-8 rounded-2xl text-white text-center">
                                    <p className="text-4xl font-bold mb-2">4.9+</p>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Industry Rating</p>
                                </div>
                                <img
                                    src="/images/about/godown.png"
                                    className="rounded-2xl shadow-lg w-full h-auto sm:h-[300px] object-contain object-center sm:object-cover"
                                    alt="Warehouse"
                                />
                                <img
                                    src="/images/Banner/1.jpg"
                                    className="rounded-2xl shadow-lg w-full h-auto sm:h-[200px] object-contain object-center sm:object-cover"
                                    alt="Product"
                                />
                                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-primary mb-1">Core Team</p>
                                    <p className="text-sm font-semibold text-text-primary">Built by experienced partners focused on quality and service.</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -z-10 -bottom-10 -right-10 w-48 h-48 bg-brand-light rounded-full blur-3xl" />
                    </ScrollReveal>
                </div>
            </section>

            {/* Values Grid - Inspired by HeavyTech's Our Origin/Purpose/Brigade/Pledge */}
            <section className="py-24 bg-neutral-surface">
                <div className="max-w-7xl mx-auto px-6">
                    <ScrollReveal className="text-center mb-16">
                        <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">What Drives Us</h2>
                        <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">Our Values & Vision</h3>
                        <div className="w-24 h-1.5 bg-brand-primary mx-auto mt-6 rounded-full" />
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {values.map((value, i) => (
                            <ScrollReveal key={i} delay={i * 100}>
                                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-primary/30 transition-all h-full group">
                                    <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center text-brand-primary mb-6 group-hover:bg-brand-primary group-hover:text-white transition-all">
                                        {value.icon}
                                    </div>
                                    <h4 className="text-xl font-bold text-text-primary mb-4">{value.title}</h4>
                                    <p className="text-text-secondary leading-relaxed">{value.description}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gray-900 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px]" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-5xl font-primary font-bold text-white mb-8 leading-tight">
                            Thank you for choosing Veepee Impex as your partner in agricultural excellence.
                        </h2>
                        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                            Let&apos;s cultivate success together. Whether you&apos;re looking for premium machinery or want to join our dealer network, we&apos;re here for you.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="/contact"
                                className="px-8 py-4 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-secondary transition-all shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] flex items-center gap-3"
                            >
                                Contact Us
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </a>
                            <a
                                href="/dealership"
                                className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold hover:bg-white/20 transition-all"
                            >
                                Become a Dealer
                            </a>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}
