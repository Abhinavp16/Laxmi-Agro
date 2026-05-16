import Link from 'next/link';
import {
    featuredProductFallbackImage,
    getFeaturedDescription,
    normalizeFeaturedProduct,
    slugifyFeaturedProduct,
} from '@/lib/featured-products';

export default function FeaturedProductCard({
    product,
    href,
}) {
    const normalizedProduct = normalizeFeaturedProduct(product);
    const productHref = href || `/products/${slugifyFeaturedProduct(normalizedProduct)}`;
    const cardDescription = getFeaturedDescription(normalizedProduct);

    return (
        <div className="group mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-neutral-surface">
                <img
                    src={normalizedProduct.image || featuredProductFallbackImage}
                    className="h-full w-full object-cover object-center"
                    alt={normalizedProduct.name}
                />
                {normalizedProduct.badge && (
                    <div className={`absolute left-3 top-3 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm ${normalizedProduct.badgeStyle || 'border border-orange-100 bg-white text-brand-primary'}`}>
                        {normalizedProduct.badge}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col px-5 py-5">
                <h4 className="min-h-[3.6rem] text-[1.05rem] font-bold leading-snug text-text-primary">
                    {normalizedProduct.name}
                </h4>

                <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-gray-500">
                    {cardDescription}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
                    <p className="text-[1.1rem] font-black text-brand-primary">
                        {normalizedProduct.price}
                    </p>
                    <Link
                        href={productHref}
                        aria-label={`View details for ${normalizedProduct.name}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light/60 text-brand-primary shadow-sm transition-colors hover:bg-brand-primary hover:text-white"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
