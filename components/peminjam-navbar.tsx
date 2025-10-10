"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Package, Calendar, CreditCard, RotateCcw, MessageSquare, Bell, User, Menu, X, ShoppingCart, TimerIcon, Timer, HandCoins, Clock, LogOut } from "lucide-react"
import Image from "next/image"
import { title } from "process"
import { fetchData } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect as ReactUseEffect, useState as ReactUseState } from "react"

const peminjamMenuItems = [
  {
    title: "Home",
    href: "/home",
    icon: Home,
  },
  {
    title: "Katalog Jasa",
    href: "/katalog",
    icon: HandCoins,
  },
  {
    title: "Keranjang",
    href: "/keranjang",
    icon: ShoppingCart,
  },
  {
    title: "Pemesanan",
    href: "/booking",
    icon: Calendar,
  },
  {
    title: "Riwayat Transaksi",
    href: "/riwayat",
    icon: CreditCard,
  },
  // {
  //   title: "Sedang Dipinjam",
  //   href: "/dipinjam",
  //   icon: Clock,
  // },
  // {
  //   title: "Riwayat Pinjaman",
  //   href: "/riwayat",
  //   icon: Timer,
  // },
  // {
  //   title: "Pengembalian",
  //   href: "/pengembalian",
  //   icon: RotateCcw,
  // },
  {
    title: "Notifikasi",
    href: "/notifikasi",
    icon: Bell,
  },
  // {
  //   title: "Profil",
  //   href: "/profile",
  //   icon: User,
  // },
]

export function PeminjamNavbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const { user, logout } = useAuth()
  const router = useRouter()
  const [navUser, setNavUser] = ReactUseState<{ name?: string; email?: string; photoUrl?: string } | null>(null)

  const userPhoto = (p?: string | null) => {
    if (!p) return "/avatar.png"
    if (/^https?:\/\//i.test(p)) return p
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    const path = p.startsWith("/uploads/") ? p : `/uploads/${p}`
    return `${base}${path}`
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('token')
    } catch {}
    logout()
    router.push('/auth/login')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Load unread notification count
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await fetchData("/notifications", { method: "GET" })
        const list: any[] = Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data) ? data : []
        const count = list.filter((n: any) => !n.readAt).length
        if (active) setUnreadCount(count)
      } catch {
        if (active) setUnreadCount(0)
      }
    }
    load()
    const t = setInterval(load, 30000)
    return () => { active = false; clearInterval(t) }
  }, [])

  // Fetch latest user profile like profile/page.tsx
  useEffect(() => {
    let mounted = true
    async function loadMe() {
      try {
        const resp = await fetchData("/auth/me")
        const u = resp?.user || resp
        if (mounted) setNavUser({ name: u?.name, email: u?.email, photoUrl: u?.photoUrl })
      } catch {
        if (mounted) setNavUser({ name: user?.name, email: user?.email, photoUrl: (user as any)?.photoUrl })
      }
    }
    loadMe()
    return () => { mounted = false }
  }, [user])
  
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="UMC Media Hub Logo"
                width={40}
                height={40}
                className="rounded-xl"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                UMC Media Hub
              </h1>
              <p className="text-xs text-gray-500"></p>
            </div>
          </Link>

          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex items-center gap-2">
            {peminjamMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon

              const withBadge = item.href === "/notifikasi" && unreadCount > 0
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 rounded-xl font-medium transition-all duration-200 px-4 py-2",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg hover:from-indigo-600 hover:to-violet-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <Link href={item.href} className="relative flex items-center gap-2">
                    <span className="relative inline-flex">
                      <Icon className="w-4 h-4" />
                      {withBadge && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-[9px] leading-none h-3.5 min-w-[14px] px-1 rounded-full bg-red-600 text-white border border-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </span>
                    {item.title}
                  </Link>
                </Button>
              )
            })}
          </div>

          {/* Desktop: User Profile */}
          <div className="hidden md:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={userPhoto(navUser?.photoUrl || user?.photoUrl || null)} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{navUser?.name || user?.name || "Pengguna"}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{navUser?.email || user?.email || "-"}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{navUser?.name || user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{navUser?.email || user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg" asChild>
                  <Link href="/profile">Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            {/* Mobile: User Profile Summary */}
            <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 bg-white">
                <img src={userPhoto(navUser?.photoUrl || user?.photoUrl || null)} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-gray-900">{navUser?.name || user?.name || "Pengguna"}</div>
                <div className="text-xs text-gray-600">{navUser?.email || user?.email || "-"}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {peminjamMenuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon

                const withBadge = item.href === "/notifikasi" && unreadCount > 0
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "justify-start gap-3 rounded-xl font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg hover:from-indigo-600 hover:to-violet-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    )}
                  >
                    <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="relative flex items-center gap-2">
                      <span className="relative inline-flex">
                        <Icon className="w-4 h-4" />
                        {withBadge && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-[9px] leading-none h-3.5 min-w-[14px] px-1 rounded-full bg-red-600 text-white border border-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </span>
                      {item.title}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
