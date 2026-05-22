import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Refund & Return Policy - Laxmi Agro',
    description: 'Refund and return policy for the Laxmi Agro platform.',
};

export default function RefundPage() {
    return (
        <div className="page-transition">
            <PageHero title="Refund & Return Policy" subtitle="General return and refund guidelines for platform orders." breadcrumbItems={['Refund & Return Policy']} />
            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="space-y-10 text-text-secondary leading-relaxed">
                        <p className="text-sm text-gray-400 italic text-center">Effective Date: 20 April 2026</p>
                        <p>Return eligibility depends on product condition, delivery issue, inspection outcome, and the applicable commercial terms for the order.</p>
                        <p>Damaged, incorrect, or defective products should be reported promptly with supporting images or videos. Used, altered, or incomplete items may not qualify for return or refund.</p>
                        <p>For motor warranty returns or replacements, freight and transport charges are normally to be borne by the party unless otherwise agreed.</p>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
