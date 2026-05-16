import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Dealer Pricing & MAP Policy - Veepee Impex',
    description: 'Dealer Pricing and Minimum Advertised Price (MAP) Policy for OXON products by Veepee Impex.',
};

export default function DealerPricingPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Dealer Pricing & MAP Policy"
                subtitle="Guidelines for minimum advertised pricing and dealer tiers."
                breadcrumbItems={['Dealer Pricing']}
            />

            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="max-w-none text-text-secondary leading-relaxed space-y-12">
                        <div className="prose prose-invert max-w-none">
                            <p className="text-sm text-gray-400 mb-8 italic text-center">Effective Date: March 2026</p>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">1. Pricing Policy Overview</h2>
                                <p>
                                    VEEPEE IMPEX PARTNERSHIP CO. maintains a Minimum Advertised Price (MAP) policy to protect brand value and ensure fair competition among authorized dealers of OXON products.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">2. Dealer Tiers</h2>
                                <p>
                                    Authorized dealers are categorized into tiers based on order volume, history, and commitment. Each tier receives specific wholesale pricing as reflected on the dealer dashboard.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">3. MAP Guidelines</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Dealers must not advertise OXON products below the MAP specified by the Company.</li>
                                    <li>MAP applies to all public-facing advertisements (online and offline).</li>
                                    <li>Bundling or discounting that effectively lowers the price below MAP is prohibited without prior approval.</li>
                                </ul>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">4. Policy Violations</h2>
                                <p>
                                    Violations of the pricing or MAP policy may result in immediate suspension of dealer privileges and termination of authorized dealer status.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">5. Updates & Compliance</h2>
                                <p>
                                    The Company reserves the right to update MAP and pricing tiers at its discretion. Dealers are responsible for staying compliant with the latest pricing guidelines.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
