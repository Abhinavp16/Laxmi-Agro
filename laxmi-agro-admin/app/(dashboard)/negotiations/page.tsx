"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MessageSquare, Check, X, Send, Search, Package } from "@/components/hugeicons"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch, getUser } from "@/lib/api"
import { useNegotiationSocket } from "@/lib/hooks/useNegotiationSocket"

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.laxmiagroenterprises.com/api/v1")
    .replace(/\/api\/v1\/?$/, "")

interface HistoryActor {
    _id?: string
    name?: string
    username?: string
    email?: string
}

interface HistoryEntry {
    action: string
    by: 'wholesaler' | 'admin'
    pricePerUnit?: number
    totalPrice?: number
    message?: string
    timestamp: string
    actorId?: string | HistoryActor | null
    actorRole?: string | null
}

interface ApprovedBy {
    role: string
    userId: string | null
    name: string
}

interface NegotiationList {
    id: string
    negotiationNumber: string
    product: { name: string; price: number }
    wholesaler: { name: string }
    requestedQuantity: number
    requestedPricePerUnit: number
    status: string
    orderId?: string | null
    approvedBy?: ApprovedBy | null
}

interface NegotiationDetail {
    _id: string
    negotiationNumber: string
    productSnapshot: { name: string; sku: string; price: number; image?: string }
    wholesalerId: { _id: string; name: string; email?: string; phone?: string; address?: string; businessInfo?: { businessName?: string; businessAddress?: string } }
    requestedQuantity: number
    requestedPricePerUnit: number
    status: string
    currentOfferBy?: 'wholesaler' | 'admin'
    currentPricePerUnit?: number
    currentTotalPrice?: number
    finalPricePerUnit?: number
    finalTotalPrice?: number
    orderId?: { _id: string; orderNumber: string; status: string; total: number } | string | null
    approvedBy?: ApprovedBy | null
    lastOrderAddress?: ShippingAddress | null
    message: string
    history: HistoryEntry[]
    createdAt: string
}

interface ShippingAddress {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
}

const EMPTY_ADDRESS: ShippingAddress = {
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
}

function actorDisplayName(entry: HistoryEntry): string {
    if (typeof entry.actorId === 'object' && entry.actorId) {
        return entry.actorId.name || entry.actorId.username || entry.actorId.email || 'Staff'
    }
    if (entry.by === 'wholesaler') return 'Wholesaler'
    return entry.actorRole === 'staff' ? 'Staff' : 'Admin'
}

export default function NegotiationsPage() {
    const [negotiations, setNegotiations] = useState<NegotiationList[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Search & Pagination state
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalNegotiations, setTotalNegotiations] = useState(0)
    const [hasMore, setHasMore] = useState(false)

    useEffect(() => {
        fetchNegotiations(1, true)
    }, [])

    async function fetchNegotiations(pageNum: number = 1, reset: boolean = false) {
        if (reset) {
            setIsLoading(true)
            setPage(1)
        } else {
            setIsLoadingMore(true)
        }

        try {
            const params = new URLSearchParams()
            params.append('page', pageNum.toString())
            params.append('limit', '20')
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim())
            }

            const res = await apiFetch(`/admin/negotiations?${params.toString()}`)
            const data = await res.json()
            if (res.ok) {
                const items = data.data || []
                const pagination = data.pagination || {}

                if (reset || pageNum === 1) {
                    setNegotiations(items)
                } else {
                    setNegotiations(prev => [...prev, ...items])
                }

                setTotalPages(pagination.totalPages || 1)
                setTotalNegotiations(pagination.total || items.length)
                setHasMore((pagination.page || 1) < (pagination.totalPages || 1))
            } else {
                toast.error("Failed to fetch negotiations")
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
        fetchNegotiations(1, true)
    }, [searchQuery])

    const loadMore = useCallback(() => {
        if (hasMore && !isLoadingMore) {
            const nextPage = page + 1
            setPage(nextPage)
            fetchNegotiations(nextPage, false)
        }
    }, [hasMore, isLoadingMore, page])

    function openDetails(id: string) {
        setSelectedId(id)
        setIsSheetOpen(true)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>
            case 'accepted': return <Badge variant="outline" className="text-green-500 border-green-500">Accepted</Badge>
            case 'converted': return <Badge variant="outline" className="text-emerald-400 border-emerald-400">Converted</Badge>
            case 'rejected': return <Badge variant="outline" className="text-red-500 border-red-500">Rejected</Badge>
            case 'countered': return <Badge variant="outline" className="text-blue-500 border-blue-500">Countered</Badge>
            case 'expired': return <Badge variant="outline" className="text-gray-500 border-gray-500">Expired</Badge>
            default: return <Badge variant="outline" className="text-gray-500 border-gray-500">{status}</Badge>
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Negotiations</h1>
                    <p className="text-gray-400 text-sm">{totalNegotiations > 0 && `(${totalNegotiations} negotiations)`}</p>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search negotiations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#161616] border-[#333] text-white placeholder:text-gray-500 focus-visible:ring-[#86efac]"
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    className="border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A]"
                >
                    Search
                </Button>
                {searchQuery && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setSearchQuery("")
                            fetchNegotiations(1, true)
                        }}
                        className="text-gray-400 hover:text-white"
                    >
                        Clear
                    </Button>
                )}
            </form>

            <Card className="bg-[#161616] border-[#333]">
                <CardHeader>
                    <CardTitle className="text-white">Active Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#86efac]" />
                        </div>
                    ) : negotiations.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No negotiations found</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-[#333] hover:bg-[#1A1A1A]">
                                    <TableHead className="text-gray-400">ID</TableHead>
                                    <TableHead className="text-gray-400">Wholesaler</TableHead>
                                    <TableHead className="text-gray-400">Product</TableHead>
                                    <TableHead className="text-gray-400 text-right">Qty</TableHead>
                                    <TableHead className="text-gray-400 text-right">Req. Price</TableHead>
                                    <TableHead className="text-gray-400 text-center">Status</TableHead>
                                    <TableHead className="text-gray-400">Approved By</TableHead>
                                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {negotiations.map((negotiation) => (
                                    <TableRow key={negotiation.id} className="border-[#333] hover:bg-[#1A1A1A]">
                                        <TableCell className="text-white font-medium">{negotiation.negotiationNumber}</TableCell>
                                        <TableCell className="text-white">{negotiation.wholesaler?.name || 'Unknown'}</TableCell>
                                        <TableCell className="text-gray-400">{negotiation.product?.name || 'Unknown'}</TableCell>
                                        <TableCell className="text-white text-right">{negotiation.requestedQuantity}</TableCell>
                                        <TableCell className="text-white text-right">₹{negotiation.requestedPricePerUnit.toLocaleString()}</TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(negotiation.status)}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-sm">
                                            {negotiation.approvedBy
                                                ? `${negotiation.approvedBy.role === 'staff' ? 'Staff' : 'Admin'} · ${negotiation.approvedBy.name}`
                                                : <span className="text-gray-600">—</span>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-white hover:bg-[#333]"
                                                onClick={() => openDetails(negotiation.id)}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="bg-[#161616] border-l-[#333] text-white w-[500px] sm:w-[560px] sm:max-w-[560px] max-w-[95vw] flex flex-col overflow-y-auto">
                    {selectedId && (
                        <NegotiationChatPanel
                            negotiationId={selectedId}
                            onChanged={() => fetchNegotiations(1, true)}
                        />
                    )}
                </SheetContent>
            </Sheet>

            {/* Load More Button */}
            {hasMore && negotiations.length > 0 && (
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
                            `Load More (${negotiations.length}/${totalNegotiations})`
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}

function NegotiationChatPanel({ negotiationId, onChanged }: { negotiationId: string; onChanged: () => void }) {
    const router = useRouter()
    const [detail, setDetail] = useState<NegotiationDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Chat message input
    const [chatMessage, setChatMessage] = useState("")
    const [isSendingMessage, setIsSendingMessage] = useState(false)

    // Counter offer state
    const [counterPrice, setCounterPrice] = useState("")
    const [counterMessage, setCounterMessage] = useState("")

    // Reject dialog
    const [isRejectOpen, setIsRejectOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState("")

    // Accept (confirm order) dialog + address form
    const [isAcceptOpen, setIsAcceptOpen] = useState(false)
    const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS)
    const [customerNote, setCustomerNote] = useState("")
    const [addressTouched, setAddressTouched] = useState(false)

    const bottomRef = useRef<HTMLDivElement | null>(null)
    const detailRequestSequence = useRef(0)
    const handledSocketRevision = useRef({ negotiationId, message: 0, reconnect: 0 })
    const handledActionAt = useRef(0)

    const currentUser = (typeof window !== 'undefined' ? getUser() : null) as { _id?: string; id?: string; name?: string } | null
    const socketUserId = currentUser?._id || currentUser?.id || ""
    const socketUsername = currentUser?.name || "Admin"

    const { isConnected, messageRevision, reconnectRevision, typingUsers, lastAction, emitTyping, emitStopTyping } = useNegotiationSocket(
        negotiationId,
        socketUserId,
        socketUsername,
        SOCKET_URL
    )

    const fetchDetail = useCallback(async (silent = false) => {
        const requestSequence = ++detailRequestSequence.current
        try {
            const res = await apiFetch(`/admin/negotiations/${negotiationId}`)
            const data = await res.json()
            if (requestSequence !== detailRequestSequence.current) return
            if (res.ok) {
                setDetail(data.data)
            } else if (!silent) {
                toast.error(data?.message || "Failed to load details")
            }
        } catch {
            if (requestSequence === detailRequestSequence.current && !silent) {
                toast.error("Failed to load details")
            }
        } finally {
            if (requestSequence === detailRequestSequence.current) setIsLoading(false)
        }
    }, [negotiationId])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true)
        setDetail(null)
        setAddress(EMPTY_ADDRESS)
        setAddressTouched(false)
        setCustomerNote("")
        setCounterPrice("")
        setCounterMessage("")
        setChatMessage("")
        fetchDetail(false)
    }, [negotiationId, fetchDetail])

    useEffect(() => {
        const handled = handledSocketRevision.current
        if (handled.negotiationId !== negotiationId) {
            handledSocketRevision.current = {
                negotiationId,
                message: messageRevision,
                reconnect: reconnectRevision,
            }
            return
        }
        if (handled.message === messageRevision && handled.reconnect === reconnectRevision) return
        if (!detail) return
        handledSocketRevision.current = {
            negotiationId,
            message: messageRevision,
            reconnect: reconnectRevision,
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDetail(true)
    }, [negotiationId, messageRevision, reconnectRevision, detail, fetchDetail])

    // Live updates from wholesaler / staff actions
    useEffect(() => {
        if (!lastAction || !detail || handledActionAt.current === lastAction.at) return
        const actionNegotiationId = (lastAction.payload as { negotiationId?: string })?.negotiationId
        if (actionNegotiationId && String(actionNegotiationId) !== negotiationId) {
            handledActionAt.current = lastAction.at
            return
        }
        handledActionAt.current = lastAction.at
        if (lastAction.kind === 'negotiation-accepted') {
            toast.success("Negotiation accepted — order confirmed")
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDetail(true)
    }, [lastAction, detail, negotiationId, fetchDetail])

    // Prefill address form once detail loads
    useEffect(() => {
        if (!detail || addressTouched) return
        const w = detail.wholesalerId
        const base = detail.lastOrderAddress
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAddress({
            fullName: base?.fullName || w?.name || "",
            phone: base?.phone || w?.phone || "",
            addressLine1: base?.addressLine1 || w?.address || w?.businessInfo?.businessAddress || "",
            addressLine2: base?.addressLine2 || w?.businessInfo?.businessName || "",
            city: base?.city || "",
            state: base?.state || "",
            pincode: base?.pincode || "",
        })
    }, [detail, addressTouched])

    // Auto-scroll chat to bottom on new entries
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [detail?.history?.length])

    async function sendChatMessage() {
        const text = chatMessage.trim()
        if (!text || isSendingMessage) return
        setIsSendingMessage(true)
        emitStopTyping()
        try {
            const res = await apiFetch(`/admin/negotiations/${negotiationId}/message`, {
                method: 'POST',
                body: JSON.stringify({ message: text }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                setChatMessage("")
                await fetchDetail()
            } else {
                toast.error(data?.message || "Failed to send message")
            }
        } catch {
            toast.error("Error sending message")
        } finally {
            setIsSendingMessage(false)
        }
    }

    async function sendCounter() {
        const price = Number(counterPrice)
        if (!price || price <= 0) {
            toast.error("Enter a valid counter price")
            return
        }
        setIsSubmitting(true)
        try {
            const res = await apiFetch(`/admin/negotiations/${negotiationId}/counter`, {
                method: 'PUT',
                body: JSON.stringify({ pricePerUnit: price, message: counterMessage || undefined }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                toast.success("Counter offer sent")
                setCounterPrice("")
                setCounterMessage("")
                await fetchDetail()
                onChanged()
            } else {
                toast.error(data?.message || "Counter failed")
            }
        } catch {
            toast.error("Error processing request")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function confirmAccept() {
        setIsSubmitting(true)
        try {
            const res = await apiFetch(`/admin/negotiations/${negotiationId}/accept`, {
                method: 'PUT',
                body: JSON.stringify({
                    message: "Accepted by admin",
                    shippingAddress: address,
                    customerNote: customerNote || undefined,
                }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                toast.success(data?.data?.orderNumber
                    ? `Order ${data.data.orderNumber} confirmed`
                    : "Negotiation accepted — order confirmed")
                setIsAcceptOpen(false)
                await fetchDetail()
                onChanged()
            } else {
                toast.error(data?.message || "Accept failed")
            }
        } catch {
            toast.error("Error processing request")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function confirmReject() {
        setIsSubmitting(true)
        try {
            const res = await apiFetch(`/admin/negotiations/${negotiationId}/reject`, {
                method: 'PUT',
                body: JSON.stringify({ reason: rejectReason || undefined }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                toast.success("Negotiation rejected")
                setIsRejectOpen(false)
                setRejectReason("")
                await fetchDetail()
                onChanged()
            } else {
                toast.error(data?.message || "Reject failed")
            }
        } catch {
            toast.error("Error processing request")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading || !detail) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#86efac]" />
            </div>
        )
    }

    const canAdminRespond =
        (detail.status === 'pending' || detail.status === 'countered') &&
        !detail.orderId
    const canAccept = canAdminRespond
    const canReject = detail.status === 'pending' || detail.status === 'countered'
    const canChat = !['rejected', 'expired'].includes(detail.status)
    const orderObj = (detail.orderId && typeof detail.orderId === 'object' ? detail.orderId : null) as { _id: string; orderNumber: string; status: string; total: number } | null
    const orderTotal = detail.finalTotalPrice ?? detail.currentTotalPrice ?? 0
    const livePrice = detail.currentPricePerUnit ?? detail.requestedPricePerUnit ?? 0
    const liveTotal = detail.currentTotalPrice ?? (detail.requestedQuantity * (detail.requestedPricePerUnit ?? 0))
    const liveByLabel = detail.currentOfferBy === 'admin' ? 'Admin' : 'Wholesaler'

    return (
        <>
            <SheetHeader>
                <SheetTitle className="text-white">Negotiation Details</SheetTitle>
                <SheetDescription className="text-gray-400">
                    {detail.negotiationNumber} · {detail.productSnapshot?.name}
                </SheetDescription>
                <SheetDescription className="text-gray-500">
                    {detail.wholesalerId?.businessInfo?.businessName || detail.wholesalerId?.name || 'Wholesaler'}
                    {detail.wholesalerId?.phone ? ` · ${detail.wholesalerId.phone}` : ''} · Qty {detail.requestedQuantity}
                </SheetDescription>
                <div className="flex items-center gap-2 pt-2 text-xs">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium capitalize ${statusColor(detail.status)}`}>
                        {detail.status}
                    </span>
                    {detail.approvedBy && (
                        <span className="text-gray-400">
                            Approved by {detail.approvedBy.role === 'staff' ? 'Staff' : 'Admin'} · {detail.approvedBy.name}
                        </span>
                    )}
                    <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium ${isConnected ? 'bg-[#86efac]/15 text-[#86efac]' : 'bg-[#222] text-gray-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-[#86efac]' : 'bg-gray-600'}`} />
                        {isConnected ? 'Live' : 'Offline'}
                    </span>
                </div>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4 mt-4 overflow-hidden">
                {/* Summary Card */}
                <div className="rounded-xl border border-[#333] bg-[#0D0D0D] p-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Original Price</span>
                            <p className="font-mono text-lg text-white">₹{detail.productSnapshot?.price}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Requested Qty</span>
                            <p className="font-mono text-lg text-white">{detail.requestedQuantity}</p>
                        </div>
                        <div>
                            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Requested Price</span>
                            <p className="font-mono text-lg text-white">₹{detail.requestedPricePerUnit}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Requested Total</span>
                            <p className="font-mono text-lg text-white">₹{(detail.requestedQuantity * detail.requestedPricePerUnit).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-[#86efac]/10 px-3 py-2">
                        <span className="text-xs font-medium text-[#86efac]">Current offer · {liveByLabel}</span>
                        <span className="font-mono text-base font-bold text-[#86efac]">₹{livePrice.toLocaleString()} <span className="text-xs font-medium text-[#86efac]/70">/unit · ₹{liveTotal.toLocaleString()}</span></span>
                    </div>
                </div>

                {/* Converted order chip */}
                {orderObj && (
                    <button
                        type="button"
                        onClick={() => router.push(`/orders?search=${encodeURIComponent(orderObj.orderNumber)}`)}
                        className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-left transition-colors hover:bg-emerald-500/20"
                    >
                        <Package className="h-5 w-5 shrink-0 text-emerald-300" />
                        <span>
                            <span className="block text-sm font-semibold text-emerald-200">Order {orderObj.orderNumber} confirmed</span>
                            <span className="block text-xs text-emerald-200/70 capitalize">
                                {orderObj.status?.replace(/_/g, ' ')} · ₹{(orderObj.total ?? orderTotal).toLocaleString()} · tap to view
                            </span>
                        </span>
                    </button>
                )}

                <Separator className="bg-[#333]" />

                {/* Live chat */}
                <div className="flex min-h-0 flex-1 flex-col">
                    <h3 className="mb-2 text-sm font-semibold text-white">Chat</h3>
                    <ScrollArea className="min-h-0 flex-1 rounded-xl border border-[#2a2a2a] bg-black/40 p-3 pr-4">
                        <div className="space-y-3">
                            {detail.history.map((entry, idx) => {
                                const isAdmin = entry.by === 'admin'
                                const actionLabel = entry.action === 'message'
                                    ? actorDisplayName(entry)
                                    : entry.action === 'requested' ? 'Requested'
                                    : entry.action === 'countered' ? `Counter · ${actorDisplayName(entry)}`
                                    : entry.action === 'accepted' ? `Accepted · ${actorDisplayName(entry)}`
                                    : entry.action === 'rejected' ? `Rejected · ${actorDisplayName(entry)}`
                                    : entry.action
                                return (
                                <div key={idx} className={`flex flex-col gap-0.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 shadow-sm ${isAdmin ? 'rounded-2xl rounded-br-md bg-[#86efac] text-black' : 'rounded-2xl rounded-bl-md bg-[#262626] text-white'}`}>
                                        <div className="mb-0.5 flex items-center justify-between gap-3">
                                            <span className={`text-[11px] font-bold uppercase tracking-wide ${isAdmin ? 'text-black/60' : 'text-[#86efac]'}`}>
                                                {actionLabel}
                                            </span>
                                            {entry.pricePerUnit != null && <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${isAdmin ? 'bg-black/15 text-black' : 'bg-[#86efac]/15 text-[#86efac]'}`}>₹{entry.pricePerUnit}</span>}
                                        </div>
                                        {entry.message && <p className="whitespace-pre-wrap text-sm leading-snug">{entry.message}</p>}
                                        <span className={`mt-1 block text-right text-[10px] ${isAdmin ? 'text-black/50' : 'text-gray-500'}`}>
                                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                </div>
                                )
                            })}
                            <div ref={bottomRef} />
                        </div>
                    </ScrollArea>
                    {typingUsers.length > 0 && (
                        <p className="pt-1 text-xs italic text-gray-500">Wholesaler is typing…</p>
                    )}

                    {/* Message composer */}
                    {canChat ? (
                        <div className="flex gap-2 pt-2">
                            <Input
                                placeholder="Type a message… (max 280)"
                                maxLength={280}
                                className="bg-black border-[#333] h-10 flex-1 text-white"
                                value={chatMessage}
                                onChange={(e) => {
                                    setChatMessage(e.target.value)
                                    if (e.target.value.trim()) emitTyping()
                                    else emitStopTyping()
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        sendChatMessage()
                                    }
                                }}
                            />
                            <Button
                                size="sm"
                                className="bg-[#86efac] hover:bg-[#86efac]/90 text-black h-10 px-4"
                                disabled={!chatMessage.trim() || isSendingMessage}
                                onClick={sendChatMessage}
                            >
                                {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                    ) : (
                        <p className="pt-2 text-center text-xs text-gray-600">This negotiation is closed.</p>
                    )}
                </div>

                {/* Actions */}
                <div className="space-y-3 border-t border-[#333] pt-3">
                    {canAdminRespond && (
                        <div className="space-y-2 rounded-xl border border-[#333] bg-[#0D0D0D] p-3">
                            <Label className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Counter Offer</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="₹ per unit"
                                    className="h-9 w-32 border-[#333] bg-black text-white"
                                    value={counterPrice}
                                    onChange={(e) => setCounterPrice(e.target.value)}
                                />
                                <Input
                                    placeholder="Message (optional)"
                                    className="h-9 flex-1 border-[#333] bg-black text-white"
                                    value={counterMessage}
                                    onChange={(e) => setCounterMessage(e.target.value)}
                                />
                                <Button
                                    size="sm"
                                    className="bg-[#86efac] hover:bg-[#86efac]/90 text-black"
                                    disabled={!counterPrice || isSubmitting}
                                    onClick={sendCounter}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {canAccept && (
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                            disabled={isSubmitting}
                            onClick={() => setIsAcceptOpen(true)}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Accept Deal · ₹{liveTotal.toLocaleString()}
                        </Button>
                    )}

                    {canReject && (
                        <Button
                            variant="outline"
                            className="w-full border-[#444] bg-transparent text-gray-400 hover:bg-red-600/10 hover:text-red-400 hover:border-red-600/40"
                            disabled={isSubmitting}
                            onClick={() => setIsRejectOpen(true)}
                        >
                            <X className="mr-2 h-4 w-4" /> Reject
                        </Button>
                    )}
                </div>
            </div>

            {/* Reject dialog */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent className="border-[#333] bg-[#161616] text-white">
                    <DialogHeader>
                        <DialogTitle>Reject negotiation?</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            The wholesaler will be notified with your reason.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Rejection reason (optional)"
                        className="bg-black border-[#333] text-white"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="ghost" className="text-gray-300" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700" disabled={isSubmitting} onClick={confirmReject}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Accept / confirm-order dialog with address */}
            <Dialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
                <DialogContent className="border-[#333] bg-[#161616] text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Accept &amp; confirm order</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {detail.requestedQuantity} × ₹{(detail.currentPricePerUnit ?? 0).toLocaleString()} = ₹{orderTotal.toLocaleString()}.
                            This creates a pending-payment order in the wholesaler&apos;s history.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-1">
                            <Label className="text-xs text-gray-400">Full name *</Label>
                            <Input className="bg-black border-[#333] h-9 mt-1" value={address.fullName} onChange={(e) => { setAddressTouched(true); setAddress({ ...address, fullName: e.target.value }) }} />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-xs text-gray-400">Phone *</Label>
                            <Input className="bg-black border-[#333] h-9 mt-1" value={address.phone} onChange={(e) => { setAddressTouched(true); setAddress({ ...address, phone: e.target.value }) }} />
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs text-gray-400">Address line 1 *</Label>
                            <Input className="bg-black border-[#333] h-9 mt-1" value={address.addressLine1} onChange={(e) => { setAddressTouched(true); setAddress({ ...address, addressLine1: e.target.value }) }} />
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs text-gray-400">Address line 2</Label>
                            <Input className="bg-black border-[#333] h-9 mt-1" value={address.addressLine2 || ''} onChange={(e) => { setAddressTouched(true); setAddress({ ...address, addressLine2: e.target.value }) }} />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-xs text-gray-400">City *</Label>
                            <Input className="bg-black border-[#333] h-9 mt-1" value={address.city} onChange={(e) => { setAddressTouched(true); setAddress({ ...address, city: e.target.value }) }} />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-xs text-gray-400">State *</Label>
                            <Input className="bg-black border-[#333] h-9 mt-1" value={address.state} onChange={(e) => { setAddressTouched(true); setAddress({ ...address, state: e.target.value }) }} />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-xs text-gray-400">Pincode *</Label>
                            <Input className="bg-black border-[#333] h-9 mt-1" value={address.pincode} onChange={(e) => { setAddressTouched(true); setAddress({ ...address, pincode: e.target.value }) }} />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-xs text-gray-400">Note for order</Label>
                            <Input className="bg-black border-[#333] h-9 mt-1" value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="text-gray-300" onClick={() => setIsAcceptOpen(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" disabled={isSubmitting} onClick={confirmAccept}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Accept · ₹${orderTotal.toLocaleString()}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function statusColor(status: string): string {
    switch (status) {
        case 'pending': return 'text-yellow-500 border-yellow-500'
        case 'accepted': return 'text-green-500 border-green-500'
        case 'converted': return 'text-emerald-400 border-emerald-400'
        case 'rejected': return 'text-red-500 border-red-500'
        case 'countered': return 'text-blue-500 border-blue-500'
        case 'expired': return 'text-gray-500 border-gray-500'
        default: return 'text-gray-500 border-gray-500'
    }
}
