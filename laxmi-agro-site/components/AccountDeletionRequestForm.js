'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '@/lib/api-base';

const initialForm = { name: '', phone: '' };
const indianMobileNumberPattern = /^[6-9]\d{9}$/;

export default function AccountDeletionRequestForm() {
    const [form, setForm] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        const name = form.name.trim();
        const phone = form.phone.trim();
        if (!name || !phone) {
            setError('Enter your full name and the registered mobile number for your Laxmi Agro account.');
            return;
        }
        if (!indianMobileNumberPattern.test(phone)) {
            setError('Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${getApiBaseUrl()}/account-deletion-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone }),
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok || payload.success !== true) {
                setError(payload.message || 'We could not submit your request. Please try again or contact support.');
                return;
            }

            setSuccessMessage(payload.message || 'If we can match an active Laxmi Agro account, we will contact the account holder to verify the request and complete it within 30 days.');
            setForm(initialForm);
        } catch (_) {
            setError('We could not submit your request. Check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" noValidate>
            <div>
                <h2 className="text-2xl font-bold text-text-primary">Submit your request</h2>
                <p className="mt-2 text-sm">Enter the full name and registered mobile number associated with your account. We do not confirm whether a matching account exists.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="deletion-name" className="mb-2 block text-sm font-semibold text-text-primary">Full name</label>
                    <input
                        id="deletion-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={updateField}
                        required
                        maxLength={100}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-text-primary outline-none transition placeholder:text-gray-400 focus:border-[#1b7a3b] focus:ring-2 focus:ring-[#1b7a3b]/20"
                    />
                </div>
                <div>
                    <label htmlFor="deletion-phone" className="mb-2 block text-sm font-semibold text-text-primary">Registered mobile number</label>
                    <input
                        id="deletion-phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="9876521430"
                        value={form.phone}
                        onChange={updateField}
                        required
                        maxLength={10}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-text-primary outline-none transition placeholder:text-gray-400 focus:border-[#1b7a3b] focus:ring-2 focus:ring-[#1b7a3b]/20"
                    />
                </div>
            </div>

            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
            {successMessage && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{successMessage}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-[#1b7a3b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#14642f] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? 'Submitting request…' : 'Submit deletion request'}
            </button>
        </form>
    );
}
