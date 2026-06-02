import { getApiBaseUrl } from '@/lib/api-base';

export function normalizeWebsiteImageUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';

    if (value.startsWith('/')) return value;

    try {
        const parsed = new URL(value);
        const apiBase = new URL(getApiBaseUrl());

        if (parsed.origin === apiBase.origin && parsed.pathname.startsWith('/images/')) {
            return parsed.pathname;
        }
    } catch {
        return value;
    }

    return value;
}
