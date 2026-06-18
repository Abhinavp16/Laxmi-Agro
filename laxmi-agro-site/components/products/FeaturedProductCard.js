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
    const productHref = href || normalizedProduct.href || `/products/${slugifyFeaturedProduct(normalizedProduct)}`;
    const cardDescription = getFeaturedDescription(normalizedProduct);
    const brandName = normalizedProduct.brand === 'GENERAL PRODUCTS' ? '' : normalizedProduct.brand;
    const categoryName = normalizedProduct.categoryName;

    return (
        <div className="group mx-auto flex h-full w-full max-w-[340px] flex-col overflow-hidden rounded-[2rem] border border-[#0b3b1f]/10 bg-[#edf3e6]/80 shadow-[0_20px_55px_rgba(8,36,18,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,36,18,0.14)]">
            <div className="relative aspect-[1.08] overflow-hidden rounded-[1.75rem] bg-[#d6e0c9] m-3 mb-0">
                <img
                    src={normalizedProduct.image || featuredProductFallbackImage}
                    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    alt={normalizedProduct.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062712]/75 via-transparent to-transparent" />
                {normalizedProduct.badge && (
                    <div className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm ${normalizedProduct.badgeStyle || 'border border-white/30 bg-white/90 text-brand-primary'}`}>
                        {normalizedProduct.badge}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col px-5 py-5">
                <h4 className="min-h-[3.3rem] text-[1.08rem] font-bold leading-snug tracking-[-0.03em] text-text-primary">
                    {normalizedProduct.name}
                </h4>

                {(brandName || categoryName) && (
                    <div className="mt-2 space-y-1.5">
                        {brandName && (
                            <div className="inline-flex max-w-full items-center rounded-full border border-brand-primary/15 bg-white/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-brand-primary shadow-sm">
                                <span className="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                                <span className="truncate">{brandName}</span>
                            </div>
                        )}
                        {categoryName && (
                            <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-[#486352]">
                                <span className="font-black uppercase tracking-[0.12em] text-[#17351d]/55">Category: </span>
                                {categoryName}
                            </p>
                        )}
                    </div>
                )}

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5d6a5f]">
                    {cardDescription}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#0b3b1f]/10 pt-5">
                    <p className="text-[1rem] font-black text-brand-primary">
                        {normalizedProduct.price}
                    </p>
                    <Link
                        href={productHref}
                        aria-label={`View details for ${normalizedProduct.name}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#0b3b1f]/15 bg-white/60 text-brand-primary shadow-sm transition-colors hover:bg-brand-primary hover:text-white"
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
