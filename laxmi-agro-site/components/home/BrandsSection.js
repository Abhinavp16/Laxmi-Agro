import BrandStrip from '@/components/BrandStrip';

export default function BrandsSection() {
    return (
        <section className="py-16 border-y border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mb-10">
                    Authorized Representative &amp; Partnerships
                </p>
                <BrandStrip />
            </div>
        </section>
    );
}
