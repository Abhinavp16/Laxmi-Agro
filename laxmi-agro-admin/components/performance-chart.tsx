"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { apiFetch } from "@/lib/api"

type PeriodKey = "7d" | "30d" | "90d" | "1y"

const periodMap: { label: string; value: PeriodKey; groupBy: string }[] = [
  { label: "7D", value: "7d", groupBy: "day" },
  { label: "1M", value: "30d", groupBy: "day" },
  { label: "3M", value: "90d", groupBy: "week" },
  { label: "1Y", value: "1y", groupBy: "month" },
]

interface ChartPoint {
  date: string
  revenue: number
  orders: number
}

export function PerformanceChart() {
  const [data, setData] = useState<ChartPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activePeriod, setActivePeriod] = useState<PeriodKey>("30d")
  const lastFetchedPeriodRef = useRef<PeriodKey | null>(null)

  useEffect(() => {
    if (lastFetchedPeriodRef.current === activePeriod) return
    lastFetchedPeriodRef.current = activePeriod
    fetchSales()
  }, [activePeriod])

  async function fetchSales() {
    setIsLoading(true)
    const period = periodMap.find((entry) => entry.value === activePeriod)
    if (!period) return

    try {
      const res = await apiFetch(`/admin/analytics/sales?period=${period.value}&groupBy=${period.groupBy}`)
      const contentType = res.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        return
      }

      const json = await res.json()
      if (res.ok && json.success) {
        const timeline: ChartPoint[] = json.data.timeline || []
        setData(
          timeline.map((point) => ({
            date: point.date,
            revenue: point.revenue,
            orders: point.orders,
          })),
        )
      }
    } catch {
      // keep empty
    } finally {
      setIsLoading(false)
    }
  }

  function formatCurrency(value: number) {
    if (value >= 100000) return `Rs. ${(value / 100000).toFixed(1)}L`
    if (value >= 1000) return `Rs. ${(value / 1000).toFixed(1)}K`
    return `Rs. ${value}`
  }

  const maxRevenue = data.length > 0 ? Math.max(...data.map((point) => point.revenue)) : 0
  const yMax = Math.ceil((maxRevenue * 1.2) / 100) * 100 || 1000

  return (
    <div className="flex flex-col gap-6 rounded-[28px] border border-[#dde3d0] bg-white/92 p-6 shadow-[0_24px_60px_rgba(60,80,40,0.08)]">
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center md:gap-2 lg:gap-4">
        <h2 className="text-xl font-medium text-slate-900">Sales Overview</h2>

        <div className="flex items-center rounded-xl border border-[#e2e7d8] bg-[#f3f6ea] p-1">
          {periodMap.map((period) => (
            <button
              key={period.value}
              onClick={() => setActivePeriod(period.value)}
              className={`rounded-md px-3 py-1 text-sm transition-colors md:px-2 md:text-xs lg:px-3 lg:text-sm ${
                activePeriod === period.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[400px] w-full">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#86efac]" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No sales data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#86efac" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#86efac" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e9db" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, yMax]}
                orientation="left"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const point = payload[0].payload as ChartPoint
                    return (
                      <div className="rounded-xl border border-[#dde3d0] bg-white p-3 shadow-xl">
                        <p className="font-medium text-slate-900">Rs. {point.revenue.toLocaleString("en-IN")}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {point.orders} orders · {point.date}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
