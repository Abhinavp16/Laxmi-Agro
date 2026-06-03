'use client';

import { useEffect, useState } from 'react';
import { formatPrice, normalizeProductVariants } from '@/lib/category-products';

function variantPrice(variant) {
    return variant.retailPrice || variant.wholesalePrice || variant.mrp || 0;
}

export default function ProductVariantShowcase({ product, productKey = product?.name || '' }) {
    const variants = normalizeProductVariants(product?.variants || []);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);
    const selectedVariant = variants[selectedIndex];

    const selectVariant = (index) => {
        setSelectedIndex(Number(index) || 0);
        setMobileOpen(false);
    };

    useEffect(() => {
        if (!selectedVariant || !productKey) return;

        window.dispatchEvent(new CustomEvent('product-variant-change', {
            detail: {
                productKey,
                variant: selectedVariant,
                price: formatPrice(variantPrice(selectedVariant)),
            },
        }));
    }, [productKey, selectedVariant]);

    if (variants.length === 0) {
        return null;
    }

    return (
        <div className="relative z-20 mt-8 overflow-visible rounded-[1.9rem] border border-[#17351d]/10 bg-[#f5f8ef] p-4 shadow-[0_18px_55px_rgba(8,36,18,0.07)]">
            <div className="border-b border-[#17351d]/10 pb-4">
                <div>
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#102313]">
                        Select variant
                    </h3>
                </div>
            </div>

            <div className="relative mt-4 sm:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen((open) => !open)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#d5a14f] bg-white px-4 py-3 text-left text-sm font-semibold text-[#17351d] shadow-sm ring-2 ring-[#d5a14f]/12"
                    aria-expanded={mobileOpen}
                    aria-label="Select product variant"
                >
                    <span>{selectedVariant.name || `Variant ${selectedIndex + 1}`}</span>
                    <svg className={`h-4 w-4 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                    </svg>
                </button>

                {mobileOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#17351d]/10 bg-white p-2 shadow-[0_18px_45px_rgba(23,53,29,0.18)]">
                        {variants.map((variant, index) => {
                            const active = index === selectedIndex;
                            return (
                                <button
                                    key={`${variant.sku || variant.name}-mobile-${index}`}
                                    type="button"
                                    onClick={() => selectVariant(index)}
                                    className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors last:mb-0 ${active ? 'bg-[#f3ead8] font-semibold text-[#17351d]' : 'bg-[#f5f8ef] font-medium text-[#41513d] hover:bg-[#edf3e6]'}`}
                                >
                                    <span>{variant.name || `Variant ${index + 1}`}</span>
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${active ? 'bg-[#17351d] text-white' : 'bg-white text-[#17351d]'}`}>
                                        {active ? '✓' : index + 1}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-4 hidden gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-4">
                {variants.map((variant, index) => {
                    const active = index === selectedIndex;

                    return (
                        <button
                            key={`${variant.sku || variant.name}-${index}`}
                            type="button"
                            onClick={() => selectVariant(index)}
                            className={`group relative min-h-[4.2rem] overflow-hidden rounded-[1.05rem] border px-3 py-3 text-left transition-all duration-300 ${active ? 'border-[#d5a14f] bg-white text-[#17351d] shadow-[0_12px_28px_rgba(23,53,29,0.10)] ring-2 ring-[#d5a14f]/20' : 'border-[#17351d]/10 bg-white/72 text-[#17351d] hover:-translate-y-0.5 hover:border-[#17351d]/25 hover:bg-white'}`}
                        >
                            <div className={`absolute -right-6 -top-8 h-16 w-16 rounded-full ${active ? 'bg-[#d9a24a]/24' : 'bg-[#dfe8d3]'}`} />
                            {active && <div className="absolute inset-x-0 top-0 h-1 bg-[#d5a14f]" />}
                            <div className="relative z-10">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="pr-2 text-sm font-semibold leading-snug tracking-[-0.02em]">
                                            {variant.name || `Variant ${index + 1}`}
                                        </p>
                                    </div>
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${active ? 'bg-[#17351d] text-white' : 'bg-[#edf3e6] text-[#17351d]'}`}>
                                        {active ? '✓' : index + 1}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

        </div>
    );
}
