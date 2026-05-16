import Link from 'next/link';

export default function ModernMachineryYields() {
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
                            src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=2072&h=800&fit=crop&q=80"
                            alt="Modern Machinery Yields"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-brand-light text-brand-primary text-xs font-bold uppercase rounded-full">
                                Success Stories
                            </span>
                            <span className="text-sm text-gray-500">Feb 2026</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-8 leading-tight">
                            How Farmers Achieved Record Yields with Modern Machinery
                        </h1>

                        <div className="prose prose-lg text-gray-600 max-w-none space-y-6">
                            <p className="lead text-xl">
                                The agricultural landscape is undergoing a revolutionary transformation. Through the adoption of modern machinery, farmers are not just surviving but thriving, setting new records in crop yields.
                            </p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">The Shift to Mechanization</h3>
                            <p>Traditional farming methods, while time-honored, often struggled with efficiency and scale. The introduction of advanced tractors, automated harvesters, and precision seeders has changed the game.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Case Study: The Green Valley Cooperative</h3>
                            <p>In the heart of the Midwest, the Green Valley Cooperative implemented a fleet of autonomous tractors. The result? A 40% increase in planting efficiency and a 25% reduction in fuel costs within the first season.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Precision Planting</h3>
                            <p>Modern seeders ensure optimal seed depth and spacing, which is critical for maximizing germination rates. By eliminating overcrowding and ensuring uniform growth, farmers are seeing healthier crops and higher yields.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Harvesting Efficiency</h3>
                            <p>New combine harvesters equipped with grain loss monitors allow operators to adjust settings on the fly, minimizing waste. This technology ensures that more of the crop makes it from the field to the silo.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Reduced Soil Compaction</h3>
                            <p>Advanced machinery with better tire technology and track systems spreads weight more evenly, reducing soil compaction. This promotes better root growth and water infiltration, leading to robust plant health.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Looking to the Future</h3>
                            <p>As technology continues to evolve, the integration of AI and robotics promises even greater gains. Farmers who embrace these tools are positioning themselves for sustainable success in a demanding market.</p>
                        </div>
                    </div>
                </article>
            </div>
        </main>
    );
}
