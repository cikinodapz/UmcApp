"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Package,
  Calendar,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  Bell,
  Settings,
} from "lucide-react"
import Image from "next/image"

const adminMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inventaris",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Pemesanan",
    href: "/pemesanan",
    icon: Calendar,
  },
  {
    title: "Pembayaran",
    href: "/payments",
    icon: CreditCard,
  },
  {
    title: "Pengembalian",
    href: "/returns",
    icon: RotateCcw,
  },
  {
    title: "Denda",
    href: "/fines",
    icon: AlertTriangle,
  },
  {
    title: "Feedback",
    href: "/feedback",
    icon: MessageSquare,
  },
  {
    title: "Notifikasi",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Pengaturan",
    href: "/settings",
    icon: Settings,
    children: [
      {
        title: "Profil",
        href: "/settings/profile",
      },
      {
        title: "Kategori",
        href: "/settings/categories",
      },
    ],
  },
]

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex h-full w-64 flex-col bg-white border-r border-gray-200 shadow-sm", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
        <div className="w-12 h-12 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="UMC Media Hub Logo"
            width={60}
            height={60}
            className="rounded-xl"
          />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            UMC Media Hub
          </h1>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <div key={item.href}>
                <Button
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11 rounded-xl font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg hover:from-indigo-600 hover:to-violet-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="w-5 h-5" />
                    {item.title}
                  </Link>
                </Button>

                {/* Sub-menu items */}
                {item.children && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <Button
                          key={child.href}
                          asChild
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start rounded-lg font-normal",
                            isChildActive
                              ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                          )}
                        >
                          <Link href={child.href}>{child.title}</Link>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}