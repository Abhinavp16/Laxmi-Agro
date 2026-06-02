'use client';
import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';
import { buildContactFormMessage, buildWhatsAppUrl } from '@/lib/inquiry';

export default function ContactPage() {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const message = buildContactFormMessage({
            name: formData.get('name')?.toString().trim() || '',
            email: formData.get('email')?.toString().trim() || '',
            phone: formData.get('phone')?.toString().trim() || '',
            category: formData.get('category')?.toString().trim() || '',
            message: formData.get('message')?.toString().trim() || '',
        });
        window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
        e.currentTarget.reset();
    };

    return (
        <div className="page-transition">
            <PageHero
                title="Contact Us"
                subtitle="Reach out for product enquiries, dealer discussions, and bulk supply coordination."
                breadcrumbItems={['Contact Us']}
            />

            <section className="px-6 py-20 max-w-7xl mx-auto sm:py-24">
                <ScrollReveal className="text-center mb-12">
                    <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">Get in Touch</h2>
                    <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">Contact Details</h3>
                </ScrollReveal>

                <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div className="group relative overflow-hidden rounded-[2rem] border border-[#17351d]/10 bg-[#f5f8ef] p-6 text-[#17351d] shadow-[0_20px_55px_rgba(8,36,18,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.14)] sm:p-7">
                        <div className="absolute inset-x-0 top-0 h-1 bg-[#d9842f]" />
                        <div className="mb-7 flex items-start justify-between gap-5">
                            <div>
                                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-[#6e7f62]">Direct Connect</p>
                                <h4 className="text-[2rem] font-semibold tracking-[-0.02em] text-[#122316]">Call Us</h4>
                            </div>
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#d9842f] shadow-sm ring-1 ring-[#17351d]/8">
                                <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.78 19.78 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8 9.69a16 16 0 0 0 6.31 6.31l1.25-1.25a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92Z" />
                                </svg>
                            </span>
                        </div>
                        <div className="space-y-3 rounded-[1.35rem] border border-[#17351d]/8 bg-[#fffdf7] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                            <a href="tel:+919179110159" className="block text-xl font-semibold tracking-tight text-[#17351d]">+91 91791 10159</a>
                            <a href="tel:+918770974845" className="block text-sm font-medium text-[#4f6248]">Alternate: +91 87709 74845</a>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-[2rem] border border-[#17351d]/10 bg-[#f5f8ef] p-6 text-[#17351d] shadow-[0_20px_55px_rgba(8,36,18,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.14)] sm:p-7">
                        <div className="absolute inset-x-0 top-0 h-1 bg-[#2f765d]" />
                        <div className="mb-7 flex items-start justify-between gap-5">
                            <div>
                                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-[#6e7f62]">Official Desk</p>
                                <h4 className="text-[2rem] font-semibold tracking-[-0.02em] text-[#122316]">Email Us</h4>
                            </div>
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2f765d] shadow-sm ring-1 ring-[#17351d]/8">
                                <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M4 4h16v16H4z" />
                                    <path d="m4 7 8 6 8-6" />
                                </svg>
                            </span>
                        </div>
                        <a href="mailto:ashirvadmarketing62@gmail.com" className="block rounded-[1.35rem] border border-[#17351d]/8 bg-[#fffdf7] p-4 text-base font-semibold leading-6 text-[#17351d] underline-offset-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] hover:underline sm:text-lg break-all">
                            ashirvadmarketing62@gmail.com
                        </a>
                    </div>

                    <div className="group relative overflow-hidden rounded-[2rem] border border-[#17351d]/10 bg-[#f5f8ef] p-6 text-[#17351d] shadow-[0_20px_55px_rgba(8,36,18,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.14)] sm:p-7">
                        <div className="absolute inset-x-0 top-0 h-1 bg-[#4b5f9c]" />
                        <div className="mb-7 flex items-start justify-between gap-5">
                            <div>
                                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-[#6e7f62]">Visit Point</p>
                                <h4 className="text-[2rem] font-semibold tracking-[-0.02em] text-[#122316]">Registered Address</h4>
                            </div>
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#4b5f9c] shadow-sm ring-1 ring-[#17351d]/8">
                                <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" />
                                    <path d="M12 12.5A2.5 2.5 0 1 0 12 7a2.5 2.5 0 0 0 0 5.5Z" />
                                </svg>
                            </span>
                        </div>
                        <p className="rounded-[1.35rem] border border-[#17351d]/8 bg-[#fffdf7] p-4 text-base font-medium leading-relaxed text-[#3f533a] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                            Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.)
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    <ScrollReveal>
                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
                            <h3 className="text-2xl font-bold text-text-primary mb-2">Send us a Message</h3>
                            <p className="text-text-secondary mb-8">Fill out the form and we will continue the conversation on WhatsApp.</p>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <input type="text" name="name" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none text-gray-900" placeholder="Amit Verma" required />
                                    <input type="email" name="email" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none text-gray-900" placeholder="amit@example.com" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <input type="tel" name="phone" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none text-gray-900" placeholder="+91 98765 43210" required />
                                    <select name="category" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none text-gray-900">
                                        <option>Personal Use</option>
                                        <option>Bulk Inquiry</option>
                                        <option>Dealership</option>
                                    </select>
                                </div>
                                <textarea
                                    name="message"
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none text-gray-900 min-h-[150px]"
                                    placeholder="Hello, I want product details, pricing, and delivery information."
                                    required
                                />
                                <button type="submit" className="w-full py-5 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-secondary transition-all">
                                    Submit Message
                                </button>
                            </form>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="sticky top-28 space-y-8">
                            <div className="overflow-hidden rounded-3xl border border-[#17351d]/10 bg-[#f5f8ef] shadow-[0_20px_55px_rgba(8,36,18,0.08)]">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4803.026643660176!2d81.6284920762234!3d21.252766680453334!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a293c4faf5936cb%3A0x11ecd444a15c1ad8!2sLaxmi%20Agro%20Enterprises!5e1!3m2!1sen!2sin!4v1780401190725!5m2!1sen!2sin"
                                    width="600"
                                    height="450"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Laxmi Agro Enterprises location"
                                    className="h-[400px] w-full"
                                />
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-text-primary mb-4 text-lg">Business Hours</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-text-secondary">Monday - Saturday</span><span className="font-semibold text-text-primary">9:00 AM - 6:00 PM</span></div>
                                    <div className="flex justify-between"><span className="text-text-secondary">Sunday</span><span className="font-semibold text-red-500">Closed</span></div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}
