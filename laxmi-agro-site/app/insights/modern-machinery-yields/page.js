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
                            src="/images/insights/pump-selection.svg"
                            alt="Farm water supply pump selection"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-brand-light text-brand-primary text-xs font-bold uppercase rounded-full">
                                Pump Selection
                            </span>
                            <span className="text-sm text-gray-500">Feb 2026</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-8 leading-tight">
                            How to Choose the Right Pump Set for Farm Water Supply
                        </h1>

                        <div className="prose prose-lg text-gray-600 max-w-none space-y-6">
                            <p className="lead text-xl">
                                A reliable pump set is the heart of farm water supply. The right selection depends on bore depth, delivery distance, pipe size, power availability, and daily water requirement.
                            </p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Start with water source and depth</h3>
                            <p>For borewell and open-well applications, buyers should first confirm water level, total head, discharge requirement, and whether the farm needs single-phase or three-phase supply.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Match pump capacity with field demand</h3>
                            <p>Oversized pumps can waste electricity and increase wear, while undersized pumps may not provide enough discharge. Laxmi Agro Enterprises helps buyers compare HP, stage, pipe size, and practical field usage.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Check accessories before installation</h3>
                            <p>Column pipes, cable length, starter panel, protection switch, clamps, and jointing material should be selected along with the pump to avoid installation delays.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Prefer dependable brands and spares</h3>
                            <p>For farm operations, product availability, service support, and replacement parts are as important as initial price. Choose products with clear specifications and local support.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Use proper protection</h3>
                            <p>Control panels, relays, and starters protect pumps from voltage fluctuation and overload. This can reduce breakdowns and extend pump life.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Buying support from Raipur</h3>
                            <p>Laxmi Agro Enterprises supplies pumps, cables, pipes, panels, and allied agriculture products for retailers, dealers, and field buyers across Raipur and nearby regions.</p>
                        </div>
                    </div>
                </article>
            </div>
        </main>
    );
}
