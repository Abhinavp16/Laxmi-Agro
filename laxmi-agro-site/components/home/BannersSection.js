import Link from 'next/link';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.laxmiagro.app';
const APP_STORE_URL = 'https://apps.apple.com/in/app/laxmi-agro/id6804305521';

const storeQrs = [
    { label: 'Play Store', sublabel: 'Android', qr: '/images/qr-play-store.png', href: PLAY_STORE_URL },
    { label: 'App Store', sublabel: 'iPhone', qr: '/images/qr-app-store.png', href: APP_STORE_URL },
];

export default function BannersSection() {
    return (
        <section className="bg-[#dfe8d3] px-4 py-10 sm:px-6 sm:py-14 lg:px-7">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.022em] text-text-primary sm:text-4xl lg:text-5xl">
                            Dealer support and app-first ordering<br className="hidden lg:block" /> for modern agriculture supply.
                        </h2>
                    </div>
                    <p className="max-w-md text-sm leading-6 text-text-secondary sm:text-base">
                        Quick access to dealership programs, bulk support, and mobile-first product discovery.
                    </p>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-5 lg:gap-6">
                    <div className="group relative left-1/2 min-h-[292px] w-screen -translate-x-1/2 overflow-hidden bg-transparent transition-all sm:min-h-[356px]">
                        <div className="absolute inset-0 bg-white sm:top-[100px]" />

                        <div className="absolute left-6 top-[106px] h-[150px] w-[195px] sm:left-[max(20px,calc(50%-650px))] sm:top-[-6px] sm:h-[350px] sm:w-[520px]">
                            <img
                                src="/images/Banner/lae-app-download-phone.png"
                                alt="Laxmi Agro Enterprises app preview"
                                className="h-full w-full object-contain object-left-bottom"
                            />
                        </div>

                        <span className="absolute right-6 top-[139px] z-20 inline-flex items-center gap-3 rounded-full border border-white/85 bg-white px-4 py-2 text-sm font-bold text-[#f9761f] shadow-[0_12px_28px_rgba(8,36,18,0.12)] sm:hidden">
                            Download
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f9761f]/40 text-2xl leading-none">→</span>
                        </span>

                        <div className="relative z-10 flex min-h-[292px] flex-col px-7 pt-7 sm:ml-[max(430px,calc(50%-130px))] sm:min-h-[356px] sm:pt-[128px]">
                            <h3 className="max-w-[21rem] text-[28px] font-black leading-[1.18] tracking-[-0.045em] text-[#122316] sm:max-w-[700px] sm:text-5xl sm:leading-[1.08] sm:tracking-[-0.055em] lg:text-[48px] xl:text-[48px]">
                                Come make an Impact with Laxmi Agro
                            </h3>
                            <div className="mt-6 hidden items-center gap-4 sm:mt-8 sm:flex">
                                <span className="inline-flex w-fit shrink-0 items-center gap-6 rounded-full border border-[#f9761f]/70 px-8 py-3 text-base font-semibold text-[#f9761f] transition-colors group-hover:bg-[#f9761f] group-hover:text-white sm:gap-8">
                                    Download Now
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f9761f]/70 text-3xl leading-none transition-colors group-hover:border-white">→</span>
                                </span>
                                {storeQrs.map((store) => (
                                    <Link
                                        key={store.label}
                                        href={store.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`Scan to download on ${store.label}`}
                                        className="flex w-[152px] shrink-0 flex-col items-center gap-2 rounded-xl border border-[#122316]/10 bg-white/95 px-3 pb-3 pt-3 shadow-[0_12px_28px_rgba(8,36,18,0.12)] transition-transform hover:-translate-y-0.5"
                                    >
                                        <img
                                            src={store.qr}
                                            alt={`QR code to download Laxmi Agro app on ${store.label}`}
                                            className="h-[104px] w-[104px] rounded-md object-contain"
                                            loading="lazy"
                                        />
                                        <span className="text-center">
                                            <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#4f6248]">Click Or Scan</span>
                                            <span className="block text-[15px] font-extrabold leading-tight text-[#122316]">
                                                {store.label}
                                                <span className="ml-1 text-[11px] font-semibold text-[#4f6248]">· {store.sublabel}</span>
                                            </span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Link href="/dealership" className="group relative left-1/2 min-h-[300px] w-screen -translate-x-1/2 overflow-hidden bg-[#cbdab8] transition-all sm:min-h-[340px]">
                        <div className="absolute right-[max(28px,calc(50%-590px))] top-1/2 hidden h-56 w-56 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_24px_60px_rgba(8,36,18,0.12)] sm:flex lg:h-64 lg:w-64">
                            <img
                                src="/images/Banner/dealer-handshake.png"
                                alt="Dealer partnership handshake"
                                className="w-[82%] object-contain"
                            />
                        </div>

                        <div className="relative z-10 flex min-h-[300px] flex-col px-7 pt-9 sm:min-h-[340px] sm:px-[max(42px,calc(50%-610px))] sm:pt-12">
                            <h3 className="max-w-2xl text-[40px] font-black leading-[1.02] tracking-[-0.05em] text-[#122316] sm:text-6xl">
                                Become a <span className="text-[#0d4b8f]">Dealer</span>
                            </h3>
                            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-[#4f6248] sm:text-lg">
                                Join our India-wide supply network, access genuine products, and grow a profitable agriculture business.
                            </p>
                            <span className="mt-7 inline-flex w-fit items-center gap-8 rounded-full bg-[#0d4b8f] px-7 py-3 text-base font-bold text-white shadow-[0_16px_35px_rgba(13,75,143,0.24)] transition-colors group-hover:bg-white group-hover:text-[#0d4b8f] sm:mt-8">
                                Become Dealer
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl leading-none text-[#0d4b8f] transition-colors group-hover:bg-[#0d4b8f] group-hover:text-white">→</span>
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}
