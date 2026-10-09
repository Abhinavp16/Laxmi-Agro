import Link from 'next/link';
import Icon from '@/components/Icon';
import {
    Call02Icon,
    DeliveryTruck01Icon,
    Facebook01Icon,
    InstagramIcon,
    Mail01Icon,
    Tick02Icon,
    YoutubeIcon,
} from '@hugeicons/core-free-icons';

const policyLinks = [
    { name: 'Terms', href: '/terms' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Delete Account', href: '/delete-account' },
    { name: 'Shipping', href: '/shipping' },
    { name: 'Refund', href: '/refund' },
    { name: 'Warranty', href: '/warranty' },
    { name: 'Dealer', href: '/dealer-agreement' },
    { name: 'Pricing', href: '/dealer-pricing' },
];

const socialLinks = [
    { name: 'facebook', icon: Facebook01Icon, href: '/contact' },
    { name: 'instagram', icon: InstagramIcon, href: '/contact' },
    { name: 'youtube', icon: YoutubeIcon, href: '/contact' },
];

export default function Footer() {
    return (
        <footer className="relative overflow-hidden bg-[#071f10] px-6 pb-6 pt-12 text-white sm:pt-14">
            <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#dfe8d3]/10 blur-[110px]" />
            <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#1b7a3b]/18 blur-[130px]" />
            <div className="footer-gold-orb absolute left-[12%] top-16 h-44 w-44 rounded-full bg-[#d9a441]/18 blur-[54px]" />
            <div className="footer-gold-orb footer-gold-orb-slow absolute bottom-20 right-[18%] h-56 w-56 rounded-full bg-[#f4c96b]/14 blur-[66px]" />

            <div className="relative z-10 mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-10 lg:grid-cols-2">
                    <div>
                        <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.028em] text-white md:text-4xl">
                            Ashirvad Marketing For Laxmi Agro Enterprises
                        </h2>

                        <div className="mt-7 grid gap-4 text-sm text-[#c8d5c0] sm:grid-cols-2">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dfe8d3]/12 text-[#dfe8d3]">
                                    <Icon icon={Tick02Icon} size={16} strokeWidth={2} />
                                </span>
                                <span className="font-medium">W.E.F. 20/04/2026</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dfe8d3]/12 text-[#dfe8d3]">
                                    <Icon icon={DeliveryTruck01Icon} size={16} strokeWidth={2} />
                                </span>
                                <span className="font-medium">Delivery arrangements confirmed per order</span>
                            </div>
                            <a href="tel:+919179110159" className="flex items-center gap-3 transition-colors hover:text-white">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dfe8d3]/12 text-[#dfe8d3]">
                                    <Icon icon={Call02Icon} size={16} strokeWidth={2} />
                                </span>
                                <span className="font-medium">Support: +91 91791 10159</span>
                            </a>
                            <a href="tel:+918770974845" className="flex items-center gap-3 transition-colors hover:text-white">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dfe8d3]/12 text-[#dfe8d3]">
                                    <Icon icon={Call02Icon} size={16} strokeWidth={2} />
                                </span>
                                <span className="font-medium">Office: +91 87709 74845</span>
                            </a>
                            <a href="mailto:ashirvadmarketing62@gmail.com" className="flex min-w-0 items-center gap-3 transition-colors hover:text-white">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dfe8d3]/12 text-[#dfe8d3]">
                                    <Icon icon={Mail01Icon} size={16} strokeWidth={2} />
                                </span>
                                <span className="truncate font-medium">ashirvadmarketing62@gmail.com</span>
                            </a>
                        </div>
                    </div>

                    <div className="lg:justify-self-end">
                        <p className="max-w-xl text-base leading-7 text-[#c8d5c0]">
                            Laxmi Agro showcases pumps, submersible cables, GI pipes, PVC column pipes, sprinkler sets, control panels, and allied agriculture supply products from Raipur.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <a href="mailto:ashirvadmarketing62@gmail.com" className="rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#dfe8d3] hover:text-[#17351d]">
                                Email Us
                            </a>
                            <a href="tel:+919179110159" className="rounded-full bg-[#dfe8d3] px-5 py-3 text-sm font-semibold text-[#17351d] transition-all hover:-translate-y-0.5 hover:bg-white">
                                Call Now
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-5 border-b border-white/10 py-9">
                    <span className="text-xs font-black uppercase tracking-[0.24em] text-[#91a486]">Follow Us</span>
                    <div className="flex gap-4">
                        {socialLinks.map((social) => (
                            <a key={social.name} href={social.href} aria-label={social.name} className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border border-white/10 bg-white/8 text-[#d8e3d1] shadow-lg transition-all hover:-translate-y-1 hover:bg-[#dfe8d3] hover:text-[#17351d]">
                                <Icon icon={social.icon} size={22} strokeWidth={1.9} />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-6 pt-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 text-xl font-semibold tracking-[-0.02em] text-white">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f8f5e9] shadow-lg">
                                <img src="/favicon-rounded.png" alt="Laxmi Agro" className="h-8 w-8 rounded-full object-contain" />
                            </span>
                            <span>Laxmi <span className="text-[#8fbf77]">Agro</span></span>
                        </Link>
                        <p className="mt-2 text-xs font-medium text-[#91a486]">Station Road, Opp. Surja Devi Shukla Complex, Raipur (C.G.)</p>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-[0.16em] text-[#91a486]">
                        {policyLinks.map((item) => (
                            <Link key={item.name} href={item.href} className="transition-colors hover:text-white">
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-8 text-center text-xs font-medium text-[#6f8367]">
                    <p suppressHydrationWarning>{`Copyright ${new Date().getFullYear()} Laxmi Agro. All rights reserved.`}</p>
                </div>
            </div>
        </footer>
    );
}
