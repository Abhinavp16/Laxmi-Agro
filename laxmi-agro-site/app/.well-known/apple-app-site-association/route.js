// iOS Universal Links: lets the Laxmi Agro app (team UW9NZM7BNP, bundle
// com.laxmiagro.app) open shared product links. Must be served as JSON with
// no redirect from https://www.laxmiagroenterprises.com.
const association = {
    applinks: {
        details: [
            {
                appIDs: ['UW9NZM7BNP.com.laxmiagro.app'],
                components: [{ '/': '/products/*', comment: 'Shared product pages' }],
            },
        ],
    },
};

export const dynamic = 'force-static';

export function GET() {
    return Response.json(association);
}
