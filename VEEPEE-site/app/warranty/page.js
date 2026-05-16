import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Warranty Policy - Veepee Impex',
    description: 'Warranty policy for OXON products by Veepee Impex.',
};

export default function WarrantyPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Warranty Policy"
                subtitle="We stand behind our products with comprehensive warranty coverage."
                breadcrumbItems={['Warranty Policy']}
            />

            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="max-w-none text-text-secondary leading-relaxed space-y-12">
                        <div className="prose prose-invert max-w-none">
                            <p className="text-sm text-gray-400 mb-8 italic text-center">Effective Date: March 2026</p>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">1. Warranty Coverage</h2>
                                <p>
                                    OXON products include manufacturer or company warranty as specified on the product page. This warranty covers manufacturing defects only.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">2. Warranty Exclusions</h2>
                                <p>The warranty does NOT cover:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Normal wear and tear</li>
                                    <li>Improper installation or misuse</li>
                                    <li>Overloading or commercial misuse beyond specifications</li>
                                    <li>Unauthorized repair or modification</li>
                                    <li>Damage due to electrical fluctuation or environmental factors</li>
                                </ul>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">3. Claim Process</h2>
                                <ol className="list-decimal pl-6 space-y-2">
                                    <li>Customer must raise a warranty request via email within the warranty period.</li>
                                    <li>Proof of purchase and product images/videos may be required.</li>
                                    <li>Inspection or service evaluation may be conducted before approval.</li>
                                </ol>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">4. Resolution</h2>
                                <p>The Company may choose to:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Repair the product</li>
                                    <li>Replace defective parts</li>
                                    <li>Replace the product (if repair not feasible)</li>
                                </ul>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">5. Transportation & Safety</h2>
                                <p>
                                    Shipping costs for warranty service may be shared or charged depending on case evaluation. Note that warranty becomes void if safety instructions or operating guidelines are ignored.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
