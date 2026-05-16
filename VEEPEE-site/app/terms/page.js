import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Terms of Service - Veepee Impex',
    description: 'Terms of Service for OXON App & Website by Veepee Impex.',
};

export default function TermsPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Terms of Service"
                subtitle="Please read these terms and conditions carefully before using our platform."
                breadcrumbItems={['Terms of Service']}
            />

            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="max-w-none text-text-secondary leading-relaxed space-y-12">
                        <div className="prose prose-invert max-w-none">
                            <p className="text-sm text-gray-400 mb-8 italic text-center">Effective Date: March 2026</p>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">1. Platform Ownership</h2>
                                <p>
                                    The Platform is owned and operated by VEEPEE IMPEX PARTNERSHIP CO., having its registered office at C‑15/16, Sector 4, Devendra Nagar, Raipur, Chhattisgarh – 492001, India. The Platform includes the OXON mobile application, website, dealer dashboards, and all digital services operated by VEEPEE IMPEX.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">2. Business Model (D2C & B2B)</h2>
                                <p>
                                    The Platform operates as a Direct‑to‑Consumer (D2C) and Business‑to‑Business (B2B) commerce platform. VEEPEE IMPEX markets and sells products under its own brands including OXON and distributes selected third‑party products through authorized supply arrangements. Unless explicitly stated otherwise, products listed on the Platform are sold directly by VEEPEE IMPEX.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">3. Acceptance of Terms</h2>
                                <p>
                                    By accessing, browsing, or using the Platform, you agree to be bound by these Terms and all applicable policies. If you do not agree, please do not use the Platform.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">4. User Eligibility</h2>
                                <p>
                                    Users must be 18 years or older and capable of forming legally binding contracts under Indian law. Minors may use the Platform only under parental supervision.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">5. Account Registration</h2>
                                <p>
                                    Users must provide accurate and complete information during registration. You are responsible for maintaining account confidentiality and all activities under your account. Unauthorized access must be reported immediately to vepemisc@gmail.com.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">6. D2C & B2B Purchases</h2>
                                <p>
                                    The Platform allows retail customers and registered business buyers to purchase products. B2B purchases may involve minimum order quantities, dealer pricing tiers, modified return eligibility, and commercial warranty terms.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">7. Payments</h2>
                                <p>
                                    Payments may be made via approved online payment methods or Cash on Delivery (COD). Payment processing is facilitated through authorized payment gateways such as Razorpay and PhonePe. All payments shall be processed in Indian Rupees (INR).
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">8. Product Safety and Usage</h2>
                                <p>
                                    Tools and machinery must be used according to manufacturer safety instructions. Users must wear appropriate safety gear, ensure trained operation, avoid misuse or overloading, and maintain products properly. Improper use may void warranty coverage.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">9. Intellectual Property</h2>
                                <p>
                                    All Platform content, software, branding, and design elements are owned by VEEPEE IMPEX. "OXON" and related logos and branding are proprietary trademarks owned or licensed exclusively to VEEPEE IMPEX. Unauthorized use is prohibited.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-text-primary mb-6">10. Governing Law</h2>
                                <p>
                                    These Terms shall be governed by the laws of India. Courts located in Raipur, Chhattisgarh shall have exclusive jurisdiction.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
