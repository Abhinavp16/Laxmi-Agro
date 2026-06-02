import Link from 'next/link';

export default function BannersSection() {
    return (
        <section className="bg-[#dfe8d3] px-4 py-10 sm:px-6 sm:py-14 lg:px-7">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="home-kicker">Field Programs</div>
                        <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.022em] text-text-primary sm:text-4xl lg:text-5xl">
                            Dealer support and app-first ordering for modern agriculture supply.
                        </h2>
                    </div>
                    <p className="max-w-md text-sm leading-6 text-text-secondary sm:text-base">
                        Quick access to dealership programs, bulk support, and mobile-first product discovery.
                    </p>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-6">
                    <Link href="/dealership" className="group block h-full rounded-[2rem] border border-[#0b3b1f]/10 bg-[#edf3e6] p-2 shadow-[0_20px_55px_rgba(8,36,18,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.14)]">
                        <img 
                            src="/images/Banner/Dealer%20Banner.png" 
                            alt="Dealer Banner" 
                            className="block h-auto w-full rounded-[1.55rem] md:h-[260px] md:object-cover"
                         />
                    </Link>

                    <Link href="#" className="group block h-full rounded-[2rem] border border-[#0b3b1f]/10 bg-[#edf3e6] p-2 shadow-[0_20px_55px_rgba(8,36,18,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.14)]">
                        <img 
                            src="/images/Banner/appdownload%20banner.png" 
                            alt="App Download Banner" 
                            className="block h-auto w-full rounded-[1.55rem] md:h-[260px] md:object-cover"
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
}
