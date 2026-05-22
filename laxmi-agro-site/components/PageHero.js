import BackButton from '@/components/BackButton';

export default function PageHero({ title, subtitle, showBackButton = true, backHref = '/' }) {
    return (
        <section className="relative bg-gray-900 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1685988466819-59f04ed4e035?w=1920&h=600&fit=crop&q=60')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/50" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-10 sm:pt-36 sm:pb-12 md:pt-44 md:pb-16">
                {showBackButton && (
                    <div className="mb-6 sm:mb-8">
                        <BackButton fallbackHref={backHref} />
                    </div>
                )}
                <h1 className="max-w-[12ch] text-4xl sm:text-5xl md:text-7xl font-primary font-bold text-white leading-[1.05] break-words">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-5 max-w-2xl text-base sm:text-lg md:text-xl text-gray-300 leading-7 sm:leading-relaxed">
                        {subtitle}
                    </p>
                )}
                <div className="w-20 sm:w-24 h-1.5 bg-brand-primary mt-6 sm:mt-8 rounded-full" />
            </div>
        </section>
    );
}
