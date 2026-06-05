import { DashboardMetrics } from "@/components/dashboard-metrics"
import { PerformanceChart } from "@/components/performance-chart"
import { RecentOrders } from "@/components/recent-orders"

export default function Dashboard() {
  return (
    <>
      <DashboardMetrics />
      <PerformanceChart />
      <RecentOrders />

      <div className="mt-4 flex items-center justify-end gap-2">
        <div className="h-[13px] w-[13px] rounded-full bg-[#86efac]" />
        <span className="text-sm text-slate-500">System Online</span>
      </div>
    </>
  )
}
