import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Privacy Policy - Veepee Impex',
    description: 'Privacy Policy for OXON App & Website by Veepee Impex.',
};

export default function PrivacyPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Privacy Policy"
                subtitle="Your privacy is important to us. Learn how we collect, use, and protect your data."
                breadcrumbItems={['Privacy Policy']}
            />

            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="max-w-none text-text-secondary leading-relaxed space-y-12">
                        <div className="prose prose-invert max-w-none">
                            <p className="text-sm text-gray-400 mb-8 italic text-center">Effective Date: March 2026</p>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">1. Information We Collect</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Name, phone number, email address</li>
                                    <li>Billing and shipping address</li>
                                    <li>Order and transaction details</li>
                                    <li>Device and usage information</li>
                                    <li>Payment information (processed securely via payment gateways)</li>
                                </ul>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">2. How We Use Information</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Process orders and deliveries</li>
                                    <li>Provide customer support</li>
                                    <li>Improve products and services</li>
                                    <li>Fraud prevention and legal compliance</li>
                                    <li>Marketing communication (with consent)</li>
                                </ul>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">3. Data Sharing</h2>
                                <p>We may share data with:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Logistics partners</li>
                                    <li>Payment gateways (Razorpay, PhonePe etc)</li>
                                    <li>Service providers required for operations</li>
                                </ul>
                                <p className="mt-4">We do not sell personal data.</p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">4. Data Security</h2>
                                <p>
                                    We implement reasonable technical and organizational measures to protect data. However, no system is completely secure.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">5. User Rights</h2>
                                <p>
                                    Users may request correction, access, or deletion of personal data by contacting us.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">6. Cookies</h2>
                                <p>
                                    We use cookies to enhance user experience and analyze platform performance.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">7. Retention</h2>
                                <p>
                                    Data is retained only as long as necessary for legal and operational purposes.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
