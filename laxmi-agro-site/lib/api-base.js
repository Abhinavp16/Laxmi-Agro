const DEFAULT_API_BASE = 'http://localhost:5000/api/v1';

export function getApiBaseUrl() {
    const rawBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.API_BASE_URL ||
        process.env.NEXT_PUBLIC_WEBSITE_API_BASE_URL ||
        DEFAULT_API_BASE;

    return rawBase.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
}
