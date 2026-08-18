import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Terms of Service - Laxmi Agro Enterprises',
    description: 'Terms of service for the Laxmi Agro platform.',
};

export default function TermsPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Terms of Service"
                subtitle="Please review these terms before using the platform."
                breadcrumbItems={['Terms of Service']}
            />

            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="space-y-10 text-text-secondary leading-relaxed">
                        <p className="text-sm text-gray-400 italic text-center">Effective Date: 20 April 2026</p>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">1. Platform Use</h2>
                            <p>This platform is provided for Laxmi Agro and operated through Ashirvad Marketing for product browsing, enquiries, dealer coordination, and order-related workflows. By using it, you agree to comply with applicable laws and platform policies.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">2. Account Responsibility</h2>
                            <p>You are responsible for maintaining accurate account information and for all actions performed through your account credentials.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">3. Orders and Pricing</h2>
                            <p>Product pricing, availability, delivery arrangements, and commercial terms may vary by buyer type, quantity, service area, and negotiated agreements. Confirm the final order terms with Laxmi Agro before payment or dispatch.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">4. Acceptable Use</h2>
                            <p>You must not misuse the platform, misrepresent products, attempt unauthorized access, or interfere with normal operations.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">5. Intellectual Property</h2>
                            <p>Platform content, layouts, and business materials remain the property of the operating business or its licensors unless otherwise stated.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">6. Account Deletion</h2>
                            <p>Account holders can request account deletion in the app or at <a className="font-semibold text-[#1b7a3b] underline" href="/delete-account">laxmiagroenterprises.com/delete-account</a>. The request is verified and processed under the Privacy Policy and applicable legal record-retention obligations.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">7. Contact and Legal</h2>
                            <p>Business contact: Ashirvad Marketing, C/O Laxmi Agro Enterprises, Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.). Email: ashirvadmarketing62@gmail.com. Phone: +91 91791 10159.</p>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
