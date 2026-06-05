"use client"

import { useEffect, useRef, useState } from "react"
import { Handshake, Loader2, ShoppingCart, Users, Wallet } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"

interface DashboardData {
  overview: {
    totalOrders: number
    pendingPayments: number
    totalRevenue: number
    activeNegotiations: number
    totalProducts: number
    totalCustomers: number
  }
  today: { orders: number; revenue: number }
  thisMonth: { orders: number; revenue: number }
}

export function DashboardMetrics() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    async function fetchStats() {
      try {
        const res = await apiFetch("/admin/analytics/dashboard")
        const contentType = res.headers.get("content-type") || ""

        if (!contentType.includes("application/json")) {
          throw new Error(`Unexpected API response (${res.status})`)
        }

        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json?.message || `Failed to load dashboard stats (${res.status})`)
        }

        setData(json.data)
      } catch (error: any) {
        toast.error(error?.message || "Failed to load dashboard stats")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex h-28 items-center justify-center rounded-[28px] border border-[#dde3d0] bg-white/90 p-6 shadow-[0_24px_60px_rgba(60,80,40,0.08)]">
        <Loader2 className="h-6 w-6 animate-spin text-[#86efac]" />
      </div>
    )
  }

  const overview = data?.overview
  const today = data?.today

  return (
    <div className="flex flex-col justify-between gap-8 rounded-[28px] border border-[#dde3d0] bg-white/92 p-6 shadow-[0_24px_60px_rgba(60,80,40,0.08)] xl:flex-row xl:items-center">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-500">
          <Wallet className="h-5 w-5" />
          <span className="text-lg">Total Revenue</span>
        </div>
        <div className="text-5xl font-bold text-slate-900 md:text-4xl lg:text-5xl">
          {formatCurrency(overview?.totalRevenue ?? 0)}
        </div>
        {today && today.revenue > 0 && <span className="text-xs text-emerald-600">+{formatCurrency(today.revenue)} today</span>}
      </div>

      <div className="grid grid-cols-2 gap-8 md:grid-cols-4 xl:gap-16">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <ShoppingCart className="h-4 w-4" /> Total Orders
          </span>
          <span className="text-2xl font-semibold text-slate-900 md:text-xl lg:text-2xl">
            {(overview?.totalOrders ?? 0).toLocaleString()}
          </span>
          {today && today.orders > 0 && <span className="text-xs text-emerald-600">+{today.orders} today</span>}
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="h-4 w-4" /> Customers
          </span>
          <span className="text-2xl font-semibold text-emerald-600 md:text-xl lg:text-2xl">
            {(overview?.totalCustomers ?? 0).toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <Handshake className="h-4 w-4" /> Negotiations
          </span>
          <span className="text-2xl font-semibold text-amber-500 md:text-xl lg:text-2xl">
            {overview?.activeNegotiations ?? 0}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-500">Pending Payments</span>
          <span className="text-2xl font-semibold text-orange-400 md:text-xl lg:text-2xl">
            {overview?.pendingPayments ?? 0}
          </span>
        </div>
      </div>
    </div>
  )
}
