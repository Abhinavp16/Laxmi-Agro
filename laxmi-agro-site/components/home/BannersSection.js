import Link from 'next/link';

export default function BannersSection() {
    return (
        <section className="pb-16 pt-4 bg-white">
            <div className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-4 md:gap-6">
                    <Link href="/dealership" className="block h-full rounded-2xl cursor-pointer p-1 bg-gradient-to-br from-slate-200 via-blue-100 to-slate-300 shadow-sm hover:shadow-md transition-shadow">
                        <img 
                            src="/images/Banner/Dealer%20Banner.png" 
                            alt="Dealer Banner" 
                            className="block h-auto w-full rounded-[14px] md:h-[220px] md:object-cover"
                         />
                    </Link>

                    <Link href="#" className="block h-full rounded-2xl cursor-pointer p-1 bg-gradient-to-br from-cyan-100 via-teal-100 to-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                        <img 
                            src="/images/Banner/appdownload%20banner.png" 
                            alt="App Download Banner" 
                            className="block h-auto w-full rounded-[14px] md:h-[220px] md:object-cover"
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
}
