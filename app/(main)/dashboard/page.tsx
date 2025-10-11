"use client"

import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState, useMemo } from "react"
import { fetchData } from "@/lib/api"
import {
  mockAssets,
  mockServices,
  mockBookings,
  mockBookingItems,
  mockPayments,
  mockUsers,
  mockCategories,
} from "@/lib/mock"
import { AssetStatus, BookingStatus, PaymentStatus, Role } from "@/types"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { Package, Calendar, CreditCard, Clock, TrendingUp, CheckCircle, Star, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MiniLineChart } from "@/components/mini-line-chart"
import Image from "next/image"

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === Role.ADMIN

  const [adminDash, setAdminDash] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<any | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState("")

  useEffect(() => {
    let mounted = true
    if (!isAdmin) return
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await fetchData("/dashboard/admin", { method: "GET" })
        if (mounted) setAdminDash(data)
      } catch (e: any) {
        if (mounted) setError(e?.message || "Gagal memuat dashboard admin")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    async function loadStats() {
      setStatsLoading(true)
      setStatsError("")
      try {
        const s = await fetchData("/dashboard/admin/stats", { method: "GET" })
        if (mounted) setStats(s)
      } catch (e: any) {
        if (mounted) setStatsError(e?.message || "Gagal memuat statistik")
      } finally {
        if (mounted) setStatsLoading(false)
      }
    }
    loadStats()
    return () => { mounted = false }
  }, [isAdmin])

  // Admin Dashboard
  if (isAdmin) {
    const totals = adminDash?.totals || {}
    const bookings = adminDash?.bookings || {}
    const payments = adminDash?.payments || {}
    const recentBookings = adminDash?.recent?.bookings || []
    const recentPayments = adminDash?.recent?.payments || []

    const adminStats = [
      {
        title: "Pengguna",
        value: Number(totals?.users?.total || 0),
        description: `Aktif ${Number(totals?.users?.active || 0)}`,
        icon: Package,
      },
      {
        title: "Jasa Aktif",
        value: Number(totals?.services?.active || 0),
        description: `Paket ${Number(totals?.packages || 0)} • Kategori ${Number(totals?.categories || 0)}`,
        icon: TrendingUp,
      },
      {
        title: "Booking Menunggu",
        value: Number(bookings?.waiting || 0),
        description: "Menunggu konfirmasi",
        icon: Clock,
      },
      {
        title: "Pembayaran Pending",
        value: Number(payments?.pending || 0),
        description: `Lunas ${Number(payments?.paid || 0)}`,
        icon: CreditCard,
      },
    ]

    const bookingColumns = [
      { key: "id", title: "ID", render: (v: string) => <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{v?.slice?.(-8)}</span> },
      { key: "user", title: "Peminjam", render: (_: any, row: any) => (<div><p className="font-medium">{row?.user?.name || "-"}</p></div>) },
      { key: "createdAt", title: "Dibuat", render: (v: string) => formatDateTime(v) },
      { key: "type", title: "Tipe" },
      { key: "totalAmount", title: "Total", render: (v: any) => formatCurrency(Number(v || 0)) },
      { key: "status", title: "Status", render: (v: string) => <StatusBadge status={v} /> },
    ]

    const paymentColumns = [
      { key: "id", title: "ID", render: (v: string) => <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{v?.slice?.(-8)}</span> },
      { key: "booking", title: "Booking/Peminjam", render: (_: any, row: any) => (<div><p className="font-medium">{row?.booking?.user?.name || "-"}</p><p className="text-xs text-gray-500">{row?.booking?.id?.slice?.(-8)}</p></div>) },
      { key: "amount", title: "Jumlah", render: (v: any) => formatCurrency(Number(v || 0)) },
      { key: "method", title: "Metode" },
      { key: "status", title: "Status", render: (v: string) => <StatusBadge status={v} /> },
      { key: "createdAt", title: "Dibuat", render: (v: string) => formatDateTime(v) },
    ]

    return (
      <div className="space-y-6 md:-ml-24">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Kelola sistem peminjaman aset dan jasa multimedia</p>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        {/* Statistics Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminStats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <MiniLineChart
              data={(stats?.timeline || []).map((d: any) => ({ label: monthLabel(d.key), value: Number(d.total || 0) }))}
              title="Total Booking per Hari"
              subtitle={statsLoading ? "Memuat…" : statsError ? statsError : "30 hari terakhir"}
              stroke="#7c3aed"
              fill="rgba(124, 58, 237, 0.12)"
              valueFormatter={(n) => `${n}`}
            />
          </div>
          <div>
            <MiniLineChart
              data={(stats?.timeline || []).map((d: any) => ({ label: monthLabel(d.key), value: Number(d.amount || 0) }))}
              title="Total Amount per Hari"
              subtitle={statsLoading ? "Memuat…" : statsError ? statsError : "30 hari terakhir"}
              stroke="#10b981"
              fill="rgba(16, 185, 129, 0.12)"
              valueFormatter={(n) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(n)}
            />
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-gray-900">Booking Terbaru</h2>
            <Button asChild variant="outline" className="rounded-xl bg-transparent">
              <Link href="/pemesanan">Lihat Semua</Link>
            </Button>
          </div>
          <DataTable
            data={recentBookings}
            columns={bookingColumns}
            title="Booking Terbaru"
            searchPlaceholder="Cari booking..."
            pageSize={8}
          />
        </div>

        {/* Recent Payments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-gray-900">Pembayaran Terbaru</h2>
            <Button asChild variant="outline" className="rounded-xl bg-transparent">
              <Link href="/payments">Lihat Semua</Link>
            </Button>
          </div>
          <DataTable
            data={recentPayments}
            columns={paymentColumns}
            title="Pembayaran Terbaru"
            searchPlaceholder="Cari pembayaran..."
            pageSize={8}
          />
        </div>
      </div>
    )
  }

  // Peminjam Dashboard - Home page with browsing experience
  const availableAssets = mockAssets.filter((asset) => asset.status === AssetStatus.TERSEDIA).slice(0, 6)
  const availableServices = mockServices.filter((service) => service.isActive).slice(0, 4)
  const userBookings = mockBookings.filter((b) => b.userId === user?.id)

  const peminjamStats = [
    {
      title: "Booking Aktif",
      value: userBookings.filter((b) => b.status === BookingStatus.DIKONFIRMASI).length,
      description: "Booking yang sedang berjalan",
      icon: Calendar,
    },
    {
      title: "Menunggu Konfirmasi",
      value: userBookings.filter((b) => b.status === BookingStatus.MENUNGGU).length,
      description: "Booking menunggu persetujuan",
      icon: Clock,
    },
    {
      title: "Pembayaran Pending",
      value: mockPayments.filter((p) => {
        const booking = mockBookings.find((b) => b.id === p.bookingId && b.userId === user?.id)
        return booking && p.status === PaymentStatus.PENDING
      }).length,
      description: "Pembayaran yang belum lunas",
      icon: CreditCard,
    },
    {
      title: "Booking Selesai",
      value: userBookings.filter((b) => b.status === BookingStatus.SELESAI).length,
      description: "Total booking yang selesai",
      icon: CheckCircle,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Selamat Datang, {user?.name}!</h1>
        <p className="text-indigo-100 text-lg">Temukan dan sewa peralatan multimedia terbaik untuk kebutuhan Anda</p>
        <div className="mt-6">
          <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 rounded-xl">
            <Link href="/bookings/new">
              <Calendar className="w-5 h-5 mr-2" />
              Buat Booking Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {peminjamStats.map((stat, index) => (
          <StatCard key={index} title={stat.title} value={stat.value} description={stat.description} icon={stat.icon} />
        ))}
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Kategori Populer</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mockCategories.slice(0, 6).map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer rounded-xl">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{category.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Assets */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Aset Populer</h2>
          <Button asChild variant="outline" className="rounded-xl bg-transparent">
            <Link href="/inventory">
              Lihat Semua
              <Eye className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableAssets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow rounded-xl overflow-hidden">
              <div className="aspect-video relative bg-gray-100">
                <Image
                  src={asset.photoUrl || "/placeholder.svg?height=200&width=300"}
                  alt={asset.name}
                  fill
                  className="object-cover"
                />
                <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">Tersedia</Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{asset.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{asset.specification}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-indigo-600">{formatCurrency(asset.dailyRate)}/hari</span>
                  <Button size="sm" className="rounded-xl">
                    <Star className="w-4 h-4 mr-1" />
                    Pilih
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Services */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Jasa Terpopuler</h2>
          <Button asChild variant="outline" className="rounded-xl bg-transparent">
            <Link href="/inventory">
              Lihat Semua
              <Eye className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availableServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow rounded-xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl mb-4 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-violet-600">{formatCurrency(service.unitRate)}</span>
                  <Button size="sm" variant="outline" className="rounded-xl bg-transparent">
                    Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
    const monthFmt = new Intl.DateTimeFormat('id-ID', { month: 'long' })
    const monthLabel = (isoDate: string) => {
      try {
        const d = new Date(isoDate)
        if (!isNaN(d.getTime())) return monthFmt.format(d)
      } catch {}
      return isoDate
    }
