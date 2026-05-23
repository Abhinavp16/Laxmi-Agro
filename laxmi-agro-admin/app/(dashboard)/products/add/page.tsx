"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash2, Building2, Flame, Star, ImagePlus, X, GripVertical, Crown, Upload, Link, ArrowLeft, FolderPlus, Youtube, Truck, ChevronDown, Tags, Check } from "lucide-react"
import { useSearchParams } from "next/navigation"
import NextLink from "next/link"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"

interface Category {
    _id: string
    name: string
    slug: string
}

interface Company {
    _id: string
    name: string
    slug: string
}

interface ProductLabelOption {
    id: string
    title: string
    sourceType: "image" | "icon"
}

function labelMatches(value: string, label: ProductLabelOption) {
    const normalizedValue = String(value || "").trim()
    return normalizedValue === label.id || normalizedValue === label.title
}

function normalizeSelectedLabelIds(values: string[], labels: ProductLabelOption[]) {
    return [...new Set(
        values
            .map((value) => {
                const normalizedValue = String(value || "").trim()
                const match = labels.find((label) => labelMatches(normalizedValue, label))
                return match?.id || normalizedValue
            })
            .filter(Boolean)
    )]
}

type UploadStatus = 'idle' | 'converting' | 'uploading' | 'done'

interface ProductImage {
    url: string
    publicId: string
    isPrimary: boolean
    order: number
    originalSize?: number
    convertedSize?: number
    savings?: string
}

interface ProductVariantAttributeForm {
    key: string
    value: string
}

interface ProductVariantForm {
    name: string
    sku: string
    mrp: string
    retailPrice: string
    wholesalePrice: string
    stock: string
    lowStockThreshold: string
    minOrderQuantity: string
    priceUnit: string
    packing: string
    isActive: boolean
    attributes: ProductVariantAttributeForm[]
}

const numericString = z.string().trim().refine((val) => val === "" || !isNaN(Number(val)), "Must be a number")

const productSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    nameHindi: z.string().optional().default(""),
    description: z.string().optional().default(""),
    shortDescription: z.string().optional(),
    bulletPoints: z.array(z.string()).optional(),
    category: z.string().min(1, "Category is required"),
    subCategory: z.string().optional().default(""),
    tags: z.string().optional().default(""),
    sku: z.string().optional().default(""),
    mrp: numericString.default(""),
    retailPrice: numericString.default(""),
    wholesalePrice: numericString.default(""),
    stock: numericString.default("0"),
    lowStockThreshold: numericString.default("5"),
    minWholesaleQuantity: z.string().refine((val) => !isNaN(Number(val)), "Must be a number"),
    negotiationEnabled: z.boolean().default(true),
    status: z.enum(["active", "draft", "archived"]),
    isFeatured: z.boolean().default(false),
    isHot: z.boolean().default(false),
    company: z.string().optional(),
    videoUrl: z.string().optional(),
    shippingTerms: z.string().optional(),
    labelIds: z.array(z.string()).default([]),
    rating: z.string().refine((val) => !isNaN(Number(val)), "Must be a number").default("4.5"),
    purchaseCountMin: z.string().refine((val) => !isNaN(Number(val)), "Must be a number").default("0"),
    purchaseCountMax: z.string().refine((val) => !isNaN(Number(val)), "Must be a number").default("0"),
})

export default function AddProductPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')
    const isEditMode = !!editId

    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingProduct, setIsLoadingProduct] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [companies, setCompanies] = useState<Company[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [availableLabels, setAvailableLabels] = useState<ProductLabelOption[]>([])
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(true)
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [isLoadingLabels, setIsLoadingLabels] = useState(true)
    const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false)
    const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
    const [newCompanyName, setNewCompanyName] = useState("")
    const [newCompanyLogo, setNewCompanyLogo] = useState("")
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isCreatingCompany, setIsCreatingCompany] = useState(false)
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [images, setImages] = useState<ProductImage[]>([])
    const [newImageUrl, setNewImageUrl] = useState("")
    const [bulletPoints, setBulletPoints] = useState<string[]>([""])
    const [variants, setVariants] = useState<ProductVariantForm[]>([])
    const [imageUploadMode, setImageUploadMode] = useState<'url' | 'file'>('url')
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            nameHindi: "",
            description: "",
            shortDescription: "",
            bulletPoints: [],
            category: "",
            subCategory: "",
            tags: "",
            sku: "",
            mrp: "",
            retailPrice: "",
            wholesalePrice: "",
            stock: "0",
            lowStockThreshold: "5",
            minWholesaleQuantity: "10",
            negotiationEnabled: true,
            status: "active",
            isFeatured: false,
            isHot: false,
            company: "",
            videoUrl: "",
            shippingTerms: "Free shipping on orders above ₹5,000. Standard delivery within 5-7 business days. Express delivery available at additional cost.\n\nReturn Policy: Products can be returned within 7 days of delivery if unused and in original packaging. Damaged or defective items will be replaced free of charge. Refunds are processed within 5-7 business days after the returned item is received and inspected.",
            labelIds: [],
            rating: "4.5",
            purchaseCountMin: "0",
            purchaseCountMax: "0",
        },
    })

    const createEmptyVariant = (): ProductVariantForm => ({
        name: "",
        sku: "",
        mrp: "",
        retailPrice: "",
            wholesalePrice: "",
            stock: "0",
            lowStockThreshold: "5",
            minOrderQuantity: "1",
            priceUnit: "",
            packing: "",
            isActive: true,
            attributes: [{ key: "", value: "" }],
        })

    useEffect(() => {
        const initData = async () => {
            setIsInitialLoading(true)

            // Fetch labels first - needed to display selected labels correctly
            await fetchLabels()

            // Fetch companies and categories in parallel
            await Promise.all([
                fetchCompanies(),
                fetchCategories(),
            ])

            // Fetch product if in edit mode
            if (isEditMode && editId) {
                await fetchProduct(editId)
            }

            setIsInitialLoading(false)
        }
        initData()
    }, [editId, isEditMode])

    async function fetchProduct(id: string) {
        setIsLoadingProduct(true)
        try {
            const res = await apiFetch(`/admin/products/${id}`)
            if (!res.ok) throw new Error("Product not found")

            const data = await res.json()
            const product = data.data

            if (!product) throw new Error("Product data is empty")

            // Set form values
            form.reset({
                name: product.name || "",
                nameHindi: product.nameHindi || "",
                description: product.description || "",
                shortDescription: product.shortDescription || "",
                bulletPoints: [],
                category: product.category || "",
                subCategory: product.subCategory || "",
                tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
                sku: product.sku || "",
                mrp: product.mrp !== undefined && product.mrp !== null ? String(product.mrp) : "",
                retailPrice: product.retailPrice !== undefined && product.retailPrice !== null ? String(product.retailPrice) : "",
                wholesalePrice: product.wholesalePrice !== undefined && product.wholesalePrice !== null ? String(product.wholesalePrice) : "",
                stock: String(product.stock || "0"),
                lowStockThreshold: String(product.lowStockThreshold ?? "5"),
                minWholesaleQuantity: String(product.minWholesaleQuantity || "10"),
                negotiationEnabled: product.negotiationEnabled !== false,
                status: product.status || "draft",
                isFeatured: product.isFeatured || false,
                isHot: product.isHot || false,
                company: product.company?._id || product.company || "none",
                videoUrl: product.videoUrl || "",
                shippingTerms: product.shippingTerms || "",
                labelIds: Array.isArray(product.labelIds) ? product.labelIds.map((item: any) => String(item)).filter(Boolean) : [],
                rating: String(product.rating ?? "4.5"),
                purchaseCountMin: String(product.purchaseCountMin || "0"),
                purchaseCountMax: String(product.purchaseCountMax || "0"),
            })

            // Set images
            if (product.images && product.images.length > 0) {
                setImages(product.images)
            }

            if (Array.isArray(product.variants) && product.variants.length > 0) {
                setVariants(product.variants.map((variant: any) => ({
                    name: String(variant.name || ""),
                    sku: String(variant.sku || ""),
                    mrp: String(variant.mrp ?? ""),
                    retailPrice: String(variant.retailPrice ?? ""),
                    wholesalePrice: String(variant.wholesalePrice ?? ""),
                    stock: String(variant.stock ?? "0"),
                    lowStockThreshold: String(variant.lowStockThreshold ?? "5"),
                    minOrderQuantity: String(variant.minOrderQuantity ?? "1"),
                    priceUnit: String(variant.priceUnit || ""),
                    packing: String(variant.packing || ""),
                    isActive: variant.isActive !== false,
                    attributes: Array.isArray(variant.attributes) && variant.attributes.length > 0
                        ? variant.attributes.map((attribute: any) => ({
                            key: String(attribute?.key || ""),
                            value: String(attribute?.value || ""),
                        }))
                        : [{ key: "", value: "" }],
                })))
            } else {
                setVariants([])
            }

            // Set bullet points from specifications
            if (product.specifications && product.specifications.length > 0) {
                setBulletPoints(product.specifications.map((s: any) => s.value))
            }
        } catch (error) {
            console.error("Fetch product error:", error)
            toast.error("Failed to load product")
            router.push("/products")
        } finally {
            setIsLoadingProduct(false)
        }
    }

    async function fetchCategories() {
        try {
            const response = await apiFetch("/categories?page=1&limit=500", { skipAuth: true })
            if (response.ok) {
                const data = await response.json()
                const nextCategories = Array.isArray(data.data) ? data.data : []
                setCategories(nextCategories)
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error)
        } finally {
            setIsLoadingCategories(false)
        }
    }

    async function fetchCompanies() {
        try {
            const response = await apiFetch("/companies?page=1&limit=500", { skipAuth: true })
            if (response.ok) {
                const data = await response.json()
                const nextCompanies = Array.isArray(data.data) ? data.data : []
                setCompanies(nextCompanies)
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error)
        } finally {
            setIsLoadingCompanies(false)
        }
    }

    async function fetchLabels() {
        try {
            const response = await apiFetch("/admin/website-settings")
            if (!response.ok) {
                throw new Error("Failed to load labels")
            }

            const data = await response.json()
            const nextLabels = Array.isArray(data?.data?.labels)
                ? data.data.labels
                    .map((item: any, index: number) => {
                        const labelId = String(item?.id || "").trim();
                        return {
                            // Only use actual ID, not title as fallback
                            id: labelId || `label-${index}`,
                            title: String(item?.title || "").trim(),
                            sourceType: item?.sourceType === "image" ? "image" : "icon",
                        };
                    })
                    .filter((item: ProductLabelOption) => item.title)
                : []

            setAvailableLabels(nextLabels)
        } catch (error) {
            console.error("Failed to fetch labels:", error)
        } finally {
            setIsLoadingLabels(false)
        }
    }

    // Image management functions
    const addImage = () => {
        if (!newImageUrl.trim()) {
            toast.error("Please enter an image URL")
            return
        }
        const newImage: ProductImage = {
            url: newImageUrl.trim(),
            publicId: `img-${Date.now()}`,
            isPrimary: images.length === 0, // First image is primary by default
            order: images.length
        }
        setImages([...images, newImage])
        setNewImageUrl("")
        toast.success("Image added")
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploadingImage(true)
        setUploadStatus('converting')

        const formData = new FormData()

        // Upload multiple files
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i])
        }

        try {
            // Brief delay to show "converting" state
            await new Promise(r => setTimeout(r, 300))
            setUploadStatus('uploading')

            const response = await apiFetch('/upload/images?folder=products', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Upload failed')
            }

            const data = await response.json()

            setUploadStatus('done')

            if (data.success && data.data) {
                const newImages: ProductImage[] = data.data.map((img: any, index: number) => ({
                    url: img.url,
                    publicId: img.publicId,
                    isPrimary: images.length === 0 && index === 0,
                    order: images.length + index,
                    originalSize: img.originalSize,
                    convertedSize: img.convertedSize,
                    savings: img.savings,
                }))
                setImages([...images, ...newImages])

                // Show savings info
                const totalOriginal = data.data.reduce((sum: number, img: any) => sum + (img.originalSize || 0), 0)
                const totalConverted = data.data.reduce((sum: number, img: any) => sum + (img.convertedSize || 0), 0)
                if (totalOriginal > 0) {
                    toast.success(
                        `${newImages.length} image(s) converted to WebP & uploaded! Saved ${formatBytes(totalOriginal - totalConverted)} (${Math.round((1 - totalConverted / totalOriginal) * 100)}% smaller)`
                    )
                } else {
                    toast.success(`${newImages.length} image(s) uploaded successfully`)
                }
            }

            // Keep "done" visible briefly
            await new Promise(r => setTimeout(r, 1000))
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to upload images')
        } finally {
            setIsUploadingImage(false)
            setUploadStatus('idle')
            // Reset file input
            e.target.value = ''
        }
    }

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index)
        // If we removed the primary image, make the first one primary
        if (images[index].isPrimary && newImages.length > 0) {
            newImages[0].isPrimary = true
        }
        // Reorder
        newImages.forEach((img, i) => img.order = i)
        setImages(newImages)
    }

    const setFeaturedImage = (index: number) => {
        const newImages = images.map((img, i) => ({
            ...img,
            isPrimary: i === index
        }))
        setImages(newImages)
        toast.success("Featured image updated")
    }

    // Bullet points management
    const addBulletPoint = () => {
        setBulletPoints([...bulletPoints, ""])
    }

    const updateBulletPoint = (index: number, value: string) => {
        const newPoints = [...bulletPoints]
        newPoints[index] = value
        setBulletPoints(newPoints)
    }

    const removeBulletPoint = (index: number) => {
        if (bulletPoints.length === 1) return
        setBulletPoints(bulletPoints.filter((_, i) => i !== index))
    }

    const addVariant = () => {
        setVariants(prev => [...prev, createEmptyVariant()])
    }

    const updateVariant = (index: number, field: keyof ProductVariantForm, value: string | boolean) => {
        setVariants(prev => prev.map((variant, i) => (
            i === index ? { ...variant, [field]: value } : variant
        )))
    }

    const removeVariant = (index: number) => {
        setVariants(prev => prev.filter((_, i) => i !== index))
    }

    const addVariantAttribute = (variantIndex: number) => {
        setVariants(prev => prev.map((variant, index) => (
            index === variantIndex
                ? { ...variant, attributes: [...variant.attributes, { key: "", value: "" }] }
                : variant
        )))
    }

    const updateVariantAttribute = (variantIndex: number, attributeIndex: number, field: keyof ProductVariantAttributeForm, value: string) => {
        setVariants(prev => prev.map((variant, index) => {
            if (index !== variantIndex) return variant

            return {
                ...variant,
                attributes: variant.attributes.map((attribute, currentAttributeIndex) => (
                    currentAttributeIndex === attributeIndex
                        ? { ...attribute, [field]: value }
                        : attribute
                )),
            }
        }))
    }

    const removeVariantAttribute = (variantIndex: number, attributeIndex: number) => {
        setVariants(prev => prev.map((variant, index) => {
            if (index !== variantIndex) return variant

            const nextAttributes = variant.attributes.filter((_, currentAttributeIndex) => currentAttributeIndex !== attributeIndex)
            return {
                ...variant,
                attributes: nextAttributes.length > 0 ? nextAttributes : [{ key: "", value: "" }],
            }
        }))
    }

    async function createNewCompany() {
        if (!newCompanyName.trim()) {
            toast.error("Company name is required")
            return
        }

        setIsCreatingCompany(true)
        try {
            const response = await apiFetch("/companies", {
                method: "POST",
                body: JSON.stringify({
                    name: newCompanyName.trim(),
                    logo: newCompanyLogo.trim() ? { url: newCompanyLogo.trim() } : undefined,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to create company")
            }

            const data = await response.json()
            const newCompany = data.data

            setCompanies(prev => [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name)))
            form.setValue("company", newCompany._id)
            setNewCompanyName("")
            setNewCompanyLogo("")
            setShowNewCompanyDialog(false)
            toast.success(`Company "${newCompany.name}" created successfully`)
        } catch (error: any) {
            toast.error(error.message || "Failed to create company")
        } finally {
            setIsCreatingCompany(false)
        }
    }

    async function createNewCategory() {
        if (!newCategoryName.trim()) {
            toast.error("Category name is required")
            return
        }

        setIsCreatingCategory(true)
        try {
            const response = await apiFetch("/categories", {
                method: "POST",
                body: JSON.stringify({ name: newCategoryName.trim() }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to create category")
            }

            const data = await response.json()
            const newCategory = data.data

            setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
            form.setValue("category", newCategory.slug)
            setNewCategoryName("")
            setShowNewCategoryDialog(false)
            toast.success(`Category "${newCategory.name}" created successfully`)
        } catch (error: any) {
            toast.error(error.message || "Failed to create category")
        } finally {
            setIsCreatingCategory(false)
        }
    }

    async function onSubmit(values: z.infer<typeof productSchema>) {
        setIsLoading(true)
        try {
            // Validate images
            if (images.length === 0) {
                toast.error("Please add at least one product image")
                setIsLoading(false)
                return
            }

            // Filter out empty bullet points
            const validBulletPoints = bulletPoints.filter(bp => bp.trim() !== "")
            const normalizedLabelIds = normalizeSelectedLabelIds(values.labelIds, availableLabels)
            const normalizedTags = String(values.tags || "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            const variantDrafts = variants.map((variant) => {
                const normalizedAttributes = variant.attributes
                    .map((attribute) => ({
                        key: attribute.key.trim(),
                        value: attribute.value.trim(),
                    }))
                    .filter((attribute) => attribute.key && attribute.value)

                return {
                    ...variant,
                    normalizedAttributes,
                    name: variant.name.trim(),
                    sku: variant.sku.trim(),
                    priceUnit: variant.priceUnit.trim(),
                    packing: variant.packing.trim(),
                }
            })

            const incompleteVariantIndex = variantDrafts.findIndex((variant) => {
                const hasAnyValue = Boolean(
                    variant.name ||
                    variant.sku ||
                    variant.mrp ||
                    variant.retailPrice ||
                    variant.wholesalePrice ||
                    variant.stock ||
                    variant.priceUnit ||
                    variant.packing ||
                    variant.normalizedAttributes.length > 0
                )

                if (!hasAnyValue) {
                    return false
                }

                return !variant.name || !variant.sku || variant.mrp === "" || variant.retailPrice === "" || variant.wholesalePrice === ""
            })

            if (incompleteVariantIndex !== -1) {
                toast.error(`Variant ${incompleteVariantIndex + 1} is incomplete. Add name, SKU, MRP, customer price, and wholesale price.`)
                setIsLoading(false)
                return
            }

            const normalizedVariants = variantDrafts
                .filter((variant) => variant.name && variant.sku && variant.mrp !== "" && variant.retailPrice !== "" && variant.wholesalePrice !== "")
                .map((variant, index) => ({
                    name: variant.name,
                    sku: variant.sku,
                    attributes: variant.normalizedAttributes,
                    mrp: Number(variant.mrp || 0),
                    retailPrice: Number(variant.retailPrice || 0),
                    wholesalePrice: Number(variant.wholesalePrice || 0),
                    stock: Number(variant.stock || 0),
                    lowStockThreshold: Number(variant.lowStockThreshold || 5),
                    minOrderQuantity: Number(variant.minOrderQuantity || 1),
                    priceUnit: variant.priceUnit,
                    packing: variant.packing,
                    isActive: variant.isActive,
                    order: index,
                }))

            if (
                normalizedVariants.length === 0 &&
                (!values.sku.trim() || values.mrp === "" || values.retailPrice === "" || values.wholesalePrice === "")
            ) {
                toast.error("Provide either complete base SKU/pricing fields or add at least one complete variant.")
                setIsLoading(false)
                return
            }

            // Construct payload matching backend expectation
            const payload = {
                name: values.name.trim(),
                nameHindi: values.nameHindi?.trim() || null,
                description: values.description,
                shortDescription: values.shortDescription?.trim() || values.description.substring(0, 200),
                category: values.category,
                subCategory: values.subCategory?.trim() || null,
                tags: normalizedTags,
                sku: values.sku.trim() || undefined,
                status: values.status,
                mrp: values.mrp === "" ? undefined : Number(values.mrp),
                retailPrice: values.retailPrice === "" ? undefined : Number(values.retailPrice),
                wholesalePrice: values.wholesalePrice === "" ? undefined : Number(values.wholesalePrice),
                stock: Number(values.stock),
                lowStockThreshold: Number(values.lowStockThreshold || 5),
                minWholesaleQuantity: Number(values.minWholesaleQuantity),
                negotiationEnabled: values.negotiationEnabled,
                isFeatured: values.isFeatured,
                isHot: values.isHot,
                company: values.company && values.company !== 'none' ? values.company : null,
                labelIds: normalizedLabelIds,
                images: images,
                specifications: validBulletPoints.map((point, index) => ({
                    key: `feature_${index + 1}`,
                    value: point
                })),
                videoUrl: values.videoUrl?.trim() || null,
                shippingTerms: values.shippingTerms?.trim() || null,
                rating: Number(values.rating),
                purchaseCountMin: Number(values.purchaseCountMin),
                purchaseCountMax: Number(values.purchaseCountMax),
                variants: normalizedVariants,
            }

            const endpoint = isEditMode
                ? `/admin/products/${editId}`
                : "/admin/products"

            const response = await apiFetch(endpoint, {
                method: isEditMode ? "PUT" : "POST",
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error(isEditMode ? "Failed to update product" : "Failed to create product")
            }

            toast.success(isEditMode ? "Product updated successfully" : "Product created successfully")
            router.push("/products")
        } catch (error) {
            console.error(error)
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isInitialLoading) {
        return (
            <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#86efac]" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <NextLink href="/products">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </NextLink>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white">
                        {isEditMode ? "Edit Product" : "Add New Product"}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => form.handleSubmit(onSubmit)()}
                        disabled={isLoading}
                        className="px-8"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? "Update" : "Create"}
                    </Button>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <Card className="bg-[#161616] border-[#333]">
                                <CardContent className="pt-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Product Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter product name" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="nameHindi"
                                        render={({ field }) => (
                                            <FormItem className="mt-4">
                                                <FormLabel className="text-white">Product Name (Hindi)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Optional Hindi display name" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                </FormControl>
                                                <FormDescription className="text-gray-500">
                                                    Used by the app when Hindi language is selected.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem className="mt-4">
                                                <FormLabel className="text-white">Description</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Product description" {...field} className="bg-[#0D0D0D] border-[#333] text-white min-h-[100px]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="shortDescription"
                                        render={({ field }) => (
                                            <FormItem className="mt-4">
                                                <FormLabel className="text-white">Short Description</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Optional short summary for cards and previews" {...field} className="bg-[#0D0D0D] border-[#333] text-white min-h-[90px]" />
                                                </FormControl>
                                                <FormDescription className="text-gray-500">
                                                    If left empty, the backend will derive it from the full description.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid gap-4 mt-4">
                                        <FormField
                                            control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Category</FormLabel>
                                                <div className="flex gap-2">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="flex-1 justify-between border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]"
                                                                >
                                                                    <span className="truncate">
                                                                        {field.value
                                                                            ? categories.find((category) => category.slug === field.value)?.name || field.value
                                                                            : isLoadingCategories
                                                                                ? "Loading categories..."
                                                                                : "Select category"}
                                                                    </span>
                                                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-[#8d8d8d]" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent align="start" className="w-[360px] border-[#333] bg-[#111] p-0 text-white">
                                                            <Command className="bg-[#111] text-white">
                                                                <CommandInput
                                                                    placeholder="Search categories..."
                                                                    className="text-white placeholder:text-[#7d7d7d]"
                                                                />
                                                                <CommandList>
                                                                    <CommandEmpty className="text-[#8d8d8d]">No category found.</CommandEmpty>
                                                                    {categories.map((category) => (
                                                                        <CommandItem
                                                                            key={category._id}
                                                                            value={`${category.name} ${category.slug}`}
                                                                            onSelect={() => field.onChange(category.slug)}
                                                                            className="flex items-center justify-between rounded-none px-3 py-2 text-white aria-selected:bg-[#1A1A1A]"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm font-medium">{category.name}</p>
                                                                                <p className="truncate text-xs text-[#7d7d7d]">{category.slug}</p>
                                                                            </div>
                                                                            <Check className={`h-4 w-4 ${field.value === category.slug ? "text-[#86efac]" : "text-transparent"}`} />
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                        <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                                                            <DialogTrigger asChild>
                                                                <Button type="button" variant="outline" size="icon" className="border-[#333] bg-[#1A1A1A] text-white hover:bg-[#333]">
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="bg-[#161616] border-[#333]">
                                                                <DialogHeader>
                                                                    <DialogTitle className="text-white">Add New Category</DialogTitle>
                                                                    <DialogDescription className="text-gray-400">
                                                                        Create a new category for your products.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="py-4">
                                                                    <Input
                                                                        placeholder="Category name (e.g., Machinery, Seeds)"
                                                                        value={newCategoryName}
                                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                                        className="bg-[#0D0D0D] border-[#333] text-white"
                                                                    />
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => setShowNewCategoryDialog(false)}
                                                                        className="border-[#333] text-gray-400 hover:text-white"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        onClick={createNewCategory}
                                                                        disabled={isCreatingCategory}
                                                                    >
                                                                        {isCreatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                        Create Category
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                    <FormDescription className="text-gray-500">
                                                        Search by category name and pick from all created categories.
                                                    </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    </div>

                                    <div className="grid gap-4 mt-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="subCategory"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Sub Category</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Optional sub category" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="tags"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Tags</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="cable, copper, 3-core" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </FormControl>
                                                    <FormDescription className="text-gray-500">
                                                        Comma-separated tags used for search and filtering.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Product Images Card */}
                            <Card className="bg-[#161616] border-[#333]">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-white font-medium flex items-center gap-2">
                                            <ImagePlus className="h-4 w-4" />
                                            Product Images
                                        </h3>
                                        {/* Toggle between URL and Upload */}
                                        <div className="flex bg-[#0D0D0D] rounded-lg p-1">
                                            <button
                                                type="button"
                                                onClick={() => setImageUploadMode('url')}
                                                className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${imageUploadMode === 'url'
                                                    ? 'bg-[#86efac] text-black'
                                                    : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                <Link className="h-3 w-3" />
                                                URL
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setImageUploadMode('file')}
                                                className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${imageUploadMode === 'file'
                                                    ? 'bg-[#86efac] text-black'
                                                    : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                <Upload className="h-3 w-3" />
                                                Upload
                                            </button>
                                        </div>
                                    </div>

                                    {/* URL Input Mode */}
                                    {imageUploadMode === 'url' && (
                                        <div className="flex gap-2 mb-4">
                                            <Input
                                                placeholder="Enter image URL..."
                                                value={newImageUrl}
                                                onChange={(e) => setNewImageUrl(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                                                className="bg-[#0D0D0D] border-[#333] text-white flex-1"
                                            />
                                            <Button
                                                type="button"
                                                onClick={addImage}
                                                className="bg-[#86efac] text-black hover:bg-[#86efac]/90"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* File Upload Mode */}
                                    {imageUploadMode === 'file' && (
                                        <div className="mb-4">
                                            <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg transition-colors ${isUploadingImage
                                                ? 'border-[#86efac]/50 bg-[#86efac]/5 cursor-wait'
                                                : 'border-[#333] bg-[#0D0D0D] hover:bg-[#1a1a1a] cursor-pointer'
                                                } ${isUploadingImage ? 'h-28' : 'h-24'}`}>
                                                <div className="flex flex-col items-center justify-center py-4">
                                                    {isUploadingImage ? (
                                                        <div className="flex flex-col items-center gap-2 w-full px-6">
                                                            {/* Step indicators */}
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${uploadStatus === 'converting'
                                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                                    : uploadStatus === 'uploading' || uploadStatus === 'done'
                                                                        ? 'bg-green-500/20 text-green-400'
                                                                        : 'bg-gray-500/20 text-gray-500'
                                                                    }`}>
                                                                    {uploadStatus === 'converting' ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <span className="text-[10px]">✓</span>
                                                                    )}
                                                                    Converting to WebP
                                                                </span>
                                                                <span className="text-gray-600">→</span>
                                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${uploadStatus === 'uploading'
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : uploadStatus === 'done'
                                                                        ? 'bg-green-500/20 text-green-400'
                                                                        : 'bg-gray-500/20 text-gray-500'
                                                                    }`}>
                                                                    {uploadStatus === 'uploading' ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : uploadStatus === 'done' ? (
                                                                        <span className="text-[10px]">✓</span>
                                                                    ) : (
                                                                        <span className="text-[10px]">○</span>
                                                                    )}
                                                                    Uploading
                                                                </span>
                                                                <span className="text-gray-600">→</span>
                                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${uploadStatus === 'done'
                                                                    ? 'bg-green-500/20 text-green-400'
                                                                    : 'bg-gray-500/20 text-gray-500'
                                                                    }`}>
                                                                    {uploadStatus === 'done' ? (
                                                                        <span className="text-[10px]">✓</span>
                                                                    ) : (
                                                                        <span className="text-[10px]">○</span>
                                                                    )}
                                                                    Done
                                                                </span>
                                                            </div>
                                                            {/* Progress bar */}
                                                            <div className="w-full bg-[#333] rounded-full h-1.5">
                                                                <div className={`h-1.5 rounded-full transition-all duration-500 ${uploadStatus === 'converting'
                                                                    ? 'w-1/3 bg-yellow-500'
                                                                    : uploadStatus === 'uploading'
                                                                        ? 'w-2/3 bg-blue-500'
                                                                        : 'w-full bg-green-500'
                                                                    }`} />
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                {uploadStatus === 'converting' && 'Converting images to WebP for smaller file sizes...'}
                                                                {uploadStatus === 'uploading' && 'Uploading optimized images to storage...'}
                                                                {uploadStatus === 'done' && 'Upload complete!'}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-6 w-6 text-gray-400 mb-2" />
                                                            <p className="text-sm text-gray-400">
                                                                <span className="text-[#86efac]">Click to upload</span> or drag and drop
                                                            </p>
                                                            <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP (max 5MB) — auto-converted to WebP</p>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                                    multiple
                                                    onChange={handleFileUpload}
                                                    disabled={isUploadingImage}
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {/* Images Grid */}
                                    {images.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {images.map((img, index) => (
                                                <div
                                                    key={index}
                                                    className={`relative group rounded-lg overflow-hidden border-2 ${img.isPrimary ? 'border-[#86efac]' : 'border-[#333]'
                                                        }`}
                                                >
                                                    <img
                                                        src={img.url}
                                                        alt={`Product ${index + 1}`}
                                                        className="w-full aspect-square object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/1a1a1a/666?text=Error'
                                                        }}
                                                    />
                                                    {/* Featured Badge */}
                                                    {img.isPrimary && (
                                                        <div className="absolute top-1 left-1 bg-[#86efac] text-black text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <Crown className="h-3 w-3" />
                                                            Featured
                                                        </div>
                                                    )}
                                                    {/* WebP savings badge */}
                                                    {img.savings && (
                                                        <div className="absolute bottom-1 left-1 bg-blue-600/80 text-white text-[9px] px-1.5 py-0.5 rounded">
                                                            WebP {img.savings} saved
                                                        </div>
                                                    )}
                                                    {/* Actions Overlay */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        {!img.isPrimary && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setFeaturedImage(index)}
                                                                className="h-7 text-xs border-[#86efac] text-[#86efac] hover:bg-[#86efac]/20"
                                                            >
                                                                <Crown className="h-3 w-3 mr-1" />
                                                                Set Featured
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => removeImage(index)}
                                                            className="h-7 w-7 p-0"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-[#333] rounded-lg p-8 text-center">
                                            <ImagePlus className="h-8 w-8 mx-auto text-gray-500 mb-2" />
                                            <p className="text-gray-500 text-sm">No images added yet</p>
                                            <p className="text-gray-600 text-xs mt-1">Add image URLs above</p>
                                        </div>
                                    )}
                                    <p className="text-gray-500 text-xs mt-2">
                                        First image will be featured by default. Click "Set Featured" to change.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Bullet Points / Features Card */}
                            <Card className="bg-[#161616] border-[#333]">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-white font-medium">Key Features / Bullet Points</h3>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={addBulletPoint}
                                            className="border-[#333]"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Point
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {bulletPoints.map((point, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <span className="text-[#86efac] text-sm">•</span>
                                                <Input
                                                    placeholder={`Feature ${index + 1}...`}
                                                    value={point}
                                                    onChange={(e) => updateBulletPoint(index, e.target.value)}
                                                    className="bg-[#0D0D0D] border-[#333] text-white flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeBulletPoint(index)}
                                                    disabled={bulletPoints.length === 1}
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-400"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-gray-500 text-xs mt-3">
                                        Add key features that will be displayed as bullet points on the product page.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* YouTube Video URL */}
                            <Card className="bg-[#161616] border-[#333]">
                                <CardContent className="pt-6">
                                    <FormField
                                        control={form.control}
                                        name="videoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white flex items-center gap-2">
                                                    <Youtube className="h-4 w-4 text-red-500" />
                                                    Product Demo Video (YouTube)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://www.youtube.com/watch?v=..." {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                </FormControl>
                                                <FormDescription className="text-gray-500">
                                                    Paste a YouTube video link. Supports youtube.com/watch, youtu.be, and shorts URLs. This will be shown as a playable video on the product page.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Shipping & Return Terms */}
                            <Card className="bg-[#161616] border-[#333]">
                                <CardContent className="pt-6">
                                    <FormField
                                        control={form.control}
                                        name="shippingTerms"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white flex items-center gap-2">
                                                    <Truck className="h-4 w-4 text-blue-400" />
                                                    Shipping & Return Terms
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Enter shipping and return policy..." {...field} className="bg-[#0D0D0D] border-[#333] text-white min-h-[120px]" />
                                                </FormControl>
                                                <FormDescription className="text-gray-500">
                                                    Pre-filled with default terms. Edit to customize for this product. Displayed under &quot;Shipping &amp; Returns&quot; on the product page.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            <Card className="bg-[#161616] border-[#333]">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-white font-medium">Base Pricing & Inventory</h3>
                                        <p className="text-xs text-gray-500">
                                            These fields act as the fallback/default summary. If you add variants below, the backend will derive the visible summary from those variants.
                                        </p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="sku"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Base SKU</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="PROD-001" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                </FormControl>
                                                <FormDescription className="text-gray-500">
                                                    Keep this filled for single-variant products or as a fallback identifier.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="mrp"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">MRP (₹)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="0.00" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                </FormControl>
                                                <FormDescription className="text-gray-500">
                                                    Maximum Retail Price - shown as original price
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="retailPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Customer Price (₹)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0.00" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </FormControl>
                                                    <FormDescription className="text-gray-500">
                                                        Price shown to regular customers
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="wholesalePrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Wholesale Price (₹)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0.00" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </FormControl>
                                                    <FormDescription className="text-gray-500">
                                                        Price shown to wholesalers only
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="stock"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Stock</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lowStockThreshold"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Low Stock Threshold</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="5" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="minWholesaleQuantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Min Wholesale Qty</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="10" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="negotiationEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border border-[#333] p-3 bg-[#0D0D0D] self-end">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-white">Wholesaler Negotiation</FormLabel>
                                                        <FormDescription className="text-xs text-gray-500">
                                                            Allow negotiation requests for this product.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-[#2c2c2c] bg-[#101010] p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-white font-semibold">Product Variants</h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Add size/spec variants with separate price and stock. The base pricing above is kept as the fallback/default summary.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={addVariant}
                                                className="border-[#333] text-white"
                                            >
                                                <Plus className="h-3.5 w-3.5 mr-1" />
                                                Add Variant
                                            </Button>
                                        </div>

                                        {variants.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-[#333] px-4 py-6 text-sm text-gray-500">
                                                No variants added yet. If this product has multiple capacities, packings, or wire sizes, add them here.
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {variants.map((variant, index) => (
                                                    <div key={`${variant.sku}-${index}`} className="rounded-2xl border border-[#333] bg-[#0D0D0D] p-4 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="text-sm font-semibold text-white">Variant {index + 1}</h5>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => removeVariant(index)}
                                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Remove
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <Input
                                                                placeholder="Variant name"
                                                                value={variant.name}
                                                                onChange={(e) => updateVariant(index, "name", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                            <Input
                                                                placeholder="Variant SKU"
                                                                value={variant.sku}
                                                                onChange={(e) => updateVariant(index, "sku", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="MRP"
                                                                value={variant.mrp}
                                                                onChange={(e) => updateVariant(index, "mrp", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Customer price"
                                                                value={variant.retailPrice}
                                                                onChange={(e) => updateVariant(index, "retailPrice", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Wholesale price"
                                                                value={variant.wholesalePrice}
                                                                onChange={(e) => updateVariant(index, "wholesalePrice", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Stock"
                                                                value={variant.stock}
                                                                onChange={(e) => updateVariant(index, "stock", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Low stock threshold"
                                                                value={variant.lowStockThreshold}
                                                                onChange={(e) => updateVariant(index, "lowStockThreshold", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Min order quantity"
                                                                value={variant.minOrderQuantity}
                                                                onChange={(e) => updateVariant(index, "minOrderQuantity", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                            <Input
                                                                placeholder="Price unit (e.g. meter)"
                                                                value={variant.priceUnit}
                                                                onChange={(e) => updateVariant(index, "priceUnit", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                            <Input
                                                                placeholder="Packing (e.g. 90m coil)"
                                                                value={variant.packing}
                                                                onChange={(e) => updateVariant(index, "packing", e.target.value)}
                                                                className="bg-[#141414] border-[#333] text-white"
                                                            />
                                                        </div>

                                                        <div className="rounded-xl border border-[#272727] bg-[#111] p-3 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium text-white">Variant Attributes</p>
                                                                    <p className="text-xs text-gray-500">Optional key/value specs like core count, size, gauge, or length.</p>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => addVariantAttribute(index)}
                                                                    className="border-[#333] text-white"
                                                                >
                                                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                                                    Add Attribute
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {variant.attributes.map((attribute, attributeIndex) => (
                                                                    <div key={`${index}-${attributeIndex}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                                                        <Input
                                                                            placeholder="Key (e.g. Core)"
                                                                            value={attribute.key}
                                                                            onChange={(e) => updateVariantAttribute(index, attributeIndex, "key", e.target.value)}
                                                                            className="bg-[#141414] border-[#333] text-white"
                                                                        />
                                                                        <Input
                                                                            placeholder="Value (e.g. 3 Core)"
                                                                            value={attribute.value}
                                                                            onChange={(e) => updateVariantAttribute(index, attributeIndex, "value", e.target.value)}
                                                                            className="bg-[#141414] border-[#333] text-white"
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            onClick={() => removeVariantAttribute(index, attributeIndex)}
                                                                            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <label className="flex items-center gap-3 text-sm text-gray-300">
                                                            <Checkbox
                                                                checked={variant.isActive}
                                                                onCheckedChange={(checked) => updateVariant(index, "isActive", checked === true)}
                                                            />
                                                            Variant is active and selectable in the app
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Status</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-[#0D0D0D] border-[#333] text-white">
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-[#0D0D0D] border-[#333]">
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="archived">Archived</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="rating"
                                        render={({ field }) => (
                                            <FormItem className="mt-4">
                                                <FormLabel className="text-white flex items-center gap-2">
                                                    <Star className="h-4 w-4 text-yellow-500" />
                                                    Admin Rating (0-5)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="5"
                                                        placeholder="4.5"
                                                        {...field}
                                                        className="bg-[#0D0D0D] border-[#333] text-white"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-gray-500">
                                                    Initial rating for the product visibility.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <FormField
                                            control={form.control}
                                            name="purchaseCountMin"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Min Purchase Count</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="0" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="purchaseCountMax"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Max Purchase Count</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="50" {...field} className="bg-[#0D0D0D] border-[#333] text-white" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormDescription className="text-gray-500 mt-1">
                                        A random number between these two values will be shown as live purchases, changing every 24 hours.
                                    </FormDescription>
                                </CardContent>
                            </Card>

                            {/* Company & Product Flags */}
                            <Card className="bg-[#161616] border-[#333]">
                                <CardContent className="pt-6 space-y-4">
                                    <h3 className="text-white font-medium mb-4">Company & Visibility</h3>

                                    {/* Company Dropdown */}
                                    <FormField
                                        control={form.control}
                                        name="company"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" />
                                                    Company / Brand
                                                </FormLabel>
                                                <div className="flex gap-2">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="flex-1 justify-between border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]"
                                                                >
                                                                    <span className="truncate">
                                                                        {field.value && field.value !== "none"
                                                                            ? companies.find((company) => company._id === field.value)?.name || field.value
                                                                            : isLoadingCompanies
                                                                                ? "Loading brands..."
                                                                                : "Select brand"}
                                                                    </span>
                                                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-[#8d8d8d]" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent align="start" className="w-[360px] border-[#333] bg-[#111] p-0 text-white">
                                                            <Command className="bg-[#111] text-white">
                                                                <CommandInput
                                                                    placeholder="Search brands..."
                                                                    className="text-white placeholder:text-[#7d7d7d]"
                                                                />
                                                                <CommandList>
                                                                    <CommandEmpty className="text-[#8d8d8d]">No brand found.</CommandEmpty>
                                                                    <CommandItem
                                                                        value="No Company"
                                                                        onSelect={() => field.onChange("none")}
                                                                        className="flex items-center justify-between rounded-none px-3 py-2 text-white aria-selected:bg-[#1A1A1A]"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-sm font-medium">No Company</p>
                                                                            <p className="truncate text-xs text-[#7d7d7d]">Use product without a linked brand</p>
                                                                        </div>
                                                                        <Check className={`h-4 w-4 ${!field.value || field.value === "none" ? "text-[#86efac]" : "text-transparent"}`} />
                                                                    </CommandItem>
                                                                    {companies.map((company) => (
                                                                        <CommandItem
                                                                            key={company._id}
                                                                            value={company.name}
                                                                            onSelect={() => field.onChange(company._id)}
                                                                            className="flex items-center justify-between rounded-none px-3 py-2 text-white aria-selected:bg-[#1A1A1A]"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm font-medium">{company.name}</p>
                                                                            </div>
                                                                            <Check className={`h-4 w-4 ${field.value === company._id ? "text-[#86efac]" : "text-transparent"}`} />
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
                                                        <DialogTrigger asChild>
                                                            <Button type="button" variant="outline" size="icon" className="border-[#333] bg-[#1A1A1A] text-white hover:bg-[#333]">
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="bg-[#161616] border-[#333]">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-white">Add New Company</DialogTitle>
                                                                <DialogDescription className="text-gray-400">
                                                                    Create a new company/brand to associate with products.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div>
                                                                    <label className="text-sm font-medium text-white mb-2 block">Brand Name *</label>
                                                                    <Input
                                                                        placeholder="Company name (e.g., Mahindra, Tata)"
                                                                        value={newCompanyName}
                                                                        onChange={(e) => setNewCompanyName(e.target.value)}
                                                                        className="bg-[#0D0D0D] border-[#333] text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-white mb-2 block">Logo URL</label>
                                                                    <div className="flex gap-2">
                                                                        <Input
                                                                            placeholder="https://example.com/logo.png"
                                                                            value={newCompanyLogo}
                                                                            onChange={(e) => setNewCompanyLogo(e.target.value)}
                                                                            className="bg-[#0D0D0D] border-[#333] text-white flex-1"
                                                                        />
                                                                        {newCompanyLogo && (
                                                                            <div className="w-10 h-10 rounded-lg bg-[#0D0D0D] border border-[#333] overflow-hidden shrink-0">
                                                                                <img
                                                                                    src={newCompanyLogo}
                                                                                    alt="Preview"
                                                                                    className="w-full h-full object-cover"
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).style.display = 'none'
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-1">Optional: Enter a direct link to the brand logo</p>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() => setShowNewCompanyDialog(false)}
                                                                    className="border-[#333] text-gray-400 hover:text-white"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    onClick={createNewCompany}
                                                                    disabled={isCreatingCompany}
                                                                >
                                                                    {isCreatingCompany && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                    Create Company
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                                <FormDescription className="text-gray-500">
                                                    Search and select from all created brands.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="labelIds"
                                        render={({ field }) => {
                                            const selectedIds = Array.isArray(field.value) ? field.value : []
                                            const selectedLabels = availableLabels.filter((label) =>
                                                selectedIds.some((value) => labelMatches(value, label))
                                            )

                                            const toggleLabel = (labelId: string, checked: boolean) => {
                                                const targetLabel = availableLabels.find((label) => label.id === labelId)
                                                const nextValue = checked
                                                    ? targetLabel && selectedIds.some((value) => labelMatches(value, targetLabel))
                                                        ? selectedIds
                                                        : [...selectedIds, labelId]
                                                    : targetLabel
                                                        ? selectedIds.filter((item) => !labelMatches(item, targetLabel))
                                                        : selectedIds.filter((item) => item !== labelId)
                                                field.onChange(nextValue)
                                            }

                                            return (
                                                <FormItem>
                                                    <FormLabel className="text-white flex items-center gap-2">
                                                        <Tags className="h-4 w-4 text-[#86efac]" />
                                                        Product Labels
                                                    </FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="w-full justify-between border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]"
                                                                >
                                                                    <span className="truncate text-left">
                                                                        {isLoadingLabels
                                                                            ? "Loading labels..."
                                                                            : selectedLabels.length > 0
                                                                                ? selectedLabels.map((label) => label.title).join(", ")
                                                                                : availableLabels.length > 0
                                                                                    ? "Select product labels"
                                                                                    : "No labels created yet"}
                                                                    </span>
                                                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-[#8d8d8d]" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent align="start" className="w-[340px] border-[#333] bg-[#111] p-2 text-white">
                                                            {availableLabels.length === 0 ? (
                                                                <p className="px-2 py-3 text-sm text-[#8d8d8d]">
                                                                    Create labels first in the Labels page, then come back here to assign them.
                                                                </p>
                                                            ) : (
                                                                <div className="max-h-72 space-y-1 overflow-y-auto">
                                                                    {availableLabels.map((label) => {
                                                                        const isChecked = selectedIds.some((value) => labelMatches(value, label))

                                                                        return (
                                                                            <label
                                                                                key={label.id}
                                                                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-3 py-2 transition-colors hover:border-[#2d2d2d] hover:bg-[#1A1A1A]"
                                                                            >
                                                                                <Checkbox
                                                                                    checked={isChecked}
                                                                                    onCheckedChange={(checked) => toggleLabel(label.id, checked === true)}
                                                                                    className="mt-0.5 border-[#4d4d4d] data-[state=checked]:border-[#86efac] data-[state=checked]:bg-[#86efac] data-[state=checked]:text-black"
                                                                                />
                                                                                <div className="min-w-0">
                                                                                    <p className="truncate text-sm font-medium text-white">{label.title}</p>
                                                                                    <p className="text-xs text-[#7d7d7d]">
                                                                                        {label.sourceType === "image" ? "Image label" : "Icon label"}
                                                                                    </p>
                                                                                </div>
                                                                            </label>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormDescription className="text-gray-500">
                                                        Selected labels will be available on the product detail page in the app.
                                                    </FormDescription>
                                                    {selectedLabels.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {selectedLabels.map((label) => (
                                                                <span
                                                                    key={label.id}
                                                                    className="rounded-full border border-[#2f4f39] bg-[#132117] px-2.5 py-1 text-xs font-medium text-[#86efac]"
                                                                >
                                                                    {label.title}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )
                                        }}
                                    />

                                    {/* Featured & Hot Product Toggles */}
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <FormField
                                            control={form.control}
                                            name="isFeatured"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border border-[#333] p-3 bg-[#0D0D0D]">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-white flex items-center gap-2">
                                                            <Star className="h-4 w-4 text-yellow-500" />
                                                            Featured
                                                        </FormLabel>
                                                        <FormDescription className="text-xs text-gray-500">
                                                            Show on homepage
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="isHot"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border border-[#333] p-3 bg-[#0D0D0D]">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-white flex items-center gap-2">
                                                            <Flame className="h-4 w-4 text-orange-500" />
                                                            Hot Product
                                                        </FormLabel>
                                                        <FormDescription className="text-xs text-gray-500">
                                                            Mark as trending
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 border-[#333] bg-[#1A1A1A] text-gray-300 hover:text-white hover:bg-[#333]"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? "Update Product" : "Create Product"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    )
}
