"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, FolderTree, Loader2, LayoutGrid, List, Upload, Package, Search, Languages, GripVertical } from "@/components/hugeicons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

interface Category {
    _id: string
    name: string
    nameHindi?: string
    slug: string
    description?: string
    image?: { url?: string; publicId?: string }
    company?: { _id: string; name: string; slug: string } | string | null
    parent?: { _id: string; name: string; nameHindi?: string; slug: string } | null
    order: number
    isActive: boolean
    productCount: number
    createdAt: string
}

interface Company {
    _id: string
    name: string
    slug: string
}

type UploadStatus = 'idle' | 'converting' | 'uploading' | 'done'

export default function CategoriesPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'list' | 'card'>('card')

    // Search & Pagination state
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCategories, setTotalCategories] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [isConvertingHindi, setIsConvertingHindi] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [nameHindi, setNameHindi] = useState("")
    const [description, setDescription] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [imagePublicId, setImagePublicId] = useState("")
    const [parentId, setParentId] = useState<string>("none")
    const [companyId, setCompanyId] = useState<string>("")
    const [order, setOrder] = useState("0")
    const [isActive, setIsActive] = useState(true)
    const [previewImageUrl, setPreviewImageUrl] = useState("")
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')

    useEffect(() => {
        fetchCategories(1, true)
        fetchCompanies()
    }, [])

    async function fetchCompanies() {
        try {
            const res = await apiFetch('/companies?page=1&limit=500', { skipAuth: true })
            if (res.ok) {
                const data = await res.json()
                setCompanies(Array.isArray(data.data) ? data.data : [])
            }
        } catch (error) {
            console.error("Failed to fetch brands:", error)
        }
    }

    function getCategoryCompanyId(category: Category) {
        return typeof category.company === 'object' && category.company
            ? category.company._id
            : String(category.company || '')
    }

    function getCategoryCompanyName(category: Category) {
        if (typeof category.company === 'object' && category.company) return category.company.name
        return companies.find(company => company._id === category.company)?.name || 'Unassigned'
    }

    async function fetchCategories(pageNum: number = 1, reset: boolean = false) {
        if (reset) {
            setIsLoading(true)
            setPage(1)
        } else {
            setIsLoadingMore(true)
        }

        try {
            const params = new URLSearchParams()
            params.append('page', pageNum.toString())
            params.append('limit', '200')
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim())
            }

            const res = await apiFetch(`/categories?${params.toString()}`, { skipAuth: true })
            if (res.ok) {
                const data = await res.json()
                const items = data.data || []
                const pagination = data.pagination || {}

                if (reset || pageNum === 1) {
                    setCategories(items)
                } else {
                    setCategories(prev => [...prev, ...items])
                }

                setTotalPages(pagination.totalPages || 1)
                setTotalCategories(pagination.total || items.length)
                setHasMore((pagination.page || 1) < (pagination.totalPages || 1))
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error)
            toast.error("Failed to load categories")
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        fetchCategories(1, true)
    }, [searchQuery])

    const loadMore = useCallback(() => {
        if (hasMore && !isLoadingMore) {
            const nextPage = page + 1
            setPage(nextPage)
            fetchCategories(nextPage, false)
        }
    }, [hasMore, isLoadingMore, page])

    function openCreateDialog() {
        setEditingCategory(null)
        setName("")
        setNameHindi("")
        setDescription("")
        setImageUrl("")
        setImagePublicId("")
        setParentId("none")
        setCompanyId(companies[0]?._id || "")
        setOrder("0")
        setIsActive(true)
        setIsDialogOpen(true)
    }

    function openEditDialog(category: Category) {
        setEditingCategory(category)
        setName(category.name)
        setNameHindi(category.nameHindi || "")
        setDescription(category.description || "")
        setImageUrl(category.image?.url || "")
        setImagePublicId(category.image?.publicId || "")
        setParentId(category.parent?._id || "none")
        setCompanyId(getCategoryCompanyId(category))
        setOrder(String(category.order || 0))
        setIsActive(category.isActive)
        setIsDialogOpen(true)
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingImage(true)
        setUploadStatus('converting')
        const formData = new FormData()
        formData.append('image', file)

        try {
            await new Promise(r => setTimeout(r, 300))
            setUploadStatus('uploading')

            const response = await apiFetch('/upload/image?folder=categories', {
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
                setImageUrl(data.data.url)
                setImagePublicId(data.data.publicId)
                const orig = data.data.originalSize || 0
                const conv = data.data.convertedSize || 0
                if (orig > 0 && conv > 0) {
                    toast.success(`Image converted to WebP & uploaded! Saved ${formatBytes(orig - conv)} (${data.data.savings} smaller)`)
                } else {
                    toast.success('Image uploaded successfully')
                }
            }

            await new Promise(r => setTimeout(r, 1000))
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to upload image')
        } finally {
            setIsUploadingImage(false)
            setUploadStatus('idle')
            e.target.value = ''
        }
    }

    async function handleSubmit() {
        if (!name.trim()) {
            toast.error("Category name is required")
            return
        }

        if (!companyId) {
            toast.error("Brand is required")
            return
        }

        setIsSubmitting(true)

        try {
            const payload: any = {
                name: name.trim(),
                company: companyId,
                nameHindi: nameHindi.trim() || undefined,
                description: description.trim() || undefined,
                image: imageUrl.trim() ? { url: imageUrl.trim(), publicId: imagePublicId || undefined } : undefined,
                parent: parentId !== "none" ? parentId : null,
                order: Number(order) || 0,
                isActive,
            }

            const endpoint = editingCategory
                ? `/categories/${editingCategory._id}`
                : "/categories"

            const res = await apiFetch(endpoint, {
                method: editingCategory ? "PUT" : "POST",
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || "Failed to save category")
            }

            toast.success(editingCategory ? "Category updated successfully" : "Category created successfully")
            setIsDialogOpen(false)
            fetchCategories()
        } catch (error: any) {
            toast.error(error.message || "Failed to save category")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function convertMissingHindiNames() {
        setIsConvertingHindi(true)
        try {
            const res = await apiFetch("/categories/hindi-names/generate-missing", {
                method: "POST",
                body: JSON.stringify({}),
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok || data?.success === false) {
                toast.error(data?.message || "Failed to convert Hindi names")
                return
            }

            const stats = data.data || {}
            toast.success(
                `Hindi conversion done: ${stats.updated ?? 0} updated, ${stats.skipped ?? 0} skipped (processed ${stats.processed ?? 0}).`
            )
            fetchCategories(1, true)
        } catch (error) {
            console.error(error)
            toast.error("Error converting Hindi names")
        } finally {
            setIsConvertingHindi(false)
        }
    }

    async function handleDelete(id: string) {
        try {
            const res = await apiFetch(`/categories/${id}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || "Failed to delete category")
            }

            toast.success("Category deleted successfully")
            setDeleteConfirmId(null)
            fetchCategories()
        } catch (error: any) {
            toast.error(error.message || "Failed to delete category")
        }
    }

    // Drag and Drop Reorder Handler
    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over || active.id === over.id) return

        // Find indices in the current categories array
        const oldIndex = categories.findIndex(c => c._id === active.id)
        const newIndex = categories.findIndex(c => c._id === over.id)

        if (oldIndex === -1 || newIndex === -1) return

        // Reorder locally first (optimistic update)
        const newCategories = arrayMove(categories, oldIndex, newIndex)
        
        // Assign sequential order numbers starting from 1
        const updates = newCategories.map((cat, index) => ({
            categoryId: cat._id,
            order: index + 1,
        }))

        // Update UI immediately
        setCategories(newCategories.map((cat, index) => ({
            ...cat,
            order: index + 1,
        })))

        // Send to backend
        try {
            const res = await apiFetch("/categories/reorder", {
                method: "POST",
                body: JSON.stringify({ updates }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || "Failed to reorder categories")
            }

            toast.success("Categories reordered successfully")
        } catch (error: any) {
            console.error("Reorder error:", error)
            toast.error(error.message || "Failed to reorder categories")
            // Refresh to get correct state from backend
            fetchCategories(1, true)
        }
    }

    // Setup sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Get parent categories for the dropdown (exclude the category being edited)
    const parentOptions = categories.filter(c => 
        (!editingCategory || c._id !== editingCategory._id) &&
        (!companyId || getCategoryCompanyId(c) === companyId)
    )

    // Draggable Table Row Component
    function DraggableTableRow({ category, index }: { category: Category; index: number }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: category._id })

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        }

        return (
            <TableRow
                ref={setNodeRef}
                style={style}
                className={`cursor-pointer border-[#333] transition-colors ${
                    isDragging ? 'bg-[#86efac]/10 ring-2 ring-[#86efac]' : 'hover:bg-[#1A1A1A]'
                }`}
                onClick={() => router.push(`/categories/${category._id}/products`)}
            >
                <TableCell 
                    {...attributes}
                    {...listeners}
                    className="text-gray-400 cursor-grab active:cursor-grabbing"
                >
                    <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4" />
                        <span className="font-bold text-[#86efac]">#{index + 1}</span>
                    </div>
                </TableCell>
                <TableCell>
                    {category.image?.url ? (
                        <img 
                            src={category.image.url} 
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover bg-[#0D0D0D]"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#0D0D0D] flex items-center justify-center">
                            <FolderTree className="h-5 w-5 text-gray-500" />
                        </div>
                    )}
                </TableCell>
                <TableCell className="font-medium text-white">
                    <div>
                        <div>{category.name}</div>
                        {category.nameHindi ? (
                            <div className="text-xs font-normal text-gray-400">{category.nameHindi}</div>
                        ) : null}
                    </div>
                </TableCell>
                <TableCell className="text-gray-400">
                    {getCategoryCompanyName(category)}
                </TableCell>
                <TableCell className="text-gray-400">
                    {category.slug}
                </TableCell>
                <TableCell className="text-gray-400">
                    {category.parent?.name || "—"}
                </TableCell>
                <TableCell>
                    <span className="flex items-center gap-1 text-gray-400">
                        <Package className="h-3 w-3" />
                        {category.productCount}
                    </span>
                </TableCell>
                <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        category.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                    }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-blue-400 hover:text-blue-300"
                            onClick={() => openEditDialog(category)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => setDeleteConfirmId(category._id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        )
    }
    function DraggableCard({ category, index }: { category: Category; index: number }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: category._id })

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        }

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`relative bg-[#161616] rounded-xl p-4 transition-all ${
                    isDragging ? 'opacity-50 ring-2 ring-[#86efac]' : ''
                } ${category.isActive ? '' : 'opacity-60'}`}
            >
                {/* Order Number Badge */}
                <div className="absolute top-2 right-2 bg-[#86efac]/20 text-[#86efac] px-2 py-1 rounded text-xs font-bold">
                    #{index + 1}
                </div>

                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#86efac] transition-colors"
                >
                    <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex items-start justify-between mb-3 pt-6">
                    {category.image?.url ? (
                        <img 
                            src={category.image.url} 
                            alt={category.name}
                            className="w-14 h-14 rounded-xl object-cover bg-[#0D0D0D]"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#0D0D0D] flex items-center justify-center">
                            <FolderTree className="h-7 w-7 text-gray-500" />
                        </div>
                    )}
                    <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-blue-400 hover:text-blue-300"
                            onClick={() => openEditDialog(category)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => setDeleteConfirmId(category._id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <h3 className="font-semibold text-white text-lg mb-1">{category.name}</h3>
                {category.nameHindi ? (
                    <p className="text-[#86efac] text-sm mb-1">{category.nameHindi}</p>
                ) : null}
                <p className="text-gray-500 text-sm mb-2">/{category.slug}</p>
                <p className="text-[#86efac] text-xs font-medium mb-2">{getCategoryCompanyName(category)}</p>
                <div className="flex items-center gap-3 text-xs">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        category.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                    }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                        <Package className="h-3 w-3" />
                        {category.productCount} products
                    </span>
                </div>
                {category.parent?.name && (
                    <p className="text-gray-500 text-xs mt-2">Parent: {category.parent.name}</p>
                )}
                {category.description && (
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{category.description}</p>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <FolderTree className="h-7 w-7 shrink-0 text-[#86efac] sm:h-8 sm:w-8" />
                    <div>
                        <h1 className="text-2xl font-bold text-white sm:text-3xl">Categories</h1>
                        <p className="text-gray-400 text-sm">{totalCategories > 0 && `(${totalCategories} categories)`}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Button
                        type="button"
                        onClick={convertMissingHindiNames}
                        disabled={isConvertingHindi}
                        variant="outline"
                        className="w-full border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A] sm:w-auto"
                    >
                        {isConvertingHindi ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Languages className="mr-2 h-4 w-4" />
                        )}
                        Convert Missing Hindi Names
                    </Button>
                    {/* View Toggle */}
                    <div className="flex items-center rounded-lg border border-[#333] bg-[#161616] p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`rounded-md p-2 transition-colors ${viewMode === 'list' ? 'is-active' : 'text-gray-400 hover:text-white'}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`rounded-md p-2 transition-colors ${viewMode === 'card' ? 'is-active' : 'text-gray-400 hover:text-white'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                    <Button 
                        onClick={openCreateDialog}
                        className="h-10 min-w-0 bg-[#86efac] px-3 text-black hover:bg-[#86efac]/90 sm:px-4"
                    >
                        <Plus className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">Add Category</span>
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-md sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search categories by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#161616] border-[#333] text-white placeholder:text-gray-500 focus-visible:ring-[#86efac]"
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    className="w-full border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A] sm:w-auto"
                >
                    Search
                </Button>
                {searchQuery && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setSearchQuery("")
                            fetchCategories(1, true)
                        }}
                        className="w-full text-gray-400 hover:text-white sm:w-auto"
                    >
                        Clear
                    </Button>
                )}
            </form>

            {/* Categories Content */}
            {isLoading ? (
                <div className="bg-[#161616] rounded-xl border border-[#333] flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-[#86efac]" />
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-[#161616] rounded-xl border border-[#333] flex flex-col items-center justify-center h-48 text-gray-400">
                    <FolderTree className="h-12 w-12 mb-4 opacity-50" />
                    <p>No categories found</p>
                    <p className="text-sm">Create your first category to get started</p>
                </div>
            ) : viewMode === 'list' ? (
                /* List View with Drag and Drop */
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={categories.map(c => c._id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="bg-[#161616] rounded-xl border border-[#333] overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-[#333] hover:bg-transparent">
                                        <TableHead className="text-gray-400 w-20">Order</TableHead>
                                        <TableHead className="text-gray-400">Image</TableHead>
                                        <TableHead className="text-gray-400">Name</TableHead>
                                        <TableHead className="text-gray-400">Brand</TableHead>
                                        <TableHead className="text-gray-400">Slug</TableHead>
                                        <TableHead className="text-gray-400">Parent</TableHead>
                                        <TableHead className="text-gray-400">Products</TableHead>
                                        <TableHead className="text-gray-400">Status</TableHead>
                                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((category, index) => (
                                        <DraggableTableRow key={category._id} category={category} index={index} />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                /* Card View with Drag and Drop */
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={categories.map(c => c._id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {categories.map((category, index) => (
                                <div
                                    key={category._id}
                                    onClick={() => router.push(`/categories/${category._id}/products`)}
                                    className="cursor-pointer focus-visible:outline-none"
                                >
                                    <DraggableCard category={category} index={index} />
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl gap-3 overflow-y-hidden border-[#333] bg-[#161616] p-5">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingCategory ? "Edit Category" : "Add New Category"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {editingCategory 
                                ? "Update the category information below."
                                : "Create a new category to organize your products."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-wrap gap-y-3 py-3">
                        <div className="order-1 w-1/2 pr-2">
                            <label className="text-sm font-medium text-white mb-2 block">
                                Brand *
                            </label>
                            <Select
                                value={companyId}
                                onValueChange={(value) => {
                                    setCompanyId(value)
                                    setParentId("none")
                                }}
                            >
                                <SelectTrigger className="bg-[#0D0D0D] border-[#333] text-white">
                                    <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0D0D0D] border-[#333]">
                                    {companies.map((company) => (
                                        <SelectItem key={company._id} value={company._id}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                Category names are unique only inside the selected brand.
                            </p>
                        </div>

                        <div className="order-3 w-1/2 pr-2">
                            <label className="text-sm font-medium text-white mb-2 block">
                                Category Name *
                            </label>
                            <Input
                                placeholder="e.g., Machinery, Seeds, Fertilizers"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-[#0D0D0D] border-[#333] text-white"
                            />
                        </div>

                        <div className="order-4 w-1/2 pl-2">
                            <label className="text-sm font-medium text-white mb-2 block">
                                Category Name (Hindi)
                            </label>
                            <Input
                                placeholder="e.g., मशीनरी, बीज, उर्वरक"
                                value={nameHindi}
                                onChange={(e) => setNameHindi(e.target.value)}
                                className="bg-[#0D0D0D] border-[#333] text-white"
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="order-5 w-full">
                            <label className="mb-2 block text-sm font-medium text-white">
                                Category Image
                            </label>
                            <div className="flex items-center gap-3">
                                <label className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                                    isUploadingImage
                                        ? 'h-24 cursor-wait border-[#86efac]/50 bg-[#86efac]/5'
                                        : 'h-20 cursor-pointer border-[#333] bg-[#0D0D0D] hover:bg-[#1a1a1a]'
                                }`}>
                                    <div className="flex flex-col items-center justify-center py-3">
                                        {isUploadingImage ? (
                                            <div className="flex w-full flex-col items-center gap-1.5 px-4">
                                                <div className="flex items-center gap-1 text-[10px]">
                                                    <span className={`rounded-full px-1.5 py-0.5 ${
                                                        uploadStatus === 'converting'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-green-500/20 text-green-400'
                                                    }`}>
                                                        {uploadStatus === 'converting' ? '⟳ Converting' : '✓ Converted'}
                                                    </span>
                                                    <span className="text-gray-600">→</span>
                                                    <span className={`rounded-full px-1.5 py-0.5 ${
                                                        uploadStatus === 'uploading'
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : uploadStatus === 'done'
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : 'bg-gray-500/20 text-gray-500'
                                                    }`}>
                                                        {uploadStatus === 'uploading' ? '⟳ Uploading' : uploadStatus === 'done' ? '✓ Done' : '○ Upload'}
                                                    </span>
                                                </div>
                                                <div className="h-1 w-full rounded-full bg-[#333]">
                                                    <div className={`h-1 rounded-full transition-all duration-500 ${
                                                        uploadStatus === 'converting' ? 'w-1/3 bg-yellow-500'
                                                        : uploadStatus === 'uploading' ? 'w-2/3 bg-blue-500'
                                                        : 'w-full bg-green-500'
                                                    }`} />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="mb-1 h-5 w-5 text-gray-400" />
                                                <p className="text-xs text-gray-400">
                                                    <span className="text-[#86efac]">Click to upload</span> — auto WebP
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleImageUpload}
                                        disabled={isUploadingImage}
                                    />
                                </label>
                                {imageUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewImageUrl(imageUrl)}
                                        className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#333] bg-[#0D0D0D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac]"
                                        aria-label="Enlarge category image"
                                    >
                                        <img
                                            src={imageUrl}
                                            alt="Category image preview"
                                            className="h-full w-full cursor-zoom-in object-cover"
                                        />
                                    </button>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                PNG, JPG, GIF, WebP (max 5MB) — auto-converted to WebP. Click the preview to enlarge it.
                            </p>
                        </div>

                        {/* Parent Category */}
                        <div className="order-2 w-1/2 pl-2">
                            <label className="text-sm font-medium text-white mb-2 block">
                                Parent Category
                            </label>
                            <Select value={parentId} onValueChange={setParentId}>
                                <SelectTrigger className="bg-[#0D0D0D] border-[#333] text-white">
                                    <SelectValue placeholder="Select parent category" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0D0D0D] border-[#333]">
                                    <SelectItem value="none">None (Root Category)</SelectItem>
                                    {parentOptions.map((cat) => (
                                        <SelectItem key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                Leave as &quot;None&quot; for a top-level category
                            </p>
                        </div>

                        {/* Description */}
                        <div className="order-6 w-full">
                            <label className="text-sm font-medium text-white mb-2 block">
                                Description
                            </label>
                            <Textarea
                                placeholder="Brief description of the category..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-[#0D0D0D] border-[#333] text-white min-h-[80px]"
                            />
                        </div>

                        {/* Order & Active */}
                        <div className="order-7 flex w-full gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-white mb-2 block">
                                    Display Order
                                </label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={order}
                                    onChange={(e) => setOrder(e.target.value)}
                                    className="bg-[#0D0D0D] border-[#333] text-white"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium text-white mb-2 block">
                                    Active
                                </label>
                                <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-[#333] bg-[#0D0D0D]">
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={setIsActive}
                                    />
                                    <span className={`text-sm ${isActive ? 'text-green-400' : 'text-gray-500'}`}>
                                        {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="border-[#333] bg-[#1A1A1A] text-gray-300 hover:text-white hover:bg-[#333]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="is-active hover:bg-[#86efac]/90"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingCategory ? "Update Category" : "Create Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(previewImageUrl)}
                onOpenChange={(open) => {
                    if (!open) setPreviewImageUrl("")
                }}
            >
                <DialogContent className="max-w-4xl border-[#333] bg-[#161616] p-3">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Category image preview</DialogTitle>
                    </DialogHeader>
                    {previewImageUrl && (
                        <img
                            src={previewImageUrl}
                            alt="Enlarged category image"
                            className="max-h-[80vh] w-full object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                <DialogContent className="bg-[#161616] border-[#333]">
                    <DialogHeader>
                        <DialogTitle className="text-white">Delete Category</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Are you sure you want to delete this category? This action cannot be undone.
                            Categories with subcategories or products cannot be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                            className="border-[#333] bg-[#1A1A1A] text-gray-300 hover:text-white hover:bg-[#333]"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Load More Button */}
            {hasMore && categories.length > 0 && (
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        className="border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A] min-w-[200px]"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            `Load More (${categories.length}/${totalCategories})`
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
