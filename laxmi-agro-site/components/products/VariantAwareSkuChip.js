'use client';

import { useEffect, useState } from 'react';

export default function VariantAwareSkuChip({ productKey, sku }) {
    const [currentSku, setCurrentSku] = useState(sku || '');

    useEffect(() => {
        setCurrentSku(sku || '');
    }, [sku]);

    useEffect(() => {
        const handleVariantChange = (event) => {
            if (event.detail?.productKey !== productKey) return;
            setCurrentSku(event.detail?.variant?.sku || sku || '');
        };

        window.addEventListener('product-variant-change', handleVariantChange);
        return () => window.removeEventListener('product-variant-change', handleVariantChange);
    }, [productKey, sku]);

    if (!currentSku) return null;

    return (
        <span className="rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-600">
            SKU: {currentSku}
        </span>
    );
}
