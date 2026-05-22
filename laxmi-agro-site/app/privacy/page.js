import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Privacy Policy - Laxmi Agro',
    description: 'Privacy policy for the Laxmi Agro platform.',
};

export default function PrivacyPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Privacy Policy"
                subtitle="How platform data is collected, used, and protected."
                breadcrumbItems={['Privacy Policy']}
            />

            <section className="py-24 px-6 max-w-4xl mx-auto">
                <ScrollReveal>
                    <div className="space-y-10 text-text-secondary leading-relaxed">
                        <p className="text-sm text-gray-400 italic text-center">Effective Date: 20 April 2026</p>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">1. Information Collected</h2>
                            <p>The platform may collect contact details, delivery information, order history, device information, and inquiry content needed to operate commerce and support workflows.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">2. How Data Is Used</h2>
                            <p>We use data to process orders, coordinate logistics, support customers, improve performance, and maintain security and compliance.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">3. Data Sharing</h2>
                            <p>Data may be shared with logistics providers, payment partners, storage providers, and service operators only as needed to run the platform.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">4. Data Protection</h2>
                            <p>Reasonable technical and organizational safeguards are used, but no system can guarantee absolute security.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">5. Contact</h2>
                            <p>For privacy and support questions, contact Ashirvad Marketing, C/O Laxmi Agro Enterprises, Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.), or email ashirvadmarketing62@gmail.com.</p>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
