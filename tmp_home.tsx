"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { formatDateTime } from "@/lib/format"
import { fetchData } from "@/lib/api"
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dash, setDash] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await fetchData("/dashboard/user", { method: "GET" })
        if (mounted) setDash(data)
      } catch (e: any) {
        if (mounted) setError(e?.message || "Gagal memuat dashboard")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const activeBookingsCount = useMemo(() => {
    const w = Number(dash?.bookings?.waiting || 0)
    const c = Number(dash?.bookings?.confirmed || 0)
    return w + c
  }, [dash])

  const nextUpcoming = dash?.bookings?.nextUpcoming ?? null

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
            className="rounded-xl h-12 !bg-indigo-600 hover:!bg-indigo-700 !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 !border-0"
            style={{
              background:
                "linear-gradient(to right, rgb(99, 102, 241), rgb(139, 92, 246))",
              color: "white",
            }}
          >
            <Link href="/katalog">
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
              <Link href="/booking">
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
            <p className="text-3xl font-bold">{Number(dash?.payments?.pending || 0)}</p>
            <Button asChild variant="link" className="px-0 text-indigo-600">
              <Link href="/riwayat">Kelola Pembayaran <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Notifikasi Belum Dibaca</CardTitle>
              <CardDescription>Total notifikasi belum dibuka</CardDescription>
            </div>
            <AlertTriangle className="w-6 h-6 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Number(dash?.notifications?.unread || 0)}</p>
            <Button asChild variant="link" className="px-0 text-indigo-600">
              <Link href="/notifikasi">Lihat Notifikasi <ArrowRight className="w-4 h-4 ml-1" /></Link>
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
            {nextUpcoming ? (
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
                  <Button
                    asChild
                    className="rounded-xl h-12 !bg-indigo-600 hover:!bg-indigo-700 !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 !border-0"
                    style={{
                      background:
                        "linear-gradient(to right, rgb(99, 102, 241), rgb(139, 92, 246))",
                      color: "white",
                    }}
                  >
                    <Link href="/booking">Kelola Booking</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border p-6 text-center">
                <p className="font-medium">Belum ada jadwal terdekat</p>
                <p className="text-sm text-gray-500 mt-1">
                  Mulai Pesan baru untuk memulai peminjaman aset atau jasa.
                </p>
                <Button
                  asChild
                  className="mt-4 rounded-xl h-12 !bg-indigo-600 hover:!bg-indigo-700 !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 !border-0"
                  style={{
                    background:
                      "linear-gradient(to right, rgb(99, 102, 241), rgb(139, 92, 246))",
                    color: "white",
                  }}
                >
                  <Link href="/katalog">
                    <Plus className="w-4 h-4 mr-2" />
                    Mulai Pesan
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
              <Link href="/katalog">
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

