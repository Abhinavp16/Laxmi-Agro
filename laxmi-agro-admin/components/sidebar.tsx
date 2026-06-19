"use client"

import {
  BadgeCheck,
  BarChart3,
  Building2,
  FolderTree,
  Globe,
  Image,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquareMore,
  Moon,
  Package,
  Clock3,
  Settings,
  ShoppingCart,
  Star,
  Sun,
  UserPlus,
  UserSearch,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  matches?: string[]
}

export const adminPrimaryNavItems: NavItem[] = [
  { href: "/", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/products", label: "PRODUCTS", icon: Package },
  { href: "/price-changes", label: "PRICE CHANGES", icon: Clock3 },
  { href: "/brands", label: "BRANDS", icon: Building2 },
  { href: "/categories", label: "CATEGORIES", icon: FolderTree },
  { href: "/manage-website?tab=labels", label: "LABELS", icon: BadgeCheck, matches: ["/manage-website", "/labels"] },
  { href: "/orders", label: "ORDERS", icon: ShoppingCart },
  { href: "/negotiations", label: "NEGOTIATIONS", icon: MessageSquareMore },
  { href: "/customers", label: "CUSTOMERS", icon: Users },
  { href: "/account-upgrades", label: "ACCOUNT UPGRADES", icon: UserPlus },
  { href: "/wholesaler-map", label: "WHOLESALER MAP", icon: MapPinned },
  { href: "/analytics", label: "ANALYTICS", icon: BarChart3 },
  { href: "/potential-customers", label: "LEADS", icon: UserSearch },
  { href: "/banners", label: "BANNERS", icon: Image },
  { href: "/manage-website", label: "MANAGE WEBSITE", icon: Globe },
  { href: "/reviews", label: "REVIEWS", icon: Star },
]

function isNavItemActive(pathname: string, item: NavItem) {
  return item.matches?.includes(pathname) || pathname === item.href
}

function formatPageTitle(label: string) {
  return label
    .toLowerCase()
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function getAdminPageTitle(pathname: string) {
  const activeItem = adminPrimaryNavItems.find((item) => isNavItemActive(pathname, item))
  return activeItem ? formatPageTitle(activeItem.label) : "Admin Panel"
}

function useAdminSidebarState() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pageTitle = useMemo(() => getAdminPageTitle(pathname), [pathname])

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    toast.success("Logged out successfully")
    router.push("/login")
  }

  return {
    mounted,
    pageTitle,
    pathname,
    theme,
    setTheme,
    handleLogout,
  }
}

function getItemClasses(isActive: boolean) {
  return isActive
    ? "bg-white text-emerald-700 shadow-sm shadow-emerald-100"
    : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
}

function SidebarNavContent({
  pathname,
  mounted,
  theme,
  setTheme,
  handleLogout,
  closeOnNavigate = false,
}: {
  pathname: string
  mounted: boolean
  theme: string | undefined
  setTheme: (theme: string) => void
  handleLogout: () => void
  closeOnNavigate?: boolean
}) {
  const content = (
    <>
      <nav className="flex flex-col gap-3">
        {adminPrimaryNavItems.map((item) => {
          const Icon = item.icon
          const link = (
            <Link
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-all lg:gap-4 lg:px-4 ${getItemClasses(isNavItemActive(pathname, item))}`}
            >
              <Icon className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" />
              <span className="min-w-0 break-words text-xs font-semibold tracking-[0.16em] lg:text-sm lg:tracking-[0.18em]">{item.label}</span>
            </Link>
          )

          if (!closeOnNavigate) {
            return <div key={item.href}>{link}</div>
          }

          return (
            <SheetClose asChild key={item.href}>
              {link}
            </SheetClose>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-[#dde3d0] pt-6 dark:border-[#263126]">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-slate-500 transition-all hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white lg:gap-4 lg:px-4"
          type="button"
        >
          {mounted && theme === "dark" ? <Sun className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" /> : <Moon className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" />}
          <span className="min-w-0 break-words text-xs font-semibold tracking-[0.16em] lg:text-sm lg:tracking-[0.18em]">
            {mounted && theme === "dark" ? "LIGHT THEME" : "DARK THEME"}
          </span>
        </button>
        {closeOnNavigate ? (
          <SheetClose asChild>
            <Link href="/settings" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-slate-500 transition-all hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white lg:gap-4 lg:px-4">
              <Settings className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" />
              <span className="min-w-0 break-words text-xs font-semibold tracking-[0.16em] lg:text-sm lg:tracking-[0.18em]">SETTINGS</span>
            </Link>
          </SheetClose>
        ) : (
          <Link href="/settings" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-slate-500 transition-all hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white lg:gap-4 lg:px-4">
            <Settings className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" />
            <span className="min-w-0 break-words text-xs font-semibold tracking-[0.16em] lg:text-sm lg:tracking-[0.18em]">SETTINGS</span>
          </Link>
        )}
        <button onClick={handleLogout} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-slate-500 transition-all hover:bg-red-50 hover:text-red-500 dark:text-slate-300 dark:hover:bg-red-500/12 lg:gap-4 lg:px-4">
          <LogOut className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" />
          <span className="min-w-0 break-words text-xs font-semibold tracking-[0.16em] lg:text-sm lg:tracking-[0.18em]">LOGOUT</span>
        </button>
      </div>
    </>
  )

  return content
}

export function MobileAdminNav() {
  const { mounted, pageTitle, pathname, theme, setTheme, handleLogout } = useAdminSidebarState()

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-[#dde3d0] bg-white/90 px-4 py-3 shadow-[0_20px_45px_rgba(60,80,40,0.08)] backdrop-blur">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Admin Panel</div>
          <h1 className="truncate text-lg font-bold text-slate-900">{pageTitle}</h1>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-2xl border-[#d8dfca] bg-[#f6f8ef] text-slate-700 hover:bg-white"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] border-r border-[#dde3d0] bg-[#f3f5ea] p-0 text-slate-900 sm:max-w-sm">
            <SheetHeader className="border-b border-[#dde3d0] px-5 py-5 text-left">
              <SheetTitle className="text-lg text-slate-900">Admin Navigation</SheetTitle>
              <SheetDescription className="text-slate-500">
                Browse dashboard sections, settings, theme, and account actions.
              </SheetDescription>
            </SheetHeader>
            <div className="flex h-full flex-col overflow-y-auto px-4 py-5">
              <div className="flex-1 rounded-[28px] border border-[#dde3d0] bg-white/35 p-5 shadow-[0_24px_60px_rgba(60,80,40,0.08)]">
                <SidebarNavContent
                  pathname={pathname}
                  mounted={mounted}
                  theme={theme}
                  setTheme={setTheme}
                  handleLogout={handleLogout}
                  closeOnNavigate
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { mounted, pathname, theme, setTheme, handleLogout } = useAdminSidebarState()

  return (
    <aside className="hidden h-screen md:flex md:w-56 lg:w-72 md:flex-col md:self-stretch md:overflow-hidden border-r border-[#dde3d0] bg-[#f3f5ea]/95 px-4 py-6 backdrop-blur dark:border-[#263126] dark:bg-[#111612]/95">
      <div className="flex-1 overflow-y-auto rounded-[28px] border border-[#dde3d0] bg-white/35 p-5 shadow-[0_24px_60px_rgba(60,80,40,0.08)] dark:border-[#263126] dark:bg-black/10 dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <SidebarNavContent
          pathname={pathname}
          mounted={mounted}
          theme={theme}
          setTheme={setTheme}
          handleLogout={handleLogout}
        />
      </div>
    </aside>
  )
}
