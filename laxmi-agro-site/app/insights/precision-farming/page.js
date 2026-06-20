import Link from 'next/link';

export default function PrecisionFarming() {
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
                            src="/images/insights/pipes-cables.svg"
                            alt="Pipes cables and farm supply buying guide"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-brand-light text-brand-primary text-xs font-bold uppercase rounded-full">
                                Buying Guide
                            </span>
                            <span className="text-sm text-gray-500">Jan 2026</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-8 leading-tight">
                            PVC Column Pipes, GI Pipes, and Cables: What Buyers Should Check
                        </h1>

                        <div className="prose prose-lg text-gray-600 max-w-none space-y-6">
                            <p className="lead text-xl">
                                Pipes and cables directly affect pump performance, safety, and maintenance cost. A small mismatch in size or quality can create pressure loss, heating, leakage, or frequent service issues.
                            </p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">PVC column pipe selection</h3>
                            <p>Check pipe diameter, pressure rating, wall thickness, thread quality, and compatibility with the pump. Good column pipes help maintain steady discharge and safer borewell operation.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">GI pipes for tough field use</h3>
                            <p>GI pipes are preferred where strength and durability matter. Buyers should verify gauge, finish, length, and usage conditions before selecting a pipe.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Submersible cable safety</h3>
                            <p>Use cable suited to motor load, depth, and moisture exposure. Proper cable selection reduces voltage drop and helps protect the pump motor.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Jointing and installation material</h3>
                            <p>Jointing solution, clamps, bends, and fittings should be chosen carefully. Poor fittings can lead to leakage, pressure loss, and extra maintenance.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Buy as a complete system</h3>
                            <p>When pumps, pipes, cables, and control panels are selected together, the overall setup becomes easier to install and maintain.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Local catalogue support</h3>
                            <p>Laxmi Agro Enterprises offers practical agriculture supply categories for dealers, retailers, and farmers looking for dependable products in one place.</p>
                        </div>
                    </div>
                </article>
            </div>
        </main>
    );
}
