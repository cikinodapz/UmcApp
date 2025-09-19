"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const adminMenuItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Inventaris",
    icon: Package,
    children: [
      { title: "Kelola Kategori", href: "/inventory/categories" },
      { title: "Kelola Aset & Jasa", href: "/inventory/assets-services" },
    ],
  },
  { title: "Pemesanan", href: "/pemesanan", icon: Calendar },
  { title: "Pembayaran", href: "/payments", icon: CreditCard },
  { title: "Pengembalian", href: "/returns", icon: RotateCcw },
  { title: "Denda", href: "/fines", icon: AlertTriangle },
  { title: "Feedback", href: "/feedback", icon: MessageSquare },
  { title: "Notifikasi", href: "/notifications", icon: Bell },
  {
    title: "Pengaturan",
    icon: Settings,
    children: [
      { title: "Profil", href: "/settings/profile" },
      { title: "Kategori", href: "/settings/categories" },
    ],
  },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // track buka/tutup submenu
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300",
        isCollapsed ? "w-24" : "w-72",
        className
      )}
    >
      {/* Header + Toggle */}
      <div className="flex h-18 items-center justify-between px-5 border-b border-gray-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-12 h-12 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="UMC Media Hub Logo"
              width={48}
              height={48}
              className="rounded-2xl"
            />
          </div>
          <div
            className={cn(
              "flex flex-col transition-all duration-300 overflow-hidden",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            <h1 className="text-lg font-bold leading-tight whitespace-nowrap bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              UMC Media Hub
            </h1>
            <p className="text-sm text-gray-500 whitespace-nowrap tracking-wide">
              Admin Panel
            </p>
          </div>
        </div>

        <Button
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="w-6 h-6" />
          ) : (
            <ChevronLeft className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-5">
        <nav className="space-y-2.5">
          {adminMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href ? item.href + "/" : "///");
            const Icon = item.icon;

            // case: menu dengan children
            // di dalam adminMenuItems.map(...)
            if (item.children) {
              // ⬇️ tambahkan ini tepat setelah const Icon = item.icon;
              const childActive = item.children.some(
                (c) => pathname === c.href || pathname.startsWith(c.href + "/")
              );

              // ⬇️ ubah baris ini:
              // const isOpen = openMenus[item.title] || false;
              // menjadi:
              const isOpen = (openMenus[item.title] ?? false) || childActive;

              return (
                <div key={item.title}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between gap-3 h-12 rounded-2xl font-medium text-[15px] transition-all duration-200",
                      // ⬇️ tambahkan kondisi active style untuk parent saat child aktif
                      childActive
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg hover:from-indigo-600 hover:to-violet-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    onClick={() => toggleMenu(item.title)}
                    // opsional: aksesibilitas
                    aria-expanded={isOpen}
                    aria-current={childActive ? "page" : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          isOpen ? "rotate-180" : ""
                        )}
                      />
                    )}
                  </Button>

                  {/* Sub-menu items */}
                  {!isCollapsed && isOpen && (
                    <div className="ml-8 mt-2 space-y-1.5">
                      {item.children.map((child) => {
                        const isChildActive =
                          pathname === child.href ||
                          pathname.startsWith(child.href + "/");
                        return (
                          <Button
                            key={child.href}
                            asChild
                            variant="ghost"
                            className={cn(
                              "w-full justify-start rounded-xl h-9 text-[14px] font-normal",
                              isChildActive
                                ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            <Link href={child.href}>{child.title}</Link>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // case: menu biasa
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12 rounded-2xl font-medium text-[15px] transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg hover:from-indigo-600 hover:to-violet-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Link href={item.href!}>
                  <Icon className="w-6 h-6 shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
