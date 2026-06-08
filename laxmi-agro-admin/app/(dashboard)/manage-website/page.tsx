"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { apiFetch, buildApiUrl } from "@/lib/api"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Save, Trash2, Upload, Globe, ChevronDown, ChevronRight, BadgeCheck, RefreshCcw, Package, Headphones, ShieldCheck, CircleDollarSign, Truck, Wrench, Pencil } from "lucide-react"

type ProductVariantAttribute = { key: string; value: string }
type WebsiteProductVariant = {
    id?: string
    name: string
    displayName?: string
    sku: string
    attributes: ProductVariantAttribute[]
    mrp: number
    retailPrice: number
    wholesalePrice: number
    stock: number
    minOrderQuantity: number
    priceUnit: string
    packing: string
    isActive: boolean
    order: number
}
type WebsiteCategoryProduct = {
    productId: string
    name: string
    slug: string
    category: string
    shortDescription: string
    description: string
    sku: string
    mrp: number
    retailPrice: number
    wholesalePrice: number
    stock: number
    status: string
    image: string
    images: string[]
    variants: WebsiteProductVariant[]
    order: number
}
type WebsiteCategory = { name: string; description: string; image: string; products: string[]; productDetails: WebsiteCategoryProduct[]; isActive: boolean; order: number }
type WebsiteFeaturedProduct = { name: string; price: string; image: string; badge: string; specs: string[]; shortDescription: string; variants: WebsiteProductVariant[]; isActive: boolean; order: number }
type WebsiteHeroCard = { image: string; order: number }
type LabelSourceType = "image" | "icon"
type WebsiteLabel = { id: string; title: string; sourceType: LabelSourceType; image: string; icon: string; isActive: boolean; order: number }
type SectionConfig = { eyebrow: string; title: string; description?: string; sideText?: string; buttonText: string }
type AdminProductImage = { url: string; isPrimary?: boolean; order?: number }
type AdminProductOption = {
    _id: string
    name: string
    slug?: string
    category?: string
    shortDescription?: string
    description?: string
    sku?: string
    mrp?: number
    retailPrice?: number
    wholesalePrice?: number
    stock?: number
    status?: string
    images?: AdminProductImage[]
    variants?: WebsiteProductVariant[]
}

const DEFAULT_HERO_CARD_IMAGES = ["/images/Banner/1.jpg", "/images/Banner/2.jpg", "/images/Banner/3.jpg", "/images/Banner/4.jpg", "/images/Banner/5.jpg"]
const HERO_CARD_PAGE_LABELS = ["Home", "About Us", "Products", "Dealership", "Contact / Other Pages"]
const defaultHeroCards = (): WebsiteHeroCard[] => DEFAULT_HERO_CARD_IMAGES.map((image, order) => ({ image, order }))
const normalizeList = (values: string[]) => values.map((v) => v.trim()).filter(Boolean)
const toNumber = (value: unknown): number => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
}
const createEmptyVariant = (order = 0): WebsiteProductVariant => ({
    id: "",
    name: "",
    displayName: "",
    sku: "",
    attributes: [],
    mrp: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    stock: 0,
    minOrderQuantity: 1,
    priceUnit: "",
    packing: "",
    isActive: true,
    order,
})
const normalizeVariantAttributes = (values: any[]): ProductVariantAttribute[] => {
    if (!Array.isArray(values)) return []
    return values
        .map((attribute) => ({
            key: String(attribute?.key || "").trim(),
            value: String(attribute?.value || "").trim(),
        }))
        .filter((attribute) => attribute.key || attribute.value)
}
const normalizeProductVariants = (values: any[]): WebsiteProductVariant[] => {
    if (!Array.isArray(values)) return []
    return values
        .map((variant, index) => ({
            id: String(variant?._id || variant?.id || ""),
            name: String(variant?.name || "").trim(),
            displayName: String(variant?.displayName || variant?.name || "").trim(),
            sku: String(variant?.sku || "").trim(),
            attributes: normalizeVariantAttributes(variant?.attributes || []),
            mrp: toNumber(variant?.mrp),
            retailPrice: toNumber(variant?.retailPrice),
            wholesalePrice: toNumber(variant?.wholesalePrice),
            stock: toNumber(variant?.stock),
            minOrderQuantity: toNumber(variant?.minOrderQuantity) || 1,
            priceUnit: String(variant?.priceUnit || "").trim(),
            packing: String(variant?.packing || "").trim(),
            isActive: variant?.isActive !== false,
            order: Number.isFinite(variant?.order) ? variant.order : index,
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0))
}
const getPersistableProductVariants = (values: any[]): WebsiteProductVariant[] => normalizeProductVariants(values).filter((variant) => variant.name && variant.sku)
const createEmptyCategoryProduct = (categoryName = ""): WebsiteCategoryProduct => ({
    productId: "",
    name: "",
    slug: "",
    category: categoryName,
    shortDescription: "",
    description: "",
    sku: "",
    mrp: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    stock: 0,
    status: "active",
    image: "",
    images: [],
    variants: [],
    order: 0,
})
const normalizeCategoryProduct = (value: any, order: number): WebsiteCategoryProduct => {
    if (typeof value === "string") {
        const name = value.trim()
        return {
            productId: "",
            name,
            slug: "",
            category: "",
            shortDescription: "",
            description: "",
            sku: "",
            mrp: 0,
            retailPrice: 0,
            wholesalePrice: 0,
            stock: 0,
            status: "",
            image: "",
            images: [],
            variants: [],
            order,
        }
    }

    const images = Array.isArray(value?.images) ? value.images.map((image: any) => String(image || "")).filter(Boolean) : []
    return {
        productId: String(value?.productId || value?._id || ""),
        name: String(value?.name || "").trim(),
        slug: String(value?.slug || ""),
        category: String(value?.category || ""),
        shortDescription: String(value?.shortDescription || ""),
        description: String(value?.description || ""),
        sku: String(value?.sku || ""),
        mrp: toNumber(value?.mrp),
        retailPrice: toNumber(value?.retailPrice),
        wholesalePrice: toNumber(value?.wholesalePrice),
        stock: toNumber(value?.stock),
        status: String(value?.status || ""),
        image: String(value?.image || images[0] || ""),
        images,
        variants: normalizeProductVariants(value?.variants || []),
        order: Number.isFinite(value?.order) ? value.order : order,
    }
}
const normalizeCategoryProductList = (values: any[]): WebsiteCategoryProduct[] => {
    if (!Array.isArray(values)) return []
    return values
        .map((value, index) => normalizeCategoryProduct(value, index))
        .filter((product) => product.name)
}
const getPrimaryProductImage = (product: AdminProductOption): string => {
    const images = Array.isArray(product.images) ? product.images : []
    const sorted = [...images].sort((a, b) => (a?.order || 0) - (b?.order || 0))
    const primary = sorted.find((image) => image?.isPrimary) || sorted[0]
    return primary?.url || ""
}
const normalizeAdminProductOption = (item: any): AdminProductOption => ({
    _id: String(item?._id || ""),
    name: String(item?.name || ""),
    slug: String(item?.slug || ""),
    category: typeof item?.category === "string" ? item.category : "",
    shortDescription: String(item?.shortDescription || ""),
    description: String(item?.description || ""),
    sku: String(item?.sku || ""),
    mrp: toNumber(item?.mrp),
    retailPrice: toNumber(item?.retailPrice),
    wholesalePrice: toNumber(item?.wholesalePrice),
    stock: toNumber(item?.stock),
    status: String(item?.status || ""),
    variants: normalizeProductVariants(item?.variants || []),
    images: Array.isArray(item?.images) ? item.images.map((image: any) => ({
        url: String(image?.url || ""),
        isPrimary: Boolean(image?.isPrimary),
        order: toNumber(image?.order),
    })).filter((image: AdminProductImage) => image.url) : [],
})
const mapAdminProductToWebsiteProduct = (product: AdminProductOption, order: number): WebsiteCategoryProduct => {
    const image = getPrimaryProductImage(product)
    const images = Array.isArray(product.images) ? product.images.map((img) => String(img?.url || "")).filter(Boolean) : (image ? [image] : [])
    return {
        productId: product._id,
        name: product.name,
        slug: String(product.slug || ""),
        category: String(product.category || ""),
        shortDescription: String(product.shortDescription || ""),
        description: String(product.description || ""),
        sku: String(product.sku || ""),
        mrp: toNumber(product.mrp),
        retailPrice: toNumber(product.retailPrice),
        wholesalePrice: toNumber(product.wholesalePrice),
        stock: toNumber(product.stock),
        status: String(product.status || ""),
        image,
        images,
        variants: normalizeProductVariants(product.variants || []),
        order,
    }
}
const getCategoryProducts = (category: WebsiteCategory): WebsiteCategoryProduct[] => {
    const fromDetails = normalizeCategoryProductList(category.productDetails || [])
    if (fromDetails.length > 0) return fromDetails
    return normalizeList(category.products || []).map((name, index) => normalizeCategoryProduct(name, index))
}
const getCategoryProductNames = (category: WebsiteCategory): string[] => normalizeList(getCategoryProducts(category).map((product) => product.name))
const hasDraftProductContent = (product?: WebsiteCategoryProduct | null): boolean => {
    if (!product) return false
    return Boolean(product.name?.trim() || product.shortDescription?.trim() || product.image?.trim() || product.sku?.trim())
}
const categoryPreviewFallback = "https://placehold.co/160x110/0f1115/8a93a3?text=Category"
const productPreviewFallback = "https://placehold.co/120x120/0f1115/8a93a3?text=Product"
const defaultCategoriesSection: SectionConfig = {
    eyebrow: "PRODUCT CATEGORIES",
    title: "The Heart of Modern Farming",
    description: "Our diverse range of agriculture and industrial machines stands at the core of modern farming practices. Each piece of equipment is designed with utmost precision.",
    buttonText: "View All products",
}
const defaultFeaturedSection: SectionConfig = {
    eyebrow: "PRECISION ENGINEERING",
    title: "Our Popular Product",
    sideText: "Reliable agricultural products engineered for durability, performance, and strong field results.",
    buttonText: "Get Quote",
}
const ICON_OPTIONS = [
    { value: "refresh", label: "Return", Icon: RefreshCcw },
    { value: "badge", label: "Quality", Icon: BadgeCheck },
    { value: "package", label: "Delivery", Icon: Package },
    { value: "support", label: "Support", Icon: Headphones },
    { value: "shield", label: "Protection", Icon: ShieldCheck },
    { value: "value", label: "Value", Icon: CircleDollarSign },
    { value: "truck", label: "Shipping", Icon: Truck },
    { value: "service", label: "Service", Icon: Wrench },
] as const
const iconMap = Object.fromEntries(ICON_OPTIONS.map((item) => [item.value, item.Icon])) as Record<string, (props: { className?: string }) => JSX.Element>
const createEmptyLabel = (order = 0): WebsiteLabel => ({
    id: "",
    title: "",
    sourceType: "icon",
    image: "",
    icon: ICON_OPTIONS[0].value,
    isActive: true,
    order,
})
const normalizeLabel = (value: any, order: number): WebsiteLabel => {
    const icon = String(value?.icon || ICON_OPTIONS[0].value).trim()
    const sourceType: LabelSourceType = value?.sourceType === "image" ? "image" : "icon"
    return {
        id: String(value?.id || "").trim(),
        title: String(value?.title || "").trim(),
        sourceType,
        image: String(value?.image || "").trim(),
        icon: iconMap[icon] ? icon : ICON_OPTIONS[0].value,
        isActive: value?.isActive !== false,
        order: Number.isFinite(value?.order) ? value.order : order,
    }
}
const hasLabelVisual = (label: WebsiteLabel) => label.sourceType === "image" ? Boolean(label.image.trim()) : Boolean(label.icon.trim())

export default function ManageWebsitePage() {
    const searchParams = useSearchParams()
    const requestedTab = searchParams.get("tab")
    const initialTab = requestedTab === "labels" || requestedTab === "categories" || requestedTab === "featured" || requestedTab === "hero"
        ? requestedTab
        : "hero"
    const [isLoading, setIsLoading] = useState(true)
    const [isSavingHero, setIsSavingHero] = useState(false)
    const [isSavingCategories, setIsSavingCategories] = useState(false)
    const [isSavingProducts, setIsSavingProducts] = useState(false)
    const [isSavingLabels, setIsSavingLabels] = useState(false)
    const [uploading, setUploading] = useState<string | null>(null)
    const [heroCards, setHeroCards] = useState<WebsiteHeroCard[]>(defaultHeroCards())
    const [labels, setLabels] = useState<WebsiteLabel[]>([])
    const [categories, setCategories] = useState<WebsiteCategory[]>([])
    const [featuredProducts, setFeaturedProducts] = useState<WebsiteFeaturedProduct[]>([])
    const [categoriesSection, setCategoriesSection] = useState<SectionConfig>(defaultCategoriesSection)
    const [featuredSection, setFeaturedSection] = useState<SectionConfig>(defaultFeaturedSection)
    const [availableProducts, setAvailableProducts] = useState<AdminProductOption[]>([])
    const [isLoadingProductOptions, setIsLoadingProductOptions] = useState(false)
    const [refreshingProductKey, setRefreshingProductKey] = useState<string | null>(null)
    const [categorySelectedProductIds, setCategorySelectedProductIds] = useState<Record<number, string>>({})
    const [categoryDraftProducts, setCategoryDraftProducts] = useState<Record<number, WebsiteCategoryProduct>>({})
    const [expandedCategoryIndex, setExpandedCategoryIndex] = useState<number | null>(null)
    const [expandedProductKey, setExpandedProductKey] = useState<string | null>(null)
    const [draftLabel, setDraftLabel] = useState<WebsiteLabel>(createEmptyLabel())
    const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<"hero" | "labels" | "categories" | "featured">(initialTab)

    const uploadUrl = useMemo(() => buildApiUrl("/upload/image?folder=website"), [])
    const websiteBaseUrl = useMemo(() => {
        const raw = process.env.NEXT_PUBLIC_WEBSITE_BASE_URL || "http://localhost:3000"
        return raw.replace(/\/+$/, "")
    }, [])

    function previewSrc(url: string) {
        if (!url) return ""
        if (url.startsWith("http://") || url.startsWith("https://")) return url
        if (url.startsWith("/")) return `${websiteBaseUrl}${url}`
        return url
    }

    useEffect(() => {
        loadData()
        loadProductOptions()
    }, [])

    useEffect(() => {
        setExpandedCategoryIndex((prev) => {
            if (categories.length === 0) return null
            if (prev === null) return 0
            return Math.min(prev, categories.length - 1)
        })
    }, [categories.length])

    async function loadData() {
        try {
            const res = await apiFetch("/admin/website-settings")
            const data = await res.json()
            if (!res.ok || !data?.data) throw new Error("failed")
            const nextCategories = (data.data.productCategories || []).map((item: any, index: number) => ({
                name: item?.name || "",
                description: item?.description || "",
                image: item?.image || "",
                products: normalizeList(Array.isArray(item?.products) ? item.products : []),
                productDetails: normalizeCategoryProductList(
                    Array.isArray(item?.productDetails) ? item.productDetails : (Array.isArray(item?.products) ? item.products : [])
                ),
                isActive: item?.isActive !== false,
                order: Number.isFinite(item?.order) ? item.order : index,
            }))
            setCategories(nextCategories)
            // Ensure shortDescription exists for all products
            const loadedFeaturedProducts = (data.data.featuredProducts || []).map((p: any) => ({
                ...p,
                shortDescription: p.shortDescription || '',
                specs: Array.isArray(p.specs) ? p.specs : [],
                variants: normalizeProductVariants(p.variants || []),
            }))
            const loadedLabels = Array.isArray(data.data.labels)
                ? data.data.labels.map((item: any, index: number) => normalizeLabel(item, index))
                : []
            setLabels(loadedLabels)
            setFeaturedProducts(loadedFeaturedProducts)
            setCategoriesSection({ ...defaultCategoriesSection, ...(data.data.categoriesSection || {}) })
            setFeaturedSection({ ...defaultFeaturedSection, ...(data.data.featuredSection || {}) })
            const incoming = Array.isArray(data.data.heroCards) ? data.data.heroCards : []
            setHeroCards(incoming.length === 5 ? incoming.map((x: any, i: number) => ({ image: x?.image || DEFAULT_HERO_CARD_IMAGES[i], order: i })) : defaultHeroCards())
        } catch {
            toast.error("Failed to load website settings")
        } finally {
            setIsLoading(false)
        }
    }

    async function loadProductOptions() {
        setIsLoadingProductOptions(true)
        try {
            const collected: AdminProductOption[] = []
            let page = 1
            let hasNext = true

            while (hasNext && page <= 20) {
                const res = await apiFetch(`/admin/products?page=${page}&limit=50&status=active&sort=name:asc`)
                const data = await res.json()
                if (!res.ok) throw new Error("failed")

                const items = Array.isArray(data?.data) ? data.data : []
                collected.push(...items.map(normalizeAdminProductOption).filter((item: AdminProductOption) => item._id && item.name))

                hasNext = Boolean(data?.pagination?.hasNext)
                page += 1
            }

            setAvailableProducts(collected)
        } catch {
            toast.error("Failed to load product options")
        } finally {
            setIsLoadingProductOptions(false)
        }
    }

    async function persistCategories(nextCategories: WebsiteCategory[], nextCategoriesSection = categoriesSection) {
        const productCategories = nextCategories.map((category, index) => {
            const productDetails = getCategoryProducts(category).map((product, productIndex) => ({
                ...product,
                category: product.category || category.name,
                images: product.image ? [product.image] : normalizeList(product.images || []),
                variants: getPersistableProductVariants(product.variants || []),
                order: productIndex,
            }))
            return {
                ...category,
                products: normalizeList(productDetails.map((product) => product.name)),
                productDetails,
                order: Number.isFinite(category.order) ? category.order : index,
            }
        })

        const res = await apiFetch("/admin/website-settings", {
            method: "PUT",
            body: JSON.stringify({ productCategories, categoriesSection: nextCategoriesSection }),
        })

        if (!res.ok) {
            throw new Error("failed")
        }
    }

    async function addProductToCategory(categoryIndex: number) {
        const selectedProductId = categorySelectedProductIds[categoryIndex]
        if (!selectedProductId) return

        const selectedProduct = availableProducts.find((product) => product._id === selectedProductId)
        if (!selectedProduct) {
            toast.error("Selected product not found")
            return
        }

        const currentCategory = categories[categoryIndex]
        if (!currentCategory) return

        const productDetails = getCategoryProducts(currentCategory)
        const alreadyAdded = productDetails.some((product) =>
            product.productId
                ? product.productId === selectedProduct._id
                : product.name.toLowerCase() === selectedProduct.name.toLowerCase()
        )

        if (alreadyAdded) {
            toast.error("This product is already in the category")
            return
        }

        const nextProductDetails = [...productDetails, mapAdminProductToWebsiteProduct(selectedProduct, productDetails.length)]
        const nextCategories = categories.map((category, index) =>
            index === categoryIndex
                ? {
                    ...category,
                    productDetails: nextProductDetails,
                    products: normalizeList(nextProductDetails.map((product) => product.name)),
                }
                : category
        )

        setCategories(nextCategories)
        setCategorySelectedProductIds((prev) => ({ ...prev, [categoryIndex]: "" }))
        setExpandedProductKey(null)

        try {
            setIsSavingCategories(true)
            await persistCategories(nextCategories)
            toast.success("Product added and saved")
        } catch {
            setCategories(categories)
            toast.error("Product was added locally, but saving failed")
        } finally {
            setIsSavingCategories(false)
        }
    }

    async function refreshCategoryProductFromCatalog(categoryIndex: number, productIndex: number) {
        const currentCategory = categories[categoryIndex]
        const currentProduct = currentCategory ? getCategoryProducts(currentCategory)[productIndex] : null
        const productId = currentProduct?.productId

        if (!currentCategory || !currentProduct || !productId) {
            toast.error("Only linked catalog products can be refreshed")
            return
        }

        const productKey = `${categoryIndex}-${productIndex}`
        setRefreshingProductKey(productKey)

        try {
            const res = await apiFetch(`/admin/products/${productId}`)
            const data = await res.json()
            if (!res.ok || !data?.data) throw new Error("failed")

            const catalogProduct = normalizeAdminProductOption(data.data)
            const refreshedProduct = {
                ...mapAdminProductToWebsiteProduct(catalogProduct, productIndex),
                category: catalogProduct.category || currentCategory.name,
            }

            const nextCategories = categories.map((category, index) => {
                if (index !== categoryIndex) return category
                const productDetails = getCategoryProducts(category).map((product, idx) => idx === productIndex ? refreshedProduct : product)
                return {
                    ...category,
                    productDetails,
                    products: normalizeList(productDetails.map((product) => product.name)),
                }
            })

            setCategories(nextCategories)
            await persistCategories(nextCategories)
            setAvailableProducts((prev) => prev.map((product) => product._id === catalogProduct._id ? catalogProduct : product))
            toast.success(`Refreshed ${catalogProduct.name} from catalog`)
        } catch {
            toast.error("Failed to refresh product from catalog")
        } finally {
            setRefreshingProductKey(null)
        }
    }

    function updateDraftCategoryProduct(categoryIndex: number, updates: Partial<WebsiteCategoryProduct>) {
        setCategoryDraftProducts((prev) => {
            const current = prev[categoryIndex] || createEmptyCategoryProduct(categories[categoryIndex]?.name || "")
            const next = { ...current, ...updates }
            return { ...prev, [categoryIndex]: next }
        })
    }

    async function addDraftProductToCategory(categoryIndex: number) {
        const draftProduct = categoryDraftProducts[categoryIndex] || createEmptyCategoryProduct(categories[categoryIndex]?.name || "")
        if (!draftProduct.name.trim()) {
            toast.error("Product name is required")
            return
        }

        const currentCategory = categories[categoryIndex]
        if (!currentCategory) return

        const productDetails = getCategoryProducts(currentCategory)
        const nextProduct: WebsiteCategoryProduct = {
            ...draftProduct,
            name: draftProduct.name.trim(),
            category: draftProduct.category || currentCategory.name,
            image: draftProduct.image.trim(),
            images: draftProduct.image ? [draftProduct.image.trim()] : [],
            variants: getPersistableProductVariants(draftProduct.variants || []),
            order: productDetails.length,
        }

        const nextProductDetails = [...productDetails, nextProduct]
        const nextCategories = categories.map((category, index) =>
            index === categoryIndex
                ? {
                    ...category,
                    productDetails: nextProductDetails,
                    products: normalizeList(nextProductDetails.map((product) => product.name)),
                }
                : category
        )

        const nextDraftProduct = createEmptyCategoryProduct(categories[categoryIndex]?.name || "")
        setCategories(nextCategories)
        setCategoryDraftProducts((prev) => ({
            ...prev,
            [categoryIndex]: nextDraftProduct,
        }))
        setExpandedProductKey(null)

        try {
            setIsSavingCategories(true)
            await persistCategories(nextCategories)
            toast.success("Quick product added and saved")
        } catch {
            setCategories(categories)
            setCategoryDraftProducts((prev) => ({
                ...prev,
                [categoryIndex]: draftProduct,
            }))
            toast.error("Quick product was added locally, but saving failed")
        } finally {
            setIsSavingCategories(false)
        }
    }

    function updateCategoryProduct(categoryIndex: number, productIndex: number, updates: Partial<WebsiteCategoryProduct>) {
        setCategories((prev) => prev.map((category, index) => {
            if (index !== categoryIndex) return category
            const nextProductDetails = getCategoryProducts(category).map((product, idx) => {
                if (idx !== productIndex) return product
                const nextProduct = { ...product, ...updates }
                if (updates.image !== undefined) {
                    nextProduct.images = updates.image ? [updates.image] : []
                }
                return nextProduct
            })
            return {
                ...category,
                productDetails: nextProductDetails,
                products: normalizeList(nextProductDetails.map((product) => product.name)),
            }
        }))
    }

    function updateCategoryProductVariant(categoryIndex: number, productIndex: number, variantIndex: number, updates: Partial<WebsiteProductVariant>) {
        const product = getCategoryProducts(categories[categoryIndex])?.[productIndex]
        if (!product) return
        const variants = normalizeProductVariants(product.variants || []).map((variant, index) => index === variantIndex ? { ...variant, ...updates } : variant)
        updateCategoryProduct(categoryIndex, productIndex, { variants })
    }

    function addCategoryProductVariant(categoryIndex: number, productIndex: number) {
        const product = getCategoryProducts(categories[categoryIndex])?.[productIndex]
        if (!product) return
        const variants = normalizeProductVariants(product.variants || [])
        updateCategoryProduct(categoryIndex, productIndex, { variants: [...variants, createEmptyVariant(variants.length)] })
    }

    function removeCategoryProductVariant(categoryIndex: number, productIndex: number, variantIndex: number) {
        const product = getCategoryProducts(categories[categoryIndex])?.[productIndex]
        if (!product) return
        const variants = normalizeProductVariants(product.variants || [])
            .filter((_, index) => index !== variantIndex)
            .map((variant, index) => ({ ...variant, order: index }))
        updateCategoryProduct(categoryIndex, productIndex, { variants })
    }

    async function removeCategoryProduct(categoryIndex: number, productIndex: number) {
        const nextCategories = categories.map((category, index) => {
            if (index !== categoryIndex) return category
            const nextProductDetails = getCategoryProducts(category)
                .filter((_, idx) => idx !== productIndex)
                .map((product, idx) => ({ ...product, order: idx }))
            return {
                ...category,
                productDetails: nextProductDetails,
                products: normalizeList(nextProductDetails.map((product) => product.name)),
            }
        })

        setCategories(nextCategories)
        setExpandedProductKey((prev) => prev === `${categoryIndex}-${productIndex}` ? null : prev)

        try {
            setIsSavingCategories(true)
            await persistCategories(nextCategories)
            toast.success("Product removed and saved")
        } catch {
            setCategories(categories)
            toast.error("Product was removed locally, but saving failed")
        } finally {
            setIsSavingCategories(false)
        }
    }

    function removeCategoryCard(indexToRemove: number) {
        setCategories((prev) =>
            prev
                .filter((_, index) => index !== indexToRemove)
                .map((category, index) => ({ ...category, order: index }))
        )
        setCategorySelectedProductIds((prev) => {
            const next: Record<number, string> = {}
            for (const [key, value] of Object.entries(prev)) {
                const index = Number(key)
                if (index < indexToRemove) next[index] = value
                if (index > indexToRemove) next[index - 1] = value
            }
            return next
        })
        setCategoryDraftProducts((prev) => {
            const next: Record<number, WebsiteCategoryProduct> = {}
            for (const [key, value] of Object.entries(prev)) {
                const index = Number(key)
                if (index < indexToRemove) next[index] = value
                if (index > indexToRemove) next[index - 1] = value
            }
            return next
        })
        setExpandedCategoryIndex((prev) => {
            if (prev === null) return null
            if (prev === indexToRemove) return null
            return prev > indexToRemove ? prev - 1 : prev
        })
    }

    async function uploadSingleImage(file: File) {
        const token = localStorage.getItem("accessToken")
        const formData = new FormData()
        formData.append("image", file)
        const res = await fetch(uploadUrl, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData })
        const data = await res.json()
        if (!res.ok || !data?.data?.url) throw new Error("Upload failed")
        return String(data.data.url)
    }

    async function uploadLabelImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading("label-draft")
        try {
            const imageUrl = await uploadSingleImage(file)
            setDraftLabel((prev) => ({ ...prev, image: imageUrl, sourceType: "image" }))
            toast.success("Label image uploaded")
        } catch {
            toast.error("Failed to upload label image")
        } finally {
            setUploading(null)
            e.target.value = ""
        }
    }

    async function uploadImage(
        e: React.ChangeEvent<HTMLInputElement>,
        type: "hero" | "category" | "featured" | "category-product" | "draft-category-product",
        index: number,
        productIndex?: number
    ) {
        const file = e.target.files?.[0]
        if (!file) return
        const uploadKey = productIndex === undefined ? `${type}-${index}` : `${type}-${index}-${productIndex}`
        setUploading(uploadKey)
        try {
            const imageUrl = await uploadSingleImage(file)
            if (type === "hero") setHeroCards((prev) => prev.map((h, i) => i === index ? { ...h, image: imageUrl } : h))
            if (type === "category") setCategories((prev) => prev.map((c, i) => i === index ? { ...c, image: imageUrl } : c))
            if (type === "featured") setFeaturedProducts((prev) => prev.map((p, i) => i === index ? { ...p, image: imageUrl } : p))
            if (type === "category-product" && productIndex !== undefined) updateCategoryProduct(index, productIndex, { image: imageUrl, images: [imageUrl] })
            if (type === "draft-category-product") updateDraftCategoryProduct(index, { image: imageUrl, images: [imageUrl] })
            toast.success("Image uploaded")
        } catch {
            toast.error("Failed to upload image")
        } finally {
            setUploading(null)
            e.target.value = ""
        }
    }

    async function saveHeroCards() {
        setIsSavingHero(true)
        try {
            const heroCardsPayload = heroCards.map((item, index) => ({ image: item.image || DEFAULT_HERO_CARD_IMAGES[index], order: index }))
            const res = await apiFetch("/admin/website-settings", { method: "PUT", body: JSON.stringify({ heroCards: heroCardsPayload }) })
            if (!res.ok) throw new Error()
            toast.success("Hero images saved")
        } catch {
            toast.error("Failed to save hero images")
        } finally { setIsSavingHero(false) }
    }

    async function saveCategories() {
        setIsSavingCategories(true)
        try {
            await persistCategories(categories)
            setExpandedProductKey(null)
            toast.success("Website product categories saved")
        } catch {
            toast.error("Failed to save product categories")
        } finally { setIsSavingCategories(false) }
    }

    async function saveProducts() {
        setIsSavingProducts(true)
        try {
            const featuredProductsPayload = featuredProducts.map((p, i) => ({ ...p, specs: normalizeList(p.specs || []), shortDescription: p.shortDescription || '', variants: getPersistableProductVariants(p.variants || []), order: Number.isFinite(p.order) ? p.order : i }))
            const res = await apiFetch("/admin/website-settings", { method: "PUT", body: JSON.stringify({ featuredProducts: featuredProductsPayload, featuredSection }) })
            if (!res.ok) throw new Error()
            toast.success("Website featured products saved")
        } catch {
            toast.error("Failed to save featured products")
        } finally { setIsSavingProducts(false) }
    }

    function updateFeaturedProductVariant(productIndex: number, variantIndex: number, updates: Partial<WebsiteProductVariant>) {
        setFeaturedProducts((prev) => prev.map((product, index) => {
            if (index !== productIndex) return product
            const variants = normalizeProductVariants(product.variants || []).map((variant, idx) => idx === variantIndex ? { ...variant, ...updates } : variant)
            return { ...product, variants }
        }))
    }

    function addFeaturedProductVariant(productIndex: number) {
        setFeaturedProducts((prev) => prev.map((product, index) => {
            if (index !== productIndex) return product
            const variants = normalizeProductVariants(product.variants || [])
            return { ...product, variants: [...variants, createEmptyVariant(variants.length)] }
        }))
    }

    function removeFeaturedProductVariant(productIndex: number, variantIndex: number) {
        setFeaturedProducts((prev) => prev.map((product, index) => {
            if (index !== productIndex) return product
            const variants = normalizeProductVariants(product.variants || [])
                .filter((_, idx) => idx !== variantIndex)
                .map((variant, idx) => ({ ...variant, order: idx }))
            return { ...product, variants }
        }))
    }

    function resetDraftLabel() {
        setEditingLabelIndex(null)
        setDraftLabel(createEmptyLabel(labels.length))
    }

    function startEditLabel(index: number) {
        setEditingLabelIndex(index)
        setDraftLabel({ ...labels[index] })
    }

    async function persistLabels(nextLabels: WebsiteLabel[]) {
        const payload = nextLabels
            .map((item, index) => ({
                id: item.id || undefined,
                title: item.title.trim(),
                sourceType: item.sourceType,
                image: item.image.trim(),
                icon: item.icon.trim(),
                isActive: item.isActive !== false,
                order: index,
            }))
            .filter((item) => item.title && (item.sourceType === "image" ? item.image : item.icon))

        setIsSavingLabels(true)
        try {
            const res = await apiFetch("/admin/website-settings", {
                method: "PUT",
                body: JSON.stringify({ labels: payload }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.message || "Failed to save labels")

            const nextSavedLabels = Array.isArray(data?.data?.labels)
                ? data.data.labels.map((item: any, index: number) => normalizeLabel(item, index))
                : payload.map((item, index) => normalizeLabel(item, index))
            setLabels(nextSavedLabels)
            toast.success("Website labels saved")
            return true
        } catch (error: any) {
            toast.error(error?.message || "Failed to save labels")
            return false
        } finally {
            setIsSavingLabels(false)
        }
    }

    async function saveDraftLabel() {
        if (!draftLabel.title.trim()) {
            toast.error("Label title is required")
            return
        }
        if (!hasLabelVisual(draftLabel)) {
            toast.error("Choose an icon or upload an image")
            return
        }

        const targetIndex = editingLabelIndex === null ? labels.length : editingLabelIndex
        const normalizedDraft = normalizeLabel(
            {
                ...draftLabel,
                title: draftLabel.title.trim(),
                image: draftLabel.image.trim(),
                order: targetIndex,
            },
            targetIndex
        )

        const nextLabels = editingLabelIndex === null
            ? [...labels, normalizedDraft]
            : labels.map((item, index) => (index === editingLabelIndex ? normalizedDraft : item))

        const saved = await persistLabels(nextLabels)
        if (saved) {
            resetDraftLabel()
        }
    }

    async function removeLabel(index: number) {
        const nextLabels = labels.filter((_, itemIndex) => itemIndex !== index)
        const saved = await persistLabels(nextLabels)
        if (saved && editingLabelIndex === index) {
            resetDraftLabel()
        } else if (saved && editingLabelIndex !== null && editingLabelIndex > index) {
            setEditingLabelIndex(editingLabelIndex - 1)
        }
    }

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#86efac]" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900"><Globe className="h-7 w-7 text-[#86efac]" />Manage Website</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Each hero card controls one page banner. Admin can only update image.</p>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "hero" | "labels" | "categories" | "featured")} className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 border border-[#dde3d0] bg-white/90 p-1 sm:grid-cols-4">
                    <TabsTrigger value="hero" className="min-h-10 px-3 text-center text-slate-500 data-[state=active]:bg-[#f3f6ea] data-[state=active]:text-slate-900">Hero Section</TabsTrigger>
                    <TabsTrigger value="labels" className="min-h-10 px-3 text-center text-slate-500 data-[state=active]:bg-[#f3f6ea] data-[state=active]:text-slate-900">Labels</TabsTrigger>
                    <TabsTrigger value="categories" className="min-h-10 px-3 text-center text-slate-500 data-[state=active]:bg-[#f3f6ea] data-[state=active]:text-slate-900">Product Categories</TabsTrigger>
                    <TabsTrigger value="featured" className="min-h-10 px-3 text-center text-slate-500 data-[state=active]:bg-[#f3f6ea] data-[state=active]:text-slate-900">Popular Products</TabsTrigger>
                </TabsList>

                <TabsContent value="hero" className="mt-4">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        <Card className="border-[#dde3d0] bg-white/92 shadow-[0_24px_60px_rgba(60,80,40,0.08)] xl:col-span-8">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-900">
                                    <span className="inline-block w-2 h-2 rounded-full bg-[#86efac]" />
                                    Page Hero Banners
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {heroCards.map((item, index) => (
                                    <div key={index} className="space-y-3 rounded-2xl border border-[#dde3d0] bg-[#f8faf3] p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-slate-900">Card {index + 1} - {HERO_CARD_PAGE_LABELS[index]}</p>
                                            <span className="rounded-full border border-[#d8dfca] bg-white px-2 py-1 text-[11px] text-slate-600">{HERO_CARD_PAGE_LABELS[index]}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_170px] gap-3 items-start">
                                            <Input value={item.image} onChange={(e) => setHeroCards((prev) => prev.map((h, i) => i === index ? { ...h, image: e.target.value } : h))} className="border-[#d8dfca] bg-white text-slate-900" />
                                            <div className="h-24 overflow-hidden rounded-xl border border-[#d8dfca] bg-white">
                                                {item.image ? (
                                                    <img
                                                        src={previewSrc(item.image)}
                                                        alt={`Hero preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = `https://placehold.co/400x220/0b0f16/9ca3af?text=Hero+${index + 1}`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No image</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <input id={`hero-upload-${index}`} type="file" className="hidden" accept="image/*" onChange={(e) => uploadImage(e, "hero", index)} />
                                            <Button type="button" variant="outline" className="border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900" onClick={() => document.getElementById(`hero-upload-${index}`)?.click()} disabled={uploading === `hero-${index}`}>
                                                {uploading === `hero-${index}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Upload Image
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Button onClick={saveHeroCards} disabled={isSavingHero} className="w-full bg-gradient-to-r from-[#86efac] to-[#57d08f] text-black hover:opacity-95">{isSavingHero ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save Page Hero Images</Button>
                            </CardContent>
                        </Card>
                        <Card className="border-[#dde3d0] bg-white/92 shadow-[0_24px_60px_rgba(60,80,40,0.08)] xl:col-span-4 xl:sticky xl:top-24">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-900">Page Banner Preview</CardTitle>
                                <CardDescription className="text-slate-500">Preview of each page-specific hero banner.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                                    {heroCards.map((item, i) => (
                                        <div key={i} className="overflow-hidden rounded-2xl border border-[#dde3d0] bg-[#f8faf3]">
                                            <div className="relative h-28">
                                                {item.image ? (
                                                    <img
                                                        src={previewSrc(item.image)}
                                                        alt={`Card ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = `https://placehold.co/600x260/0b0f16/9ca3af?text=Hero+${i + 1}`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Image</div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                <div className="absolute top-2 left-2 text-[11px] px-2 py-1 rounded-full bg-black/60 text-white border border-white/20">{HERO_CARD_PAGE_LABELS[i]}</div>
                                            </div>
                                            <div className="p-2 flex items-center justify-between">
                                                <p className="truncate text-xs text-slate-500">Card {i + 1} - {HERO_CARD_PAGE_LABELS[i]}</p>
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86efac]">Fixed</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="labels" className="mt-4">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        <Card className="border-[#dde3d0] bg-white/92 shadow-[0_24px_60px_rgba(60,80,40,0.08)] xl:col-span-8">
                            <CardHeader>
                                <CardTitle className="text-slate-900">Product Labels</CardTitle>
                                <CardDescription className="text-slate-500">
                                    These labels come directly from the `WebsiteSettings.labels` schema and are used in product detail surfaces.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-900">Label Text</label>
                                    <Input
                                        value={draftLabel.title}
                                        onChange={(event) => setDraftLabel((prev) => ({ ...prev, title: event.target.value }))}
                                        placeholder="e.g. Verified Seller"
                                        className="border-[#d8dfca] bg-white text-slate-900"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-900">Visual Type</label>
                                    <div className="flex rounded-2xl border border-[#dde3d0] bg-[#f3f6ea] p-1">
                                        <button
                                            type="button"
                                            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${draftLabel.sourceType === "icon" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                                            onClick={() => setDraftLabel((prev) => ({ ...prev, sourceType: "icon" }))}
                                        >
                                            Icon
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${draftLabel.sourceType === "image" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                                            onClick={() => setDraftLabel((prev) => ({ ...prev, sourceType: "image" }))}
                                        >
                                            Image
                                        </button>
                                    </div>
                                </div>

                                {draftLabel.sourceType === "image" ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-900">Image URL</label>
                                            <Input
                                                value={draftLabel.image}
                                                onChange={(event) => setDraftLabel((prev) => ({ ...prev, image: event.target.value }))}
                                                placeholder="https://example.com/label-logo.png"
                                                className="border-[#d8dfca] bg-white text-slate-900"
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <label className="inline-flex">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={uploadLabelImage}
                                                    disabled={uploading === "label-draft"}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900"
                                                    disabled={uploading === "label-draft"}
                                                    asChild
                                                >
                                                    <span>
                                                        {uploading === "label-draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                                        Upload Logo
                                                    </span>
                                                </Button>
                                            </label>
                                            <span className="text-xs text-slate-500">Square transparent logos work best here.</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-slate-900">Choose Icon</label>
                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                                            {ICON_OPTIONS.map((option) => {
                                                const SelectedIcon = option.Icon
                                                const isSelected = draftLabel.icon === option.value

                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setDraftLabel((prev) => ({ ...prev, icon: option.value }))}
                                                        className={`min-h-[132px] rounded-[24px] border px-4 py-5 text-center transition-colors ${isSelected ? "border-[#86efac] bg-[#eef8f0] text-slate-900" : "border-[#dde3d0] bg-white text-slate-500 hover:border-[#bfd1ad] hover:text-slate-900"}`}
                                                    >
                                                        <SelectedIcon className={`mx-auto mb-4 h-11 w-11 ${isSelected ? "text-[#5aaa73]" : "text-slate-400"}`} />
                                                        <div className="text-sm font-medium leading-snug">{option.label}</div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    {editingLabelIndex !== null && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetDraftLabel}
                                            className="border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900"
                                        >
                                            Cancel Edit
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        onClick={() => { void saveDraftLabel() }}
                                        className="bg-[#86efac] text-black hover:bg-[#86efac]/90"
                                        disabled={isSavingLabels}
                                    >
                                        {isSavingLabels && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Label
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#dde3d0] bg-white/92 shadow-[0_24px_60px_rgba(60,80,40,0.08)] xl:col-span-4 xl:sticky xl:top-24">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-900">Labels Preview</CardTitle>
                                <CardDescription className="text-slate-500">Saved website labels from the same schema document.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {labels.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-[#dde3d0] p-8 text-center text-sm text-slate-500">
                                        No labels saved yet.
                                    </div>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                        {labels
                                            .filter((label) => label.title.trim() && hasLabelVisual(label))
                                            .map((label, index) => {
                                                const IconComponent = iconMap[label.icon] || BadgeCheck

                                                return (
                                                    <div key={`${label.title}-${index}`} className="rounded-2xl border border-[#dde3d0] bg-[#f8faf3] p-3">
                                                        <div className="mb-2 rounded-[16px] bg-[#eef8fb] p-3">
                                                            <div className="rounded-[12px] bg-[#dff1f4] p-3">
                                                                <div className="flex aspect-square flex-col items-center justify-center text-center">
                                                                    <div className="mb-2 flex items-center justify-center">
                                                                        {label.sourceType === "image" && label.image ? (
                                                                            <img src={label.image} alt={label.title} className="h-14 w-14 object-contain" />
                                                                        ) : (
                                                                            <IconComponent className="h-14 w-14 text-[#2d5f67]" />
                                                                        )}
                                                                    </div>
                                                                    <p className="line-clamp-2 text-xs font-medium leading-tight text-[#2d5f67]">{label.title}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                                                                onClick={() => startEditLabel(index)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                                onClick={() => { void removeLabel(index) }}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="categories" className="mt-4">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        <Card className="border-[#dde3d0] bg-white/92 shadow-[0_24px_60px_rgba(60,80,40,0.08)] xl:col-span-8">
                            <CardHeader>
                                <CardTitle className="text-slate-900">The Heart of Modern Farming</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3 rounded-lg border border-[#dde3d0] bg-[#f8faf3] p-4">
                                    <p className="text-sm font-semibold text-slate-900">Section Content</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input value={categoriesSection.eyebrow || ""} onChange={(e) => setCategoriesSection((prev) => ({ ...prev, eyebrow: e.target.value }))} placeholder="Eyebrow text" className="border-[#d8dfca] bg-white text-slate-900" />
                                        <Input value={categoriesSection.title || ""} onChange={(e) => setCategoriesSection((prev) => ({ ...prev, title: e.target.value }))} placeholder="Section title" className="border-[#d8dfca] bg-white text-slate-900" />
                                    </div>
                                    <Textarea value={categoriesSection.description || ""} onChange={(e) => setCategoriesSection((prev) => ({ ...prev, description: e.target.value }))} placeholder="Section description" className="min-h-[70px] border-[#d8dfca] bg-white text-slate-900" />
                                </div>
                                <div className="flex justify-start">
                                    <Button
                                        onClick={() => {
                                            setCategories((prev) => {
                                                const reordered = prev.map((category, index) => ({ ...category, order: index }))
                                                return [...reordered, { name: "", description: "", image: "", products: [], productDetails: [], isActive: true, order: reordered.length }]
                                            })
                                            setExpandedCategoryIndex(categories.length)
                                        }}
                                        variant="outline"
                                        className="border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Category Card
                                    </Button>
                                </div>
                                {categories.length === 0 && (
                                    <div className="rounded-lg border border-dashed border-[#dde3d0] p-6 text-center text-sm text-slate-500">
                                        No category cards yet. Click `Add Category Card` to create one.
                                    </div>
                                )}
                                {categories.map((item, index) => {
                                    const isExpanded = expandedCategoryIndex === index
                                    const categoryProducts = getCategoryProducts(item)
                                    const selectedProduct = availableProducts.find((product) => product._id === (categorySelectedProductIds[index] || ""))
                                    const draftProduct = categoryDraftProducts[index] || createEmptyCategoryProduct(item.name)
                                    return (
                                        <div key={index} className="overflow-hidden rounded-lg border border-[#dde3d0] bg-white">
                                            <button
                                                type="button"
                                                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#f8faf3]"
                                                onClick={() => setExpandedCategoryIndex((prev) => prev === index ? null : index)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md border border-[#d8dfca] bg-white">
                                                        <img
                                                            src={previewSrc(item.image || categoryPreviewFallback)}
                                                            alt={item.name || `Category ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = categoryPreviewFallback
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.name || `Card ${index + 1}`}</p>
                                                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{categoryProducts.length} products - Order {item.order ?? index}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[11px] px-2 py-1 rounded-full border ${item.isActive !== false ? "border-[#2e4d35] text-[#86efac] bg-[#1d2a1f]" : "border-[#444] text-[#aaa] bg-[#1b1b1b]"}`}>
                                                        {item.isActive !== false ? "Active" : "Inactive"}
                                                    </span>
                                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                                </div>
                                            </button>
                                            {isExpanded && (
                                                <div className="space-y-3 border-t border-[#dde3d0] bg-[#f8faf3] p-4">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">Category Setup</p>
                                                            <p className="mt-1 text-[11px] text-slate-500">Set the category, then add products.</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-slate-500">Active</span>
                                                            <Switch checked={item.isActive !== false} onCheckedChange={(v) => setCategories((prev) => prev.map((c, i) => i === index ? { ...c, isActive: v } : c))} />
                                                            <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8" onClick={() => removeCategoryCard(index)}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4 rounded-xl border border-[#dde3d0] bg-white p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <p className="text-[11px] uppercase tracking-wide text-slate-500">Category name</p>
                                                                <Input
                                                                    value={item.name}
                                                                    onChange={(e) => {
                                                                        const name = e.target.value
                                                                        setCategories((prev) => prev.map((c, i) => i === index ? { ...c, name } : c))
                                                                        if (!categoryDraftProducts[index]?.category) {
                                                                            updateDraftCategoryProduct(index, { category: name })
                                                                        }
                                                                    }}
                                                                    placeholder="Rice Mills & Mini Rice Mills"
                                                                    className="border-[#d8dfca] bg-white text-slate-900"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-[11px] uppercase tracking-wide text-slate-500">Category image URL</p>
                                                                <Input value={item.image} onChange={(e) => setCategories((prev) => prev.map((c, i) => i === index ? { ...c, image: e.target.value } : c))} placeholder="Paste category image URL" className="border-[#d8dfca] bg-white text-slate-900" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Category description</p>
                                                            <Textarea value={item.description} onChange={(e) => setCategories((prev) => prev.map((c, i) => i === index ? { ...c, description: e.target.value } : c))} placeholder="Write a short category summary for the website card and category page." className="min-h-[90px] border-[#d8dfca] bg-white text-slate-900" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Category button text</p>
                                                            <Input value={categoriesSection.buttonText || "View All products"} onChange={(e) => setCategoriesSection((prev) => ({ ...prev, buttonText: e.target.value || "View All products" }))} placeholder="View All products" className="border-[#d8dfca] bg-white text-slate-900" />
                                                        </div>
                                                        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 items-stretch">
                                                            <div className="h-full space-y-2 rounded-lg border border-[#dde3d0] bg-[#f8faf3] p-3">
                                                                <p className="text-[11px] uppercase tracking-wide text-slate-500">Category image preview</p>
                                                                <div className="h-[148px] w-full overflow-hidden rounded-md border border-[#d8dfca] bg-white">
                                                                    <img
                                                                        src={previewSrc(item.image || categoryPreviewFallback)}
                                                                        alt={item.name || `Category ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = categoryPreviewFallback
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex min-h-[188px] flex-col justify-between rounded-lg border border-[#dde3d0] bg-[#f8faf3] p-3">
                                                                <div className="space-y-2">
                                                                <p className="text-sm font-medium text-slate-900">Upload category image</p>
                                                                <p className="text-[11px] text-slate-500">This upload is only for the category card image.</p>
                                                                </div>
                                                                <input id={`category-upload-${index}`} type="file" className="hidden" accept="image/*" onChange={(e) => uploadImage(e, "category", index)} />
                                                                <Button type="button" variant="outline" className="border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900" onClick={() => document.getElementById(`category-upload-${index}`)?.click()} disabled={uploading === `category-${index}`}>
                                                                    {uploading === `category-${index}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                                                    Upload Category Image
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3 rounded-lg border border-[#dde3d0] bg-white p-3">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-700">Products In This Category</p>
                                                            <span className="text-[11px] text-slate-500">{categoryProducts.length} added</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                            <div className="space-y-3 rounded-lg border border-[#dde3d0] bg-[#f8faf3] p-3">
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-900">Add existing product</p>
                                                                    <p className="mt-1 text-[11px] text-slate-500">Attach a product from your catalog.</p>
                                                                </div>
                                                                <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_auto] gap-2">
                                                                    <select
                                                                        value={categorySelectedProductIds[index] || ""}
                                                                        onChange={(e) => setCategorySelectedProductIds((prev) => ({ ...prev, [index]: e.target.value }))}
                                                                        className="h-10 w-full min-w-0 rounded-md border border-[#d8dfca] bg-white px-3 text-sm text-slate-900"
                                                                        disabled={isLoadingProductOptions}
                                                                    >
                                                                        <option value="">{isLoadingProductOptions ? "Loading products..." : "Select product to add"}</option>
                                                                        {availableProducts.map((product) => (
                                                                            <option key={product._id} value={product._id}>
                                                                                {product.name}{product.category ? ` (${product.category})` : ""}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <Button type="button" variant="outline" className="w-full 2xl:w-auto whitespace-normal border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900" onClick={() => addProductToCategory(index)} disabled={isLoadingProductOptions || !categorySelectedProductIds[index]}>
                                                                        <Plus className="h-4 w-4 mr-2" />
                                                                        Add Existing
                                                                    </Button>
                                                                </div>
                                                                {selectedProduct && (
                                                                    <div className="flex items-center gap-2 rounded-md border border-[#dde3d0] bg-white p-2">
                                                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#d8dfca] bg-white">
                                                                            <img
                                                                                src={previewSrc(getPrimaryProductImage(selectedProduct) || productPreviewFallback)}
                                                                                alt={selectedProduct.name}
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    (e.target as HTMLImageElement).src = productPreviewFallback
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="line-clamp-1 text-xs font-medium text-slate-900">{selectedProduct.name}</p>
                                                                            <p className="line-clamp-1 text-[11px] text-slate-500">{selectedProduct.category || "No category"} - SKU: {selectedProduct.sku || "N/A"} - {normalizeProductVariants(selectedProduct.variants || []).length} variants</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="space-y-3 rounded-lg border border-[#d7e5c9] bg-[#f5faef] p-3">
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-900">Quick add product</p>
                                                                    <p className="mt-1 text-[11px] text-slate-500">Create a simple category product.</p>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                        <Input value={draftProduct.name} onChange={(e) => updateDraftCategoryProduct(index, { name: e.target.value, category: item.name || draftProduct.category })} placeholder="Product name" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                        <Input value={draftProduct.image} onChange={(e) => updateDraftCategoryProduct(index, { image: e.target.value, images: e.target.value ? [e.target.value] : [] })} placeholder="Product image URL" className="border-[#d8dfca] bg-white text-slate-900 md:col-span-2" />
                                                                        <Textarea value={draftProduct.shortDescription} onChange={(e) => updateDraftCategoryProduct(index, { shortDescription: e.target.value, description: e.target.value })} placeholder="Short product description" className="min-h-[96px] border-[#d8dfca] bg-white text-slate-900 md:col-span-2" />
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <input id={`draft-category-product-upload-${index}`} type="file" className="hidden" accept="image/*" onChange={(e) => uploadImage(e, "draft-category-product", index)} />
                                                                        <Button type="button" variant="outline" className="border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900" onClick={() => document.getElementById(`draft-category-product-upload-${index}`)?.click()} disabled={uploading === `draft-category-product-${index}`}>
                                                                            {uploading === `draft-category-product-${index}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                                                            Upload Product Image
                                                                        </Button>
                                                                        <Button type="button" className="bg-[#86efac] text-black hover:opacity-95" onClick={() => addDraftProductToCategory(index)}>
                                                                            <Plus className="h-4 w-4 mr-2" />
                                                                            Add Quick Product
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {categoryProducts.length === 0 && (
                                                            <p className="text-[11px] text-[#717171]">No products added yet.</p>
                                                        )}
                                                        {categoryProducts.map((product, productIndex) => {
                                                            const productKey = `${index}-${productIndex}`
                                                            const showProductDetails = expandedProductKey === productKey
                                                            return (
                                                                <div key={productKey} className="space-y-2 rounded-lg border border-[#dde3d0] bg-white p-3">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="min-w-0 flex items-center gap-2">
                                                                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#d8dfca] bg-white">
                                                                                <img
                                                                                    src={previewSrc(product.image || product.images?.[0] || productPreviewFallback)}
                                                                                    alt={product.name}
                                                                                    className="w-full h-full object-cover"
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).src = productPreviewFallback
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="line-clamp-1 text-sm font-medium text-slate-900">{product.name}</p>
                                                                                <p className="line-clamp-1 text-[11px] text-slate-500">{product.productId ? `SKU: ${product.sku || "N/A"} - Stock: ${product.stock}` : "Quick category product"} - {normalizeProductVariants(product.variants || []).length} variants</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                             {product.productId && (
                                                                                <Link href={`/products/edit/${product.productId}`}>
                                                                                    <Button type="button" variant="outline" size="sm" className="border-[#2d4771] bg-[#101722] text-[#cfe2ff] hover:bg-[#162033]">
                                                                                        Edit Product
                                                                                    </Button>
                                                                                </Link>
                                                                            )}
                                                                            {product.productId && (
                                                                                <Button type="button" variant="outline" size="sm" className="border-[#36533a] bg-[#102016] text-[#b8efc2] hover:bg-[#172a1d]" onClick={() => refreshCategoryProductFromCatalog(index, productIndex)} disabled={refreshingProductKey === productKey}>
                                                                                    {refreshingProductKey === productKey ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5 mr-1" />}
                                                                                    Refresh from Catalog
                                                                                </Button>
                                                                            )}
                                                                            <Button type="button" variant="outline" size="sm" className="border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900" onClick={() => setExpandedProductKey((prev) => prev === productKey ? null : productKey)}>
                                                                                {showProductDetails ? "Close" : (product.productId ? "Details" : "Edit")}
                                                                            </Button>
                                                                            <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8" onClick={() => removeCategoryProduct(index, productIndex)}>
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    {showProductDetails && (
                                                                        <div className="space-y-2">
                                                                            {product.productId ? (
                                                                                <div className="rounded-md border border-[#244033] bg-[#102016] px-3 py-2 text-[11px] text-[#9fdfb6]">
                                                                                    This card is linked to a real catalog product. Use `Refresh from Catalog` to pull the latest images, prices, stock, and variants. Use `Edit Product` to update the source item.
                                                                                </div>
                                                                            ) : (
                                                                                <div className="rounded-md border border-[#3b3020] bg-[#1b1610] px-3 py-2 text-[11px] text-[#facc15]">
                                                                                    This entry is a quick category product. You can edit its content and upload its image here.
                                                                                </div>
                                                                            )}
                                                                            {product.productId ? (
                                                                                <div className="space-y-2 text-xs text-slate-600">
                                                                                    <p><span className="text-slate-500">Category:</span> {product.category || "N/A"}</p>
                                                                                    <p><span className="text-slate-500">SKU:</span> {product.sku || "N/A"}</p>
                                                                                    <p><span className="text-slate-500">Stock:</span> {product.stock}</p>
                                                                                    <p><span className="text-slate-500">Short Description:</span> {product.shortDescription || "N/A"}</p>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="grid grid-cols-1 gap-2">
                                                                                    <Input value={product.name} onChange={(e) => updateCategoryProduct(index, productIndex, { name: e.target.value })} placeholder="Product name" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                    <Input value={product.image} onChange={(e) => updateCategoryProduct(index, productIndex, { image: e.target.value, images: e.target.value ? [e.target.value] : [] })} placeholder="Image URL" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                    <Textarea value={product.shortDescription} onChange={(e) => updateCategoryProduct(index, productIndex, { shortDescription: e.target.value, description: e.target.value })} placeholder="Short description" className="min-h-[80px] border-[#d8dfca] bg-white text-slate-900" />
                                                                                </div>
                                                                            )}
                                                                            <div className="space-y-3 rounded-lg border border-[#d7e5c9] bg-[#f5faef] p-3">
                                                                                <div className="flex items-center justify-between gap-3">
                                                                                    <div>
                                                                                        <p className="text-xs font-semibold text-slate-900">Product Variants</p>
                                                                                        <p className="text-[11px] text-slate-500">Sizes, capacities, packings, SKU, price and stock.</p>
                                                                                    </div>
                                                                                    {!product.productId && (
                                                                                        <Button type="button" size="sm" variant="outline" className="border-[#36533a] bg-[#102016] text-[#b8efc2] hover:bg-[#172a1d]" onClick={() => addCategoryProductVariant(index, productIndex)}>
                                                                                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                                {normalizeProductVariants(product.variants || []).length === 0 ? (
                                                                                    <p className="rounded-md border border-dashed border-[#dde3d0] px-3 py-2 text-[11px] text-slate-500">No variants added for this product.</p>
                                                                                ) : (
                                                                                    <div className="space-y-2">
                                                                                        {normalizeProductVariants(product.variants || []).map((variant, variantIndex) => (
                                                                                            <div key={`${productKey}-variant-${variantIndex}`} className="space-y-2 rounded-md border border-[#d7e5c9] bg-white p-3">
                                                                                                <div className="flex items-center justify-between gap-2">
                                                                                                    <p className="line-clamp-1 text-xs font-semibold text-slate-900">{variant.name || `Variant ${variantIndex + 1}`}</p>
                                                                                                    {!product.productId && (
                                                                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-900/20" onClick={() => removeCategoryProductVariant(index, productIndex, variantIndex)}>
                                                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                                                        </Button>
                                                                                                    )}
                                                                                                </div>
                                                                                                {product.productId ? (
                                                                                                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 md:grid-cols-4">
                                                                                                        <span>SKU: {variant.sku || "N/A"}</span>
                                                                                                        <span>Retail: {variant.retailPrice || 0}</span>
                                                                                                        <span>Wholesale: {variant.wholesalePrice || 0}</span>
                                                                                                        <span>Stock: {variant.stock || 0}</span>
                                                                                                        {variant.packing && <span className="md:col-span-2">Packing: {variant.packing}</span>}
                                                                                                        {variant.attributes.length > 0 && <span className="md:col-span-2">{variant.attributes.map((attr) => `${attr.key}: ${attr.value}`).join(" / ")}</span>}
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                                                                                        <Input value={variant.name} onChange={(e) => updateCategoryProductVariant(index, productIndex, variantIndex, { name: e.target.value, displayName: e.target.value })} placeholder="Variant name: 1.0 inch / 30 pcs" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                                        <Input value={variant.sku} onChange={(e) => updateCategoryProductVariant(index, productIndex, variantIndex, { sku: e.target.value })} placeholder="SKU: SKU-CA-10" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                                        <Input value={variant.packing} onChange={(e) => updateCategoryProductVariant(index, productIndex, variantIndex, { packing: e.target.value })} placeholder="Packing: 30 pcs/box" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                                        <Input type="number" value={variant.mrp} onChange={(e) => updateCategoryProductVariant(index, productIndex, variantIndex, { mrp: toNumber(e.target.value) })} placeholder="MRP" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                                        <Input type="number" value={variant.retailPrice} onChange={(e) => updateCategoryProductVariant(index, productIndex, variantIndex, { retailPrice: toNumber(e.target.value) })} placeholder="Retail" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                                        <Input type="number" value={variant.wholesalePrice} onChange={(e) => updateCategoryProductVariant(index, productIndex, variantIndex, { wholesalePrice: toNumber(e.target.value) })} placeholder="Wholesale" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                                        <Input type="number" value={variant.stock} onChange={(e) => updateCategoryProductVariant(index, productIndex, variantIndex, { stock: toNumber(e.target.value) })} placeholder="Stock" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                                        <Input value={variant.priceUnit} onChange={(e) => updateCategoryProductVariant(index, productIndex, variantIndex, { priceUnit: e.target.value })} placeholder="Price unit: piece / coil / set" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                                        <Input value={variant.attributes.map((attr) => `${attr.key}:${attr.value}`).join(", ")} onChange={(e) => updateCategoryProductVariant(index, productIndex, variantIndex, { attributes: e.target.value.split(",").map((pair) => { const [key, ...rest] = pair.split(":"); return { key: key?.trim() || "", value: rest.join(":").trim() } }).filter((attr) => attr.key || attr.value) })} placeholder="Attributes: Size:1.0 inch, Pieces per Box:30" className="border-[#d8dfca] bg-white text-slate-900" />
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">Product Image Preview</p>
                                                                                <div className="flex items-center gap-2 overflow-x-auto">
                                                                                    {(product.images && product.images.length > 0 ? product.images : [product.image || productPreviewFallback]).map((imageUrl, imageIndex) => (
                                                                                        <div key={`${productKey}-img-${imageIndex}`} className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#d8dfca] bg-white">
                                                                                            <img
                                                                                                src={previewSrc(imageUrl || productPreviewFallback)}
                                                                                                alt={`${product.name} ${imageIndex + 1}`}
                                                                                                className="w-full h-full object-cover"
                                                                                                onError={(e) => {
                                                                                                    (e.target as HTMLImageElement).src = productPreviewFallback
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                                {!product.productId && (
                                                                                    <div className="mt-2">
                                                                                        <input id={`category-product-upload-${index}-${productIndex}`} type="file" className="hidden" accept="image/*" onChange={(e) => uploadImage(e, "category-product", index, productIndex)} />
                                                                                        <Button type="button" variant="outline" className="border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900" onClick={() => document.getElementById(`category-product-upload-${index}-${productIndex}`)?.click()} disabled={uploading === `category-product-${index}-${productIndex}`}>
                                                                                            {uploading === `category-product-${index}-${productIndex}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                                                                            Upload Product Image
                                                                                        </Button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {categories.length > 0 && <Button onClick={saveCategories} disabled={isSavingCategories} className="w-full">{isSavingCategories ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save Product Categories</Button>}
                            </CardContent>
                        </Card>
                        <Card className="border-[#dde3d0] bg-white/92 shadow-[0_24px_60px_rgba(60,80,40,0.08)] xl:col-span-4 xl:sticky xl:top-24">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-900">Live Preview</CardTitle>
                                <CardDescription className="text-slate-500">Section header + card details preview.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                                    <div className="rounded-2xl border border-[#dde3d0] bg-[#f8faf3] p-4">
                                        <p className="text-[11px] tracking-[0.2em] text-[#ff8a32] font-semibold uppercase">{categoriesSection.eyebrow || "PRODUCT CATEGORIES"}</p>
                                        <p className="mt-2 text-xl font-bold text-slate-900">{categoriesSection.title || "The Heart of Modern Farming"}</p>
                                        <p className="text-[#a7b0bf] text-xs mt-2 line-clamp-3">{categoriesSection.description || "Section description"}</p>
                                    </div>
                                    {expandedCategoryIndex !== null && categories[expandedCategoryIndex] && hasDraftProductContent(categoryDraftProducts[expandedCategoryIndex]) && (
                                        <div className="rounded-2xl overflow-hidden border border-[#355028] bg-[#11160d]">
                                            <div className="p-3 border-b border-[#2f4126]">
                                                <p className="text-[11px] tracking-[0.18em] text-[#b7e08b] font-semibold uppercase">Draft Product Preview</p>
                                                <p className="text-[#8fa17b] text-xs mt-1">This shows the quick product you are currently typing.</p>
                                            </div>
                                            <div className="relative h-32">
                                                {(categoryDraftProducts[expandedCategoryIndex]?.image || "").trim() ? (
                                                    <img
                                                        src={previewSrc(categoryDraftProducts[expandedCategoryIndex]?.image || productPreviewFallback)}
                                                        alt={categoryDraftProducts[expandedCategoryIndex]?.name || "Draft product"}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = productPreviewFallback
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-[#666]">No Image</div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                                                <div className="absolute top-2 right-2 rounded-full border border-[#4b6738] bg-[#182411] px-2 py-1 text-[10px] font-medium text-[#c3eca0]">
                                                    Draft
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-white text-base font-semibold line-clamp-2">
                                                    {categoryDraftProducts[expandedCategoryIndex]?.name || "Product name"}
                                                </p>
                                                <p className="text-[#ff8a32] text-xs mt-1 line-clamp-2">
                                                    {categoryDraftProducts[expandedCategoryIndex]?.shortDescription || "Short description"}
                                                </p>
                                                <div className="mt-3 flex items-center justify-between text-[11px] text-[#a5b097]">
                                                    <span>Quick product</span>
                                                    <span>{categories[expandedCategoryIndex]?.name || "Category"}</span>
                                                </div>
                                                <button className="mt-3 w-full py-2 rounded-lg border border-[#3c4d30] bg-[#171c23] text-[#d6dde8] text-xs font-semibold">
                                                    Draft Product CTA
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {categories
                                        .filter((c) => c.isActive !== false)
                                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                                        .map((item, i) => (
                                            <div key={i} className="rounded-2xl overflow-hidden border border-[#333] bg-[#111]">
                                                <div className="relative h-32">
                                                    {item.image ? (
                                                        <img
                                                            src={previewSrc(item.image)}
                                                            alt={item.name || "Category"}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `https://placehold.co/600x300/0b0f16/9ca3af?text=Category+${i + 1}`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-[#666]">No Image</div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                                                    <div className="absolute bottom-2 left-2 right-2">
                                                        <p className="text-white text-base font-semibold line-clamp-1">{item.name || "Category title"}</p>
                                                        <p className="text-[#ff8a32] text-xs mt-0.5 line-clamp-1">{item.description || "Short description"}</p>
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <ul className="space-y-1.5">
                                                        {getCategoryProductNames(item).slice(0, 3).map((product, idx) => (
                                                            <li key={idx} className="text-[11px] text-[#c8ced8] line-clamp-1 flex items-center gap-2">
                                                                <span className="w-1 h-1 rounded-full bg-[#86efac] shrink-0" />
                                                                {product}
                                                            </li>
                                                        ))}
                                                        {getCategoryProductNames(item).length === 0 && (
                                                            <li className="text-[11px] text-[#717171]">No list items yet</li>
                                                        )}
                                                    </ul>
                                                    <button className="mt-3 w-full py-2 rounded-lg border border-[#2f3742] bg-[#171c23] text-[#d6dde8] text-xs font-semibold">
                                                        {categoriesSection.buttonText || "View Products"}
                                                    </button>
                                                    <div className="mt-3 text-[11px] text-[#9aa3b2] flex items-center justify-between">
                                                        <span>Order: {item.order ?? i}</span>
                                                        <span className="px-2 py-0.5 rounded-full bg-[#1d2a1f] text-[#86efac] border border-[#2e4d35]">Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="featured" className="mt-4">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        <Card className="border-[#dde3d0] bg-white/92 shadow-[0_24px_60px_rgba(60,80,40,0.08)] xl:col-span-8">
                            <CardHeader><div className="flex items-center justify-between gap-4"><div><CardTitle className="text-slate-900">Our Popular Product</CardTitle></div><Button onClick={() => setFeaturedProducts((prev) => [...prev, { name: "", price: "", image: "", badge: "", specs: [""], shortDescription: "", variants: [], isActive: true, order: prev.length }])} variant="outline" className="border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f6f8ef] hover:text-slate-900"><Plus className="h-4 w-4 mr-2" /> Add Product Card</Button></div></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3 rounded-lg border border-[#dde3d0] bg-[#f8faf3] p-4">
                                    <p className="text-sm font-semibold text-slate-900">Section Content</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input value={featuredSection.eyebrow || ""} onChange={(e) => setFeaturedSection((prev) => ({ ...prev, eyebrow: e.target.value }))} placeholder="Eyebrow text" className="border-[#d8dfca] bg-white text-slate-900" />
                                        <Input value={featuredSection.title || ""} onChange={(e) => setFeaturedSection((prev) => ({ ...prev, title: e.target.value }))} placeholder="Section title" className="border-[#d8dfca] bg-white text-slate-900" />
                                    </div>
                                    <Textarea value={featuredSection.sideText || ""} onChange={(e) => setFeaturedSection((prev) => ({ ...prev, sideText: e.target.value }))} placeholder="Right side section text" className="min-h-[70px] border-[#d8dfca] bg-white text-slate-900" />
                                    <Input value={featuredSection.buttonText || ""} onChange={(e) => setFeaturedSection((prev) => ({ ...prev, buttonText: e.target.value }))} placeholder="Card button text" className="border-[#d8dfca] bg-white text-slate-900" />
                                </div>
                                {featuredProducts.map((item, index) => (
                                    <div key={index} className="space-y-3 rounded-lg border border-[#dde3d0] bg-[#f8faf3] p-4">
                                        <div className="flex justify-between items-center"><p className="text-sm font-medium text-slate-900">Card {index + 1}</p><div className="flex items-center gap-3"><span className="text-xs text-slate-500">Active</span><Switch checked={item.isActive !== false} onCheckedChange={(v) => setFeaturedProducts((prev) => prev.map((p, i) => i === index ? { ...p, isActive: v } : p))} /><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-900/20 hover:text-red-300" onClick={() => setFeaturedProducts((prev) => prev.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div></div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Input value={item.name} onChange={(e) => setFeaturedProducts((prev) => prev.map((p, i) => i === index ? { ...p, name: e.target.value } : p))} placeholder="Product title" className="border-[#d8dfca] bg-white text-slate-900" /><Input value={item.price} onChange={(e) => setFeaturedProducts((prev) => prev.map((p, i) => i === index ? { ...p, price: e.target.value } : p))} placeholder="Price text" className="border-[#d8dfca] bg-white text-slate-900" /><Input value={item.image} onChange={(e) => setFeaturedProducts((prev) => prev.map((p, i) => i === index ? { ...p, image: e.target.value } : p))} placeholder="Image URL" className="border-[#d8dfca] bg-white text-slate-900" /><Input value={item.badge} onChange={(e) => setFeaturedProducts((prev) => prev.map((p, i) => i === index ? { ...p, badge: e.target.value } : p))} placeholder="Badge" className="border-[#d8dfca] bg-white text-slate-900" /></div>
                                        <Textarea value={item.shortDescription || ""} onChange={(e) => setFeaturedProducts((prev) => prev.map((p, i) => i === index ? { ...p, shortDescription: e.target.value } : p))} placeholder="Short description (shown instead of specs if provided)" className="min-h-[60px] border-[#d8dfca] bg-white text-slate-900" />
                                        <Textarea value={(item.specs || []).join("\n")} onChange={(e) => setFeaturedProducts((prev) => prev.map((p, i) => i === index ? { ...p, specs: e.target.value.split("\n") } : p))} placeholder="Specs (one per line) - shown if no short description" className="bg-[#0D0D0D] border-[#333] text-white min-h-[90px]" />
                                        <div className="rounded-lg border border-[#283329] bg-[#0b120d] p-3 space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold text-white">Variants</p>
                                                    <p className="text-[11px] text-[#8c8c8c]">Optional size/spec variants for this featured card.</p>
                                                </div>
                                                <Button type="button" size="sm" variant="outline" className="border-[#36533a] bg-[#102016] text-[#b8efc2] hover:bg-[#172a1d]" onClick={() => addFeaturedProductVariant(index)}>
                                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                                                </Button>
                                            </div>
                                            {normalizeProductVariants(item.variants || []).map((variant, variantIndex) => (
                                                <div key={`featured-${index}-variant-${variantIndex}`} className="rounded-md border border-[#28352b] bg-[#101712] p-3 space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-xs font-semibold text-[#dcfce7]">Variant {variantIndex + 1}</p>
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-900/20" onClick={() => removeFeaturedProductVariant(index, variantIndex)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                                        <Input value={variant.name} onChange={(e) => updateFeaturedProductVariant(index, variantIndex, { name: e.target.value, displayName: e.target.value })} placeholder="Variant name: 8 mm / 70 No." className="bg-[#0D0D0D] border-[#333] text-white" />
                                                        <Input value={variant.sku} onChange={(e) => updateFeaturedProductVariant(index, variantIndex, { sku: e.target.value })} placeholder="SKU: PDF-SWA-8MM" className="bg-[#0D0D0D] border-[#333] text-white" />
                                                        <Input value={variant.packing} onChange={(e) => updateFeaturedProductVariant(index, variantIndex, { packing: e.target.value })} placeholder="Packing: 300 meter coil" className="bg-[#0D0D0D] border-[#333] text-white" />
                                                        <Input type="number" value={variant.mrp} onChange={(e) => updateFeaturedProductVariant(index, variantIndex, { mrp: toNumber(e.target.value) })} placeholder="MRP" className="bg-[#0D0D0D] border-[#333] text-white" />
                                                        <Input type="number" value={variant.retailPrice} onChange={(e) => updateFeaturedProductVariant(index, variantIndex, { retailPrice: toNumber(e.target.value) })} placeholder="Retail" className="bg-[#0D0D0D] border-[#333] text-white" />
                                                        <Input type="number" value={variant.wholesalePrice} onChange={(e) => updateFeaturedProductVariant(index, variantIndex, { wholesalePrice: toNumber(e.target.value) })} placeholder="Wholesale" className="bg-[#0D0D0D] border-[#333] text-white" />
                                                        <Input type="number" value={variant.stock} onChange={(e) => updateFeaturedProductVariant(index, variantIndex, { stock: toNumber(e.target.value) })} placeholder="Stock" className="bg-[#0D0D0D] border-[#333] text-white" />
                                                        <Input value={variant.priceUnit} onChange={(e) => updateFeaturedProductVariant(index, variantIndex, { priceUnit: e.target.value })} placeholder="Price unit: piece / coil / set" className="bg-[#0D0D0D] border-[#333] text-white" />
                                                        <Input value={variant.attributes.map((attr) => `${attr.key}:${attr.value}`).join(", ")} onChange={(e) => updateFeaturedProductVariant(index, variantIndex, { attributes: e.target.value.split(",").map((pair) => { const [key, ...rest] = pair.split(":"); return { key: key?.trim() || "", value: rest.join(":").trim() } }).filter((attr) => attr.key || attr.value) })} placeholder="Attributes: Size:8 mm, Gauge:70 No." className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </div>
                                                </div>
                                            ))}
                                            {normalizeProductVariants(item.variants || []).length === 0 && <p className="rounded-md border border-dashed border-[#333] px-3 py-2 text-[11px] text-[#777]">No variants added.</p>}
                                        </div>
                                        <div className="flex justify-end"><div className="flex items-center gap-2"><input id={`featured-upload-${index}`} type="file" className="hidden" accept="image/*" onChange={(e) => uploadImage(e, "featured", index)} /><Button type="button" variant="outline" className="border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]" onClick={() => document.getElementById(`featured-upload-${index}`)?.click()} disabled={uploading === `featured-${index}`}>{uploading === `featured-${index}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Upload Image</Button></div></div>
                                    </div>
                                ))}
                                {featuredProducts.length > 0 && <Button onClick={saveProducts} disabled={isSavingProducts} className="w-full">{isSavingProducts ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save Popular Products</Button>}
                            </CardContent>
                        </Card>
                        <Card className="border-[#dde3d0] bg-white/92 shadow-[0_24px_60px_rgba(60,80,40,0.08)] xl:col-span-4 xl:sticky xl:top-24">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-900">Live Preview</CardTitle>
                                <CardDescription className="text-slate-500">Section header + card details preview.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                                    <div className="rounded-2xl border border-[#dde3d0] bg-[#f8faf3] p-4">
                                        <p className="text-[11px] tracking-[0.2em] text-[#ff8a32] font-semibold uppercase">{featuredSection.eyebrow || "PRECISION ENGINEERING"}</p>
                                        <p className="mt-2 text-xl font-bold text-slate-900">{featuredSection.title || "Our Popular Product"}</p>
                                        <p className="mt-2 line-clamp-3 text-xs text-slate-500">{featuredSection.sideText || "Section side description"}</p>
                                    </div>
                                    {featuredProducts
                                        .filter((p) => p.isActive !== false)
                                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                                        .map((item, i) => (
                                            <div key={i} className="overflow-hidden rounded-2xl border border-[#dde3d0] bg-[#f8faf3] p-3">
                                                <div className="relative h-28 rounded-xl overflow-hidden bg-[#0d0d0d]">
                                                    {item.image ? (
                                                        <img
                                                            src={previewSrc(item.image)}
                                                            alt={item.name || "Product"}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `https://placehold.co/600x300/0b0f16/9ca3af?text=Product+${i + 1}`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-[#666]">No Image</div>
                                                    )}
                                                    {item.badge && (
                                                        <span className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full bg-white/90 text-black font-semibold">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="pt-3">
                                                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.name || "Product title"}</p>
                                                    <p className="text-[#86efac] text-xs font-semibold mt-1">{item.price || "Price text"}</p>
                                                    <ul className="mt-2 space-y-1.5">
                                                        {normalizeList(item.specs || []).slice(0, 3).map((spec, idx) => (
                                                            <li key={idx} className="text-[11px] text-[#c8ced8] line-clamp-1 flex items-center gap-2">
                                                                <span className="w-1 h-1 rounded-full bg-[#ff8a32] shrink-0" />
                                                                {spec}
                                                            </li>
                                                        ))}
                                                        {normalizeList(item.specs || []).length === 0 && (
                                                            <li className="text-[11px] text-[#717171]">No specs yet</li>
                                                        )}
                                                    </ul>
                                            </div>
                                            <button className="mt-3 w-full rounded-lg border border-[#d8dfca] bg-white py-2 text-xs font-semibold text-slate-700">
                                                {featuredSection.buttonText || "Get Quote"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
