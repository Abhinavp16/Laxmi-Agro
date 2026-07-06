import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Warranty Policy - Laxmi Agro Enterprises',
    description: 'Warranty policy for the Laxmi Agro platform.',
};

export default function WarrantyPage() {
    return (
        <div className="page-transition">
            <PageHero title="Warranty Policy" subtitle="General warranty guidelines for machinery and equipment listings." breadcrumbItems={['Warranty Policy']} />
            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="space-y-10 text-text-secondary leading-relaxed">
                        <p className="text-sm text-gray-400 italic text-center">Effective Date: 20 April 2026</p>
                        <p>Warranty coverage may vary by manufacturer, category, and order type. Coverage typically applies to verified manufacturing defects and does not cover misuse, unauthorized modification, or routine wear.</p>
                        <p>Unless a specific item states otherwise, the current business term is 1 year guarantee on motor only, not on the pump body or wear items.</p>
                        <p>Warranty claims may require proof of purchase, issue documentation, inspection, and service approval before repair or replacement decisions are made.</p>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
