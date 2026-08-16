"use client"

import { MobileStaffNav, StaffSidebar } from "@/components/sidebar"
import { PageTransition } from "@/components/motion/page-transition"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { apiFetch, isSessionExpired, logout } from "@/lib/api"

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    async function verifyStaffAccess() {
      if (!localStorage.getItem("accessToken") || isSessionExpired()) return logout()

      const response = await apiFetch("/auth/me")
      if (!response.ok) return logout()

      const data = await response.json()
      if (data.data.role !== "staff") return logout()
      setIsAuthorized(true)
    }

    verifyStaffAccess().catch(logout)
    const sessionCheck = window.setInterval(() => { if (isSessionExpired()) logout() }, 60_000)
    return () => window.clearInterval(sessionCheck)
  }, [])

  if (!isAuthorized) return null

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground md:h-screen md:overflow-hidden">
      <main className="flex min-h-screen md:h-full">
        <StaffSidebar />
        <div className="min-w-0 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex min-h-full flex-col gap-4 p-4 sm:p-5 md:gap-6 md:p-6">
            <MobileStaffNav />
            <PageTransition routeKey={pathname}>{children}</PageTransition>
          </div>
        </div>
      </main>
    </div>
  )
}
