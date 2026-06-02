'use client';
import { useEffect, useRef, useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';

function Counter({ end, duration = 2000, suffix = '' }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const start = 0;
                    const increment = end / (duration / 16);
                    let current = start;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= end) {
                            setCount(end);
                            clearInterval(timer);
                        } else {
                            setCount(Math.floor(current));
                        }
                    }, 16);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return (
        <span ref={ref}>
            {count.toLocaleString()}{suffix}
        </span>
    );
}

const stats = [
    { value: 10000, suffix: '+', label: 'Products Delivered', icon: '\uD83D\uDCE6' },
    { value: 28, suffix: '+', label: 'States Covered', icon: '\uD83D\uDDFA\uFE0F' },
    { value: 250, suffix: '+', label: 'Active Dealers', icon: '\uD83E\uDD1D' },
    { value: 99, suffix: '%', label: 'Client Satisfaction', icon: '\u2B50' },
];

export default function StatsSection() {
    return (
        <section className="relative overflow-hidden bg-[#dfe8d3] px-4 py-16 sm:px-6 sm:py-24 lg:px-7">
            <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-white/25 blur-[120px]" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#0b3b1f]/10 blur-[100px]" />

            <div className="relative z-10 mx-auto max-w-7xl rounded-[2.3rem] bg-[#062712] px-5 py-10 text-white shadow-[0_28px_80px_rgba(8,36,18,0.18)] sm:px-8 sm:py-14 lg:px-12">
                <ScrollReveal className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1fr] lg:items-end">
                    <div>
                        <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">Covering India</div>
                        <h3 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.065em] text-white md:text-6xl">
                            Our Impact in Numbers
                        </h3>
                    </div>
                    <p className="max-w-xl text-base leading-7 text-white/60 lg:justify-self-end">
                        Practical distribution support, regional dealer relationships, and dependable dispatch workflows for agriculture supply categories.
                    </p>
                </ScrollReveal>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => (
                        <ScrollReveal key={i} delay={i * 150}>
                            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-7 transition-all hover:bg-white/[0.08]">
                                <div className="mb-5 text-3xl">{stat.icon}</div>
                                <div className="mb-2 text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">
                                    <Counter end={stat.value} suffix={stat.suffix} />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-white/45">
                                    {stat.label}
                                </p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
