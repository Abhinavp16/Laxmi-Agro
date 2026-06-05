"use client"

import {
  BadgeCheck,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Globe,
  Image,
  LayoutDashboard,
  LogOut,
  Moon,
  MapPinned,
  MessageSquareMore,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Sun,
  Store,
  TicketPercent,
  User,
  UserPlus,
  UserSearch,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useEffect, useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [offersOpen, setOffersOpen] = useState(pathname.startsWith("/offers"))
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    toast.success("Logged out successfully")
    router.push("/login")
  }

  const getItemClasses = (isActive: boolean) =>
    isActive
      ? "bg-white text-emerald-700 shadow-sm shadow-emerald-100"
      : "text-slate-500 hover:bg-white/80 hover:text-slate-900"

  return (
    <aside className="hidden h-screen md:flex md:w-56 lg:w-72 md:flex-col md:self-stretch md:overflow-hidden border-r border-[#dde3d0] bg-[#f3f5ea]/95 px-4 py-6 backdrop-blur dark:border-[#263126] dark:bg-[#111612]/95">
      <div className="flex-1 overflow-y-auto rounded-[28px] border border-[#dde3d0] bg-white/35 p-5 shadow-[0_24px_60px_rgba(60,80,40,0.08)] dark:border-[#263126] dark:bg-black/10 dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <nav className="flex flex-col gap-3">
        <Link href="/" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/")}`}>
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">DASHBOARD</span>
        </Link>
        <Link href="/products" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/products")}`}>
          <Package className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">PRODUCTS</span>
        </Link>
        <Link href="/brands" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/brands")}`}>
          <Building2 className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">BRANDS</span>
        </Link>
        <Link href="/categories" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/categories")}`}>
          <FolderTree className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">CATEGORIES</span>
        </Link>
        <Link
          href="/manage-website?tab=labels"
          className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/manage-website" || pathname === "/labels")}`}
        >
          <BadgeCheck className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">LABELS</span>
        </Link>
        <Link href="/orders" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/orders")}`}>
          <ShoppingCart className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">ORDERS</span>
        </Link>
        <Link href="/negotiations" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/negotiations")}`}>
          <MessageSquareMore className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">NEGOTIATIONS</span>
        </Link>
        <Link href="/customers" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/customers")}`}>
          <Users className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">CUSTOMERS</span>
        </Link>
        <Link href="/account-upgrades" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/account-upgrades")}`}>
          <UserPlus className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">ACCOUNT UPGRADES</span>
        </Link>
        <Link href="/wholesaler-map" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/wholesaler-map")}`}>
          <MapPinned className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">WHOLESALER MAP</span>
        </Link>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setOffersOpen(!offersOpen)}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname.startsWith("/offers"))}`}
          >
            <div className="flex items-center gap-4">
              <TicketPercent className="h-6 w-6" />
              <span className="text-sm font-semibold tracking-[0.18em]">OFFERS</span>
            </div>
            {offersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {offersOpen && (
            <div className="ml-4 flex flex-col gap-3 rounded-2xl bg-white/70 p-3">
              <Link href="/offers/customers" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] transition-all ${getItemClasses(pathname === "/offers/customers")}`}>
                <User className="h-4 w-4" />
                CUSTOMERS
              </Link>
              <Link href="/offers/wholesalers" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] transition-all ${getItemClasses(pathname === "/offers/wholesalers")}`}>
                <Store className="h-4 w-4" />
                WHOLESALERS
              </Link>
              <Link href="/offers/affiliates" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.18em] transition-all ${getItemClasses(pathname === "/offers/affiliates")}`}>
                <BadgeCheck className="h-4 w-4" />
                AFFILIATE CODES
              </Link>
            </div>
          )}
        </div>

        <Link href="/analytics" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/analytics")}`}>
          <BarChart3 className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">ANALYTICS</span>
        </Link>
        <Link href="/potential-customers" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/potential-customers")}`}>
          <UserSearch className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">LEADS</span>
        </Link>
        <Link href="/banners" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/banners")}`}>
          <Image className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">BANNERS</span>
        </Link>
        <Link href="/manage-website" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/manage-website")}`}>
          <Globe className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">MANAGE WEBSITE</span>
        </Link>
        <Link href="/reviews" className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${getItemClasses(pathname === "/reviews")}`}>
          <Star className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">REVIEWS</span>
        </Link>
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-[#dde3d0] pt-6 dark:border-[#263126]">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-500 transition-all hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
          type="button"
        >
          {mounted && theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          <span className="text-sm font-semibold tracking-[0.18em]">
            {mounted && theme === "dark" ? "LIGHT THEME" : "DARK THEME"}
          </span>
        </button>
        <Link href="/settings" className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-500 transition-all hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white">
          <Settings className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">SETTINGS</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-500 transition-all hover:bg-red-50 hover:text-red-500 dark:text-slate-300 dark:hover:bg-red-500/12">
          <LogOut className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-[0.18em]">LOGOUT</span>
        </button>
      </div>
      </div>
    </aside>
  )
}
