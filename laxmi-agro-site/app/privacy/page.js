import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
    title: 'Privacy Policy - Laxmi Agro Enterprises',
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
                        <p className="text-sm text-gray-400 italic text-center">Effective Date: 20 August 2026</p>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">1. Information We Collect</h2>
                            <p>We collect the information needed to operate the Laxmi Agro wholesale agricultural-equipment marketplace, process orders, provide support, and protect the platform. This may include account and contact details such as your name, phone number, email address, username, business name, and delivery address.</p>
                            <p className="mt-4">Depending on how you use the platform, we may also collect business details you provide, including your business address, contact person, GST number, and business-verification information; order, cart, delivery, payment-verification, inquiry, and negotiation information; profile photos, business-verification documents, and payment proof images that you choose to upload; and customer-support communications.</p>
                            <p className="mt-4">When you choose to use location-based features, we may collect the precise location or map coordinates used to place your shop. You can choose a shop location manually instead. We also process device, technical, and notification-token information needed to operate, secure, and improve the platform and to send service-related notifications when you allow them.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">2. How We Use Information</h2>
                            <p>We use information to create and secure accounts, verify businesses, process and coordinate orders and deliveries, verify payments, respond to inquiries and negotiations, provide customer support, send order and account notifications, prevent fraud, resolve disputes, maintain platform security, improve service performance, and meet legal obligations.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">3. Data Sharing and Processing</h2>
                            <p>We may share or allow processing of relevant information with service providers only as needed to run the platform and meet legal obligations. These providers may include cloud hosting and media-storage providers, notification providers, payment-verification or payment partners, logistics providers, and service operators. We do not sell personal information.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">4. Your Choices</h2>
                            <p>You can manage location and notification permissions through your device settings. You may contact us using the details below to ask privacy questions or request access to or correction of your information, where applicable. You can also request account deletion in the app or through our public deletion page.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">5. Data Protection</h2>
                            <p>We use reasonable technical and organizational safeguards to protect stored information. No digital system can guarantee absolute security.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">6. Account Deletion and Retention</h2>
                            <p>You can request deletion of your Laxmi Agro account in the app or at <a className="font-semibold text-[#1b7a3b] underline" href="/delete-account">laxmiagroenterprises.com/delete-account</a>. After staff verifies the request, we target completion within 30 days. When deletion is completed, account access is revoked and direct account data is deleted or anonymized, including profile details, saved addresses, uploaded account media, carts, device tokens, notification history, and negotiations.</p>
                            <p className="mt-4">Orders and restricted financial records may be retained for the applicable retention period when required for tax, payment verification, fraud prevention, disputes, warranties, or other legal obligations. Retained records may include order and payment references, payment method information, and payment proof submitted for verification. Backup handling follows our applicable operational and legal retention requirements.</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-4">7. Contact</h2>
                            <p>For privacy and support questions, contact Ashirvad Marketing, C/O Laxmi Agro Enterprises, Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.), or email ashirvadmarketing62@gmail.com.</p>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
