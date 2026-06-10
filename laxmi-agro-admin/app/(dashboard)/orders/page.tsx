"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, Truck, CheckCircle2, XCircle, Package, MapPin, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api"

interface Order {
    _id: string
    orderNumber: string
    items: { productSnapshot: { name: string }; quantity: number; pricePerUnit: number }[]
    customerSnapshot: { name: string; email: string; phone: string }
    total: number
    status: string
    createdAt: string
    trackingNumber?: string
    courierName?: string
    shippingAddress?: { address: string; city: string; state: string; pincode: string }
    statusHistory?: { status: string; note?: string; timestamp: string }[]
    payment?: {
        _id: string
        amount: number
        method?: string
        upiId: string
        screenshotUrl: string
        status: string
    }
}

function formatStatusLabel(status: string) {
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function OrdersPage() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isdetailsOpen, setIsDetailsOpen] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [isShipDialogOpen, setIsShipDialogOpen] = useState(false)
    const [trackingNumber, setTrackingNumber] = useState("")
    const [courierName, setCourierName] = useState("")
    const [isShipping, setIsShipping] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalOrders, setTotalOrders] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const filteredUserId = searchParams.get("userId")?.trim() || ""
    const filteredCustomerName = searchParams.get("customerName")?.trim() || ""
    const searchFromUrl = searchParams.get("search")?.trim() || ""

    useEffect(() => {
        setSearchQuery(searchFromUrl)
        void fetchOrders(1, true, searchFromUrl)
    }, [filteredUserId, searchFromUrl])

    async function fetchOrders(
        pageNum: number = 1,
        reset: boolean = false,
        searchOverride?: string
    ) {
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
            if (filteredUserId) {
                params.append("userId", filteredUserId)
            }
            const effectiveSearch = typeof searchOverride === "string" ? searchOverride : searchQuery
            if (effectiveSearch.trim()) {
                params.append("search", effectiveSearch.trim())
            }

            const res = await apiFetch(`/admin/orders?${params.toString()}`)
            const data = await res.json()
            if (res.ok) {
                const items = data.data || []
                const pagination = data.pagination || {}

                if (reset || pageNum === 1) {
                    setOrders(items)
                } else {
                    setOrders((prev) => [...prev, ...items])
                }

                setTotalOrders(pagination.total || items.length)
                setHasMore((pagination.page || 1) < (pagination.totalPages || 1))
            } else {
                toast.error("Failed to fetch orders")
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
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery.trim()) {
            params.set("search", searchQuery.trim())
        } else {
            params.delete("search")
        }
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname)
    }, [pathname, router, searchParams, searchQuery])

    const loadMore = useCallback(() => {
        if (hasMore && !isLoadingMore) {
            const nextPage = page + 1
            setPage(nextPage)
            void fetchOrders(nextPage, false, searchFromUrl)
        }
    }, [hasMore, isLoadingMore, page, searchFromUrl])

    async function fetchOrderDetails(id: string) {
        try {
            const res = await apiFetch(`/admin/orders/${id}`)
            const data = await res.json()
            if (res.ok) {
                setSelectedOrder(data.data)
                setIsDetailsOpen(true)
            }
        } catch {
            toast.error("Failed to load details")
        }
    }

    async function handleVerifyPayment(paymentId: string) {
        if (!confirm("Are you sure you want to verify this payment?")) return
        setIsVerifying(true)
        try {
            const res = await apiFetch(`/admin/payments/${paymentId}/verify`, {
                method: "PUT",
            })
            if (res.ok) {
                toast.success("Payment verified successfully")
                setIsDetailsOpen(false)
                void fetchOrders(1, true, searchFromUrl)
            } else {
                const data = await res.json()
                toast.error(data.message || "Verification failed")
            }
        } catch {
            toast.error("Error processing request")
        } finally {
            setIsVerifying(false)
        }
    }

    async function handleRejectPayment(paymentId: string) {
        const reason = prompt("Enter rejection reason:")
        if (!reason) return
        setIsRejecting(true)
        try {
            const res = await apiFetch(`/admin/payments/${paymentId}/reject`, {
                method: "PUT",
                body: JSON.stringify({ reason })
            })
            if (res.ok) {
                toast.success("Payment rejected")
                setIsDetailsOpen(false)
                void fetchOrders(1, true, searchFromUrl)
            } else {
                const data = await res.json()
                toast.error(data.message || "Rejection failed")
            }
        } catch {
            toast.error("Error processing request")
        } finally {
            setIsRejecting(false)
        }
    }

    async function updateOrderStatus(orderId: string, status: string, note?: string) {
        setIsUpdatingStatus(true)
        try {
            const res = await apiFetch(`/admin/orders/${orderId}/status`, {
                method: "PUT",
                body: JSON.stringify({ status, note })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(`Order ${status.replace(/_/g, " ")}`)
                setIsDetailsOpen(false)
                void fetchOrders(1, true, searchFromUrl)
            } else {
                toast.error(data.message || "Failed to update status")
            }
        } catch {
            toast.error("Error updating order status")
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    async function handleMarkPaymentCompleted(orderId: string) {
        if (!confirm("Mark this order payment as completed in office?")) return
        setIsUpdatingStatus(true)
        try {
            const res = await apiFetch(`/admin/orders/${orderId}/mark-payment-complete`, {
                method: "PUT",
            })
            const data = await res.json()
            if (res.ok) {
                toast.success("Payment marked completed")
                await fetchOrders(1, true)
                await fetchOrderDetails(orderId)
            } else {
                toast.error(data.message || "Failed to mark payment completed")
            }
        } catch {
            toast.error("Error marking payment completed")
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    async function shipOrder(orderId: string) {
        if (!trackingNumber.trim() || !courierName.trim()) {
            toast.error("Please enter tracking number and courier name")
            return
        }
        setIsShipping(true)
        try {
            const res = await apiFetch(`/admin/orders/${orderId}/ship`, {
                method: "PUT",
                body: JSON.stringify({ trackingNumber: trackingNumber.trim(), courierName: courierName.trim() })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success("Order shipped!")
                setIsShipDialogOpen(false)
                setIsDetailsOpen(false)
                setTrackingNumber("")
                setCourierName("")
                void fetchOrders(1, true, searchFromUrl)
            } else {
                toast.error(data.message || "Failed to ship order")
            }
        } catch {
            toast.error("Error shipping order")
        } finally {
            setIsShipping(false)
        }
    }

    function canDeleteOrder(order: Order) {
        return order.status === "cancelled" || order.payment?.status === "rejected"
    }

    async function deleteOrder(order: Order) {
        const confirmed = window.confirm(
            `Delete ${order.orderNumber}? This will permanently remove the order and its linked payment and stock-log history.`
        )
        if (!confirmed) return

        setIsDeleting(true)
        try {
            const res = await apiFetch(`/admin/orders/${order._id}`, {
                method: "DELETE",
            })
            const data = await res.json()

            if (res.ok) {
                toast.success("Order deleted successfully")
                setIsDetailsOpen(false)
                setSelectedOrder(null)
                void fetchOrders(1, true, searchFromUrl)
            } else {
                toast.error(data.message || "Failed to delete order")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error deleting order")
        } finally {
            setIsDeleting(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "delivered": return "text-green-500 bg-green-500/10"
            case "payment_verified": return "text-green-500 bg-green-500/10"
            case "payment_uploaded": return "text-blue-500 bg-blue-500/10"
            case "processing": return "text-blue-500 bg-blue-500/10"
            case "shipped": return "text-purple-500 bg-purple-500/10"
            case "pending_payment": return "text-yellow-500 bg-yellow-500/10"
            default: return "text-gray-500 bg-gray-500/10"
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Orders</h1>
                    <p className="text-sm text-gray-400">{totalOrders > 0 && `(${totalOrders} orders)`}</p>
                </div>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-md sm:flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by order number, customer name, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#161616] border-[#333] pl-10 text-white placeholder:text-gray-500 focus-visible:ring-[#86efac]"
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
                            const params = new URLSearchParams(searchParams.toString())
                            params.delete("search")
                            const query = params.toString()
                            router.replace(query ? `${pathname}?${query}` : pathname)
                        }}
                        className="w-full text-gray-400 hover:text-white sm:w-auto"
                    >
                        Clear
                    </Button>
                )}
            </form>

            {filteredUserId && (
                <div className="flex flex-col gap-3 rounded-xl border border-[#2f4f3a] bg-[#0D0D0D] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-white">
                            Viewing order history for {filteredCustomerName || "selected shop"}
                        </div>
                        <div className="text-xs text-gray-400">
                            Only orders for this wholesaler are shown.
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-[#333] bg-transparent text-white hover:bg-[#1A1A1A] sm:w-auto"
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString())
                            params.delete("userId")
                            params.delete("customerName")
                            const query = params.toString()
                            router.replace(query ? `${pathname}?${query}` : pathname)
                        }}
                    >
                        Clear Shop Filter
                    </Button>
                </div>
            )}

            <Card className="bg-[#161616] border-[#333]">
                <CardHeader>
                    <CardTitle className="text-white">All Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#86efac]" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="py-10 text-center text-gray-500">No orders found</div>
                    ) : (
                        <>
                            <div className="space-y-3 md:hidden">
                                {orders.map((order) => {
                                    const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
                                    const leadItem = order.items[0]?.productSnapshot?.name || "Product"

                                    return (
                                        <div key={order._id} className="rounded-2xl border border-[#333] bg-[#0D0D0D] p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{order.orderNumber}</div>
                                                    <div className="mt-1 text-xs text-gray-400">
                                                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                                                    </div>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${getStatusColor(order.status)}`}>
                                                    {formatStatusLabel(order.status)}
                                                </span>
                                            </div>

                                            <div className="mt-4 space-y-2 text-sm">
                                                <div className="text-white">{order.customerSnapshot?.name || "-"}</div>
                                                <div className="text-xs text-gray-400">{order.customerSnapshot?.phone || "-"}</div>
                                                <div className="text-xs text-gray-400">
                                                    {totalItems} items, starting with {leadItem}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-xs uppercase tracking-wide text-gray-500">Order Total</div>
                                                    <div className="text-base font-bold text-white">Rs {order.total.toLocaleString("en-IN")}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-[#333] bg-transparent text-white hover:bg-[#1A1A1A]"
                                                        onClick={() => fetchOrderDetails(order._id)}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </Button>
                                                    {canDeleteOrder(order) && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => void deleteOrder(order)}
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-[#333] hover:bg-[#1A1A1A]">
                                            <TableHead className="text-gray-400">Order #</TableHead>
                                            <TableHead className="text-gray-400">Customer</TableHead>
                                            <TableHead className="text-gray-400">Items</TableHead>
                                            <TableHead className="text-gray-400 text-right">Total</TableHead>
                                            <TableHead className="text-gray-400 text-center">Status</TableHead>
                                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map((order) => (
                                            <TableRow key={order._id} className="border-[#333] hover:bg-[#1A1A1A]">
                                                <TableCell className="font-medium text-white">{order.orderNumber}</TableCell>
                                                <TableCell className="font-medium text-white">{order.customerSnapshot?.name}</TableCell>
                                                <TableCell className="text-xs text-gray-400">
                                                    {order.items.length} items ({order.items[0]?.productSnapshot?.name}...)
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-white">Rs {order.total.toLocaleString("en-IN")}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`rounded-full px-2 py-1 text-xs font-medium uppercase ${getStatusColor(order.status)}`}>
                                                        {order.status.replace(/_/g, " ")}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-white hover:bg-[#333]"
                                                            onClick={() => fetchOrderDetails(order._id)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {canDeleteOrder(order) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                                onClick={() => void deleteOrder(order)}
                                                                disabled={isDeleting}
                                                            >
                                                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isdetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-h-[85vh] max-w-[95vw] border-[#333] bg-[#161616] text-white sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Order Details: {selectedOrder?.orderNumber}</DialogTitle>
                        <DialogDescription>
                            Customer: {selectedOrder?.customerSnapshot?.name} | {selectedOrder?.customerSnapshot?.phone}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6 overflow-y-auto pr-1 sm:pr-2">
                            <div className="rounded-lg border border-[#333] bg-[#0D0D0D] p-4">
                                <h3 className="mb-2 flex items-center gap-2 font-medium">
                                    Payment Information
                                    {selectedOrder.status === "payment_verified" && (
                                        <div className="flex items-center gap-1 text-xs text-green-500">
                                            <CheckCircle2 className="h-3 w-3" /> Verified
                                        </div>
                                    )}
                                </h3>

                                {selectedOrder.payment ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                            <div>
                                                <span className="block text-gray-400">Amount</span>
                                                <span>Rs {selectedOrder.payment.amount}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-400">Method</span>
                                                <span>{selectedOrder.payment.method ? selectedOrder.payment.method.replace(/_/g, " ") : (selectedOrder.payment.upiId || "Manual")}</span>
                                            </div>
                                        </div>

                                        {selectedOrder.payment.screenshotUrl && (
                                            <div>
                                                <span className="mb-2 block text-sm text-gray-400">Payment Screenshot</span>
                                                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-[#333]">
                                                    <img
                                                        src={selectedOrder.payment.screenshotUrl}
                                                        alt="Payment Proof"
                                                        className="h-full w-full object-contain bg-black/50"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {selectedOrder.status === "payment_uploaded" && (
                                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                                                <Button
                                                    className="w-full bg-green-500 text-white hover:bg-green-600"
                                                    onClick={() => selectedOrder.payment && handleVerifyPayment(selectedOrder.payment._id)}
                                                    disabled={isVerifying}
                                                >
                                                    {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Verify Payment
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="w-full"
                                                    onClick={() => selectedOrder.payment && handleRejectPayment(selectedOrder.payment._id)}
                                                    disabled={isRejecting}
                                                >
                                                    {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Reject
                                                </Button>
                                            </div>
                                        )}

                                        {selectedOrder.status === "pending_payment" && (
                                            <Button
                                                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                                                onClick={() => handleMarkPaymentCompleted(selectedOrder._id)}
                                                disabled={isUpdatingStatus}
                                            >
                                                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Payment Completed
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="text-sm text-yellow-500">No payment information uploaded yet.</div>
                                        {selectedOrder.status === "pending_payment" && (
                                            <Button
                                                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                                                onClick={() => handleMarkPaymentCompleted(selectedOrder._id)}
                                                disabled={isUpdatingStatus}
                                            >
                                                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Payment Completed
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {selectedOrder.shippingAddress && (
                                <div className="rounded-lg border border-[#333] bg-[#0D0D0D] p-4">
                                    <h3 className="mb-3 flex items-center gap-2 font-medium">
                                        <MapPin className="h-4 w-4" /> Shipping Address
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                        <div>
                                            <span className="block text-gray-400">Address</span>
                                            <span>{selectedOrder.shippingAddress.address}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400">City</span>
                                            <span>{selectedOrder.shippingAddress.city}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400">State</span>
                                            <span>{selectedOrder.shippingAddress.state}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400">Pincode</span>
                                            <span>{selectedOrder.shippingAddress.pincode}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg border border-[#333] bg-[#0D0D0D] p-4">
                                <h3 className="mb-3 flex items-center gap-2 font-medium">
                                    <Package className="h-4 w-4" /> Ordered Items
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex items-start justify-between gap-4 border-b border-[#222] pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <p className="text-sm font-medium">{item.productSnapshot?.name || "Product"}</p>
                                                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-semibold">Rs {(item.pricePerUnit * item.quantity).toLocaleString("en-IN")}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-[#222] pt-3 text-sm">
                                    <span className="text-gray-400">Grand Total</span>
                                    <span className="text-lg font-bold text-white">Rs {selectedOrder.total.toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                                <div className="rounded-lg border border-[#333] bg-[#0D0D0D] p-4">
                                    <h3 className="mb-3 font-medium">Status Timeline</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.statusHistory.map((entry, idx) => (
                                            <div key={idx} className="border-l-2 border-[#86efac] pl-3">
                                                <div className="text-sm font-medium">{formatStatusLabel(entry.status)}</div>
                                                <div className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString("en-IN")}</div>
                                                {entry.note ? <div className="mt-1 text-xs text-gray-300">{entry.note}</div> : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                {canDeleteOrder(selectedOrder) && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => void deleteOrder(selectedOrder)}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete History
                                    </Button>
                                )}

                                {selectedOrder.status === "payment_verified" && (
                                    <Button
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                        onClick={() => updateOrderStatus(selectedOrder._id, "processing")}
                                        disabled={isUpdatingStatus}
                                    >
                                        {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Start Processing
                                    </Button>
                                )}

                                {selectedOrder.status === "processing" && (
                                    <Button
                                        className="bg-purple-600 text-white hover:bg-purple-700"
                                        onClick={() => setIsShipDialogOpen(true)}
                                        disabled={isUpdatingStatus}
                                    >
                                        <Truck className="mr-2 h-4 w-4" />
                                        Ship Order
                                    </Button>
                                )}

                                {selectedOrder.status === "shipped" && (
                                    <Button
                                        className="bg-green-600 text-white hover:bg-green-700"
                                        onClick={() => updateOrderStatus(selectedOrder._id, "delivered")}
                                        disabled={isUpdatingStatus}
                                    >
                                        {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Mark Delivered
                                    </Button>
                                )}

                                {!["delivered", "cancelled"].includes(selectedOrder.status) && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            const note = prompt("Reason for cancellation (optional):") || undefined
                                            void updateOrderStatus(selectedOrder._id, "cancelled", note)
                                        }}
                                        disabled={isUpdatingStatus}
                                    >
                                        {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel Order
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isShipDialogOpen} onOpenChange={setIsShipDialogOpen}>
                <DialogContent className="max-w-[95vw] border-[#333] bg-[#161616] text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ship Order</DialogTitle>
                        <DialogDescription>
                            Enter courier details for {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 text-sm text-gray-400">Tracking Number</div>
                            <Input
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number"
                                className="bg-[#0D0D0D] border-[#333] text-white"
                            />
                        </div>
                        <div>
                            <div className="mb-2 text-sm text-gray-400">Courier Name</div>
                            <Input
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                                placeholder="Enter courier name"
                                className="bg-[#0D0D0D] border-[#333] text-white"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-3 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-[#333] bg-transparent text-white hover:bg-[#1A1A1A]"
                            onClick={() => setIsShipDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-[#86efac] text-black hover:bg-[#74db98]"
                            onClick={() => selectedOrder && shipOrder(selectedOrder._id)}
                            disabled={isShipping}
                        >
                            {isShipping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Shipment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {hasMore && orders.length > 0 && (
                <div className="flex justify-center pt-2">
                    <Button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        className="w-full border-[#333] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A] sm:min-w-[200px] sm:w-auto"
                    >
                        {isLoadingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</> : `Load More (${orders.length}/${totalOrders})`}
                    </Button>
                </div>
            )}
        </div>
    )
}
