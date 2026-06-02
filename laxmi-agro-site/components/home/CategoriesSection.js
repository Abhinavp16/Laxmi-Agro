'use client';

import { useState } from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

const INITIAL_VISIBLE_COUNT = 7;

const defaultCategories = [
    {
        name: 'Rice Mill Machinery',
        description: 'Commercial & Domestic Units',
        image: 'https://images.unsplash.com/photo-1687709644237-ca3ef4127cc2?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/1.jpg',
    },
    {
        name: 'Brush Cutters',
        description: 'Backpack & Side Pack Models',
        image: '/images/products/brush cutter.webp',
        fallback: '/images/products/brush cutter.webp',
    },
    {
        name: 'Water Pumps',
        description: 'Petrol & Electric Pumps',
        image: 'https://images.pexels.com/photos/34935520/pexels-photo-34935520.jpeg?w=1200&h=800&fit=crop',
        fallback: '/images/Banner/3.jpg',
    },
    {
        name: 'Welding Machines',
        description: 'Arc & MIG Welders',
        image: 'https://images.unsplash.com/photo-1759847552281-60e45956124d?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/4.jpg',
    },
    {
        name: 'Air Compressors',
        description: 'Oil-Free & Industrial',
        image: 'https://images.pexels.com/photos/31257317/pexels-photo-31257317.jpeg?w=1200&h=800&fit=crop',
        fallback: '/images/Banner/5.jpg',
    },
    {
        name: 'Power Tools',
        description: 'Drills, Grinders & More',
        image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1200&h=800&fit=crop&q=80',
        fallback: '/images/Banner/1.jpg',
    },
];

const defaultSection = {
    eyebrow: 'PRODUCT CATEGORIES',
    title: 'Our Expertise Areas',
    description: 'Explore our core machinery categories for agriculture, fabrication, irrigation, and workshop use.',
    buttonText: 'View Products',
};

export default function CategoriesSection({
    categories = defaultCategories,
    section = defaultSection,
}) {
    const [expanded, setExpanded] = useState(false);
    const visibleCategories = expanded ? categories : categories.slice(0, INITIAL_VISIBLE_COUNT);
    const shouldShowViewMoreCard = !expanded && categories.length > INITIAL_VISIBLE_COUNT;
    const remainingCount = Math.max(categories.length - INITIAL_VISIBLE_COUNT, 0);

    return (
        <section id="categories" className="bg-[#dfe8d3] px-4 py-16 sm:px-6 sm:py-24 lg:px-7">
            <div className="mx-auto max-w-7xl">
            <ScrollReveal className="mb-12 grid grid-cols-1 gap-5 lg:mb-16 lg:grid-cols-[0.8fr_1fr] lg:items-end">
                <div>
                    <div className="home-kicker">{section.eyebrow}</div>
                    <h3 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.065em] text-text-primary md:text-6xl">{section.title}</h3>
                </div>
                <p className="max-w-xl text-base leading-7 text-text-secondary lg:justify-self-end">{section.description}</p>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-4">
                {visibleCategories.map((cat, i) => {
                    return (
                        <ScrollReveal key={i} delay={i * 80}>
                            <Link
                                href={`/category/${encodeURIComponent(cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '')}`}
                                className="group mx-auto flex h-full w-full max-w-[420px] cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-[#0b3b1f]/10 bg-[#edf3e6]/80 p-3 shadow-[0_20px_55px_rgba(8,36,18,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.14)]"
                            >
                                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[1.55rem] bg-[#d6e0c9] p-4">
                                    <img
                                        src={cat.image}
                                        className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                                        alt={cat.name}
                                    />
                                </div>
                                <div className="flex min-h-[124px] flex-1 flex-col justify-between px-2 py-5">
                                    <h3 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.05em] text-text-primary">
                                        {cat.name}
                                    </h3>
                                    <div className="mt-5 flex items-center justify-between border-t border-[#0b3b1f]/10 pt-4 text-sm font-semibold text-brand-primary">
                                        <span>{section.buttonText || 'View Products'}</span>
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60">→</span>
                                    </div>
                                </div>
                            </Link>
                        </ScrollReveal>
                    );
                })}

                {shouldShowViewMoreCard && (
                    <ScrollReveal delay={visibleCategories.length * 80}>
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className="group mx-auto flex h-full min-h-[26rem] w-full max-w-[420px] flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-[#062712] px-8 text-center text-white shadow-[0_20px_55px_rgba(8,36,18,0.16)] transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/8">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="34"
                                    height="34"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-transform duration-300 group-hover:translate-x-1"
                                >
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-bold">View More</h3>
                            <p className="mt-3 text-sm font-medium text-white/85">
                                Show {remainingCount} more categories
                            </p>
                        </button>
                    </ScrollReveal>
                )}
            </div>
            </div>
        </section>
    );
}
