"use client"

import { Sidebar } from "@/components/sidebar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch, logout } from "@/lib/api"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const res = await apiFetch("/auth/me")
        if (!res.ok) {
          logout()
          return
        }

        const data = await res.json()
        if (data.data.role !== "admin") {
          logout()
          return
        }

        setIsAuthorized(true)
      } catch {
        logout()
      }
    }

    verifyAuth()
  }, [router])

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="relative h-screen w-full overflow-hidden text-slate-900">
      <main className="flex h-full">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex min-h-full flex-col gap-6 p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
