import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';
import AccountDeletionRequestForm from '@/components/AccountDeletionRequestForm';

export const metadata = {
    title: 'Request Account Deletion - Laxmi Agro Enterprises',
    description: 'Submit a request to delete your Laxmi Agro account and associated personal data.',
};

export default function DeleteAccountPage() {
    return (
        <div className="page-transition">
            <PageHero
                title="Request Account Deletion"
                subtitle="Submit a request to delete your Laxmi Agro account and associated personal data."
                breadcrumbItems={['Request Account Deletion']}
            />

            <section className="mx-auto max-w-4xl px-6 py-24">
                <ScrollReveal>
                    <div className="space-y-8 text-text-secondary leading-relaxed">
                        <div className="rounded-2xl border border-[#dfe8d3] bg-[#f8fbf5] p-6">
                            <h2 className="text-2xl font-bold text-text-primary">How this works</h2>
                            <p className="mt-3">Submit the email address or phone number associated with your account. We use a privacy-preserving response and will contact the account holder to verify the request before staff complete it within 30 days.</p>
                        </div>

                        <AccountDeletionRequestForm />

                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
                            <h2 className="text-2xl font-bold text-text-primary">What happens after completion</h2>
                            <p>Account access is revoked. Profile details, saved addresses, uploaded account media, carts, device tokens, notification history, and negotiations are deleted or anonymized.</p>
                            <p>Orders and payment records may be retained in restricted records when required for tax, payment, fraud-prevention, dispute, warranty, or other legal obligations. Backup copies are scheduled to expire within 90 days after deletion is completed.</p>
                            <p>For questions about this process, email <a className="font-semibold text-[#1b7a3b] underline" href="mailto:ashirvadmarketing62@gmail.com">ashirvadmarketing62@gmail.com</a>.</p>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
