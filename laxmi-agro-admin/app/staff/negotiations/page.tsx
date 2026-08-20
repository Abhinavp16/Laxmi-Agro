"use client"

import { FormEvent, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Loader2, MessageSquare, Search, Send } from "@/components/hugeicons"

type StatusFilter = "all" | "pending" | "accepted" | "rejected" | "expired"

type NegotiationHistory = {
  action: string
  by: "wholesaler" | "admin"
  pricePerUnit?: number
  totalPrice?: number
  message?: string
  timestamp: string
}

type Negotiation = {
  _id: string
  negotiationNumber: string
  productSnapshot?: { name?: string; sku?: string; price?: number }
  wholesalerId?: { name?: string; email?: string; businessInfo?: { businessName?: string } }
  requestedQuantity: number
  requestedPricePerUnit: number
  currentPricePerUnit: number
  currentTotalPrice?: number
  currentOfferBy?: "wholesaler" | "admin"
  status: string
  isExpired: boolean
  staffMinPrice: number | null
  expiresAt?: string
  history?: NegotiationHistory[]
}

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
]

function formatCurrency(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`
}

function displayStatus(item: Pick<Negotiation, "status" | "isExpired">) {
  return item.isExpired ? "expired" : item.status
}

function getStatusBadge(item: Pick<Negotiation, "status" | "isExpired">) {
  const status = displayStatus(item)
  const classes = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
    expired: "border-slate-200 bg-slate-100 text-slate-600",
    countered: "border-blue-200 bg-blue-50 text-blue-700",
  }[status] || "border-slate-200 bg-slate-100 text-slate-600"

  return <Badge variant="outline" className={`capitalize ${classes}`}>{status}</Badge>
}

function getReadOnlyReason(item: Negotiation) {
  if (item.isExpired) return "This negotiation has expired. Only a full admin can continue it."
  if (item.status !== "pending") return `This negotiation is ${item.status}. It is available to review only.`
  if (item.currentOfferBy !== "wholesaler") return "Waiting for the wholesaler to respond to the latest counter-offer."
  if (item.staffMinPrice === null) return "A full admin must set a minimum member price for this product before a member can act."
  return null
}

export default function StaffNegotiationsPage() {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selected, setSelected] = useState<Negotiation | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [totalNegotiations, setTotalNegotiations] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [counterPrice, setCounterPrice] = useState("")
  const [counterMessage, setCounterMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function fetchNegotiations(pageNumber = 1, reset = false, searchOverride?: string, statusOverride?: StatusFilter) {
    if (reset) setIsLoading(true)
    else setIsLoadingMore(true)

    const activeSearch = typeof searchOverride === "string" ? searchOverride : searchQuery
    const activeStatus = statusOverride || statusFilter

    try {
      const params = new URLSearchParams({ page: String(pageNumber), limit: "20" })
      if (activeSearch.trim()) params.set("search", activeSearch.trim())
      if (activeStatus !== "all") params.set("status", activeStatus)

      const response = await apiFetch(`/staff/negotiations?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to fetch negotiations")

      const items = data.data || []
      const pagination = data.pagination || {}
      setNegotiations((previous) => reset || pageNumber === 1 ? items : [...previous, ...items])
      setPage(pageNumber)
      setTotalNegotiations(pagination.total || items.length)
      setHasMore((pagination.page || 1) < (pagination.totalPages || 1))
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch negotiations")
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // The first request intentionally uses the initial search and filter state only.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void fetchNegotiations(1, true) }, [])

  async function openNegotiation(id: string) {
    try {
      const response = await apiFetch(`/staff/negotiations/${id}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to load negotiation details")

      const negotiation = data.data as Negotiation
      setSelected(negotiation)
      setCounterPrice(String(Math.max(Number(negotiation.currentPricePerUnit || 0), Number(negotiation.staffMinPrice || 0))))
      setCounterMessage("")
      setIsSheetOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to load negotiation details")
    }
  }

  async function handleAccept() {
    if (!selected) return
    if (!window.confirm(`Accept ${formatCurrency(selected.currentPricePerUnit)} per unit for ${selected.negotiationNumber}?`)) return

    setIsSubmitting(true)
    try {
      const response = await apiFetch(`/staff/negotiations/${selected._id}/accept`, { method: "PUT" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Unable to accept negotiation")
      toast.success("Negotiation accepted")
      setIsSheetOpen(false)
      await fetchNegotiations(1, true)
    } catch (error: any) {
      toast.error(error.message || "Unable to accept negotiation")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCounter() {
    if (!selected) return
    const pricePerUnit = Number(counterPrice)
    const minimum = selected.staffMinPrice

    if (minimum === null || !Number.isFinite(pricePerUnit) || pricePerUnit < minimum) {
      toast.error(`Enter a counter price of at least ${formatCurrency(minimum || 0)} per unit`)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiFetch(`/staff/negotiations/${selected._id}/counter`, {
        method: "PUT",
        body: JSON.stringify({ pricePerUnit, message: counterMessage.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Unable to send counter-offer")
      toast.success("Counter-offer sent")
      setIsSheetOpen(false)
      await fetchNegotiations(1, true)
    } catch (error: any) {
      toast.error(error.message || "Unable to send counter-offer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const readOnlyReason = selected ? getReadOnlyReason(selected) : null
  const canCounter = Boolean(selected && !readOnlyReason)
  const currentOfferMeetsMinimum = Boolean(selected && selected.staffMinPrice !== null && Number(selected.currentPricePerUnit) >= selected.staffMinPrice)
  const counterIsValid = Boolean(selected && selected.staffMinPrice !== null && counterPrice.trim() && Number.isFinite(Number(counterPrice)) && Number(counterPrice) >= selected.staffMinPrice)

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    void fetchNegotiations(1, true)
  }

  return <div className="flex flex-col gap-6"><div><h1 className="text-3xl font-bold tracking-tight text-slate-900">Negotiations</h1><p className="mt-1 text-sm text-slate-500">{totalNegotiations > 0 ? `${totalNegotiations} negotiations` : "Review wholesaler offers within the price limits set by full admins."}</p></div><form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search negotiation or product..." className="h-10 border-[#d8dfca] bg-white pl-10 text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#86efac]" /></div><select aria-label="Filter negotiations by status" value={statusFilter} onChange={(event) => { const value = event.target.value as StatusFilter; setStatusFilter(value); void fetchNegotiations(1, true, undefined, value) }} className="h-10 rounded-md border border-[#d8dfca] bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#86efac]">{statusFilters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}</select><Button type="submit" variant="outline" className="h-10 border-[#d8dfca] bg-white text-slate-700 hover:bg-[#f5f8ec]">Search</Button>{searchQuery && <Button type="button" variant="ghost" className="h-10 text-slate-500" onClick={() => { setSearchQuery(""); void fetchNegotiations(1, true, "") }}>Clear</Button>}</form><Card className="overflow-hidden border-[#e2e8d5] bg-white shadow-sm"><CardHeader className="border-b border-[#edf0e7] px-5 py-4"><CardTitle className="text-sm font-bold text-slate-800">All Negotiations</CardTitle></CardHeader><CardContent className="p-0">{isLoading ? <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div> : negotiations.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">No negotiations found</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-[#edf0e7] hover:bg-transparent"><TableHead className="px-5 text-[11px] font-semibold text-slate-500">ID</TableHead><TableHead className="text-[11px] font-semibold text-slate-500">Wholesaler</TableHead><TableHead className="text-[11px] font-semibold text-slate-500">Product</TableHead><TableHead className="text-right text-[11px] font-semibold text-slate-500">Qty</TableHead><TableHead className="text-right text-[11px] font-semibold text-slate-500">Request Price</TableHead><TableHead className="text-center text-[11px] font-semibold text-slate-500">Status</TableHead><TableHead className="px-5 text-right text-[11px] font-semibold text-slate-500">Actions</TableHead></TableRow></TableHeader><TableBody>{negotiations.map((item) => <TableRow key={item._id} className="border-[#edf0e7] hover:bg-[#f7f9f1]"><TableCell className="px-5 py-3 text-xs font-semibold text-slate-800">{item.negotiationNumber}</TableCell><TableCell className="py-3 text-xs font-medium text-slate-700">{item.wholesalerId?.businessInfo?.businessName || item.wholesalerId?.name || "Unknown"}</TableCell><TableCell className="py-3 text-xs text-slate-600">{item.productSnapshot?.name || "Unknown product"}</TableCell><TableCell className="py-3 text-right text-xs text-slate-700">{item.requestedQuantity}</TableCell><TableCell className="py-3 text-right text-xs font-semibold text-slate-800">{formatCurrency(item.requestedPricePerUnit)}</TableCell><TableCell className="py-3 text-center">{getStatusBadge(item)}</TableCell><TableCell className="px-5 py-3 text-right"><Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0 text-slate-600 hover:bg-[#eef2e5]" onClick={() => void openNegotiation(item._id)}><MessageSquare className="h-3.5 w-3.5" /><span className="sr-only">Open {item.negotiationNumber}</span></Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>{hasMore && <div className="flex justify-center"><Button variant="outline" className="border-[#d8dfca] bg-white" disabled={isLoadingMore} onClick={() => void fetchNegotiations(page + 1)}>{isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Load more negotiations</Button></div>}<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><SheetContent className="flex w-full flex-col border-l-[#dfe6d1] bg-white text-slate-800 sm:max-w-xl"><SheetHeader><SheetTitle>Negotiation Details</SheetTitle><SheetDescription>{selected?.negotiationNumber} · {selected?.productSnapshot?.name}</SheetDescription></SheetHeader>{selected && <div className="mt-6 flex min-h-0 flex-1 flex-col gap-5"><div className="grid grid-cols-2 gap-4 rounded-lg border border-[#e3e9d8] bg-[#fcfdf9] p-4"><div><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Original price</span><p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(selected.productSnapshot?.price)}</p></div><div><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Requested quantity</span><p className="mt-1 text-base font-semibold text-slate-900">{selected.requestedQuantity}</p></div><div><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Wholesaler offer</span><p className="mt-1 text-base font-semibold text-amber-700">{formatCurrency(selected.currentPricePerUnit)} / unit</p></div><div><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Current total</span><p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(selected.currentTotalPrice || selected.requestedQuantity * selected.currentPricePerUnit)}</p></div></div><div className="flex items-center justify-between gap-3 rounded-lg border border-[#e3e9d8] bg-[#f7f9f1] px-3 py-2"><span className="text-xs font-medium text-slate-600">Member minimum price</span><span className="text-sm font-bold text-slate-900">{selected.staffMinPrice === null ? "Not configured" : `${formatCurrency(selected.staffMinPrice)} / unit`}</span></div>{selected.isExpired && <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Expired negotiations are read-only for members. A full admin may continue this negotiation.</p>}<Separator className="bg-[#e3e9d8]" /><div className="flex min-h-0 flex-1 flex-col"><h3 className="mb-3 text-sm font-semibold text-slate-800">Conversation History</h3><ScrollArea className="min-h-[180px] flex-1 pr-3"><div className="space-y-4">{selected.history?.length ? selected.history.map((entry, index) => <div key={`${entry.timestamp}-${index}`} className={`flex flex-col gap-1 ${entry.by === "admin" ? "items-end" : "items-start"}`}><div className={`max-w-[85%] rounded-lg p-3 ${entry.by === "admin" ? "bg-emerald-100 text-emerald-950" : "bg-slate-100 text-slate-800"}`}><div className="mb-1 flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-wide opacity-70"><span>{entry.action}</span>{entry.pricePerUnit !== undefined && <span>{formatCurrency(entry.pricePerUnit)}</span>}</div>{entry.message && <p className="text-sm">{entry.message}</p>}</div><span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString("en-IN")}</span></div>) : <p className="py-8 text-center text-sm text-slate-500">No conversation history is available.</p>}</div></ScrollArea></div><div className="space-y-3 border-t border-[#e3e9d8] pt-4">{readOnlyReason ? <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{readOnlyReason}</div> : <><div className="rounded-lg border border-[#e3e9d8] bg-[#fcfdf9] p-3"><Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Counter offer</Label><p className="mt-1 text-xs text-slate-500">Minimum allowed: {formatCurrency(selected.staffMinPrice || 0)} per unit</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input type="number" min={selected.staffMinPrice ?? 0} step="0.01" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)} placeholder="Price per unit" className="border-[#d8dfca] bg-white" /><Input value={counterMessage} onChange={(event) => setCounterMessage(event.target.value)} placeholder="Message (optional)" maxLength={500} className="border-[#d8dfca] bg-white" /><Button size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={!counterIsValid || isSubmitting} onClick={() => void handleCounter()}><Send className="h-4 w-4" /><span className="sr-only">Send counter-offer</span></Button></div>{counterPrice && !counterIsValid && <p className="mt-2 text-xs font-medium text-red-600">Counter price must meet the member minimum.</p>}</div>{!currentOfferMeetsMinimum && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">The current wholesaler offer is below the member minimum and cannot be accepted. You may send a compliant counter-offer.</p>}<Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={!currentOfferMeetsMinimum || isSubmitting} onClick={() => void handleAccept()}><Check className="mr-2 h-4 w-4" />Accept Deal</Button></>}</div></div>}</SheetContent></Sheet></div>
}
