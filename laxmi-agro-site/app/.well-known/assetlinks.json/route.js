// Android App Links: lets the Laxmi Agro app (com.laxmiagro.app) open shared
// product links. Android checks the app's signing certificate against these
// SHA-256 fingerprints: the Play app-signing key (Play Console > Setup > App
// integrity > App signing) and the upload key.
const SHA256_CERT_FINGERPRINTS = [
    // e.g. '14:6D:E9:...:5A', one per signing certificate.
];

export const dynamic = 'force-static';

export function GET() {
    // Nothing to verify against yet: answer 404 rather than publish an
    // empty statement.
    if (SHA256_CERT_FINGERPRINTS.length === 0) {
        return new Response('Not found', { status: 404 });
    }
    return Response.json([
        {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: {
                namespace: 'android_app',
                package_name: 'com.laxmiagro.app',
                sha256_cert_fingerprints: SHA256_CERT_FINGERPRINTS,
            },
        },
    ]);
}
