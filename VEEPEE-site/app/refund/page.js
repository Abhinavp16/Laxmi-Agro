import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Refund & Return Policy - Veepee Impex',
    description: 'Learn about our refund, return, and cancellation policies at Veepee Impex.',
};

export default function RefundPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Refund & Return Policy"
                subtitle="Transparent policies for cancellations, returns, and refunds to ensure a smooth experience."
                breadcrumbItems={['Refund & Return Policy']}
            />

            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="max-w-none text-text-secondary leading-relaxed space-y-12">
                        <div className="prose prose-invert max-w-none">
                            <p className="text-sm text-gray-400 mb-8 italic text-center">Effective Date: March 2026</p>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">1. Order Cancellation</h2>
                                <p>
                                    Orders cancelled before dispatch receive a full refund. Post-dispatch cancellations may incur logistics deductions.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">2. Return Eligibility</h2>
                                <p>Returns are accepted only if:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Product is defective on arrival</li>
                                    <li>Product damaged during transit</li>
                                    <li>Wrong item delivered</li>
                                </ul>
                                <p className="mt-4 italic text-sm">Return requests must be submitted within 48 hours of delivery.</p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">3. Return Conditions</h2>
                                <p>Products must be:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Unused</li>
                                    <li>In original packaging</li>
                                    <li>With all accessories and documentation</li>
                                </ul>
                                <p className="mt-4">Returned items undergo inspection before approval. Claims may be rejected if damage is caused by misuse.</p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">4. Refund Approval & Method</h2>
                                <p>Refunds may be approved when:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Product arrives damaged</li>
                                    <li>Manufacturing defect exists</li>
                                    <li>Incorrect product delivered</li>
                                </ul>
                                <p className="mt-4">
                                    Refunds are processed to the original payment method within 7–10 business days after approval and inspection.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">5. Non-Refundable Cases</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Used or installed products</li>
                                    <li>Damage due to misuse</li>
                                    <li>Missing accessories or packaging</li>
                                    <li>Custom or bulk orders (unless defective)</li>
                                </ul>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">6. Fraud Prevention</h2>
                                <p>
                                    The Company reserves the right to investigate suspicious refund requests.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
