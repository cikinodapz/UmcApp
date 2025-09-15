"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { mockNotifications } from "@/lib/mock"
import { NotificationType } from "@/types"
import { formatDateTime } from "@/lib/format"
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [typeFilter, setTypeFilter] = useState("")

  // Get user notifications
  const userNotifications = mockNotifications
    .filter((notification) => notification.userId === user?.id)
    .filter((notification) => !typeFilter || typeFilter === "all" || notification.type === typeFilter)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())

  const unreadCount = userNotifications.filter((n) => !n.readAt).length

  const handleMarkAsRead = (id: string) => {
    // In a real app, this would make an API call
    console.log("Marking notification as read:", id)
    toast({
      title: "Berhasil",
      description: "Notifikasi ditandai sebagai sudah dibaca",
    })
  }

  const handleMarkAllAsRead = () => {
    // In a real app, this would make an API call
    console.log("Marking all notifications as read")
    toast({
      title: "Berhasil",
      description: "Semua notifikasi ditandai sebagai sudah dibaca",
    })
  }

  const handleDelete = (id: string) => {
    // In a real app, this would make an API call
    console.log("Deleting notification:", id)
    toast({
      title: "Berhasil",
      description: "Notifikasi berhasil dihapus",
    })
  }

  const getNotificationIcon = (type: NotificationType) => {
    const icons = {
      [NotificationType.BOOKING]: "📅",
      [NotificationType.PAYMENT]: "💳",
      [NotificationType.RETURN]: "↩️",
      [NotificationType.SYSTEM]: "⚙️",
    }
    return icons[type] || "📢"
  }

  const getTypeColor = (type: NotificationType) => {
    const colors = {
      [NotificationType.BOOKING]: "bg-blue-100 text-blue-800",
      [NotificationType.PAYMENT]: "bg-green-100 text-green-800",
      [NotificationType.RETURN]: "bg-orange-100 text-orange-800",
      [NotificationType.SYSTEM]: "bg-gray-100 text-gray-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifikasi</h1>
          <p className="text-gray-600 mt-2">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" className="rounded-xl bg-transparent">
            <CheckCheck className="w-4 h-4 mr-2" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <Bell className="w-5 h-5 text-gray-400" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Semua Jenis" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              Semua Jenis
            </SelectItem>
            <SelectItem value={NotificationType.BOOKING} className="rounded-lg">
              Booking
            </SelectItem>
            <SelectItem value={NotificationType.PAYMENT} className="rounded-lg">
              Pembayaran
            </SelectItem>
            <SelectItem value={NotificationType.RETURN} className="rounded-lg">
              Pengembalian
            </SelectItem>
            <SelectItem value={NotificationType.SYSTEM} className="rounded-lg">
              Sistem
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">Menampilkan {userNotifications.length} notifikasi</div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {userNotifications.length > 0 ? (
          userNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                !notification.readAt ? "border-l-4 border-l-indigo-500 bg-indigo-50/30" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <Badge className={`${getTypeColor(notification.type)} rounded-lg text-xs`}>
                          {notification.type}
                        </Badge>
                        {!notification.readAt && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                      </div>
                      {notification.body && <p className="text-gray-600 mb-3">{notification.body}</p>}
                      <p className="text-sm text-gray-400">{formatDateTime(notification.sentAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.readAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada notifikasi</h3>
            <p className="text-gray-500">Notifikasi akan muncul di sini ketika ada aktivitas baru</p>
          </div>
        )}
      </div>
    </div>
  )
}