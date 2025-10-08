"use client"

import { Input } from "@/components/ui/input"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { mockBookingItems, mockBookings, mockAssets, mockUsers, mockReturns } from "@/lib/mock"
import { BookingStatus, Condition, ItemType, Role } from "@/types"
import { formatDateTime } from "@/lib/format"
import { RotateCcw, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ReturnsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [fineDialogOpen, setFineDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [returnCondition, setReturnCondition] = useState<Condition>(Condition.BAIK)
  const [returnNotes, setReturnNotes] = useState("")
  const [fineAmount, setFineAmount] = useState("")
  const [fineNotes, setFineNotes] = useState("")

  const isAdmin = user?.role === Role.ADMIN

  // Get items that need to be returned (assets only, from confirmed bookings)
  const itemsToReturn = mockBookingItems
    .filter((item) => {
      const booking = mockBookings.find((b) => b.id === item.bookingId)
      const isReturned = mockReturns.some((r) => r.bookingItemId === item.id)
      return (
        item.itemType === ItemType.ASET &&
        booking?.status === BookingStatus.DIKONFIRMASI &&
        !isReturned &&
        (isAdmin || booking?.userId === user?.id)
      )
    })
    .map((item) => {
      const booking = mockBookings.find((b) => b.id === item.bookingId)
      const asset = mockAssets.find((a) => a.id === item.assetId)
      const bookingUser = booking ? mockUsers.find((u) => u.id === booking.userId) : null

      return {
        ...item,
        assetName: asset?.name || "Unknown",
        assetCode: asset?.code || "Unknown",
        userName: bookingUser?.name || "Unknown",
        userEmail: bookingUser?.email || "",
        bookingStartDate: booking?.startDatetime || "",
        bookingEndDate: booking?.endDatetime || "",
        isOverdue: booking ? new Date(booking.endDatetime) < new Date() : false,
      }
    })
    .sort((a, b) => new Date(a.bookingEndDate).getTime() - new Date(b.bookingEndDate).getTime())

  // Define columns for returns table
  const returnColumns = [
    {
      key: "assetCode",
      title: "Kode Aset",
      render: (value: string) => <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{value}</span>,
    },
    {
      key: "assetName",
      title: "Nama Aset",
    },
    ...(isAdmin
      ? [
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
        ]
      : []),
    {
      key: "bookingEndDate",
      title: "Batas Kembali",
      render: (value: string, item: any) => (
        <div>
          <p className={item.isOverdue ? "text-red-600 font-medium" : ""}>{formatDateTime(value)}</p>
          {item.isOverdue && <p className="text-xs text-red-500">Terlambat</p>}
        </div>
      ),
      sortable: true,
    },
    {
      key: "qty",
      title: "Jumlah",
      render: (value: number) => `${value} unit`,
    },
    {
      key: "isOverdue",
      title: "Status",
      render: (value: boolean) => (
        <StatusBadge status={value ? "OVERDUE" : "ACTIVE"} className={value ? "bg-red-100 text-red-800" : ""} />
      ),
    },
    {
      key: "actions",
      title: "Aksi",
      render: (_: any, item: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedItem(item)
            setReturnCondition(Condition.BAIK)
            setReturnNotes("")
            setReturnDialogOpen(true)
          }}
          className="rounded-lg"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Proses Kembali
        </Button>
      ),
    },
  ]

  const handleProcessReturn = () => {
    if (!selectedItem) return

    // In a real app, this would make an API call
    console.log("Processing return:", {
      itemId: selectedItem.id,
      condition: returnCondition,
      notes: returnNotes,
    })

    toast({
      title: "Berhasil",
      description: `Aset ${selectedItem.assetName} berhasil dikembalikan`,
    })

    // If condition is not good, show fine dialog
    if (returnCondition !== Condition.BAIK) {
      setFineAmount(returnCondition === Condition.RUSAK_RINGAN ? "100000" : "500000")
      setFineNotes(`Kerusakan pada aset: ${selectedItem.assetName}`)
      setFineDialogOpen(true)
    }

    setReturnDialogOpen(false)
    setSelectedItem(null)
  }

  const handleCreateFine = () => {
    if (!selectedItem) return

    // In a real app, this would make an API call
    console.log("Creating fine:", {
      bookingId: selectedItem.bookingId,
      amount: Number.parseInt(fineAmount),
      notes: fineNotes,
      type: "KERUSAKAN",
    })

    toast({
      title: "Denda Dibuat",
      description: `Denda sebesar ${fineAmount} telah dibuat`,
    })

    setFineDialogOpen(false)
    setFineAmount("")
    setFineNotes("")
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengembalian Aset</h1>
        <p className="text-gray-600 mt-2">
          {isAdmin ? "Proses pengembalian aset dari pengguna" : "Aset yang perlu dikembalikan"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{itemsToReturn.length}</p>
              <p className="text-sm text-gray-600">Total Belum Kembali</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{itemsToReturn.filter((item) => item.isOverdue).length}</p>
              <p className="text-sm text-gray-600">Terlambat</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockReturns.length}</p>
              <p className="text-sm text-gray-600">Sudah Dikembalikan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <DataTable data={itemsToReturn} columns={returnColumns} searchPlaceholder="Cari aset..." pageSize={10} />

      {/* Return Processing Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Proses Pengembalian Aset</DialogTitle>
            <DialogDescription>Periksa kondisi aset dan catat pengembalian</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Asset Details */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium mb-2">Detail Aset</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nama Aset</p>
                    <p className="font-medium">{selectedItem.assetName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Kode</p>
                    <p className="font-medium">{selectedItem.assetCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Peminjam</p>
                    <p className="font-medium">{selectedItem.userName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Jumlah</p>
                    <p className="font-medium">{selectedItem.qty} unit</p>
                  </div>
                </div>
              </div>

              {/* Return Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Kondisi Setelah Dikembalikan</Label>
                  <Select value={returnCondition} onValueChange={(value) => setReturnCondition(value as Condition)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value={Condition.BAIK} className="rounded-lg">
                        Baik
                      </SelectItem>
                      <SelectItem value={Condition.RUSAK_RINGAN} className="rounded-lg">
                        Rusak Ringan
                      </SelectItem>
                      <SelectItem value={Condition.RUSAK_BERAT} className="rounded-lg">
                        Rusak Berat
                      </SelectItem>
                      <SelectItem value={Condition.HILANG} className="rounded-lg">
                        Hilang
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Catatan kondisi aset..."
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                {returnCondition !== Condition.BAIK && (
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <p className="font-medium text-yellow-800">Perhatian</p>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Kondisi aset tidak baik. Sistem akan membuat denda otomatis setelah pengembalian diproses.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)} className="rounded-xl">
              Batal
            </Button>
            <Button
              onClick={handleProcessReturn}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
            >
              Proses Pengembalian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fine Creation Dialog */}
      <Dialog open={fineDialogOpen} onOpenChange={setFineDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Buat Denda</DialogTitle>
            <DialogDescription>Buat denda untuk kerusakan atau kehilangan aset</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fineAmount">Jumlah Denda (IDR)</Label>
              <Input
                id="fineAmount"
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="100000"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fineNotes">Keterangan Denda</Label>
              <Textarea
                id="fineNotes"
                value={fineNotes}
                onChange={(e) => setFineNotes(e.target.value)}
                placeholder="Alasan denda..."
                className="rounded-xl"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFineDialogOpen(false)} className="rounded-xl">
              Batal
            </Button>
            <Button
              onClick={handleCreateFine}
              className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              Buat Denda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}