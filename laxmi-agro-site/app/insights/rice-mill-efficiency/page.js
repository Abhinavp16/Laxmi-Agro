import Link from 'next/link';

export default function RiceMillEfficiency() {
    return (
        <main className="pt-24 pb-16 bg-neutral-surface min-h-screen">
            <div className="max-w-4xl mx-auto px-6">
                <Link href="/" className="inline-flex items-center text-brand-primary hover:underline mb-8 font-medium">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Home
                </Link>

                <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="relative h-64 md:h-96 w-full">
                        <img
                            src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2072&auto=format&fit=crop"
                            alt="Rice Mill Efficiency"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-brand-light text-brand-primary text-xs font-bold uppercase rounded-full">
                                Rice Milling
                            </span>
                            <span className="text-sm text-gray-500">Dec 2025</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-8 leading-tight">
                            Top 10 Tips for Maximizing Rice Mill Efficiency
                        </h1>

                        <div className="prose prose-lg text-gray-600 max-w-none space-y-6">
                            <p className="lead text-xl">
                                Improving efficiency in rice milling is crucial for maximizing yield and profitability. Here are the top 10 expert tips to optimize your operations.
                            </p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">1. Regular Maintenance</h3>
                            <p>Ensure all machinery is serviced regularly to prevent breakdowns and ensure consistent output quality.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">2. Optimize Paddy Quality</h3>
                            <p>The quality of input paddy directly affects milling efficiency. Proper drying and cleaning before milling are essential.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">3. Upgrade to Modern Machinery</h3>
                            <p>Investing in modern rice milling technology can significantly reduce broken grains and increase head rice recovery.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">4. Monitor Moisture Content</h3>
                            <p>Maintaining the correct moisture content (around 14%) is critical for milling quality and storage stability.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">5. Efficient Rubber Rollers</h3>
                            <p>Use high-quality rubber rollers and adjust them properly to minimize grain breakage during husking.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">6. Proper Whitening Settings</h3>
                            <p>Adjust the whitening stones and screens to remove bran effectively without excessive pressure that causes breakage.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">7. Effective Dust Aspiration</h3>
                            <p>A good aspiration system keeps the mill clean and improves the quality of the final product by removing bran and dust.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">8. Staff Training</h3>
                            <p>Well-trained operators can identify issues early and operate machinery at optimal settings.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">9. Quality Control Checks</h3>
                            <p>Implement regular quality checks at different stages of the milling process to maintain consistency.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">10. Data-Driven Decisions</h3>
                            <p>Track production metrics to identify bottlenecks and areas for improvement in your milling line.</p>
                        </div>
                    </div>
                </article>
            </div>
        </main>
    );
}
