"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/contexts/auth-context"
import { mockFines, mockBookings, mockUsers } from "@/lib/mock"
import { Role } from "@/types"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FinesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedFine, setSelectedFine] = useState<any>(null)

  const isAdmin = user?.role === Role.ADMIN

  // Get fines with booking and user details
  const finesWithDetails = mockFines
    .map((fine) => {
      const booking = mockBookings.find((b) => b.id === fine.bookingId)
      const bookingUser = booking ? mockUsers.find((u) => u.id === booking.userId) : null

      return {
        ...fine,
        bookingCode: booking?.id.slice(-8) || "Unknown",
        userName: bookingUser?.name || "Unknown",
        userEmail: bookingUser?.email || "",
      }
    })
    .filter((fine) => (isAdmin ? true : mockBookings.some((b) => b.id === fine.bookingId && b.userId === user?.id)))
    .filter((fine) => {
      if (!statusFilter || statusFilter === "all") return true
      return statusFilter === "PAID" ? fine.isPaid : !fine.isPaid
    })
    .sort((a, b) => new Date(b.paidAt || "1970-01-01").getTime() - new Date(a.paidAt || "1970-01-01").getTime())

  // Define columns for fines table
  const fineColumns = [
    {
      key: "bookingCode",
      title: "Booking",
      render: (value: string) => <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{value}</span>,
    },
    ...(isAdmin
      ? [
          {
            key: "userName",
            title: "Pengguna",
            render: (value: string, item: any) => (
              <div>
                <p className="font-medium">{value}</p>
                <p className="text-sm text-gray-500">{item.userEmail}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "type",
      title: "Jenis Denda",
      render: (value: string) => {
        const typeLabels = {
          TELAT: "Keterlambatan",
          KERUSAKAN: "Kerusakan",
          KEHILANGAN: "Kehilangan",
          LAINNYA: "Lainnya",
        }
        return typeLabels[value as keyof typeof typeLabels] || value
      },
    },
    {
      key: "amount",
      title: "Jumlah",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "isPaid",
      title: "Status",
      render: (value: boolean) => (
        <StatusBadge
          status={value ? "PAID" : "UNPAID"}
          className={value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
        />
      ),
    },
    {
      key: "paidAt",
      title: "Tanggal Bayar",
      render: (value: string) => (value ? formatDateTime(value) : "-"),
      sortable: true,
    },
    {
      key: "notes",
      title: "Keterangan",
      render: (value: string) => value || "-",
    },
    {
      key: "actions",
      title: "Aksi",
      render: (_: any, fine: any) => (
        <div className="flex items-center gap-2">
          {!fine.isPaid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFine(fine)
                setPaymentDialogOpen(true)
              }}
              className="rounded-lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Tandai Lunas
            </Button>
          )}
        </div>
      ),
    },
  ]

  const handleMarkAsPaid = () => {
    if (!selectedFine) return

    // In a real app, this would make an API call
    console.log("Marking fine as paid:", selectedFine.id)

    toast({
      title: "Berhasil",
      description: "Denda berhasil ditandai sebagai lunas",
    })

    setPaymentDialogOpen(false)
    setSelectedFine(null)
  }

  const totalUnpaidFines = finesWithDetails.filter((fine) => !fine.isPaid).reduce((sum, fine) => sum + fine.amount, 0)
  const totalPaidFines = finesWithDetails.filter((fine) => fine.isPaid).reduce((sum, fine) => sum + fine.amount, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Denda</h1>
        <p className="text-gray-600 mt-2">{isAdmin ? "Kelola denda dari semua pengguna" : "Lihat status denda Anda"}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalUnpaidFines)}</p>
              <p className="text-sm text-gray-600">Total Belum Lunas</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalPaidFines)}</p>
              <p className="text-sm text-gray-600">Total Sudah Lunas</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{finesWithDetails.length}</p>
              <p className="text-sm text-gray-600">Total Denda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <AlertTriangle className="w-5 h-5 text-gray-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              Semua Status
            </SelectItem>
            <SelectItem value="UNPAID" className="rounded-lg">
              Belum Lunas
            </SelectItem>
            <SelectItem value="PAID" className="rounded-lg">
              Sudah Lunas
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">Menampilkan {finesWithDetails.length} denda</div>
      </div>

      {/* Fines Table */}
      <DataTable data={finesWithDetails} columns={fineColumns} searchPlaceholder="Cari denda..." pageSize={10} />

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran Denda</DialogTitle>
            <DialogDescription>Tandai denda sebagai sudah lunas</DialogDescription>
          </DialogHeader>

          {selectedFine && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium mb-2">Detail Denda</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Booking</p>
                    <p className="font-medium">{selectedFine.bookingCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Jenis</p>
                    <p className="font-medium">{selectedFine.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Jumlah</p>
                    <p className="font-medium">{formatCurrency(selectedFine.amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pengguna</p>
                    <p className="font-medium">{selectedFine.userName}</p>
                  </div>
                </div>
                {selectedFine.notes && (
                  <div className="mt-4">
                    <p className="text-gray-500 text-sm">Keterangan</p>
                    <p className="text-sm">{selectedFine.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="rounded-xl">
              Batal
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              Tandai Lunas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
