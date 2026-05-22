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

            <section className="py-24 px-6 max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-16">
                    <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">Get in Touch</h2>
                    <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">Contact Details</h3>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    <div className="rounded-[2rem] p-8 text-white text-center bg-gradient-to-br from-[#ff8f2f] via-[#ff6f0f] to-[#db5800]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/70 mb-3">Direct Connect</p>
                        <h4 className="text-[2rem] font-primary font-bold mb-3">Call Us</h4>
                        <div className="space-y-1">
                            <p className="text-xl font-black tracking-tight">+91 91791 10159</p>
                            <p className="text-sm font-semibold text-white/70">Alternate: +91 87709 74845</p>
                        </div>
                    </div>
                    <div className="rounded-[2rem] p-8 text-white text-center bg-gradient-to-br from-[#182238] via-[#111827] to-[#0b1220]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45 mb-3">Official Desk</p>
                        <h4 className="text-[2rem] font-primary font-bold mb-3">Email Us</h4>
                        <a href="mailto:ashirvadmarketing62@gmail.com" className="text-xl font-black text-brand-primary hover:underline break-all">
                            ashirvadmarketing62@gmail.com
                        </a>
                    </div>
                    <div className="rounded-[2rem] p-8 text-white text-center bg-gradient-to-br from-[#a6491b] via-[#8a3511] to-[#6c2409]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45 mb-3">Visit Point</p>
                        <h4 className="text-[2rem] font-primary font-bold mb-3">Registered Address</h4>
                        <p className="max-w-[24ch] text-base font-semibold leading-relaxed mx-auto">
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
                            <div className="bg-gray-100 rounded-3xl overflow-hidden h-[400px] border border-gray-200 flex items-center justify-center text-center p-8">
                                <p className="text-text-secondary">Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.)</p>
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
