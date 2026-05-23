"use client"

import Link from "next/link"
import { Plus, Loader2, Pencil, Trash2, Eye, LayoutGrid, List, Package, Star, Languages, Search } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"

interface ProductVariant {
    _id?: string
    sku?: string
    retailPrice?: number
    stock?: number
    isActive?: boolean
}

interface ProductCategory {
    name?: string
    slug?: string
}

interface Product {
    _id: string
    name: string
    nameHindi?: string
    category?: string | ProductCategory
    retailPrice?: number
    stock?: number
    status: string
    sku?: string
    rating: number
    variants?: ProductVariant[]
    isFeatured?: boolean
    isHot?: boolean
}

function getProductRating(product: any): number | null {
    const candidates = [
        product?.rating,
        product?.averageRating,
        product?.ratings?.average,
    ]

    for (const candidate of candidates) {
        const value = Number(candidate)
        if (Number.isFinite(value)) {
            return value
        }
    }

    return null
}

function getCategoryLabel(category: Product["category"]): string {
    if (!category) return "Uncategorized"
    if (typeof category === "string") return category
    return category.name || category.slug || "Uncategorized"
}

function getVariantCount(product: Product): number {
    return Array.isArray(product.variants) ? product.variants.length : 0
}

function getDisplaySku(product: Product): string {
    if (product.sku) return product.sku
    return product.variants?.find((variant) => variant.sku)?.sku || "-"
}

function getDisplayPrice(product: Product): number | null {
    if (typeof product.retailPrice === "number" && Number.isFinite(product.retailPrice)) {
        return product.retailPrice
    }

    const firstVariantPrice = product.variants?.find((variant) => typeof variant.retailPrice === "number")?.retailPrice
    return typeof firstVariantPrice === "number" ? firstVariantPrice : null
}

function getTotalStock(product: Product): number {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
        return product.variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
    }

    return Number(product.stock || 0)
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [viewMode, setViewMode] = useState<"list" | "card">("card")
    const [isConvertingHindi, setIsConvertingHindi] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalProducts, setTotalProducts] = useState(0)
    const [hasMore, setHasMore] = useState(false)

    useEffect(() => {
        fetchProducts(1, true)
    }, [])

    async function fetchProducts(pageNum: number = 1, reset: boolean = false) {
        if (reset) {
            setIsLoading(true)
            setPage(1)
        } else {
            setIsLoadingMore(true)
        }

        try {
            const params = new URLSearchParams()
            params.append("page", pageNum.toString())
            params.append("limit", "20")
            if (searchQuery.trim()) {
                params.append("search", searchQuery.trim())
            }

            const res = await apiFetch(`/admin/products?${params.toString()}`)
            const data = await res.json()
            if (res.ok) {
                const items = Array.isArray(data.data) ? data.data : []
                const pagination = data.pagination || {}

                if (reset || pageNum === 1) {
                    const missingRatingIds = items
                        .filter((product: any) => getProductRating(product) === null)
                        .map((product: any) => String(product?._id || ""))
                        .filter(Boolean)

                    let ratingsById: Record<string, number> = {}

                    if (missingRatingIds.length > 0) {
                        const detailResults = await Promise.all(
                            missingRatingIds.map(async (productId: string) => {
                                try {
                                    const detailRes = await apiFetch(`/admin/products/${productId}`)
                                    const detailData = await detailRes.json()
                                    if (!detailRes.ok) return null
                                    const detailedProduct = detailData?.data
                                    const rating = getProductRating(detailedProduct)
                                    return rating === null ? null : { productId, rating }
                                } catch {
                                    return null
                                }
                            })
                        )

                        ratingsById = detailResults.reduce((acc, item) => {
                            if (item) acc[item.productId] = item.rating
                            return acc
                        }, {} as Record<string, number>)
                    }

                    const productsWithRatings = items.map((product: any) => ({
                        ...product,
                        rating: getProductRating(product) ?? ratingsById[String(product?._id || "")] ?? 0,
                    }))

                    setProducts(productsWithRatings)
                } else {
                    const missingRatingIds = items
                        .filter((product: any) => getProductRating(product) === null)
                        .map((product: any) => String(product?._id || ""))
                        .filter(Boolean)

                    let ratingsById: Record<string, number> = {}

                    if (missingRatingIds.length > 0) {
                        const detailResults = await Promise.all(
                            missingRatingIds.map(async (productId: string) => {
                                try {
                                    const detailRes = await apiFetch(`/admin/products/${productId}`)
                                    const detailData = await detailRes.json()
                                    if (!detailRes.ok) return null
                                    const detailedProduct = detailData?.data
                                    const rating = getProductRating(detailedProduct)
                                    return rating === null ? null : { productId, rating }
                                } catch {
                                    return null
                                }
                            })
                        )

                        ratingsById = detailResults.reduce((acc, item) => {
                            if (item) acc[item.productId] = item.rating
                            return acc
                        }, {} as Record<string, number>)
                    }

                    const newProducts = items.map((product: any) => ({
                        ...product,
                        rating: getProductRating(product) ?? ratingsById[String(product?._id || "")] ?? 0,
                    }))

                    setProducts((prev) => [...prev, ...newProducts])
                }

                setTotalPages(pagination.totalPages || 1)
                setTotalProducts(pagination.total || items.length)
                setHasMore((pagination.page || 1) < (pagination.totalPages || 1))
            } else {
                toast.error("Failed to fetch products")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error connecting to server")
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        fetchProducts(1, true)
    }, [searchQuery])

    const loadMore = useCallback(() => {
        if (hasMore && !isLoadingMore) {
            const nextPage = page + 1
            setPage(nextPage)
            fetchProducts(nextPage, false)
        }
    }, [hasMore, isLoadingMore, page])

    async function deleteProduct(productId: string) {
        const confirmed = window.confirm("Are you sure you want to archive this product? It will no longer be visible in the app.")
        if (!confirmed) return

        try {
            const res = await apiFetch(`/admin/products/${productId}`, {
                method: "DELETE",
            })
            const data = await res.json()

            if (res.ok) {
                toast.success("Product archived successfully")
                fetchProducts()
            } else {
                toast.error(data.message || "Failed to delete product")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error connecting to server")
        }
    }

    async function convertMissingHindiNames() {
        const confirmed = window.confirm(
            "Convert missing Hindi names for all products that don't have Hindi text yet?"
        )
        if (!confirmed) return

        setIsConvertingHindi(true)
        try {
            const res = await apiFetch("/admin/products/hindi-names/generate-missing", {
                method: "POST",
                body: JSON.stringify({}),
            })
            const data = await res.json()

            if (!res.ok || !data?.success) {
                toast.error(data?.message || "Failed to convert Hindi names")
                return
            }

            const stats = data.data || {}
            toast.success(
                `Hindi conversion done: ${stats.updated ?? 0} updated, ${stats.skipped ?? 0} skipped (processed ${stats.processed ?? 0}).`
            )
            fetchProducts()
        } catch (error) {
            console.error(error)
            toast.error("Error converting Hindi names")
        } finally {
            setIsConvertingHindi(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Products</h1>
                    <p className="text-gray-400">Manage your product catalog. {totalProducts > 0 && `(${totalProducts} products)`}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        onClick={convertMissingHindiNames}
                        disabled={isConvertingHindi}
                        variant="outline"
                        className="border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]"
                    >
                        {isConvertingHindi ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Languages className="mr-2 h-4 w-4" />
                        )}
                        Convert Missing Hindi Names
                    </Button>
                    <div className="flex items-center rounded-lg border border-[#333] bg-[#161616] p-1">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`rounded-md p-2 transition-colors ${viewMode === "list" ? "bg-[#86efac] text-black" : "text-gray-400 hover:text-white"}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("card")}
                            className={`rounded-md p-2 transition-colors ${viewMode === "card" ? "bg-[#86efac] text-black" : "text-gray-400 hover:text-white"}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                    <Link href="/products/add" className="inline-flex h-10 items-center justify-center rounded-md bg-[#86efac] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#86efac]/90">
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#161616] pl-10 text-white placeholder:text-gray-500 focus-visible:ring-[#86efac]"
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    className="border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]"
                >
                    Search
                </Button>
                {searchQuery ? (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setSearchQuery("")
                            fetchProducts(1, true)
                        }}
                        className="text-gray-400 hover:text-white"
                    >
                        Clear
                    </Button>
                ) : null}
            </form>

            {isLoading ? (
                <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-[#333] bg-[#161616]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#86efac]" />
                </div>
            ) : products.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#333] bg-[#161616] text-gray-400">
                    <Package className="mb-4 h-12 w-12 opacity-50" />
                    <p>No products found</p>
                    <p className="text-sm">Add your first product to get started</p>
                </div>
            ) : viewMode === "list" ? (
                <div className="overflow-hidden rounded-2xl border border-[#333] bg-[#161616]">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-[#333] hover:bg-[#1A1A1A]">
                                <TableHead className="text-gray-400">Name</TableHead>
                                <TableHead className="text-gray-400">SKU</TableHead>
                                <TableHead className="text-gray-400">Category</TableHead>
                                <TableHead className="text-right text-gray-400">Price</TableHead>
                                <TableHead className="text-right text-gray-400">Stock</TableHead>
                                <TableHead className="text-center text-gray-400">Variants</TableHead>
                                <TableHead className="text-center text-gray-400">Rating</TableHead>
                                <TableHead className="text-center text-gray-400">Status</TableHead>
                                <TableHead className="text-right text-gray-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => {
                                const displayPrice = getDisplayPrice(product)
                                const totalStock = getTotalStock(product)
                                const variantCount = getVariantCount(product)

                                return (
                                    <TableRow key={product._id} className="border-[#333] hover:bg-[#1A1A1A]">
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-white">{product.name}</p>
                                                {product.nameHindi ? (
                                                    <p className="text-xs text-gray-500">{product.nameHindi}</p>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-400">{getDisplaySku(product)}</TableCell>
                                        <TableCell className="text-white">
                                            <Badge variant="outline" className="border-[#333] text-gray-300">
                                                {getCategoryLabel(product.category)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-white">{displayPrice !== null ? `Rs ${displayPrice.toLocaleString()}` : "-"}</TableCell>
                                        <TableCell className="text-right text-white">{totalStock}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="border-[#333] text-gray-300">
                                                {variantCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-yellow-500">
                                                <Star className="h-3 w-3 fill-current" />
                                                <span className="text-xs">{product.rating > 0 ? product.rating : "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={product.status === "active" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"}>
                                                {product.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:bg-[#333] hover:text-white">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Link href={`/products/edit/${product._id}`}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:bg-blue-400/10 hover:text-blue-300">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-400/10 hover:text-red-300" onClick={() => deleteProduct(product._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => {
                        const displayPrice = getDisplayPrice(product)
                        const variantCount = getVariantCount(product)
                        const totalStock = getTotalStock(product)

                        return (
                            <div
                                key={product._id}
                                className="rounded-xl border border-[#333] bg-[#161616] p-4 transition-colors hover:border-[#444]"
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0D0D0D]">
                                        <Package className="h-6 w-6 text-gray-500" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:bg-[#333] hover:text-white">
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Link href={`/products/edit/${product._id}`}>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-400 hover:bg-blue-400/10 hover:text-blue-300">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-400/10 hover:text-red-300" onClick={() => deleteProduct(product._id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <h3 className="mb-1 line-clamp-1 text-base font-semibold text-white">{product.name}</h3>
                                {product.nameHindi ? (
                                    <p className="mb-1 line-clamp-1 text-xs text-gray-500">{product.nameHindi}</p>
                                ) : null}
                                <p className="mb-3 text-xs text-gray-500">SKU: {getDisplaySku(product)}</p>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <Badge variant="outline" className="border-[#333] text-xs text-gray-300">
                                        {getCategoryLabel(product.category)}
                                    </Badge>
                                    <Badge className={product.status === "active" ? "text-xs bg-green-500/10 text-green-500" : "text-xs bg-gray-500/10 text-gray-500"}>
                                        {product.status}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <Star className="h-3 w-3 fill-current" />
                                        <span className="text-xs font-medium">{product.rating > 0 ? product.rating : "-"}</span>
                                    </div>
                                </div>
                                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                                    <Badge variant="outline" className="border-[#333] text-gray-300">
                                        {variantCount} variant{variantCount === 1 ? "" : "s"}
                                    </Badge>
                                    {product.isFeatured ? (
                                        <Badge className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">
                                            Featured
                                        </Badge>
                                    ) : null}
                                    {product.isHot ? (
                                        <Badge className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">
                                            Hot
                                        </Badge>
                                    ) : null}
                                </div>
                                <div className="flex items-center justify-between border-t border-[#333] pt-3">
                                    <div>
                                        <p className="text-lg font-bold text-[#86efac]">{displayPrice !== null ? `Rs ${displayPrice.toLocaleString()}` : "-"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Stock</p>
                                        <p className="font-medium text-white">{totalStock}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {hasMore && products.length > 0 ? (
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        className="min-w-[200px] border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            `Load More (${products.length}/${totalProducts})`
                        )}
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
