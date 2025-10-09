"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Package, Calendar, CreditCard, RotateCcw, MessageSquare, Bell, User, Menu, X, ShoppingCart, TimerIcon, Timer, HandCoins, Clock } from "lucide-react"
import Image from "next/image"
import { title } from "process"
import { fetchData } from "@/lib/api"

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
  {
    title: "Profil",
    href: "/settings/profile",
    icon: User,
  },
]

export function PeminjamNavbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)

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
