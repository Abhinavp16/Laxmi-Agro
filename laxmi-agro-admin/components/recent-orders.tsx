"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, CheckCircle2, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { apiFetch } from "@/lib/api"

interface Order {
  _id: string
  orderNumber: string
  customerSnapshot: { name: string }
  total: number
  status: string
  createdAt: string
  payment?: { status: string }
}

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    async function fetchOrders() {
      try {
        const res = await apiFetch("/admin/orders?limit=6")
        const contentType = res.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
          return
        }

        const json = await res.json()
        if (res.ok) {
          setOrders((json.data || []).slice(0, 6))
        }
      } catch {
        // keep empty
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case "delivered":
      case "payment_verified":
        return "bg-green-500/10 text-green-600"
      case "processing":
      case "payment_uploaded":
        return "bg-blue-500/10 text-blue-600"
      case "shipped":
        return "bg-violet-500/10 text-violet-600"
      case "pending_payment":
        return "bg-amber-500/10 text-amber-600"
      case "cancelled":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-slate-500/10 text-slate-500"
    }
  }

  function formatStatus(status: string) {
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  }

  function getPaymentStatus(order: Order) {
    if (!order.payment) return order.status === "pending_payment" ? "pending" : "unknown"
    return order.payment.status
  }

  return (
    <div className="rounded-[28px] border border-[#dde3d0] bg-white/92 p-4 shadow-[0_24px_60px_rgba(60,80,40,0.08)] sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-bold text-slate-900">Recent Orders</h3>
        <Link href="/orders" className="flex items-center gap-1 text-sm text-emerald-600 hover:underline">
          View All <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#86efac]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">No orders yet</div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {orders.map((order) => {
              const payStatus = getPaymentStatus(order)
              return (
                <div key={order._id} className="rounded-2xl border border-[#edf0e2] bg-[#f8faf3] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{order.orderNumber}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">Rs. {order.total.toLocaleString("en-IN")}</div>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-700">{order.customerSnapshot?.name || "-"}</div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    {payStatus === "verified" ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> Verified
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-4 w-4" /> {formatStatus(payStatus)}
                      </div>
                    )}
                    <Link href="/orders" className="font-medium text-emerald-600 hover:underline">
                      Manage
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          <table className="hidden w-full md:table">
            <thead>
              <tr className="border-b border-[#edf0e2] text-sm text-slate-500">
                <th className="pb-4 pl-2 text-left font-medium">Order ID</th>
                <th className="pb-4 text-left font-medium">Customer</th>
                <th className="pb-4 text-left font-medium">Date</th>
                <th className="pb-4 text-right font-medium">Amount</th>
                <th className="pb-4 text-center font-medium">Status</th>
                <th className="pb-4 pr-2 text-center font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {orders.map((order) => {
                const payStatus = getPaymentStatus(order)
                return (
                  <tr
                    key={order._id}
                    className="group border-b border-[#edf0e2] transition-colors last:border-0 hover:bg-[#f8faf3]"
                  >
                    <td className="py-4 pl-2 font-medium text-slate-900">{order.orderNumber}</td>
                    <td className="py-4 text-slate-700">{order.customerSnapshot?.name || "-"}</td>
                    <td className="py-4 text-slate-500">{formatDate(order.createdAt)}</td>
                    <td className="py-4 text-right font-bold text-slate-900">
                      Rs. {order.total.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4">
                      <div className="flex justify-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-2">
                      <div className="flex items-center justify-center gap-2">
                        {payStatus === "verified" ? (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Verified
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-4 w-4" /> {formatStatus(payStatus)}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
