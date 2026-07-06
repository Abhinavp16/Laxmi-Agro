import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Dealer Pricing Policy - Laxmi Agro Enterprises',
    description: 'Dealer pricing policy overview for the Laxmi Agro platform.',
};

export default function DealerPricingPage() {
    return (
        <div className="page-transition">
            <PageHero title="Dealer Pricing Policy" subtitle="General pricing guidance for dealers, distributors, and partner accounts." breadcrumbItems={['Dealer Pricing']} />
            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="space-y-10 text-text-secondary leading-relaxed">
                        <p className="text-sm text-gray-400 italic text-center">Effective Date: May 2026</p>
                        <p>Dealer pricing may vary by product line, order volume, service area, support obligations, and client-approved commercial rules.</p>
                        <p>Public pricing, wholesale tiers, negotiated rates, and promotional discounts may be controlled separately depending on the partner model.</p>
                        <p>Final pricing policy content and enforcement rules will be configured during deployment.</p>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
