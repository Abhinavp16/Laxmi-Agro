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
                            src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=2072&h=800&fit=crop&q=80"
                            alt="Precision Farming Techniques"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-brand-light text-brand-primary text-xs font-bold uppercase rounded-full">
                                Precision Farming
                            </span>
                            <span className="text-sm text-gray-500">Jan 2026</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-8 leading-tight">
                            Enhancing Crop Productivity with Precision Farming Techniques
                        </h1>

                        <div className="prose prose-lg text-gray-600 max-w-none space-y-6">
                            <p className="lead text-xl">
                                Precision farming is more than just a buzzword; it's a critical shift in how we approach agriculture. By leveraging technology, we can optimize every aspect of the crop cycle.
                            </p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">What is Precision Farming?</h3>
                            <p>At its core, precision farming uses data and technology to ensure that crops and soil receive exactly what they need for optimum health and productivity, minimizing waste and maximizing yields.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">GPS and Auto-Steer Systems</h3>
                            <p>GPS has revolutionized field work. With auto-steer systems, tractors can navigate fields with centimeter-level accuracy, reducing overlap, saving fuel, and lowering operator fatigue.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Variable Rate Technology (VRT)</h3>
                            <p>VRT allows farmers to apply fertilizers, pesticides, and seeds at variable rates across a field based on specific needs. This means applying more where the soil is rich and less where it isn't, optimizing input costs.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Remote Sensing and Drones</h3>
                            <p>Drones equipped with multispectral cameras can monitor crop health from the air. This early detection system allows for targeted interventions before pests or diseases can spread.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Soil Moisture Sensors</h3>
                            <p>Real-time data from soil sensors helps in precise irrigation scheduling. This not only conserves water but also prevents crop stress due to under or over-watering.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">Data Analytics for Better Decisions</h3>
                            <p>The integration of farm management software allows for the analysis of historical and real-time data. This empowers farmers to make informed decisions about planting times, crop varieties, and harvest schedules.</p>

                            <h3 className="text-xl font-bold text-text-primary mt-8">A Sustainable Future</h3>
                            <p>Precision farming is key to sustainable agriculture. By using resources more efficiently, we reduce environmental impact while ensuring food security for a growing global population.</p>
                        </div>
                    </div>
                </article>
            </div>
        </main>
    );
}
