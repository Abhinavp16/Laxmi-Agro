'use client';
import ScrollReveal from '@/components/ScrollReveal';
import { buildContactFormMessage, buildWhatsAppUrl } from '@/lib/inquiry';

export default function ContactSection() {
    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const message = buildContactFormMessage({
            name: formData.get('name')?.toString().trim() || '',
            email: '',
            phone: formData.get('phone')?.toString().trim() || '',
            category: formData.get('category')?.toString().trim() || '',
            message: formData.get('message')?.toString().trim() || '',
        });

        window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
        e.currentTarget.reset();
    };

    return (
        <section id="contact" className="py-16 sm:py-24 bg-gray-900 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 items-center">
                    <ScrollReveal>
                        <div className="inline-block px-4 py-2 border border-brand-primary/30 rounded-lg text-brand-primary font-bold text-xs sm:text-sm mb-5 sm:mb-6 uppercase tracking-[0.24em] sm:tracking-widest">
                            Connect with Experts
                        </div>
                        <h2 className="max-w-[11ch] text-4xl sm:text-5xl font-primary font-bold text-white mb-6 sm:mb-8 leading-[1.05] sm:leading-tight break-words">
                            Ready to boost your productivity?
                        </h2>

                        <div className="space-y-7 sm:space-y-10">
                            <div className="flex items-start gap-4 sm:gap-6">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold uppercase mb-1">Direct Sales Helpline</p>
                                    <p className="text-xl sm:text-2xl font-bold text-white leading-tight break-words">7828832346 / 8962732346</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 sm:gap-6">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold uppercase mb-1">Official Correspondance</p>
                                    <p className="text-lg sm:text-2xl font-bold text-white italic underline decoration-brand-primary underline-offset-8 decoration-2 break-all">
                                        vepemisc@gmail.com
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 sm:gap-6">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold uppercase mb-1">Registered Address</p>
                                    <p className="text-base sm:text-lg text-white font-medium opacity-80">
                                        Devendra Nagar, Raipur, CG - 492001
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative">
                            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            suppressHydrationWarning
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900"
                                            placeholder="Priya Sharma"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            suppressHydrationWarning
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900"
                                            placeholder="+91 98765 12345"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category of Interest</label>
                                    <select name="category" suppressHydrationWarning className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900 appearance-none">
                                        <option>Personal Use</option>
                                        <option>Bulk Inquiry</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Your Message</label>
                                    <textarea
                                        name="message"
                                        suppressHydrationWarning
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-gray-900 min-h-[120px]"
                                        placeholder="I want details for a water pump suitable for irrigation use near Durg."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="relative w-full py-5 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl font-bold hover:from-brand-primary hover:to-brand-secondary transition-all duration-300 shadow-xl active:scale-[0.98] overflow-hidden group/submit"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Send Inquiry
                                        <svg className="group-hover/submit:translate-x-1 group-hover/submit:-translate-y-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                    </span>
                                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/submit:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                                </button>
                            </form>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}
