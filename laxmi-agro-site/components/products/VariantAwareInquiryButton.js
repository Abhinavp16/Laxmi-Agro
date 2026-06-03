'use client';

import { useEffect, useState } from 'react';
import InquiryPopupButton from '@/components/InquiryPopupButton';

function buildVariantDetails(variant) {
    if (!variant) return [];

    return [
        `Variant: ${variant.displayName || variant.name}`,
        variant.sku ? `Variant SKU: ${variant.sku}` : '',
        variant.packing ? `Packing: ${variant.packing}` : '',
        variant.priceUnit ? `Price Unit: ${variant.priceUnit}` : '',
        variant.stock > 0 ? `Stock: ${variant.stock}` : 'Check availability',
        ...(Array.isArray(variant.attributes) ? variant.attributes.map((attribute) => `${attribute.key}: ${attribute.value}`) : []),
    ].filter(Boolean);
}

export default function VariantAwareInquiryButton({ productKey, productName, price = '', details = [], children = 'Inquire About the Product', className = '' }) {
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedPrice, setSelectedPrice] = useState(price);

    useEffect(() => {
        const handleVariantChange = (event) => {
            if (event.detail?.productKey !== productKey) return;
            setSelectedVariant(event.detail?.variant || null);
            setSelectedPrice(event.detail?.price || price);
        };

        window.addEventListener('product-variant-change', handleVariantChange);
        return () => window.removeEventListener('product-variant-change', handleVariantChange);
    }, [price, productKey]);

    const variantDetails = buildVariantDetails(selectedVariant);

    return (
        <InquiryPopupButton
            productName={selectedVariant ? `${productName} - ${selectedVariant.name}` : productName}
            price={selectedPrice || price}
            details={[...variantDetails, ...details]}
            className={className}
        >
            {children}
        </InquiryPopupButton>
    );
}
