"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  AddTeamIcon,
  ChartHistogramIcon,
  Clock01Icon,
  DashboardSquare01Icon,
  DeliveryTruck01Icon,
  Folder01Icon,
  Globe02Icon,
  Image01Icon,
  Logout01Icon,
  MapsGlobal01Icon,
  Menu01Icon,
  Message01Icon,
  Moon01Icon,
  Package01Icon,
  Settings01Icon,
  StarIcon,
  Sun01Icon,
  Tag01Icon,
  TagsIcon,
  UserGroupIcon,
  UserSearch01Icon,
} from "@hugeicons/core-free-icons"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
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

type HugeIcon = typeof DashboardSquare01Icon

type NavItem = {
  href: string
  label: string
  icon: HugeIcon
  matches?: string[]
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const adminNavGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [{ href: "/", label: "DASHBOARD", icon: DashboardSquare01Icon }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "PRODUCTS", icon: Package01Icon },
      { href: "/brands", label: "BRANDS", icon: Tag01Icon },
      { href: "/categories", label: "CATEGORIES", icon: Folder01Icon },
      { href: "/price-changes", label: "PRICE CHANGES", icon: Clock01Icon },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/orders", label: "ORDERS", icon: DeliveryTruck01Icon },
      { href: "/negotiations", label: "NEGOTIATIONS", icon: Message01Icon },
      { href: "/customers", label: "CUSTOMERS", icon: UserGroupIcon },
      { href: "/account-upgrades", label: "ACCOUNT UPGRADES", icon: AddTeamIcon },
      { href: "/wholesaler-map", label: "WHOLESALER MAP", icon: MapsGlobal01Icon },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "ANALYTICS", icon: ChartHistogramIcon },
      { href: "/potential-customers", label: "LEADS", icon: UserSearch01Icon },
    ],
  },
  {
    label: "App",
    items: [
      { href: "/banners", label: "BANNERS", icon: Image01Icon },
      { href: "/manage-website?tab=labels", label: "LABELS", icon: TagsIcon, matches: ["/labels"] },
      { href: "/reviews", label: "REVIEWS", icon: StarIcon },
    ],
  },
]

const manageWebsiteNavItem: NavItem = {
  href: "/manage-website",
  label: "MANAGE WEBSITE",
  icon: Globe02Icon,
}

export const adminPrimaryNavItems: NavItem[] = [
  ...adminNavGroups.flatMap((group) => group.items),
  manageWebsiteNavItem,
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
    ? "border-blue-500 bg-blue-50 text-blue-700"
    : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
}

function SidebarIcon({ icon, size = 20 }: { icon: HugeIcon; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} color="currentColor" />
}

function SidebarBrand() {
  return (
    <Link href="/" className="flex items-center gap-3 px-5 py-5 transition-colors hover:bg-slate-50">
      <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200 shadow-sm dark:ring-[#334155]">
        <Image src="/lae-logo.svg" alt="Laxmi Agro" width={36} height={36} className="h-full w-full object-cover" priority />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold tracking-tight text-slate-900">Laxmi Agro</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin Portal</span>
      </span>
    </Link>
  )
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
  const renderLink = (item: NavItem) => {
    const link = (
      <Link
        href={item.href}
        className={`group flex min-h-10 items-center gap-3 border-l-2 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] transition-colors lg:text-xs ${getItemClasses(isNavItemActive(pathname, item))}`}
      >
        <span className="flex shrink-0 items-center justify-center">
          <SidebarIcon icon={item.icon} />
        </span>
        <span className="min-w-0 break-words">{item.label}</span>
      </Link>
    )

    if (!closeOnNavigate) {
      return (
        <motion.div
          key={item.href}
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
        >
          {link}
        </motion.div>
      )
    }

    return (
      <SheetClose asChild key={item.href}>
        {link}
      </SheetClose>
    )
  }

  const settingsLink = (
    <Link
      href="/settings"
      className="flex min-h-10 items-center gap-3 border-l-2 border-transparent px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:text-xs"
    >
      <span className="flex shrink-0 items-center justify-center"><SidebarIcon icon={Settings01Icon} /></span>
      <span>SETTINGS</span>
    </Link>
  )

  return (
    <div className="flex min-h-full flex-col">
      <nav className="flex flex-col gap-6" aria-label="Admin navigation">
        {adminNavGroups.map((group) => (
          <section key={group.label} aria-labelledby={`sidebar-group-${group.label.toLowerCase()}`}>
            <p id={`sidebar-group-${group.label.toLowerCase()}`} className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">{group.items.map(renderLink)}</div>
          </section>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-3">
        <nav className="pb-3" aria-label="Website management">
          {renderLink(manageWebsiteNavItem)}
        </nav>
        <div className="border-t border-slate-200 pt-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex min-h-10 w-full items-center gap-3 border-l-2 border-transparent px-3 py-2 text-left text-[11px] font-semibold tracking-[0.12em] text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:text-xs"
            type="button"
          >
            <span className="flex shrink-0 items-center justify-center">
              <SidebarIcon icon={mounted && theme === "dark" ? Sun01Icon : Moon01Icon} />
            </span>
            <span>{mounted && theme === "dark" ? "LIGHT THEME" : "DARK THEME"}</span>
          </button>
          {closeOnNavigate ? <SheetClose asChild>{settingsLink}</SheetClose> : settingsLink}
          <button
            onClick={handleLogout}
            className="flex min-h-10 w-full items-center gap-3 border-l-2 border-transparent px-3 py-2 text-left text-[11px] font-semibold tracking-[0.12em] text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 lg:text-xs"
          >
            <span className="flex shrink-0 items-center justify-center"><SidebarIcon icon={Logout01Icon} /></span>
            <span>LOGOUT</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function MobileAdminNav() {
  const { mounted, pageTitle, pathname, theme, setTheme, handleLogout } = useAdminSidebarState()

  return (
    <div className="-mx-4 -mt-4 border-b border-slate-200 bg-white sm:-mx-5 sm:-mt-5 md:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Laxmi Agro</div>
          <h1 className="truncate text-lg font-bold text-slate-900">{pageTitle}</h1>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-md border-slate-200 bg-white text-slate-700 shadow-none hover:bg-slate-50"
            >
              <SidebarIcon icon={Menu01Icon} size={20} />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] border-r border-slate-200 bg-white p-0 text-slate-900 sm:max-w-sm">
            <SheetHeader className="border-b border-slate-200 p-0 text-left">
              <SidebarBrand />
              <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
              <SheetDescription className="sr-only">Browse dashboard sections, settings, theme, and account actions.</SheetDescription>
            </SheetHeader>
            <div className="h-[calc(100dvh-77px)] overflow-y-auto no-scrollbar px-3 py-5">
              <SidebarNavContent
                pathname={pathname}
                mounted={mounted}
                theme={theme}
                setTheme={setTheme}
                handleLogout={handleLogout}
                closeOnNavigate
              />
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
    <aside className="hidden h-screen shrink-0 md:flex md:w-60 lg:w-64 md:flex-col md:self-stretch md:overflow-hidden border-r border-slate-200 bg-white text-slate-900">
      <div className="border-b border-slate-200">
        <SidebarBrand />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-5">
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
