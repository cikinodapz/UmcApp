"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { mockBookings, mockPayments, mockFines } from "@/lib/mock"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { BookingStatus, Role } from "@/types"
import {
  Calendar,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const isPeminjam = user?.role === Role.PEMINJAM

  // === Derived datasets ===
  const {
    bookingsMine,
    activeBookingsCount,
    upcomingBooking,
    paymentsPending,
    pendingAmount,
    finesUnpaid,
    finesUnpaidAmount,
  } = useMemo(() => {
    const bookingsMine = mockBookings.filter((b) => b.userId === user?.id)

    const activeStatuses = new Set<BookingStatus>([
      BookingStatus.MENUNGGU,
      BookingStatus.DIKONFIRMASI,
    ])
    const activeBookings = bookingsMine.filter((b) => activeStatuses.has(b.status))
    const activeBookingsCount = activeBookings.length

    const now = Date.now()
    const upcomingCandidates = bookingsMine
      .filter(
        (b) =>
          new Date(b.startDatetime).getTime() > now &&
          (b.status === BookingStatus.DIKONFIRMASI || b.status === BookingStatus.MENUNGGU),
      )
      .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
    const upcomingBooking = upcomingCandidates[0] ?? null

    const paymentsMine = mockPayments.filter((p) =>
      bookingsMine.some((b) => b.id === p.bookingId),
    )
    const paymentsPending = paymentsMine
      .filter((p) => p.status === "PENDING")
      .sort((a, b) => new Date(b.createdAt || b.paidAt || 0).getTime() - new Date(a.createdAt || a.paidAt || 0).getTime())
      .slice(0, 5)
    const pendingAmount = paymentsMine
      .filter((p) => p.status === "PENDING")
      .reduce((s, p) => s + Number(p.amount || 0), 0)

    const finesMine = mockFines.filter((f) => bookingsMine.some((b) => b.id === f.bookingId))
    const finesUnpaid = finesMine
      .filter((f) => !f.isPaid)
      .sort((a, b) => new Date(b.createdAt || b.paidAt || 0).getTime() - new Date(a.createdAt || a.paidAt || 0).getTime())
      .slice(0, 5)
    const finesUnpaidAmount = finesMine
      .filter((f) => !f.isPaid)
      .reduce((s, f) => s + Number(f.amount || 0), 0)

    return {
      bookingsMine,
      activeBookingsCount,
      upcomingBooking,
      paymentsPending,
      pendingAmount,
      finesUnpaid,
      finesUnpaidAmount,
    }
  }, [user?.id])

  // === UI ===
  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      {/* Header (bukan bar kedua) */}
      <header className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isPeminjam ? "Beranda Peminjam" : "Beranda"}
            </h1>
            <p className="mt-1 text-gray-600">
              Halo{user?.name ? `, ${user.name}` : ""}! Kelola peminjaman, pembayaran, dan denda Anda dari satu tempat.
            </p>
          </div>
          <Button
            asChild
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
          >
            <Link href="/bookings/new">
              <Plus className="w-4 h-4 mr-2" />
              Buat Pinjaman
            </Link>
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Booking Aktif</CardTitle>
              <CardDescription>Pemesanan yang masih berjalan</CardDescription>
            </div>
            <Calendar className="w-6 h-6 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeBookingsCount}</p>
            <Button asChild variant="link" className="px-0 text-indigo-600">
              <Link href="/bookings">
                Lihat Booking <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Pembayaran Pending</CardTitle>
              <CardDescription>Jumlah tagihan menunggu</CardDescription>
            </div>
            <CreditCard className="w-6 h-6 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(pendingAmount)}</p>
            <Button asChild variant="link" className="px-0 text-indigo-600">
              <Link href="/payments">
                Kelola Pembayaran <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Denda Belum Lunas</CardTitle>
              <CardDescription>Total outstanding fines</CardDescription>
            </div>
            <AlertTriangle className="w-6 h-6 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(finesUnpaidAmount)}</p>
            <Button asChild variant="link" className="px-0 text-indigo-600">
              <Link href="/fines">
                Lihat Denda <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming booking + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Jadwal Terdekat</CardTitle>
              <CardDescription>Booking yang akan datang</CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-lg">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {upcomingBooking ? "Tersedia" : "Tidak ada"}
            </Badge>
          </CardHeader>
          <CardContent>
            {upcomingBooking ? (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">
                    #{upcomingBooking.id.slice(-8)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(upcomingBooking.startDatetime)} — {formatDateTime(upcomingBooking.endDatetime)}
                  </p>
                  <div className="mt-2">
                    <Badge className="rounded-lg">
                      {upcomingBooking.status === BookingStatus.DIKONFIRMASI ? "Dikonfirmasi" : "Menunggu"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href={`/bookings/${upcomingBooking.id}`}>Detail</Link>
                  </Button>
                  <Button asChild className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700">
                    <Link href="/bookings">Kelola Booking</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border p-6 text-center">
                <p className="font-medium">Belum ada jadwal terdekat</p>
                <p className="text-sm text-gray-500 mt-1">
                  Buat booking baru untuk memulai peminjaman aset atau jasa.
                </p>
                <Button asChild className="mt-4 rounded-xl">
                  <Link href="/bookings/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Booking
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
            <CardDescription>Hal-hal yang sering kamu lakukan</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link href="/bookings/new">
                <Plus className="w-4 h-4 mr-2" />
                Booking Baru
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link href="/payments">
                <CreditCard className="w-4 h-4 mr-2" />
                Lihat Pembayaran
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link href="/fines">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Lihat Denda
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link href="/feedback">
                <MessageSquare className="w-4 h-4 mr-2" />
                Beri Feedback
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Pembayaran Menunggu</CardTitle>
              <CardDescription>Unggah bukti atau selesaikan pembayaran</CardDescription>
            </div>
            <Button asChild variant="ghost" className="rounded-xl">
              <Link href="/payments">
                Lihat semua <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {paymentsPending.length === 0 ? (
              <EmptyRow text="Tidak ada pembayaran pending" icon={<CheckCircle2 className="w-4 h-4" />} />
            ) : (
              <ul className="space-y-3">
                {paymentsPending.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <p className="font-medium">#{p.bookingId.slice(-8)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(Number(p.amount || 0))}</p>
                    </div>
                    <Button asChild size="sm" className="rounded-lg">
                      <Link href="/payments">Bayar</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Denda Belum Lunas</CardTitle>
              <CardDescription>Selesaikan agar akun tetap sehat</CardDescription>
            </div>
            <Button asChild variant="ghost" className="rounded-xl">
              <Link href="/fines">
                Lihat semua <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {finesUnpaid.length === 0 ? (
              <EmptyRow text="Tidak ada denda" icon={<CheckCircle2 className="w-4 h-4" />} />
            ) : (
              <ul className="space-y-3">
                {finesUnpaid.map((f) => (
                  <li key={f.id} className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <p className="font-medium">
                        #{f.bookingId.slice(-8)} — {f.type}
                      </p>
                      <p className="text-sm text-gray-500">{f.notes || "—"}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(Number(f.amount || 0))}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmptyRow({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-6 text-center text-gray-600">
      <div className="mx-auto mb-2 h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center">
        {icon ?? <Clock className="w-4 h-4" />}
      </div>
      <p>{text}</p>
    </div>
  )
}
