import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Shipping Policy - Laxmi Agro Enterprises',
    description: 'Shipping policy for the Laxmi Agro platform.',
};

export default function ShippingPage() {
    return (
        <div className="page-transition">
            <PageHero title="Shipping Policy" subtitle="Delivery, dispatch, and order fulfillment guidelines." breadcrumbItems={['Shipping Policy']} />
            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="space-y-10 text-text-secondary leading-relaxed">
                        <p className="text-sm text-gray-400 italic text-center">Effective Date: 20 April 2026</p>
                        <p>Orders are processed based on stock, payment status, delivery zone, and logistics capacity. Delivery arrangements, any freight or other charges, and payment steps depend on the product, order, and location. Contact Laxmi Agro to confirm the applicable terms before payment or dispatch.</p>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
