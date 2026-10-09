// Knowledge Hub posts, newest first. Used by the home "Latest Insights"
// section, the /insights listing and each article's cover image.
export const insightPosts = [
    {
        href: '/insights/modern-machinery-yields',
        title: 'How to Choose the Right Pump Set for Farm Water Supply',
        category: 'Pump Selection',
        date: 'Feb 2026',
        readTime: '4 min read',
        image: '/images/Banner/1.jpg',
        imageAlt: 'Pump set delivering water across a paddy field',
        excerpt: 'A reliable pump set is the heart of farm water supply. The right selection depends on bore depth, delivery distance, pipe size, power availability, and daily water requirement.',
    },
    {
        href: '/insights/precision-farming',
        title: 'PVC Column Pipes, GI Pipes, and Cables: What Buyers Should Check',
        category: 'Buying Guide',
        date: 'Jan 2026',
        readTime: '5 min read',
        image: 'https://storage.googleapis.com/laxmi-agro-1df4b.firebasestorage.app/website/22a94b41-9416-4c41-9bdb-5aac4402cb44.webp',
        imageAlt: 'Submersible pumps with cables, PVC pipes and a control panel',
        excerpt: 'Pipes and cables directly affect pump performance, safety, and maintenance cost. A small mismatch in size or quality can create pressure loss, heating, leakage, or frequent service issues.',
    },
    {
        href: '/insights/rice-mill-efficiency',
        title: 'Sprinkler and Raingun Setup Tips for Reliable Field Coverage',
        category: 'Irrigation Tips',
        date: 'Dec 2025',
        readTime: '4 min read',
        image: '/images/Banner/4.jpg',
        imageAlt: 'Sprinklers watering rows of crops',
        excerpt: 'Sprinkler sets and rainguns help distribute water across the field, but performance depends on pump capacity, pipe layout, nozzle choice, and operating pressure.',
    },
];

export function getInsightPost(href) {
    return insightPosts.find((post) => post.href === href);
}
