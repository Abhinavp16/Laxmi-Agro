import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Dealer & Distributor Agreement - Veepee Impex',
    description: 'Dealer and Distributor Agreement for OXON platform by Veepee Impex.',
};

export default function DealerAgreementPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Dealer & Distributor Agreement"
                subtitle="Guidelines and terms for our authorized dealers and distributors."
                breadcrumbItems={['Dealer Agreement']}
            />

            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="max-w-none text-text-secondary leading-relaxed space-y-12">
                        <div className="prose prose-invert max-w-none">
                            <p className="text-sm text-gray-400 mb-8 italic text-center">Effective Date: March 2026</p>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">1. Dealer Eligibility</h2>
                                <p>
                                    Dealers must provide valid business registration and GST details to participate in the OXON platform operated by VEEPEE IMPEX PARTNERSHIP CO.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">2. Pricing & Payments</h2>
                                <p>
                                    Dealers receive tier-based pricing subject to minimum order quantities. All dealer orders must be prepaid unless credit terms are approved in writing.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">3. Resale & Brand Usage</h2>
                                <p>
                                    Dealers may resell OXON products but must not misrepresent branding, pricing policies, or warranty terms. Dealers may use OXON branding only for authorized promotion and sales.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">4. Warranty & Support</h2>
                                <p>
                                    Warranty claims must follow company procedures. Dealers must not offer unauthorized warranties of their own.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">5. Non-Circumvention</h2>
                                <p>
                                    Dealers shall not bypass the Platform or directly source products to avoid company policies or pricing controls.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">6. Termination & Law</h2>
                                <p>
                                    The Company may terminate dealership rights for policy violations, non-payment, or brand misuse. This Agreement is governed by Indian law with jurisdiction in Raipur, Chhattisgarh.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
