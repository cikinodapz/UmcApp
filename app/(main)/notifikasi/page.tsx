"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { NotificationType } from "@/types"
import { formatDateTime } from "@/lib/format"
import { Bell, Check, CheckCheck, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchData } from "@/lib/api"
import Swal from "sweetalert2"

// Pagination component (copied from bookings page)
function Pagination({
  total,
  page,
  setPage,
  pageSize,
  setPageSize,
}: {
  total: number;
  page: number;
  setPage: (n: number | ((p: number) => number)) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageWindow = (cur: number, tot: number, span = 2) => {
    const out: (number | string)[] = [];
    const s = Math.max(1, cur - span);
    const e = Math.min(tot, cur + span);
    if (s > 1) out.push(1);
    if (s > 2) out.push("...");
    for (let p = s; p <= e; p++) out.push(p);
    if (e < tot - 1) out.push("...");
    if (e < tot) out.push(tot);
    return out;
  };
  const pagesArr = useMemo(
    () => pageWindow(page, totalPages, 2),
    [page, totalPages]
  );

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <div className="text-sm text-gray-600">
        Menampilkan{" "}
        <span className="font-medium">
          {total === 0 ? 0 : (page - 1) * pageSize + 1}
        </span>{" "}
        –
        <span className="font-medium"> {Math.min(page * pageSize, total)}</span>{" "}
        dari <span className="font-medium">{total}</span> data
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows</span>
          <select
            className="h-9 rounded-xl border px-3 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="rounded-xl"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page <= 1}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {pagesArr.map((p, i) =>
            typeof p === "string" ? (
              <span key={`${p}-${i}`} className="px-2 text-sm text-gray-500">
                {p}
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className={
                  p === page ? "rounded-xl bg-indigo-600" : "rounded-xl"
                }
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            className="rounded-xl"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [typeFilter, setTypeFilter] = useState("")
  const [sortOrder, setSortOrder] = useState("desc") // desc: terbaru ke terlama, asc: terlama ke terbaru
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Fetch notifications
  useEffect(() => {
    async function loadNotifications() {
      setLoading(true)
      try {
        const data = await fetchData<{ notifications: any[] }>("/notifications", {
          method: "GET",
        })
        setNotifications(data?.notifications || [])
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Gagal memuat data notifikasi"
        Swal.fire({ icon: "error", title: "Error", text: msg })
      } finally {
        setLoading(false)
      }
    }
    loadNotifications()
  }, [])

  // Filtered and sorted notifications
  const filteredNotifications = notifications
    .filter((notification) => !typeFilter || typeFilter === "all" || notification.type === typeFilter)
    .sort((a, b) => {
      const dateA = new Date(a.sentAt).getTime()
      const dateB = new Date(b.sentAt).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })

  // Paginate data
  const pagedNotifications = useMemo(
    () => filteredNotifications.slice((page - 1) * pageSize, page * pageSize),
    [filteredNotifications, page, pageSize]
  )

  const unreadCount = filteredNotifications.filter((n) => !n.readAt).length

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetchData(`/notifications/${id}/read`, {
        method: "PATCH",
      })
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      toast({
        title: "Berhasil",
        description: "Notifikasi ditandai sebagai sudah dibaca",
      })
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal menandai notifikasi sebagai dibaca"
      Swal.fire({ icon: "error", title: "Error", text: msg })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetchData("/notifications/read", {
        method: "PATCH",
      })
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
      )
      toast({
        title: "Berhasil",
        description: "Semua notifikasi ditandai sebagai sudah dibaca",
      })
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal menandai semua notifikasi sebagai dibaca"
      Swal.fire({ icon: "error", title: "Error", text: msg })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetchData(`/notifications/${id}`, {
        method: "DELETE",
      })
      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast({
        title: "Berhasil",
        description: "Notifikasi berhasil dihapus",
      })
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal menghapus notifikasi"
      Swal.fire({ icon: "error", title: "Error", text: msg })
    }
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
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
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="desc" className="rounded-lg">
              Terbaru ke Terlama
            </SelectItem>
            <SelectItem value="asc" className="rounded-lg">
              Terlama ke Terbaru
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">Menampilkan {filteredNotifications.length} notifikasi</div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {pagedNotifications.length > 0 ? (
          pagedNotifications.map((notification) => (
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

      {/* Pagination */}
      <Pagination
        total={filteredNotifications.length}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
    </div>
  )
}