"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Bell, LogOut, User, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { mockNotifications } from "@/lib/mock"
import { formatDateTime } from "@/lib/format"
import { useRouter } from "next/navigation"

interface TopbarProps {
  showSearch?: boolean
}

export function Topbar({ showSearch = true }: TopbarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  // Get unread notifications
  const unreadNotifications = mockNotifications.filter((notif) => notif.userId === user?.id && !notif.readAt)

  const recentNotifications = mockNotifications.filter((notif) => notif.userId === user?.id).slice(0, 5)

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Search */}
        <div className="flex items-center gap-4 flex-1">
          {showSearch && (
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari aset, booking, atau pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl border-2 focus:border-indigo-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative rounded-xl">
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 hover:bg-red-600">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-xl" align="end">
              <div className="p-4 border-b">
                <h4 className="font-semibold">Notifikasi</h4>
                <p className="text-sm text-gray-500">{unreadNotifications.length} notifikasi belum dibaca</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.length > 0 ? (
                  recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                        !notification.readAt ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {notification.body && <p className="text-sm text-gray-600 mt-1">{notification.body}</p>}
                          <p className="text-xs text-gray-400 mt-2">{formatDateTime(notification.sentAt)}</p>
                        </div>
                        {!notification.readAt && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada notifikasi</p>
                  </div>
                )}
              </div>
              {recentNotifications.length > 0 && (
                <div className="p-3 border-t">
                  <Button variant="ghost" size="sm" className="w-full rounded-lg">
                    Lihat Semua Notifikasi
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-medium">
                    {user ? getUserInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="w-fit mt-1 rounded-md">
                    {user?.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
