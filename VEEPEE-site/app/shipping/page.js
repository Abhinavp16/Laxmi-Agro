import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Shipping Policy - Veepee Impex',
    description: 'Learn about our shipping, processing, and COD policies at Veepee Impex.',
};

export default function ShippingPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Shipping Policy"
                subtitle="We ensure safe and timely delivery of our tools and machinery across India."
                breadcrumbItems={['Shipping Policy']}
            />

            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="max-w-none text-text-secondary leading-relaxed space-y-12">
                        <div className="prose prose-invert max-w-none">
                            <p className="text-sm text-gray-400 mb-8 italic text-center">Effective Date: March 2026</p>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">1. Shipping Coverage</h2>
                                <p>
                                    Orders are shipped across India through authorized courier and logistics partners.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">2. Processing & Delivery Time</h2>
                                <p>
                                    Orders are processed within 1–3 business days after payment confirmation. Typical delivery timelines range between 3–10 business days depending on location.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">3. Shipping Charges</h2>
                                <p>
                                    Shipping costs are displayed during checkout or included in product pricing. Costs are based on weight, dimensions, and destination.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">4. Cash on Delivery (COD) Policy</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>COD is available for select pin codes and order values.</li>
                                    <li>An additional COD handling fee may apply.</li>
                                    <li>Customers must confirm the order via phone or WhatsApp if requested.</li>
                                    <li>Refusal of COD orders without valid reason may lead to restriction of future COD access.</li>
                                </ul>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">5. Tracking & Delays</h2>
                                <p>
                                    Tracking details are provided via Message/email/app once dispatched. Delays may occur due to weather, transportation disruptions, public holidays, or force majeure events.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">6. Delivery Attempts</h2>
                                <p>
                                    Repeated failed delivery attempts may lead to cancellation and restriction of COD access.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
