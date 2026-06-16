import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ScrollReveal from '@/components/ScrollReveal';
import {
    findCategoryBySlug,
    getCategories,
    getCategoryProducts,
    productCardFallbackImage,
    slugifyCategoryName,
    slugifyProductName,
} from '@/lib/category-products';

export async function generateMetadata({ params }) {
    const categories = await getCategories();
    const resolvedParams = await params;
    const category = findCategoryBySlug(categories, resolvedParams.slug);

    return {
        title: category ? `${category.name} - Laxmi Agro` : 'Category Products - Laxmi Agro',
        description: category ? category.description : 'Browse our products in this category.',
    };
}

export default async function CategoryPage({ params }) {
    const categories = await getCategories();
    const resolvedParams = await params;
    const category = findCategoryBySlug(categories, resolvedParams.slug);

    if (!category) {
        return (
            <div className="page-transition min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-4xl md:text-5xl font-primary font-bold text-text-primary mb-6">Category Not Found</h1>
                <p className="text-text-secondary text-lg mb-8">We couldn't find the category you were looking for.</p>
                <Link
                    href="/products"
                    className="px-8 py-3 bg-brand-primary text-white font-bold rounded-full hover:bg-orange-600 transition-colors shadow-cta"
                >
                    Back to Products
                </Link>
            </div>
        );
    }

    const categoryProducts = getCategoryProducts(category);

    return (
        <div className="page-transition">
            <PageHero
                title={category.name}
                subtitle={category.description}
                backHref="/products"
            />

            <section className="py-24 px-6 max-w-7xl mx-auto">
                <ScrollReveal className="mb-12">
                    <h2 className="text-3xl md:text-4xl font-primary font-bold text-text-primary mb-4">
                        All Products in {category.name}
                    </h2>
                    <p className="text-text-secondary">
                        Browse our complete range of {category.name.toLowerCase()} for your agricultural and industrial needs.
                    </p>
                </ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {categoryProducts.map((product, index) => {
                        const cardDescription =
                            product.shortDescription ||
                            product.description ||
                            `Explore ${product.name} with reliable performance for professional agricultural and industrial use.`;
                        return (
                            <ScrollReveal key={index} delay={index * 80}>
                                <div className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white p-3 shadow-sm">
                                    <div className="mb-3 aspect-square overflow-hidden rounded-[1.2rem] bg-neutral-surface">
                                        <img
                                            src={product.image || productCardFallbackImage}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>

                                    <div className="flex flex-1 flex-col px-1 pb-1">
                                        <h3 className="min-h-[3.25rem] text-base font-bold leading-tight text-text-primary line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <p className="mt-2 min-h-[4.5rem] text-sm leading-6 text-gray-500 line-clamp-3">
                                            {cardDescription}
                                        </p>

                                        <div className="mt-auto pt-4">
                                            <Link
                                                href={`/category/${slugifyCategoryName(category.name)}/${slugifyProductName(product)}`}
                                                className="block w-full rounded-2xl border border-gray-200 bg-neutral-surface py-3 text-center text-sm font-bold text-text-secondary"
                                            >
                                                View Product Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        );
                    })}

                    {categoryProducts.length === 0 && (
                        <div className="sm:col-span-2 xl:col-span-4 rounded-[2rem] border border-dashed border-gray-300 bg-white/70 p-10 text-center">
                            <h3 className="text-2xl font-primary font-bold text-text-primary">No products added yet</h3>
                            <p className="mt-3 text-text-secondary">
                                This category is live, but no active products are linked to it right now.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
