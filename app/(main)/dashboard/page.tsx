"use client"

import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/contexts/auth-context"
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
import Image from "next/image"

export default function DashboardPage() {
  const { user } = useAuth()

  // Admin Dashboard
  if (user?.role === Role.ADMIN) {
    // Calculate statistics
    const totalAssets = mockAssets.length
    const borrowedAssets = mockAssets.filter((asset) => asset.status === AssetStatus.DIPINJAM).length
    const pendingBookings = mockBookings.filter((booking) => booking.status === BookingStatus.MENUNGGU).length
    const pendingPayments = mockPayments.filter((payment) => payment.status === PaymentStatus.PENDING).length

    // Get recent bookings with user and item details
    const recentBookings = mockBookings
      .slice(0, 10)
      .map((booking) => {
        const bookingUser = mockUsers.find((u) => u.id === booking.userId)
        const items = mockBookingItems.filter((item) => item.bookingId === booking.id)
        const totalAmount = items.reduce((sum, item) => sum + item.price, 0)

        return {
          ...booking,
          userName: bookingUser?.name || "Unknown",
          userEmail: bookingUser?.email || "",
          itemCount: items.length,
          totalAmount,
        }
      })
      .sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime())

    // Define columns for recent bookings table
    const bookingColumns = [
      {
        key: "id",
        title: "ID Booking",
        render: (value: string) => (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{value.slice(-8)}</span>
        ),
      },
      {
        key: "userName",
        title: "Peminjam",
        render: (value: string, item: any) => (
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-gray-500">{item.userEmail}</p>
          </div>
        ),
      },
      {
        key: "startDatetime",
        title: "Tanggal Mulai",
        render: (value: string) => formatDateTime(value),
        sortable: true,
      },
      {
        key: "endDatetime",
        title: "Tanggal Selesai",
        render: (value: string) => formatDateTime(value),
      },
      {
        key: "itemCount",
        title: "Jumlah Item",
        render: (value: number) => `${value} item`,
      },
      {
        key: "totalAmount",
        title: "Total",
        render: (value: number) => formatCurrency(value),
      },
      {
        key: "status",
        title: "Status",
        render: (value: string) => <StatusBadge status={value} />,
      },
    ]

    const adminStats = [
      {
        title: "Total Aset",
        value: totalAssets,
        description: "Aset tersedia di inventaris",
        icon: Package,
        trend: { value: 12, isPositive: true },
      },
      {
        title: "Aset Dipinjam",
        value: borrowedAssets,
        description: "Sedang dipinjam pengguna",
        icon: TrendingUp,
      },
      {
        title: "Booking Menunggu",
        value: pendingBookings,
        description: "Menunggu konfirmasi admin",
        icon: Clock,
      },
      {
        title: "Pembayaran Pending",
        value: pendingPayments,
        description: "Menunggu konfirmasi pembayaran",
        icon: CreditCard,
      },
    ]

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Kelola sistem peminjaman aset dan jasa multimedia</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminStats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>

        {/* Recent Bookings Table */}
        <DataTable
          data={recentBookings}
          columns={bookingColumns}
          title="Booking Terbaru"
          searchPlaceholder="Cari booking..."
          pageSize={8}
        />
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
