import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Dealer & Distributor Agreement - Laxmi Agro Enterprises',
    description: 'Dealer and distributor agreement overview for the Laxmi Agro platform.',
};

export default function DealerAgreementPage() {
    return (
        <div className="page-transition">
            <PageHero title="Dealer & Distributor Agreement" subtitle="General guidance for dealer onboarding and partner operations." breadcrumbItems={['Dealer Agreement']} />
            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="space-y-10 text-text-secondary leading-relaxed">
                        <p className="text-sm text-gray-400 italic text-center">Effective Date: May 2026</p>
                        <p>Authorized dealers may be required to provide business registration details, tax information, service coverage, and order capability before approval.</p>
                        <p>Partner pricing, warranty support, territorial expectations, and marketing permissions are subject to formal commercial terms and client-specific operating rules.</p>
                        <p>Final agreement wording will be updated during deployment with the correct legal entity and commercial structure.</p>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
