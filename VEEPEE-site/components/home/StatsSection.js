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
        <section className="py-24 bg-gray-900 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <ScrollReveal className="text-center mb-16">
                    <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">
                        Covering India with Advanced Solutions
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-primary font-bold text-white">
                        Our Impact in Numbers
                    </h3>
                </ScrollReveal>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <ScrollReveal key={i} delay={i * 150}>
                            <div className="text-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                                <div className="text-4xl mb-4">{stat.icon}</div>
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    <Counter end={stat.value} suffix={stat.suffix} />
                                </div>
                                <p className="text-xs uppercase tracking-widest font-bold text-gray-400">
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
