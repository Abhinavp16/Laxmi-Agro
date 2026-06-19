import { getApiBaseUrl } from '@/lib/api-base';
import { normalizeWebsiteImageUrl } from '@/lib/media-url';

const fallbackCategoryImage = 'https://placehold.co/800x520/f3f4f6/94a3b8?text=Category';
const fallbackProductImage = 'https://placehold.co/800x520/f3f4f6/94a3b8?text=Product';

async function fetchJson(path) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
}

export function slugifyCatalogName(name = '') {
    return encodeURIComponent(String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
}

function normalizeBrand(brand = {}) {
    return {
        id: String(brand.id || brand._id || ''),
        name: String(brand.name || '').trim(),
        slug: String(brand.slug || '').trim(),
        description: String(brand.description || '').trim(),
        image: normalizeWebsiteImageUrl(brand.logo?.url || '') || fallbackCategoryImage,
        href: `/brand/${brand.slug}`,
        productCount: Number(brand.productCount) || 0,
    };
}

function normalizeCategory(category = {}, hrefPrefix = '/category') {
    const slug = String(category.slug || slugifyCatalogName(category.name)).trim();
    return {
        id: String(category.id || category._id || ''),
        name: String(category.name || '').trim(),
        slug,
        description: String(category.description || '').trim(),
        image: normalizeWebsiteImageUrl(category.image || '') || fallbackCategoryImage,
        fallback: fallbackCategoryImage,
        href: `${hrefPrefix}/${slug}`,
        productCount: Number(category.productCount) || 0,
        products: [],
        productDetails: [],
        brand: category.brand || null,
    };
}

export function normalizeCatalogProduct(product = {}, order = 0) {
    const category = product.category || {};
    const brand = product.brand || {};
    const image = normalizeWebsiteImageUrl(product.image || product.primaryImage || '');
    const images = Array.isArray(product.images)
        ? product.images.map(normalizeWebsiteImageUrl).filter(Boolean)
        : [];

    const categorySlug = typeof category === 'string' ? category : category.slug || '';
    const brandName = typeof brand === 'string' ? brand : brand.name || '';
    const brandSlug = typeof brand === 'string' ? '' : brand.slug || '';
    const slug = String(product.slug || '').trim();
    const href = brandName === 'GENERAL PRODUCTS'
        ? `/category/${categorySlug}/${slug}`
        : `/brand/${brandSlug}/category/${categorySlug}/${slug}`;

    return {
        productId: String(product.productId || product.id || product._id || ''),
        id: String(product.id || product._id || product.productId || ''),
        name: String(product.name || '').trim(),
        slug,
        shortDescription: String(product.shortDescription || '').trim(),
        description: String(product.description || '').trim(),
        image: image || images[0] || fallbackProductImage,
        images: images.length > 0 ? images : (image ? [image] : []),
        sku: String(product.sku || '').trim(),
        stock: Number(product.stock) || 0,
        priceUnit: String(product.priceUnit || '').trim(),
        packing: String(product.packing || '').trim(),
        retailPrice: Number(product.retailPrice) || 0,
        wholesalePrice: Number(product.wholesalePrice) || 0,
        mrp: Number(product.mrp) || 0,
        order,
        category: typeof category === 'string' ? category : category.slug || category.name || '',
        categoryName: typeof category === 'string' ? category : category.name || '',
        categorySlug,
        brand: brandName,
        brandSlug,
        href,
    };
}

export async function getWebsiteHomeCatalog() {
    const json = await fetchJson('/website/catalog/home');
    const brands = Array.isArray(json?.data?.brands) ? json.data.brands.map(normalizeBrand).filter((item) => item.name) : [];
    const generalCategories = Array.isArray(json?.data?.generalCategories)
        ? json.data.generalCategories.map((category) => normalizeCategory(category)).filter((item) => item.name)
        : [];
    const featuredProducts = Array.isArray(json?.data?.featuredProducts)
        ? json.data.featuredProducts.map(normalizeCatalogProduct).filter((item) => item.name)
        : [];
    return { brands, generalCategories, featuredProducts };
}

export async function getWebsiteBrands() {
    const json = await fetchJson('/website/catalog/brands');
    return Array.isArray(json?.data) ? json.data.map(normalizeBrand).filter((item) => item.name) : [];
}

export async function getBrandCategories(brandSlug) {
    const json = await fetchJson(`/website/catalog/brands/${brandSlug}/categories`);
    const brand = json?.data?.brand ? normalizeBrand(json.data.brand) : null;
    const categories = Array.isArray(json?.data?.categories)
        ? json.data.categories.map((category) => normalizeCategory(category, `/brand/${brandSlug}/category`)).filter((item) => item.name)
        : [];
    return { brand, categories };
}

export async function getBrandCategoryProducts(brandSlug, categorySlug) {
    const json = await fetchJson(`/website/catalog/brands/${brandSlug}/categories/${categorySlug}/products`);
    const brand = json?.data?.brand ? normalizeBrand(json.data.brand) : null;
    const category = json?.data?.category ? normalizeCategory(json.data.category, `/brand/${brandSlug}/category`) : null;
    const products = Array.isArray(json?.data?.products)
        ? json.data.products.map(normalizeCatalogProduct).filter((item) => item.name)
        : [];
    return { brand, category, products };
}

export async function getGeneralCategories() {
    const json = await fetchJson('/website/catalog/categories/general');
    return Array.isArray(json?.data) ? json.data.map((category) => normalizeCategory(category)).filter((item) => item.name) : [];
}

export async function getGeneralCategoryProducts(categorySlug) {
    const json = await fetchJson(`/website/catalog/categories/${categorySlug}/products`);
    const category = json?.data?.category ? normalizeCategory(json.data.category) : null;
    const products = Array.isArray(json?.data?.products)
        ? json.data.products.map(normalizeCatalogProduct).filter((item) => item.name)
        : [];
    return { category, products };
}

export async function getAllWebsiteProducts(search = '') {
    const query = String(search || '').trim();
    const path = query
        ? `/website/catalog/products?search=${encodeURIComponent(query)}`
        : '/website/catalog/products';
    const json = await fetchJson(path);
    return Array.isArray(json?.data)
        ? json.data.map(normalizeCatalogProduct).filter((item) => item.name)
        : [];
}

export async function getWebsiteProduct(productSlug) {
    const json = await fetchJson(`/website/catalog/products/${productSlug}`);
    return json?.data ? normalizeCatalogProduct(json.data) : null;
}

export { fallbackCategoryImage, fallbackProductImage };
