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
        <section id="categories" className="py-24 px-6 max-w-7xl mx-auto">
            <ScrollReveal className="text-center mb-16">
                <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">{section.eyebrow}</h2>
                <h3 className="text-4xl md:text-5xl font-primary font-bold text-text-primary">{section.title}</h3>
                <p className="text-text-secondary mt-6 max-w-2xl mx-auto">{section.description}</p>
                <div className="w-24 h-1.5 bg-brand-primary mx-auto mt-6 rounded-full" />
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
                {visibleCategories.map((cat, i) => {
                    return (
                        <ScrollReveal key={i} delay={i * 80}>
                            <Link
                                href={`/category/${encodeURIComponent(cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '')}`}
                                className="group flex h-full w-full max-w-[390px] mx-auto flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                            >
                                <div className="aspect-square overflow-hidden rounded-3xl bg-neutral-surface p-4 flex items-center justify-center">
                                    <img
                                        src={cat.image}
                                        className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                                        alt={cat.name}
                                    />
                                </div>
                                <div className="flex min-h-[120px] flex-1 flex-col items-center justify-center px-4 py-5 lg:min-h-[120px] lg:px-4 lg:py-5">
                                    <div className="mb-3 h-1 w-10 rounded-full bg-brand-primary/80" />
                                    <h3 className="min-h-[2.8rem] text-center text-[1.55rem] font-bold text-text-primary leading-tight lg:min-h-[3.2rem] lg:text-[1.45rem]">
                                        {cat.name}
                                    </h3>
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
                            className="group flex h-full min-h-[26rem] w-full max-w-[390px] mx-auto flex-col items-center justify-center rounded-3xl border border-brand-primary/15 bg-gradient-to-br from-brand-primary/75 via-brand-primary/65 to-brand-secondary/75 px-8 text-center text-white shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
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
        </section>
    );
}
