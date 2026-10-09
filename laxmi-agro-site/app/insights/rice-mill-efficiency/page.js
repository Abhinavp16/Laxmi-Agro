import Link from 'next/link';
import { getInsightPost } from '@/lib/insights';
import Icon from '@/components/Icon';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

export default function RiceMillEfficiency() {
    const post = getInsightPost('/insights/rice-mill-efficiency');
    return (
        <main className="pt-32 sm:pt-36 lg:pt-44 pb-16 bg-neutral-surface min-h-screen">
            <div className="max-w-4xl mx-auto px-6">
                <Link href="/insights" className="inline-flex items-center text-brand-primary hover:underline mb-8 font-medium">
                    <Icon icon={ArrowLeft01Icon} size={16} strokeWidth={2} className="w-4 h-4 mr-2" />
                    All Insights
                </Link>

                <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="relative h-64 md:h-96 w-full">
                        <img
                            src={post.image}
                            alt={post.imageAlt}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-brand-light text-brand-primary text-xs font-bold uppercase rounded-full">
                                Irrigation Tips
                            </span>
                            <span className="text-sm text-gray-500">Dec 2025</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-8 leading-tight">
                            Sprinkler and Raingun Setup Tips for Reliable Field Coverage
                        </h1>

                        <div className="prose prose-lg text-gray-600 max-w-none space-y-6">
                            <p className="lead text-xl">
                                Sprinkler sets and rainguns help distribute water across the field, but performance depends on pump capacity, pipe layout, nozzle choice, and operating pressure.
                            </p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">1. Match pump pressure with coverage</h3>
                            <p>Before buying a sprinkler or raingun, confirm whether the pump can deliver enough pressure and discharge for the expected coverage area.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">2. Plan pipe layout properly</h3>
                            <p>Long runs, sharp bends, and undersized pipes reduce pressure. A practical layout keeps water flow stable across the field.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">3. Choose the right nozzle</h3>
                            <p>Nozzle size affects throw distance, droplet size, and water volume. Select it according to crop type, soil condition, and available pump pressure.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">4. Keep spacing consistent</h3>
                            <p>Uneven spacing creates dry patches and over-watered zones. Mark sprinkler positions before installation for better field coverage.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">5. Use reliable fittings</h3>
                            <p>Couplers, clamps, bends, and connectors must handle field pressure. Weak fittings can leak or disconnect during operation.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">6. Maintain filters and joints</h3>
                            <p>Clean filters and inspect joints regularly to avoid blockage, pressure drop, and uneven spray patterns.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">7. Get product guidance before purchase</h3>
                            <p>Laxmi Agro Enterprises can help buyers compare sprinkler sets, rainguns, pipes, pumps, and accessories for practical field requirements.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">8. Keep spares ready</h3>
                            <p>Keeping extra nozzles, washers, couplers, and clamps helps reduce downtime during peak irrigation periods.</p>
                        </div>
                    </div>
                </article>
            </div>
        </main>
    );
}
