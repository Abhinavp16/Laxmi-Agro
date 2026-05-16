import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

const blogPosts = [
    {
        title: 'How Farmers Achieved Record Yields with Modern Machinery',
        category: 'Success Stories',
        date: 'Feb 2026',
        image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop&q=80',
        link: '/insights/modern-machinery-yields'
    },
    {
        title: 'Enhancing Crop Productivity with Precision Farming Techniques',
        category: 'Precision Farming',
        date: 'Jan 2026',
        image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop&q=80',
        link: '/insights/precision-farming'
    },
    {
        title: 'Top 10 Tips for Maximizing Rice Mill Efficiency',
        category: 'Rice Milling',
        date: 'Dec 2025',
        image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2072&auto=format&fit=crop',
        link: '/insights/rice-mill-efficiency'
    },
];

export default function BlogSection() {
    return (
        <section className="py-24 bg-neutral-surface">
            <div className="max-w-7xl mx-auto px-6">
                <ScrollReveal className="text-center mb-16">
                    <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">
                        Knowledge Hub
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">
                        Latest Insights
                    </h3>
                    <div className="w-24 h-1.5 bg-brand-primary mx-auto mt-6 rounded-full" />
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {blogPosts.map((post, i) => (
                        <ScrollReveal key={i} delay={i * 120}>
                            <Link href={post.link}>
                                <article className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 h-full flex flex-col cursor-pointer">
                                    <div className="h-48 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                                        <img
                                            src={post.image}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt={post.title}
                                        />
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="px-3 py-1 bg-brand-light text-brand-primary text-[10px] font-bold uppercase rounded-full">
                                                {post.category}
                                            </span>
                                            <span className="text-xs text-gray-400">{post.date}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-text-primary leading-snug group-hover:text-brand-primary transition-colors mb-auto">
                                            {post.title}
                                        </h4>
                                        <div className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-primary">
                                            Read More
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
